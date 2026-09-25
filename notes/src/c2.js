/* Course notes — Chapter 2.

   The chapter follows the slides of Module 2 one for one: its numbered
   sections are the module's sections, each heading inside a section is one
   teaching slide, and every figure is the slide's figure drawn at one static
   state (the last frame of a stepped figure, a named slider setting of a live
   one). The figure helpers below repeat the ones in `83_scenes_m2.js` and
   `88_scenes_m2x.js`, with the same seeds, so the noisy figures are the same
   figures as on the slides. Galleries, laboratories, code pages and the quick
   check are not carried here, as in Chapter 1. */
(function(){
const P=PLOT, C=P.COL;
/* one figure across the page, and one of two side by side */
const ax1=o=>P.Axes(Object.assign({w:700,h:210,pad:{l:56,r:22,t:20,b:40},xtarget:8,ytarget:3},o));
const ax2=o=>P.Axes(Object.assign({w:340,h:230,pad:{l:52,r:16,t:20,b:40},xtarget:5,ytarget:3},o));
const sinc=x=>Math.abs(x)<1e-12?1:Math.sin(Math.PI*x)/(Math.PI*x);
const clamp01=x=>Math.max(0,Math.min(1,x));
const place=(svg,x,y,w,h)=>svg.replace('<svg ',`<svg x="${x}" y="${y}" width="${w}" height="${h}" `);
const stack=(w,parts)=>{ let y=0,s='';
  parts.forEach(([svg,h])=>{ s+=place(svg,0,y,w,h); y+=h; });
  return `<svg viewBox="0 0 ${w} ${y}" xmlns="http://www.w3.org/2000/svg" role="img">${s}</svg>`; };

/* Seeded noise, as on the slides, so every noisy figure is the same figure. */
function rng(seed){ let a=seed>>>0; return function(){
  a=(a+0x6D2B79F5)>>>0; let t=Math.imul(a^(a>>>15),1|a);
  t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
function gauss(seed,n,s){ const r=rng(seed),o=[]; for(let i=0;i<n;i++){
  const u=Math.max(1e-12,r()), v=r();
  o.push(s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)); } return o; }
function noiseFn(seed,dt,s,t0=-2,t1=40){
  const n=gauss(seed,Math.ceil((t1-t0)/dt)+2,s);
  return t=>{ const x=(t-t0)/dt, k=Math.max(0,Math.min(n.length-2,Math.floor(x))), f=x-k,
    w=(1-Math.cos(Math.PI*f))/2; return (1-w)*n[k]+w*n[k+1]; };
}

/* The Gaussian tail, the Gaussian density, and a number in TeX. */
function erfc(x){ const z=Math.abs(x), t=1/(1+0.5*z);
  const r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806
    +t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));
  return x>=0?r:2-r; }
const Qf=x=>0.5*erfc(x/Math.SQRT2);
const dens=(y,m,s)=>Math.exp(-(y-m)*(y-m)/(2*s*s))/(s*Math.sqrt(2*Math.PI));
function sci(v,d=3){
  if(v===0) return '0';
  const e=Math.floor(Math.log10(Math.abs(v)));
  if(e>=-2 && e<3) return String(+v.toPrecision(d));
  const m=v/Math.pow(10,e);
  return (+m.toPrecision(d))+'\\times10^{'+e+'}';
}
const SUPS={'-':'\u207B','0':'\u2070','1':'\u00B9','2':'\u00B2','3':'\u00B3','4':'\u2074','5':'\u2075','6':'\u2076','7':'\u2077','8':'\u2078','9':'\u2079'};
const mdec=v=>{ const e=Math.floor(v+1e-9), m=Math.round(Math.pow(10,v-e));
  return (m===1?'':m+'\u00D7')+'10'+String(e).split('').map(c=>SUPS[c]||c).join(''); };
/* tick numbers of a logarithmic axis at the left edge of the frame */
function leftTicks(a,vals,fmt){
  vals.forEach(v=>{ const y=a.sy(v).toFixed(2);
    a.raw(`<line x1="${a.x0}" y1="${y}" x2="${a.x0-5}" y2="${y}" stroke="${C.axis}" stroke-width="1.2"/>`);
    a.raw(`<text x="${a.x0-10}" y="${(+y+4.5).toFixed(2)}" font-size="13" fill="${C.muted}" text-anchor="end">${fmt(v)}</text>`); });
}

/* ---- 2.1 the matched filter --------------------------------------------- */
const RX_W=noiseFn(7,0.012,0.5,-1,4);
function figReceiver(){
  const X=x=>+(x*1.25).toFixed(1);
  const top=P.blocks({w:700,h:140,items:[
    {t:'arrow',x1:X(14),y1:62,x2:X(112),y2:62,label:'g(t)',tex:true,color:C.in},
    {t:'sum',x:X(132),y:62},
    {t:'arrow',x1:X(132),y1:126,x2:X(132),y2:78,color:C.muted},
    {t:'text',x:X(146),y:120,label:'w(t)',tex:true,anchor:'start',fs:15},
    {t:'arrow',x1:X(148),y1:62,x2:X(238),y2:62,label:'x(t)',tex:true,color:C.out},
    {t:'box',x:X(238),y:32,w:X(118),h:60,label:'h(t)',tex:true,color:C.h},
    {t:'arrow',x1:X(356),y1:62,x2:X(436),y2:62,label:'y(t)',tex:true,color:C.mid},
    {t:'line',d:`M${X(436)},62 h30`}, {t:'line',d:`M${X(436)+30},62 l24,-16`},
    {t:'arrow',x1:X(488),y1:62,x2:X(548),y2:62,label:'y(T)',tex:true,color:C.mid},
    {t:'text',x:X(470),y:104,label:'t=T',tex:true,fs:14}
  ]});
  const a=P.Axes({w:700,h:210,xr:[-0.2,1.4],yr:[-1.2,2.6],xlabel:'t/T',ylabel:'x(t)',
    pad:{l:56,r:22,t:24,b:42},xticksOverride:[0,0.5,1],ytarget:3});
  a.curve(t=>(t>=0&&t<=1?1:0)+RX_W(t),{color:C.out,width:1.5,n:900});
  a.poly([[-0.2,0],[0,0],[0,1],[1,1],[1,0],[1.4,0]],{color:C.in,width:2.4});
  return stack(700,[[top,140],[a.svg(),210]]);
}

const SNR_N=noiseFn(11,0.06,0.16,-1,4);
function figSnr(){
  const s=0.16, g0=t=>t<0?0:t<1?t:t<2?2-t:0;
  const a=ax1({xr:[0,2.3],yr:[-0.45,1.45],xlabel:'t/T',ylabel:'y(t)',xticksOverride:[0,0.5,1,1.5,2],ytarget:4});
  const pts=[]; for(let i=0;i<=230;i++){ const t=2.3*i/230; pts.push([a.sx(t),a.sy(g0(t)+s)]); }
  for(let i=230;i>=0;i--){ const t=2.3*i/230; pts.push([a.sx(t),a.sy(g0(t)-s)]); }
  a.under(`<path d="M${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L')}Z" fill="${C.noiseSoft}"/>`);
  a.curve(t=>g0(t)+SNR_N(t),{color:C.mid,width:1.2,opacity:0.35,n:900});
  a.curve(g0,{color:C.mid,width:2.6});
  a.vline(1,{color:C.muted});
  a.point(1,1,{color:C.mid,r:5});
  a.note(1.05,1.26,'g_0(T)',{tex:true,fs:14,color:C.mid});
  a.poly([[1.55,0.45-s],[1.55,0.45+s]],{color:C.muted,width:1.6});
  a.poly([[1.52,0.45+s],[1.58,0.45+s]],{color:C.muted,width:1.6});
  a.poly([[1.52,0.45-s],[1.58,0.45-s]],{color:C.muted,width:1.6});
  a.note(1.62,0.64,'\\pm\\sqrt{E[n^{2}]}',{tex:true,fs:14,color:C.muted});
  return a.svg();
}

const schwarzRatio=b=>2*b/(1+b*b);
function figSchwarz(b){
  const a=ax1({xr:[-3.2,3.2],yr:[-0.08,1.3],xlabel:'f',ylabel:'|G(f)|,\\;|H(f)|',
    xtarget:6,ytickfmt:()=>''});
  const G=f=>Math.exp(-f*f), H=f=>Math.exp(-f*f/(b*b));
  a.area(f=>Math.min(G(f),H(f)),-3.2,3.2,{color:C.dec.mid});
  a.curve(G,{color:C.in,width:2.4});
  a.curve(H,{color:C.h,width:2.2,dash:'7 5'});
  a.note(-3.05,1.14,`\\eta=${schwarzRatio(b).toFixed(2)}\\cdot\\dfrac{2E}{N_0}`,{tex:true,fs:15,color:C.mid});
  return a.svg();
}

/* the ramp s(t) = t/T, its reversal s(-t), and h(t) = s(T - t) */
function figMatchedBuild(){
  const a=ax1({xr:[-1.35,1.35],yr:[-0.2,1.35],xlabel:'t/T',ylabel:'s(t),\\;h(t)',
    xticksOverride:[-1,-0.5,0,0.5,1]});
  a.poly([[0,0],[1,1],[1,0]],{color:C.in,width:2.4});
  a.poly([[0,0],[-1,1],[-1,0]],{color:C.h,width:2.0,dash:'7 5'});
  a.poly([[1,0],[0,1],[0,0]],{color:C.h,width:2.6});
  a.note(1.05,0.78,'s(t)',{tex:true,fs:14,color:C.in});
  a.note(-1.28,1.12,'s(-t)',{tex:true,fs:14,color:C.h});
  a.note(0.06,1.14,'h(t)=s(T-t)',{tex:true,fs:14,color:C.h});
  return a.svg();
}

/* the sliding overlap at t = T/2, and y(t) drawn as far as the slide has gone */
function figConvTop(){
  const t=0.5, s=u=>(u>=0&&u<=1)?1:0;
  const a=ax2({xr:[-1.2,2.3],yr:[-0.2,1.4],xlabel:'\\tau/T',ylabel:'s(\\tau),\\;h(t-\\tau)',xticksOverride:[-1,0,1,2],ytarget:2});
  a.area(u=>Math.min(s(u),s(u-t+1)),-1.2,2.3,{color:C.dec.mid});
  a.poly([[-1.2,0],[0,0],[0,1],[1,1],[1,0],[2.3,0]],{color:C.in,width:2.4});
  a.poly([[-1.2,0],[t-1,0],[t-1,1],[t,1],[t,0],[2.3,0]],{color:C.h,width:2.2,dash:'7 5'});
  return a.svg();
}
function figConvBottom(){
  const t=0.5, y=u=>u<0?0:u<1?u:u<2?2-u:0;
  const a=ax2({xr:[-1.2,2.3],yr:[-0.2,1.4],xlabel:'t/T',ylabel:'y(t)',xticksOverride:[-1,0,1,2],ytarget:2});
  a.curve(y,{color:C.mid,width:1.4,dash:'4 5',opacity:0.5});
  a.curve(u=>u<=t+1e-9?y(u):NaN,{color:C.mid,width:2.6,n:700});
  a.point(t,y(t),{color:C.mid,r:5});
  return a.svg();
}

const SHAPES=[ t=>(t>=0&&t<=1)?1:0, t=>(t>=0&&t<=1)?Math.SQRT2*Math.sin(Math.PI*t):0 ];
function mfOut(k){ const s=SHAPES[k], N=400, pts=[];
  for(let j=0;j<=240;j++){ const t=2.4*j/240-0.2; let acc=0;
    for(let i=0;i<N;i++){ const u=(i+0.5)/N; acc+=s(u)*s(u+1-t); } pts.push([t,acc/N]); }
  return pts; }
function figEqualOutputs(){
  const a=ax1({xr:[-0.2,2.2],yr:[-0.12,1.3],xlabel:'t/T',ylabel:'y(t)/E',xticksOverride:[0,0.5,1,1.5,2]});
  a.poly(mfOut(0),{color:C.mid,width:2.4});
  a.poly(mfOut(1),{color:C.mid,width:2.4,dash:'8 5'});
  a.vline(1,{color:C.muted});
  a.point(1,1,{color:C.mid,r:5});
  a.note(1.05,1.16,'y(T)=E',{tex:true,fs:14,color:C.mid});
  return a.svg();
}

function figExMf(){
  const a=ax1({xr:[-0.4,2.4],yr:[-0.12,1.3],xlabel:'t/T',ylabel:'y(t)/(A^{2}T)',xticksOverride:[0,0.5,1,1.5,2],ytarget:4});
  a.poly([[-0.2,0],[0,0],[0,1],[1,1],[1,0],[2.4,0]],{color:C.ink,width:1.6,dash:'6 5'});
  a.note(0.06,1.12,'s(t)/A',{tex:true,fs:14,color:C.ink});
  a.poly([[-0.2,0],[0,0],[1,1],[2,0],[2.4,0]],{color:C.mid,width:2.6});
  a.point(1,1,{color:C.mid,r:5});
  a.note(1.08,1.14,'y(T)=A^{2}T',{tex:true,fs:14,color:C.mid});
  return a.svg();
}

/* ---- 2.2 the demodulator ----------------------------------------------- */
function figBasis(){
  const a=ax1({h:260,xr:[-0.3,1.35],yr:[-2.1,2.1],xlabel:'t/T_b',ylabel:'\\psi(t),\\;s_m(t)',
    xticksOverride:[0,0.5,1],ytickfmt:()=>'',yticksOverride:[-1.5,-1,0,1,1.5]});
  a.poly([[-0.3,0],[0,0],[0,1.5],[1,1.5],[1,0],[1.35,0]],{color:C.in,width:2.4});
  a.poly([[-0.3,0],[0,0],[0,-1.5],[1,-1.5],[1,0],[1.35,0]],{color:C.in,width:2.4,dash:'8 5'});
  a.poly([[-0.3,0],[0,0],[0,1],[1,1],[1,0],[1.35,0]],{color:C.h,width:2.2});
  a.note(0.5,1.78,'s_1(t)=+A',{tex:true,fs:14,color:C.in,anchor:'middle'});
  a.note(0.5,0.5,'\\psi(t)=1/\\sqrt{T_b}',{tex:true,fs:14,color:C.h,anchor:'middle'});
  a.note(0.5,-1.1,'s_0(t)=-A',{tex:true,fs:14,color:C.in,anchor:'middle'});
  return a.svg();
}
function figSpaceWave(){
  const a=ax2({xr:[-0.3,1.45],yr:[-2.1,2.1],xlabel:'t/T_b',ylabel:'s_m(t)',xticksOverride:[0,0.5,1],yticksOverride:[],ytarget:2});
  a.poly([[-0.3,0],[0,0],[0,1.5],[1,1.5],[1,0],[1.45,0]],{color:C.in,width:2.4});
  a.poly([[-0.3,0],[0,0],[0,-1.5],[1,-1.5],[1,0],[1.45,0]],{color:C.in,width:2.4,dash:'8 5'});
  a.note(1.04,1.5,'s_1(t)',{tex:true,fs:14,color:C.in});
  a.note(1.04,-1.5,'s_0(t)',{tex:true,fs:14,color:C.in});
  return a.svg();
}
function figSpacePoints(){
  const a=ax2({xr:[-2,2],yr:[-1,1.2],xlabel:'\\text{signal-space axis}',
    xticksOverride:[],yticksOverride:[],grid:false,arrows:false,zeroAxes:false});
  a.poly([[-2,0],[2,0]],{color:C.axis,width:1.5});
  a.point(-1.4,0,{color:C.in,r:7}); a.point(1.4,0,{color:C.in,r:7});
  a.note(-1.4,-0.6,'s_0=-\\sqrt{E_b}',{tex:true,fs:14,color:C.in,anchor:'middle'});
  a.note(1.4,-0.6,'s_1=+\\sqrt{E_b}',{tex:true,fs:14,color:C.in,anchor:'middle'});
  a.span(-1.4,1.4,0.62,'d=2\\sqrt{E_b}',{tex:true,fs:14,color:C.muted});
  return a.svg();
}

const DM_W=noiseFn(29,0.012,0.45,-1,3);
function figMfDemod(){
  const X=x=>+(x*1.25).toFixed(1);
  const top=P.blocks({w:700,h:124,items:[
    {t:'arrow',x1:X(16),y1:58,x2:X(150),y2:58,label:'x(t)',tex:true,color:C.out},
    {t:'box',x:X(150),y:26,w:X(150),h:64,label:'\\psi(T_b-t)',tex:true,color:C.h},
    {t:'arrow',x1:X(300),y1:58,x2:X(396),y2:58,label:'y(t)',tex:true,color:C.mid},
    {t:'line',d:`M${X(396)},58 h30`}, {t:'line',d:`M${X(396)+30},58 l24,-16`},
    {t:'arrow',x1:X(448),y1:58,x2:X(548),y2:58,label:'y(T_b)',tex:true,color:C.mid},
    {t:'text',x:X(430),y:104,label:'t=T_b',tex:true,fs:14}
  ]});
  const x=t=>(t>=0&&t<=1)?1+DM_W(t):0;
  const N=400, yv=[]; for(let j=0;j<=200;j++){ const t=2*j/200; let s=0;
    for(let i=0;i<N;i++){ const u=(i+0.5)/N; if(u<=t && u>=t-1) s+=x(u); } yv.push([t,s/N]); }
  const a=P.Axes({w:700,h:230,xr:[-0.15,2.2],yr:[-1.0,2.6],xlabel:'t/T_b',ylabel:'x(t),\\;y(t)',
    pad:{l:56,r:22,t:24,b:42},xticksOverride:[0,0.5,1,1.5,2],ytarget:3});
  a.curve(t=>t>=0&&t<=1?x(t):NaN,{color:C.out,width:1.4,n:900});
  a.poly(yv,{color:C.mid,width:2.6});
  a.vline(1,{color:C.muted});
  a.point(1,yv[100][1],{color:C.mid,r:5});
  a.note(1.06,yv[100][1]+0.4,'y(T_b)=s_m+n',{tex:true,fs:14,color:C.mid});
  return stack(700,[[top,124],[a.svg(),230]]);
}

function figCorrMf(){
  const a=ax1({xr:[-0.15,2.2],yr:[-0.2,1.35],xlabel:'t/T_b',ylabel:'\\text{output}',xticksOverride:[0,0.5,1,1.5,2]});
  a.raw('<g opacity="0.45">');
  a.poly([[-0.15,0],[0,0],[1,1],[2,0],[2.2,0]],{color:C.mid,width:5});
  a.raw('</g>');
  a.poly([[-0.15,0],[0,0],[1,1],[1,0],[2.2,0]],{color:C.mid,width:2.2,dash:'7 5'});
  a.vline(1,{color:C.muted});
  a.point(1,1,{color:C.mid,r:5});
  a.note(1.05,1.16,'s_m=1',{tex:true,fs:14,color:C.mid});
  return a.svg();
}

/* ---- 2.3 the decision and its error ------------------------------------- */
const DS={A:1,s:0.5,N0:0.5};
const densFrame=o=>ax1(Object.assign({xr:[-3,3],xlabel:'y',xticksOverride:[-2,-1,0,1,2],
  xtickfmt:v=>Math.abs(v)===1?'':String(v),ytickfmt:()=>''},o));
function markMeans(a,y){
  a.point(-1,0,{color:C.in,r:5}); a.point(1,0,{color:C.in,r:5});
  a.note(-1,y,'-\\sqrt{E_b}',{tex:true,fs:14,color:C.in,anchor:'middle'});
  a.note(1,y,'+\\sqrt{E_b}',{tex:true,fs:14,color:C.in,anchor:'middle'});
}
function figStat(){
  const {A,s}=DS, top=dens(0,0,s);
  const a=densFrame({yr:[-0.06*top,1.3*top],ylabel:'f_Y(y\\mid s_m)'});
  a.curve(y=>dens(y,-A,s),{color:C.mid,width:2.4,dash:'8 5'});
  a.curve(y=>dens(y,A,s),{color:C.mid,width:2.4});
  markMeans(a,0.1*top);
  return a.svg();
}
function figErrors(lam){
  const {A,s}=DS, top=dens(0,0,s);
  const a=densFrame({h:260,yr:[-0.06*top,1.42*top],ylabel:'f_Y(y\\mid s_m)'});
  a.area(y=>dens(y,-A,s),lam,3,{color:C.dec.err});
  a.area(y=>dens(y,A,s),-3,lam,{color:C.dec.err});
  a.curve(y=>dens(y,-A,s),{color:C.mid,width:2.4,dash:'8 5'});
  a.curve(y=>dens(y,A,s),{color:C.mid,width:2.4});
  a.vline(lam,{color:C.ink,dash:'6 4',width:1.6,opacity:1});
  markMeans(a,0.1*top);
  a.note(-2.9,1.3*top,`P(\\text{err}\\mid s_0)=${sci(Qf((lam+A)/s))}`,{tex:true,fs:14,color:C.err});
  a.note(-2.9,1.13*top,`P(\\text{err}\\mid s_1)=${sci(Qf((A-lam)/s))}`,{tex:true,fs:14,color:C.err});
  return a.svg();
}
const lamOpt=(N0,A,p0)=>N0/(4*A)*Math.log(p0/(1-p0));
function figThreshold(){
  const {A,s,N0}=DS, p0=0.7, top=p0*dens(0,0,s), lo=lamOpt(N0,A,p0);
  const a=densFrame({yr:[-0.06*top,1.3*top],ylabel:'P(s_m)\\,f_Y(y\\mid s_m)'});
  a.area(y=>Math.min(p0*dens(y,-A,s),(1-p0)*dens(y,A,s)),-3,3,{color:C.dec.err});
  a.curve(y=>p0*dens(y,-A,s),{color:C.mid,width:2.4,dash:'8 5'});
  a.curve(y=>(1-p0)*dens(y,A,s),{color:C.mid,width:2.4});
  a.vline(0,{color:C.muted});
  a.vline(lo,{color:C.ink,dash:'6 4',width:1.6,opacity:1});
  a.point(lo,(1-p0)*dens(lo,A,s),{color:C.ink,r:4.5});
  markMeans(a,0.1*top);
  a.note(lo+0.1,1.16*top,'\\lambda_{\\mathrm{opt}}',{tex:true,fs:15,color:C.ink});
  return a.svg();
}
function figThresholdLive(p0,dB){
  const A=1, N0=1/Math.pow(10,dB/10), s=Math.sqrt(N0/2), lo=lamOpt(N0,A,p0);
  const top=Math.max(p0,1-p0)*dens(0,0,s);
  const a=densFrame({yr:[-0.06*top,1.36*top],ylabel:'P(s_m)\\,f_Y(y\\mid s_m)'});
  a.curve(y=>p0*dens(y,-A,s),{color:C.mid,width:2.4,dash:'8 5'});
  a.curve(y=>(1-p0)*dens(y,A,s),{color:C.mid,width:2.4});
  a.vline(0,{color:C.muted});
  a.vline(lo,{color:C.ink,dash:'6 4',width:1.6,opacity:1});
  markMeans(a,0.1*top);
  a.note(-2.9,1.2*top,`\\lambda_{\\mathrm{opt}}=${lo.toFixed(3)}`,{tex:true,fs:15,color:C.ink});
  return a.svg();
}
function figQ(x){
  const phi=z=>Math.exp(-z*z/2)/Math.sqrt(2*Math.PI);
  const a=ax1({xr:[-3.6,3.6],yr:[-0.03,0.52],xlabel:'z',ylabel:'\\phi(z)',xticksOverride:[-3,-2,-1,0,1,2,3],yticksOverride:[0.1,0.2,0.3]});
  a.area(phi,x,3.6,{color:C.dec.mid});
  a.curve(phi,{color:C.mid,width:2.4});
  a.vline(x,{color:C.ink,dash:'6 4',width:1.6,opacity:1});
  a.note(-3.45,0.46,`Q(${x.toFixed(1)})=${sci(Qf(x))}`,{tex:true,fs:15,color:C.mid});
  return a.svg();
}
const pbDb=d=>Qf(Math.sqrt(2*Math.pow(10,d/10)));
function figPe(dB){
  const a=ax1({h:270,xr:[0,12],yr:[-8,-0.02],xlabel:'E_b/N_0\\;(\\mathrm{dB})',ylabel:'P_b',
    ytickfmt:P.decade,yticksOverride:P.decades(-8,-1),zeroAxes:false,pad:{l:64,r:22,t:20,b:46},xtarget:6});
  a.curve(d=>{ const p=pbDb(d); return p>3e-8?Math.log10(p):NaN; },{color:C.in,width:2.4});
  const p=pbDb(dB);
  a.vline(dB,{color:C.muted});
  a.point(dB,Math.log10(p),{color:C.in,r:5.5});
  a.note(dB-0.35,Math.log10(p)-0.7,`P_b=${sci(p)}`,{tex:true,fs:15,color:C.in,anchor:'end'});
  return a.svg();
}
const EX={A:1,N0:0.1,p0:0.7};
EX.s=Math.sqrt(EX.N0/2); EX.lam=lamOpt(EX.N0,EX.A,EX.p0);
EX.pe=l=>EX.p0*Qf((l+EX.A)/EX.s)+(1-EX.p0)*Qf((EX.A-l)/EX.s);
function figExLog(){
  const {A,s,p0,lam}=EX, L=(y,m,p)=>Math.log10(p*dens(y,m,s));
  const a=ax1({h:260,xr:[-0.25,0.25],yr:[-7.6,-1.8],xlabel:'y',ylabel:'P(s_m)\\,f_Y(y\\mid s_m)',
    ytickfmt:()=>'',yticksOverride:P.decades(-7,-2),xticksOverride:[-0.2,-0.1,0,0.1,0.2],zeroAxes:false,
    pad:{l:64,r:22,t:20,b:44}});
  leftTicks(a,P.decades(-7,-2),P.decade);
  const inX=f=>y=>Math.abs(y)<=0.24?f(y):NaN;
  a.curve(inX(y=>L(y,-A,p0)),{color:C.mid,width:2.4,dash:'8 5'});
  a.curve(inX(y=>L(y,A,1-p0)),{color:C.mid,width:2.4});
  a.vline(0,{color:C.muted});
  a.vline(lam,{color:C.ink,dash:'6 4',width:1.6,opacity:1});
  a.point(lam,L(lam,A,1-p0),{color:C.ink,r:4.5});
  a.note(lam+0.012,-6.9,'\\lambda_{\\mathrm{opt}}=0.0212',{tex:true,fs:14,color:C.ink});
  return a.svg();
}
function figExPe(){
  const {lam}=EX, lg=l=>Math.log10(EX.pe(l));
  const a=ax1({xr:[-0.12,0.16],yr:[-5.75,-4.45],xlabel:'\\lambda',ylabel:'P_e',
    ytickfmt:()=>'',yticksOverride:[Math.log10(4e-6),Math.log10(1e-5),Math.log10(2e-5)],
    xticksOverride:[-0.1,-0.05,0,0.05,0.1,0.15],zeroAxes:false,pad:{l:88,r:22,t:20,b:44}});
  leftTicks(a,[Math.log10(4e-6),Math.log10(1e-5),Math.log10(2e-5)],mdec);
  a.curve(lg,{color:C.in,width:2.4});
  a.vline(0,{color:C.muted}); a.vline(lam,{color:C.ink,dash:'6 4',width:1.6,opacity:1});
  a.point(0,lg(0),{color:C.muted,r:5}); a.point(lam,lg(lam),{color:C.in,r:5.5});
  return a.svg();
}

/* ---- 2.4 intersymbol interference ---------------------------------------
   A first-order RC lowpass of 3 dB bandwidth B, T_b = 1, q = exp(-2 pi B T_b). */
const rcq=bt=>Math.exp(-2*Math.PI*bt);
function rcResp(bt){ const tau=1/(2*Math.PI*bt), e=Math.exp(-1/tau);
  return t=>t<0?0:t<=1?1-Math.exp(-t/tau):(1-e)*Math.exp(-(t-1)/tau); }
function rcTrain(bits,bt,hist=0){ const r=rcResp(bt), tau=1/(2*Math.PI*bt);
  return t=>bits.reduce((s,b,k)=>s+(b?1:-1)*r(t-k),t>=0?hist*Math.exp(-t/tau):hist); }
const nrz=(bits,hist=0)=>t=>{ const k=Math.floor(t); return k<0?hist:k<bits.length?(bits[k]?1:-1):0; };

const ISI_B=[1,1,0,1,0,0];
function figIsiBuild(){
  const bt=0.25, r=rcResp(bt);
  const a=ax1({h:250,xr:[-0.6,7.3],yr:[-1.6,1.75],xlabel:'t/T_b',ylabel:'y(t)',
    xticksOverride:[0,1,2,3,4,5,6,7],ytarget:4});
  a.curve(nrz(ISI_B),{color:C.in,width:1.4,dash:'5 5',opacity:0.7,n:1400});
  ISI_B.forEach((b,k)=>a.curve(t=>(b?1:-1)*r(t-k),{color:C.mid,width:1.2,dash:'3 4',opacity:0.6,n:900}));
  const y=rcTrain(ISI_B,bt);
  a.curve(y,{color:C.out,width:2.6,n:1400});
  ISI_B.forEach((_,k)=>a.point(k+1,y(k+1),{color:C.mid,r:4.6}));
  return a.svg();
}
const TERM_B=[0,0,0,1];
function figIsiTermTop(){
  const bt=0.25, y=rcTrain(TERM_B,bt,-1);
  const a=ax2({xr:[-0.6,4.4],yr:[-1.4,1.5],xlabel:'t/T_b',ylabel:'y(t)',xticksOverride:[0,1,2,3,4]});
  a.curve(nrz(TERM_B,-1),{color:C.in,width:1.4,dash:'5 5',opacity:0.7,n:900});
  a.curve(y,{color:C.out,width:2.6,n:900});
  a.vline(4,{color:C.muted});
  a.point(4,y(4),{color:C.mid,r:5});
  a.note(2.2,1.22,`y=${y(4).toFixed(3)}`,{tex:true,fs:13,color:C.mid});
  return a.svg();
}
function figIsiTermBottom(){
  const q=rcq(0.25);
  const cont=[0,1,2,3,4].map(m=>[m,(m===0?1:-1)*(1-q)*Math.pow(q,m)]);
  const a=ax2({xr:[-0.5,5],yr:[-0.35,1.0],xlabel:'m\\;(\\text{bits back})',ylabel:'\\text{share of the sample}',
    xticksOverride:[0,1,2,3,4]});
  a.stem([cont[0]],{color:C.mid});
  a.stem(cont.slice(1),{color:C.err});
  a.note(0.14,0.84,'1-q',{tex:true,fs:13,color:C.mid});
  a.note(2.0,0.36,'-(1-q)q^{m}',{tex:true,fs:13,color:C.err});
  return a.svg();
}
const EXI_B=[0,0,0,1,1,1,0,1];
function figExIsi(){
  const bt=0.25, y=rcTrain(EXI_B,bt,-1);
  const a=ax1({h:250,xr:[-0.4,8.4],yr:[-1.5,1.6],xlabel:'t/T_b',ylabel:'y(t)',
    xticksOverride:[0,1,2,3,4,5,6,7,8],ytarget:4});
  a.curve(nrz(EXI_B,-1),{color:C.ink,width:1.6,dash:'6 5',n:1400});
  EXI_B.forEach((b,k)=>a.note(k+0.5,1.4,String(b),{fs:13,color:C.ink,anchor:'middle'}));
  a.curve(y,{color:C.out,width:2.6,n:1400});
  EXI_B.forEach((_,k)=>a.point(k+1,y(k+1),{color:C.mid,r:4.6}));
  a.note(7.12,y(7)-0.22,y(7).toFixed(3),{tex:true,fs:14,color:C.mid});
  return a.svg();
}
function eyeTraces(bt,n){
  const out=[], r=rcResp(bt);
  for(let j=0;j<n;j++){ const p=(j*37+45)%128, bits=[];
    for(let k=0;k<7;k++) bits.push((p>>k)&1);
    const pts=[]; for(let i=0;i<=120;i++){ const u=-1+2*i/120, t=6+u;
      let s=0; bits.forEach((b,k)=>{ s+=(b?1:-1)*r(t-k); }); pts.push([u,s]); }
    out.push(pts); }
  return out;
}
function figEye(){
  const a=ax1({h:230,xr:[-1,1],yr:[-1.5,1.5],xlabel:'t/T_b',ylabel:'y(t)',xticksOverride:[-1,-0.5,0,0.5,1],ytarget:4});
  a.raw('<g opacity="0.5">');
  eyeTraces(0.3,128).forEach(pts=>a.poly(pts,{color:C.out,width:1.1}));
  a.raw('</g>');
  a.vline(0,{color:C.muted});
  return a.svg();
}
function figEyeClose(bt){
  const q=rcq(bt), h=1-2*q;
  const a=ax1({h:230,xr:[-1,1],yr:[-1.5,1.5],xlabel:'t/T_b',ylabel:'y(t)',xticksOverride:[-1,-0.5,0,0.5,1],ytarget:4});
  a.raw('<g opacity="0.5">');
  eyeTraces(bt,128).forEach(pts=>a.poly(pts,{color:C.out,width:1.1}));
  a.raw('</g>');
  a.vline(0,{color:C.muted});
  a.poly([[0.04,-h],[0.04,h]],{color:C.mid,width:2.4});
  a.poly([[0.02,h],[0.06,h]],{color:C.mid,width:2.4}); a.poly([[0.02,-h],[0.06,-h]],{color:C.mid,width:2.4});
  a.note(0.09,1.3,`2(1-2q)=${(2*h).toFixed(3)}`,{tex:true,fs:14,color:C.mid});
  return a.svg();
}
/* 128 seven-bit patterns, each with its own seeded noise, and a histogram of
   1024 samples at the sampling instant, as on the slide */
const EYE_P=[...Array(128)].map((_,j)=>{ const p=(j*37+45)%128, b=[]; for(let k=0;k<7;k++) b.push((p>>k)&1); return b; });
const EYE_W=EYE_P.map((_,j)=>noiseFn(20260960+j,0.3,1,3,9));
const EYE_Z=gauss(20260951,1024,1);
function figEyeNoise(bt,sg){
  const r=rcResp(bt), y0=(bits,t)=>bits.reduce((s,b,k)=>s+(b?1:-1)*r(t-k),0);
  const a=ax1({h:290,xr:[-1,2.3],yr:[-2.9,2.9],xlabel:'t/T_b',ylabel:'y(t)',xticksOverride:[-1,-0.5,0,0.5,1],ytarget:4});
  a.raw('<g opacity="0.45">');
  EYE_P.forEach((bits,j)=>{ const pts=[]; for(let i=0;i<=90;i++){ const u=-1+2*i/90, t=6+u;
    pts.push([u,y0(bits,t)+sg*EYE_W[j](t)]); } a.poly(pts,{color:C.out,width:1.05}); });
  a.raw('</g>');
  a.vline(0,{color:C.muted});
  a.vline(1.08,{color:C.muted});
  const NB=44, lo=-2.2, hi=2.2, ok=Array(NB).fill(0), bad=Array(NB).fill(0); let ne=0;
  EYE_P.forEach((bits,j)=>{ const s0=y0(bits,6), one=bits[5]===1;
    for(let d=0;d<8;d++){ const y=s0+sg*EYE_Z[j*8+d], k=Math.max(0,Math.min(NB-1,Math.floor((y-lo)/(hi-lo)*NB)));
      if((y>0)===one) ok[k]++; else { bad[k]++; ne++; } } });
  const top=Math.max(40,...ok.map((c,k)=>c+bad[k])), X0=1.14, L=1.1/top, bw=(hi-lo)/NB;
  for(let k=0;k<NB;k++){ const ya=lo+k*bw+0.01, yb=lo+(k+1)*bw-0.01;
    if(ok[k]) a.rect(X0,ya,X0+L*ok[k],yb,{fill:C.mid});
    if(bad[k]) a.rect(X0+L*ok[k],ya,X0+L*(ok[k]+bad[k]),yb,{fill:C.err}); }
  a.note(2.27,2.55,'y_k\\;\\text{at}\\;t=0',{tex:true,fs:14,color:C.mid,anchor:'end'});
  a.note(2.27,-2.7,`\\text{errors}=${ne}\\,/\\,1024`,{tex:true,fs:14,color:ne?C.err:C.muted,anchor:'end'});
  return a.svg();
}

/* ---- 2.5 Nyquist and the raised cosine ----------------------------------
   T_b = 1, so R_b = 1 and W = 1/2. */
const rcPulse=(t,al)=>{ const den=1-4*al*al*t*t;
  if(Math.abs(den)<1e-6) return sinc(t)*Math.PI/4;
  return sinc(t)*Math.cos(Math.PI*al*t)/den; };
const rcSpec=(f,al)=>{ const u=Math.abs(f), f1=1-al;
  if(al<1e-9) return u<=1?1:0;
  if(u<=f1) return 1;
  if(u<2-f1) return 0.5*(1-Math.sin(Math.PI*(u-1)/(2-2*f1)));
  return 0; };
function figSincTrain(){
  const a=ax1({xr:[-4.5,4.5],yr:[-0.35,1.3],xlabel:'t/T_b',ylabel:'p(t)',xticksOverride:[-4,-3,-2,-1,0,1,2,3,4]});
  a.curve(t=>sinc(t-1),{color:C.in,width:1.4,dash:'6 5',opacity:0.6});
  a.curve(t=>sinc(t+1),{color:C.in,width:1.4,dash:'6 5',opacity:0.6});
  a.curve(sinc,{color:C.in,width:2.6});
  for(let k=-4;k<=4;k++) a.point(k,sinc(k),{color:C.mid,r:4.8});
  return a.svg();
}
function figTiling(){
  const tri=u=>Math.max(0,1-Math.abs(u));
  const a=ax1({xr:[-3.3,3.3],yr:[-0.12,1.45],xlabel:'f/R_b',ylabel:'R_b\\,P(f-nR_b)',xticksOverride:[-3,-2,-1,0,1,2,3]});
  for(const n of [-2,-1,1,2]) a.poly([[n-1,0],[n,1],[n+1,0]],{color:C.mid,width:1.8,dash:'6 4'});
  a.poly([[-1,0],[0,1],[1,0]],{color:C.in,width:2.6});
  a.curve(u=>{ if(Math.abs(u)>2) return NaN; let s=0; for(let n=-2;n<=2;n++) s+=tri(u-n); return s; },{color:C.mid,width:2.8});
  return a.svg();
}
function figNyqChannel(){
  const a=ax1({xr:[-3.6,3.6],yr:[-0.12,1.4],xlabel:'f/W',ylabel:'2W\\,P(f-nR_b)',xticksOverride:[-3,-1,1,3]});
  for(let n=-1;n<=1;n++)
    a.poly([[-3.6,0],[2*n-1,0],[2*n-1,1],[2*n+1,1],[2*n+1,0],[3.6,0]],{color:n?C.mid:C.in,width:n?1.8:2.6,dash:n?'6 4':null});
  return a.svg();
}
const sincIsi=(eps,K=20)=>{ let s=0; for(let k=-K;k<=K;k++) if(k) s+=Math.abs(sinc(k+eps)); return s; };
function figSincOffset(eps){
  const a=ax1({xr:[-5.5,5.5],yr:[-0.35,1.35],xlabel:'t/T_b',ylabel:'p(t)',xticksOverride:[-5,-4,-3,-2,-1,0,1,2,3,4,5]});
  a.curve(sinc,{color:C.in,width:2.6});
  const st=[]; for(let k=-5;k<=5;k++) if(k) st.push([k+eps,sinc(k+eps)]);
  a.stem(st,{color:C.err});
  a.stem([[eps,sinc(eps)]],{color:C.mid});
  a.note(-5.35,1.16,`\\textstyle\\sum_{1\\le|k|\\le20}|p(kT_b+\\epsilon)|=${sincIsi(eps).toFixed(2)}`,{tex:true,fs:14,color:C.err});
  return a.svg();
}
function figRcSpec(al){
  const a=ax1({xr:[-3.3,3.3],yr:[-0.12,1.4],xlabel:'f/W',ylabel:'2W\\,P(f)',xticksOverride:[-3,-2,-1,0,1,2,3]});
  for(const n of [-1,1]) a.curve(f=>rcSpec(f-2*n,al),{color:C.mid,width:1.6,dash:'6 4',n:900});
  a.curve(f=>rcSpec(f,al),{color:C.in,width:2.6,n:900});
  a.curve(f=>{ let s=0; for(let n=-2;n<=2;n++) s+=rcSpec(f-2*n,al); return s; },{color:C.mid,width:2.2,n:900});
  a.span(-1-al,1+al,1.24,'',{color:C.muted});
  a.note(-0.8,1.31,`B_T=${(1+al).toFixed(2)}\\,W`,{tex:true,fs:14,color:C.muted,anchor:'middle'});
  return a.svg();
}
function figRcPulse(al){
  const a=ax1({xr:[-4.5,4.5],yr:[-0.3,1.25],xlabel:'t/T_b',ylabel:'p(t)',xticksOverride:[-4,-3,-2,-1,0,1,2,3,4]});
  a.curve(sinc,{color:C.in,width:1.4,dash:'6 5',opacity:0.6});
  a.curve(t=>rcPulse(t,al),{color:C.in,width:2.6,n:900});
  for(let k=-4;k<=4;k++) a.point(k,k?0:1,{color:C.mid,r:4.6});
  a.note(-4.35,1.06,`\\alpha=${al.toFixed(2)}`,{tex:true,fs:15,color:C.in});
  return a.svg();
}
function figExRc(){
  const a=ax1({xr:[-22,22],yr:[-0.12,1.35],xlabel:'f\\;(\\text{kHz})',ylabel:'2W\\,P(f)',
    xticksOverride:[-20,-15,-10,-5,0,5,10,15,20]});
  a.poly([[-22,0],[-10,0],[-10,1],[10,1],[10,0],[22,0]],{color:C.ink,width:1.6,dash:'6 5'});
  a.curve(f=>rcSpec(f/10,0.5),{color:C.in,width:2.6,n:900});
  a.span(-15,15,1.18,'',{color:C.in});
  a.note(-7.5,1.25,'B_T=15\\ \\text{kHz}',{tex:true,fs:14,color:C.in,anchor:'middle'});
  return a.svg();
}
function figSrrc(){
  const al=0.5;
  const a=ax1({xr:[-2.2,2.2],yr:[-0.08,1.3],xlabel:'f/W',ylabel:'\\text{spectrum}',
    xticksOverride:[-2,-1.5,-1,-0.5,0,0.5,1,1.5,2]});
  a.curve(f=>Math.sqrt(rcSpec(f,al)),{color:C.h,width:2.4,dash:'8 5',n:900});
  a.curve(f=>rcSpec(f,al),{color:C.in,width:2.6,n:900});
  return a.svg();
}

/* ---- 2.6 the link in practice ------------------------------------------- */
/* One tap: z(t) = y(t) + w y(t - T_b). The eye uses 128 seeded patterns of
   twelve bits, as on the slide. */
const EQ_P=(()=>{ const r=rng(20260970), o=[];
  for(let j=0;j<128;j++){ const b=[]; for(let k=0;k<12;k++) b.push(r()<0.5?0:1); o.push(b); } return o; })();
function figEqEye(bt,w){
  const q=rcq(bt), r=rcResp(bt), g=t=>r(t)+w*r(t-1), h=(1-q)-Math.abs(q+w);
  const a=ax2({h:250,xr:[-1,1],yr:[-2,2],xlabel:'t/T_b',ylabel:'z(t)',xticksOverride:[-1,0,1],ytarget:4});
  a.raw('<g opacity="0.5">');
  EQ_P.forEach(bits=>{ const pts=[]; for(let i=0;i<=90;i++){ const u=-1+2*i/90, t=11+u;
    pts.push([u,bits.reduce((s,bb,k)=>s+(bb?1:-1)*g(t-k),0)]); } a.poly(pts,{color:C.out,width:1.05}); });
  a.raw('</g>');
  a.vline(0,{color:C.muted});
  if(h>0.02){
    a.poly([[0.07,-h],[0.07,h]],{color:C.mid,width:2.4});
    a.poly([[0.03,h],[0.11,h]],{color:C.mid,width:2.4}); a.poly([[0.03,-h],[0.11,-h]],{color:C.mid,width:2.4});
  }
  return a.svg();
}
function figEqTaps(bt,w){
  const q=rcq(bt), h=(1-q)-Math.abs(q+w);
  const a=ax2({h:250,xr:[-0.7,5.6],yr:[-0.9,1.3],xlabel:'m',ylabel:'g_m',xticksOverride:[0,1,2,3,4,5]});
  a.stem([[0,1-q]],{color:C.mid});
  const tail=[]; for(let m=1;m<=5;m++) tail.push([m,(1-q)*Math.pow(q,m-1)*(q+w)]);
  a.stem(tail,{color:C.err});
  a.note(5.5,1.12,h>0.02?`\\text{opening }${(2*h).toFixed(2)}`:'\\text{eye closed}',
    {tex:true,fs:13,color:h>0.02?C.mid:C.err,anchor:'end'});
  return a.svg();
}
/* The early-late gate on the triangle of 2.1, with the clock 0.4 T_b late and
   early and late samples 0.35 T_b either side. */
const tri=t=>Math.max(0,1-Math.abs(t-1));
function figTiming(){
  const tau=1.4, D=0.35;
  const a=ax1({xr:[-0.15,2.4],yr:[-0.12,1.42],xlabel:'t/T_b',ylabel:'y(t)',xticksOverride:[0,0.5,1,1.5,2]});
  a.curve(tri,{color:C.mid,width:2.6,n:900});
  for(const d of [-D,D]){ const x=tau+d;
    a.poly([[x,0],[x,tri(x)]],{color:C.slate,width:1.6,dash:'5 4'});
    a.point(x,tri(x),{color:C.slate,r:4.6}); }
  a.poly([[tau,0],[tau,tri(tau)]],{color:C.out,width:2.2});
  a.point(tau,tri(tau),{color:C.out,r:5.2});
  const e=tri(tau-D)-tri(tau+D);
  a.note(0.06,1.26,`e=${e.toFixed(2)}`,{tex:true,fs:14,color:C.ink});
  return a.svg();
}
/* Spectra around a carrier, frequency in units of R_b: the raised cosine, the
   rectangular pulse's sinc^2, and the neighbouring channel at spacing Delta. */
const DB_LO=-45;
const dBv=x=>Math.max(DB_LO,10*Math.log10(Math.max(x,1e-9)));
/* a curve stops at the floor rather than running along it */
const dBc=x=>{ const v=10*Math.log10(Math.max(x,1e-12)); return v<DB_LO?NaN:v; };
const simpson=(f,a,b,n=400)=>{ if(b<=a) return 0; const h=(b-a)/n; let s=f(a)+f(b);
  for(let i=1;i<n;i++) s+=(i%2?4:2)*f(a+i*h); return s*h/3; };
function figPsd(al,dl){
  const rc=f=>rcSpec(2*f,al), rect=f=>sinc(f)*sinc(f);
  const lo=dl-(1+al)/2, hi=dl+(1+al)/2;
  const a=ax1({h:260,xr:[-2.6,3.4],yr:[DB_LO-7,14],xlabel:'(f-f_c)/R_b',ylabel:'S(f)\\;(\\text{dB})',
    xticksOverride:[-2,-1,0,1,2,3],yticksOverride:[-40,-30,-20,-10,0],ytarget:4});
  const fill=fn=>{ const x0=Math.max(lo,-2.6), x1=Math.min(hi,3.4), pts=[];
    for(let i=0;i<=200;i++){ const x=x0+(x1-x0)*i/200, y=Math.max(DB_LO,Math.min(14,dBv(fn(x))));
      pts.push(a.sx(x).toFixed(2)+','+a.sy(y).toFixed(2)); }
    a.raw(`<path d="M${a.sx(x0).toFixed(2)},${a.sy(DB_LO).toFixed(2)}L${pts.join('L')}L${a.sx(x1).toFixed(2)},${a.sy(DB_LO).toFixed(2)}Z" fill="${C.dec.err}" stroke="none"/>`); };
  fill(rect); if(lo<(1+al)/2) fill(rc);
  a.curve(f=>dBc(rc(f-dl)),{color:C.slate,width:1.8,dash:'2 4',n:1200});
  a.curve(f=>dBc(rect(f)),{color:C.in,width:1.6,dash:'4 4',n:1600});
  a.curve(f=>dBc(rc(f)),{color:C.in,width:2.6,n:1200});
  const pr=simpson(rect,lo,hi,800);
  const prc=simpson(rc,Math.max(lo,-(1+al)/2),Math.min(hi,(1+al)/2))/simpson(rc,-(1+al)/2,(1+al)/2);
  const pct=x=>x<0.0005?'0':(100*x).toFixed(1);
  a.note(3.35,8.5,`\\text{rectangle }${pct(pr)}\\%,\\ \\text{RC }${pct(prc)}\\%`,{tex:true,fs:14,color:C.ink,anchor:'end'});
  return a.svg();
}
/* Eight bits over four hops, each hop adding its own seeded noise. */
const RP_B=[1,0,1,1,0,0,1,0];
const RP_N=[1,2,3,4].map(i=>noiseFn(20261120+i,0.25,0.5,-1,10));
const RP_R=(()=>{ const out=[RP_B.slice()]; let cur=RP_B.slice();
  RP_N.forEach(n=>{ cur=cur.map((b,j)=>((b?1:-1)+n(j+0.5))>0?1:0); out.push(cur.slice()); }); return out; })();
const lvl=bits=>t=>{ const k=Math.floor(t); return k<0||k>=bits.length?0:(bits[k]?1:-1); };
function figRepeater(){
  const s=lvl(RP_B), acc=t=>RP_N.reduce((n,f)=>n+f(t),0);
  const b=P.Axes({w:700,h:170,xr:[-0.2,8.3],yr:[-3.6,3.6],xlabel:'',ylabel:'\\text{amplified}',
    pad:{l:56,r:22,t:22,b:14},xticksOverride:[],ytarget:2});
  b.curve(t=>t>=0&&t<8?s(t)+acc(t):0,{color:C.out,width:1.4,n:1600});
  RP_B.forEach((bit,j)=>{ const y=s(j+0.5)+acc(j+0.5);
    b.point(j+0.5,y,{color:(y>0)===(bit===1)?C.mid:C.err,r:4.4}); });
  const c=P.Axes({w:700,h:190,xr:[-0.2,8.3],yr:[0.2,3.8],xlabel:'t/T_b',ylabel:'\\text{regenerated}',
    pad:{l:56,r:22,t:22,b:40},xnameDrop:44*P.labelScale(),xticksOverride:[0,2,4,6,8],yticksOverride:[1,3],ytickfmt:y=>P.fmt(y-2)});
  c.hline(2,{color:C.muted});
  const prev=lvl(RP_R[3]), sent=RP_R[4];
  c.curve(t=>2+(t>=0&&t<8?prev(t)+RP_N[3](t):0),{color:C.noise,width:1.3,n:1600});
  sent.forEach((bit,j)=>{ const y=bit?3:1, wrong=bit!==RP_B[j];
    c.poly([[j,y],[j+1,y]],{color:wrong?C.err:C.out,width:2.6});
    if(j && sent[j-1]!==bit) c.poly([[j,1],[j,3]],{color:C.out,width:2.6}); });
  c.poly([[-0.2,2],[0,2],[0,sent[0]?3:1]],{color:C.out,width:2.6});
  c.poly([[8,sent[7]?3:1],[8,2],[8.3,2]],{color:C.out,width:2.6});
  return stack(700,[[b.svg(),170],[c.svg(),190]]);
}

/* ---- the whole link: eight bits through pulse, noise, correlator and
   decision, the last frame of the slide. The second decision is wrong. */
const CH_B=[1,0,0,1,1,0,1,0];
const CH_W=noiseFn(20260942,0.25,0.9,-1,10);
const chS=nrz(CH_B), chX=t=>t>=0&&t<8?chS(t)+CH_W(t):0;
const chY=k=>{ let s=0; const N=200; for(let i=0;i<N;i++) s+=chX(k+(i+0.5)/N); return s/N; };
function figChain(){
  const axc=(h,yr,yl,pb)=>P.Axes({w:700,h,xr:[-0.2,8.3],yr,xlabel:pb?'t/T_b':'',ylabel:yl,
    pad:{l:56,r:22,t:22,b:pb?40:14},xticksOverride:pb?[0,2,4,6,8]:[],ytarget:2});
  const a=axc(110,[-1.6,1.9],'s(t)',false);
  CH_B.forEach((b,k)=>a.note(k+0.5,1.55,String(b),{fs:14,color:C.ink,anchor:'middle',weight:600}));
  a.curve(chS,{color:C.in,width:2.4,n:1400});
  const b=axc(110,[-3.2,3.2],'x(t)',false);
  b.curve(chX,{color:C.out,width:1.4,n:1400});
  const c=axc(160,[-1.9,2.0],'y_k',true);
  c.hline(0,{color:C.muted});
  c.stem(CH_B.map((_,k)=>[k+1,chY(k)]),{color:C.mid});
  CH_B.forEach((bit,k)=>{ const d=chY(k)>0?1:0;
    c.note(k+1,1.62,String(d),{fs:14,color:d===bit?C.out:C.err,anchor:'middle',weight:600}); });
  return stack(700,[[a.svg(),110],[b.svg(),110],[c.svg(),160]]);
}

window.C2 = [

{t:'h1', num:'CHAPTER 2', text:'Baseband transmission of digital signals'},
{t:'p', lead:true, text:'Each bit is sent as one waveform. The channel adds noise, and the receiver filters, samples and decides.'},
{t:'p', text:'The matched filter gives the largest peak SNR, $2E/N_0$. Only the pulse energy counts, not its shape. With polar signalling and equal priors, $P_b=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$. A channel narrower than $R_b/2$ cannot avoid intersymbol interference.'},

/* ================================================================ 2.1 === */
{t:'h2', num:'2.1', text:'The matched filter'},

{t:'h3', text:'The receiver model'},
{t:'p', text:'One bit is sent as a pulse $g(t)$ on $0\\le t\\le T$. The channel adds noise $w(t)$. The receiver passes the sum through a linear filter $h(t)$ and samples the output once, at $t=T$.'},
{t:'fig', svg:()=>figReceiver(),
 cap:'The receiver model. One pulse $g(t)$ on $[0,T]$ plus white noise $w(t)$ enters a linear filter, and the output is sampled once, at $t=T$. The lower panel shows one pulse (cyan) and the same pulse with noise on it (green).'},
{t:'eqbox', cap:'Received signal', tex:'x(t)=g(t)+w(t),\\qquad 0\\le t\\le T',
 after:'$g(t)$ is the pulse of one bit. $w(t)$ is the noise the channel adds.'},
{t:'p', text:'The noise is white and Gaussian. White means that its power spectral density is flat. Its autocorrelation is then an impulse, so noise values at two different times are uncorrelated.'},
{t:'eqbox', cap:'White noise', tex:'S_W(f)=\\frac{N_0}{2}\\quad\\text{for all }f,\\qquad R_W(\\tau)=\\frac{N_0}{2}\\,\\delta(\\tau)',
 after:'The density is two-sided: it is $N_0/2$ at every positive and every negative frequency. For example, $S_W(f)=10^{-9}$ W/Hz means $N_0=2(10^{-9})=2\\times10^{-9}$ W/Hz.'},

{t:'h3', text:'The peak pulse signal-to-noise ratio'},
{t:'p', text:'The filter is linear, so its output splits into two parts. The signal part $g_0(t)$ is the output for $g(t)$ alone. The noise part $n(t)$ is the output for $w(t)$ alone.'},
{t:'p', text:'The receiver reads one value, at $t=T$. The quality of that value is the signal power there against the noise power there.'},
{t:'eqbox', cap:'Peak pulse SNR', tex:'\\eta=\\frac{|g_0(T)|^{2}}{E[n^{2}(T)]}',
 after:'The ratio $\\eta$ is the <b>peak pulse signal-to-noise ratio</b>. For example, $g_0(T)=2$ mV and $E[n^{2}(T)]=10^{-6}\\ \\text{V}^{2}$ give $\\eta=(2\\times10^{-3})^{2}/10^{-6}=4$.'},
{t:'p', text:'Both parts can be written in the frequency domain. The signal part is the inverse transform of $H(f)G(f)$, read at $t=T$. The noise part integrates the output noise density $S_W(f)|H(f)|^{2}$.'},
{t:'eqbox', cap:'Both parts in $f$', tex:'\\begin{aligned}g_0(T)&=\\int_{-\\infty}^{\\infty}H(f)\\,G(f)\\,e^{j2\\pi fT}\\,df\\\\E[n^{2}(T)]&=\\int_{-\\infty}^{\\infty}\\frac{N_0}{2}\\,|H(f)|^{2}\\,df\\end{aligned}'},
{t:'fig', svg:()=>figSnr(),
 cap:'The filter output. The heavy line is the signal part $g_0(t)$ and the grey band is one noise standard deviation wide around it. The thin line is one noisy output. The receiver reads one value, at $t=T$.'},

{t:'h3', text:'The bound on the output SNR'},
{t:'p', text:'Schwarz\'s inequality bounds $\\eta$. It holds for any pair of functions.'},
{t:'eqbox', cap:'Schwarz\'s inequality', tex:'\\Bigl|\\int\\phi_1(f)\\,\\phi_2(f)\\,df\\Bigr|^{2}\\le\\int|\\phi_1(f)|^{2}\\,df\\int|\\phi_2(f)|^{2}\\,df',
 after:'Equality holds only when $\\phi_1(f)=k\\,\\phi_2^{*}(f)$ for a constant $k$.'},
{t:'p', text:'Take $\\phi_1=H(f)$ and $\\phi_2=G(f)\\,e^{j2\\pi fT}$. The left side is then $|g_0(T)|^{2}$. Since $|e^{j2\\pi fT}|=1$, the right side is $\\int|H(f)|^{2}df\\int|G(f)|^{2}df$.'},
{t:'eq', tex:'|g_0(T)|^{2}\\le\\int|H(f)|^{2}df\\int|G(f)|^{2}df'},
{t:'p', text:'Divide both sides by the noise power $E[n^{2}(T)]$.'},
{t:'eqbox', cap:'The bound', tex:'\\begin{aligned}\\eta&\\le\\frac{\\int|H(f)|^{2}df\\int|G(f)|^{2}df}{\\frac{N_0}{2}\\int|H(f)|^{2}df}\\\\&=\\frac{2}{N_0}\\int|G(f)|^{2}\\,df=\\frac{2E}{N_0}\\end{aligned}',
 after:'The factor $\\int|H(f)|^{2}df$ cancels between the top and the bottom. Parseval\'s theorem gives $\\int|G(f)|^{2}df=E$, the pulse energy, so the bound contains no $H$. For example, $E=5\\times10^{-7}$ J and $N_0=10^{-7}$ W/Hz give $\\eta_{\\max}=2(5\\times10^{-7})/10^{-7}=10$.'},
{t:'fig', svg:()=>figSchwarz(2),
 cap:'The signal spectrum $|G(f)|$ (cyan) and a filter $|H(f)|$ (amber, dashed) of twice its width, $b=2$. The shaded overlap sets the SNR, here $0.80$ of the bound. The bound is reached only when the two shapes agree, at $b=1$.'},

{t:'h3', text:'The matched filter'},
{t:'p', text:'The equality condition of Schwarz\'s inequality names the best filter. Put $\\phi_1=H(f)$ and $\\phi_2=G(f)e^{j2\\pi fT}$ into $\\phi_1=k\\phi_2^{*}$.'},
{t:'eqbox', cap:'In frequency', tex:'H_{\\mathrm{opt}}(f)=k\\,G^{*}(f)\\,e^{-j2\\pi fT}',
 after:'The conjugate of $e^{j2\\pi fT}$ is $e^{-j2\\pi fT}$, and $k$ is the constant of the equality condition.'},
{t:'p', text:'Take the inverse transform to find the filter in time. The integral that appears is the conjugate of the inverse transform of $G(f)$, read at $T-t$.'},
{t:'eqbox', cap:'In time', tex:'\\begin{aligned}h_{\\mathrm{opt}}(t)&=\\int_{-\\infty}^{\\infty}H_{\\mathrm{opt}}(f)\\,e^{j2\\pi ft}\\,df\\\\&=k\\int_{-\\infty}^{\\infty}G^{*}(f)\\,e^{-j2\\pi f(T-t)}\\,df\\\\&=k\\,g^{*}(T-t)\\\\&=k\\,g(T-t)\\end{aligned}',
 after:'A real pulse has $g^{*}=g$. The filter is the pulse reversed in time and shifted right by $T$. It is called the <b>matched filter</b>.'},
{t:'p', text:'For example, the ramp $g(t)=t/T$ on $0\\le t\\le T$ with $k=1$ has $h_{\\mathrm{opt}}(0)=g(T-0)=g(T)=1$.'},
{t:'fig', svg:()=>figMatchedBuild(),
 cap:'The matched filter of the ramp $s(t)=t/T$, built in two moves. The ramp (cyan) is reversed in time to $s(-t)$ (amber, dashed), then shifted right by $T$ to $h(t)=s(T-t)$ (amber).'},

{t:'h3', text:'The output of the matched filter'},
{t:'p', text:'The matched-filter output is a sliding overlap. Write it as a convolution and substitute $h(t)=s(T-t)$, so that $h(t-\\tau)=s(T-t+\\tau)$.'},
{t:'eqbox', cap:'Convolution', tex:'\\begin{aligned}y(t)&=\\int_{-\\infty}^{\\infty}s(\\tau)\\,h(t-\\tau)\\,d\\tau\\\\&=\\int_{-\\infty}^{\\infty}s(\\tau)\\,s(T-t+\\tau)\\,d\\tau\\end{aligned}'},
{t:'p', text:'At $t=T$ the two copies of $s$ lie on top of each other. The overlap is then the integral of $s^{2}$, which is the energy.'},
{t:'eqbox', cap:'The peak', tex:'y(T)=\\int_{-\\infty}^{\\infty}s^{2}(\\tau)\\,d\\tau=E',
 after:'For $s(t)=A$ on $[0,T]$, the overlap at $0\\le t\\le T$ has length $t$. So $y(t)=A^{2}t$, and $y(T/2)=A^{2}T/2=E/2$.'},
{t:'figrow', n:2, items:[
 {svg:()=>figConvTop(), cap:'The overlap at $t=T/2$. The pulse $s(\\tau)$ (cyan) and the copy $h(t-\\tau)$ (amber, dashed) share the shaded interval.'},
 {svg:()=>figConvBottom(), cap:'The output $y(t)$, the area of the overlap, drawn up to $t=T/2$. The dashed rest of the output peaks at $y(T)=E$.'}
]},

{t:'h3', text:'Properties of the matched filter'},
{t:'p', text:'Two properties follow from the results above.'},
{t:'ol', items:[
 'The output is the autocorrelation of the pulse, shifted by $T$. Its peak is $y(T)=E$.',
 'The peak SNR is $2E/N_0$. It depends on the energy, not on the shape.'
]},
{t:'p', text:'The second property can be checked in time. Parseval\'s theorem turns $\\int|H(f)|^{2}df$ into $\\int h^{2}(t)\\,dt$, and $h$ has the same energy as $s$.'},
{t:'eqbox', cap:'Noise at the output', tex:'\\begin{aligned}E[n^{2}(T)]&=\\frac{N_0}{2}\\int_{-\\infty}^{\\infty}h^{2}(t)\\,dt\\\\&=\\frac{N_0}{2}\\int_{-\\infty}^{\\infty}s^{2}(T-t)\\,dt=\\frac{N_0E}{2}\\end{aligned}',
 after:'Then $\\eta=E^{2}/(N_0E/2)=2E/N_0$, which is the bound. For example, a rectangular pulse and a half-sine pulse with $E=10^{-6}$ J and $N_0=10^{-7}$ W/Hz both give $\\eta_{\\max}=20$.'},
{t:'fig', svg:()=>figEqualOutputs(),
 cap:'A rectangular pulse and a half-sine pulse of the same energy $E$, each through its own matched filter. The rectangular output is solid and the half-sine output dashed. Both peak at $t=T$ with the value $E$.'},

{t:'ex', hd:'Example 2.1 — the matched filter of a rectangular pulse', rows:[
 ['Given','$s(t)=A$ on $[0,T]$, with $A=2$ V, $T=0.5$ ms and $N_0/2=10^{-4}$ W/Hz.'],
 ['Find','The matched filter $h(t)$, its output $y(t)$ and the largest peak SNR $\\eta_{\\max}$.'],
 ['Method','Reverse and shift the pulse to get $h(t)$. The output is the sliding overlap of $s$ and $h$. The largest SNR is $2E/N_0$, which needs only the energy.'],
 ['Solution','$h(t)=s(T-t)=A$ for $0\\le t\\le T$. The overlap gives $y(t)=A^{2}t$ for $0\\le t\\le T$ and $y(t)=A^{2}(2T-t)$ for $T\\le t\\le2T$. The energy is $E=A^{2}T=(2)^{2}(0.5\\times10^{-3})=2\\times10^{-3}$ J. Then $\\eta_{\\max}=2E/N_0=2(2\\times10^{-3})/(2\\times10^{-4})=20$.'],
 ['Check','$10\\log_{10}20=13.0$ dB. The peak is $y(T)=A^{2}T=E$, as the general result requires.']
]},
{t:'fig', svg:()=>figExMf(),
 cap:'Example 2.1: the pulse $s(t)/A$ (dashed) and the output of its matched filter, $y(t)/(A^{2}T)$. The output is a triangle that peaks at $y(T)=A^{2}T$.'},
{t:'box', kind:'err', hd:'Common error', html:'Use $N_0=2\\times10^{-4}$, not $N_0/2$, in $2E/N_0$. The wrong value gives $40$.'},

{t:'h3', text:'Matched filters around us'},
{t:'p', text:'The matched filter appears in radar, Wi-Fi, range finders and serial ports.'},
{t:'ul', items:[
 '<b>Radar.</b> A radar chirp lasts $T=10\\ \\mu$s and sweeps $B=5$ MHz. Its matched output is $(1-|t|/T)\\,|\\operatorname{sinc}(Bt(1-|t|/T))|$, a peak about $1/B=0.2\\ \\mu$s wide.',
 '<b>Wi-Fi.</b> Wi-Fi at $1$ and $2$ Mb/s spreads each bit over the $11$-chip Barker code $c[n]$. Its matched output $R[k]=\\sum_n c[n]\\,c[n+k]$ is $11$ at $k=0$ and $0$ or $-1$ elsewhere.',
 '<b>Range finder.</b> An ultrasonic range finder correlates the echo with the pulse it sent. The peak at $t_0=5.83$ ms gives $d=ct_0/2=1.00$ m for $c=343$ m/s.',
 '<b>Serial port.</b> A serial port at $9600$ baud integrates each bit over $T_b=1/9600=104.2\\ \\mu$s, then dumps. The integrator is the matched filter of a rectangular bit.'
]},
{t:'box', kind:'def', hd:'Correlation with a template', html:'Each receiver correlates what it hears with a copy of what was sent. That is the matched filter $h(t)=s(T-t)$ read at its peak.'},
{t:'box', kind:'def', hd:'Peak time', html:'The peak falls where the copy lines up with the echo. Its time is the delay, and the delay gives the range.'},
{t:'box', kind:'warn', hd:'Pulse compression', html:'A long chirp carries much energy, and its matched output is still a peak about $1/B$ wide. The resolution comes from the bandwidth $B$, not from the length $T$.'},

/* ================================================================ 2.2 === */
{t:'h2', num:'2.2', text:'The demodulator'},

{t:'h3', text:'The unit-energy basis and antipodal signalling'},
{t:'p', text:'Polar signalling sends $+A$ for a $1$ and $-A$ for a $0$, over a bit of length $T_b$. Both waveforms are multiples of one shape, the <b>basis function</b> $\\psi(t)$.'},
{t:'eqbox', cap:'The basis', tex:'\\psi(t)=\\frac{1}{\\sqrt{T_b}},\\quad 0\\le t\\le T_b,\\qquad\\int_{0}^{T_b}\\psi^{2}(t)\\,dt=1',
 after:'A basis function has unit energy. Outside $[0,T_b]$ it is zero.'},
{t:'p', text:'Each waveform is then a number times $\\psi(t)$. The number is set by the energy per bit $E_b$.'},
{t:'eqbox', cap:'Two waveforms', tex:'\\begin{aligned}s_1(t)&=+A=+\\sqrt{E_b}\\,\\psi(t)\\\\s_0(t)&=-A=-\\sqrt{E_b}\\,\\psi(t)\\\\E_b&=\\int_0^{T_b}A^{2}\\,dt=A^{2}T_b\\end{aligned}',
 after:'Since $\\sqrt{E_b}=A\\sqrt{T_b}$, the product $\\sqrt{E_b}\\,\\psi(t)$ is $A\\sqrt{T_b}/\\sqrt{T_b}=A$. The two waveforms are negatives of each other, so the signalling is called <b>antipodal</b>. With $A=2$ V and $T_b=1$ ms in a $1\\ \\Omega$ load, $E_b=(2)^{2}(10^{-3})=4$ mJ.'},
{t:'fig', svg:()=>figBasis(),
 cap:'The basis $\\psi(t)$ (amber) and the two waveforms of polar signalling, $s_1(t)$ (cyan) and $s_0(t)$ (cyan, dashed), drawn with $T_b=1$ and $A=1.5$. Each waveform is $\\psi(t)$ times a number.'},

{t:'h3', text:'Two waveforms as two points'},
{t:'p', text:'The number that multiplies $\\psi(t)$ is found by projection. Multiply the waveform by $\\psi(t)$ and integrate over the bit.'},
{t:'eqbox', cap:'Coefficient on $\\psi$', tex:'\\begin{aligned}s_m&=\\int_0^{T_b}s_m(t)\\,\\psi(t)\\,dt\\\\s_1&=\\int_0^{T_b}A\\,\\frac{1}{\\sqrt{T_b}}\\,dt=A\\sqrt{T_b}=+\\sqrt{E_b}\\end{aligned}',
 after:'For $s_0(t)=-A$ the same steps give $s_0=-\\sqrt{E_b}$. The two waveforms have become two points on one axis, the axis of $\\psi(t)$.'},
{t:'p', text:'The distance between the two points measures how far noise must push the received value to cause an error.'},
{t:'eqbox', cap:'Distance', tex:'d=s_1-s_0=\\sqrt{E_b}-\\bigl(-\\sqrt{E_b}\\bigr)=2\\sqrt{E_b}',
 after:'A larger distance means noise must move the received value further before it crosses to the wrong point. For $E_b=4$ mJ, $d=2\\sqrt{4\\times10^{-3}}=2(0.0632)=0.126\\ \\sqrt{\\text{J}}$.'},
{t:'figrow', n:2, items:[
 {svg:()=>figSpaceWave(), cap:'The two waveforms of polar signalling, $s_1(t)$ (solid) and $s_0(t)$ (dashed).'},
 {svg:()=>figSpacePoints(), cap:'The same two waveforms as points on the axis of $\\psi(t)$. The points are $2\\sqrt{E_b}$ apart.'}
]},

{t:'h3', text:'The demodulator output'},
{t:'p', text:'The demodulator correlates the received signal $x(t)=s_m(t)+w(t)$ with $\\psi(t)$. The integral splits into a signal term and a noise term.'},
{t:'eqbox', cap:'The sample', tex:'y(T_b)=\\int_0^{T_b}s_m(t)\\,\\psi(t)\\,dt+\\int_0^{T_b}w(t)\\,\\psi(t)\\,dt=s_m+n',
 after:'The first integral is the coefficient $s_m$ found above. The second is a noise value $n$.'},
{t:'p', text:'The noise value $n$ is Gaussian, because it comes from a linear operation on Gaussian noise. Its mean is zero. Its variance follows from the autocorrelation of white noise.'},
{t:'eqbox', cap:'Noise variance', tex:'\\begin{aligned}E[n^{2}]&=\\int_0^{T_b}\\!\\!\\int_0^{T_b}E[w(t)w(u)]\\,\\psi(t)\\,\\psi(u)\\,dt\\,du\\\\&=\\int_0^{T_b}\\!\\!\\int_0^{T_b}\\frac{N_0}{2}\\,\\delta(t-u)\\,\\psi(t)\\,\\psi(u)\\,dt\\,du\\\\&=\\frac{N_0}{2}\\int_0^{T_b}\\psi^{2}(t)\\,dt=\\frac{N_0}{2}\\end{aligned}',
 after:'The first line writes $n^{2}$ as a double integral and takes the expectation inside. The second uses $R_W(\\tau)=(N_0/2)\\delta(\\tau)$. The impulse then sifts $\\psi(u)$ to $\\psi(t)$, and $\\int\\psi^{2}dt=1$.'},
{t:'p', text:'For example, $N_0=2\\times10^{-4}$ W/Hz gives $\\sigma^{2}=N_0/2=10^{-4}$, so the standard deviation of $n$ is $\\sigma=\\sqrt{10^{-4}}=0.01$.'},
{t:'fig', svg:()=>figMfDemod(),
 cap:'The filter matched to $\\psi(t)$, and what it does to one noisy bit. The received bit is green and the filter output violet. At $t=T_b$ the output is the symbol $s_m$ plus a noise value $n$.'},

{t:'h3', text:'Correlator and matched-filter demodulators'},
{t:'p', text:'The number $y$ can be formed in two ways. The <b>correlator</b> multiplies by $\\psi(t)$ and integrates over the bit. It reads the result at $T_b$, then resets.'},
{t:'eqbox', cap:'Correlator', tex:'y=\\int_0^{T_b}x(t)\\,\\psi(t)\\,dt'},
{t:'p', text:'The <b>matched filter</b> has the impulse response $\\psi(T_b-t)$. Write its output as a convolution and put $t=T_b$.'},
{t:'eqbox', cap:'Matched filter at $T_b$', tex:'\\begin{aligned}h(t)&=\\psi(T_b-t)\\\\y(t)&=\\int_{-\\infty}^{\\infty}x(\\tau)\\,\\psi(T_b-t+\\tau)\\,d\\tau\\\\y(T_b)&=\\int_0^{T_b}x(\\tau)\\,\\psi(\\tau)\\,d\\tau\\end{aligned}',
 after:'The last line is the correlator output, for any shape of $\\psi$. The two demodulators agree at $t=T_b$.'},
{t:'p', text:'Away from $T_b$ the two outputs differ. Take one noiseless bit with $s_m=1$ and the rectangular $\\psi$. On $[0,T_b]$ both outputs rise along the same line.'},
{t:'p', text:'After $T_b$ the correlator has been reset, while the matched-filter output falls as $2-t/T_b$. So $y(1.5T_b)=0.5$ at the filter. Only the value at $T_b$ is used.'},
{t:'fig', svg:()=>figCorrMf(),
 cap:'One noiseless bit with $s_m=1$ and the rectangular $\\psi$. The matched-filter output is the wide line and the correlator output is dashed. The correlator integrates from $0$ and is reset at $T_b$. At $t=T_b$ both read $s_m$.'},

{t:'h3', text:'Demodulators around us'},
{t:'p', text:'Antipodal signalling and the correlator appear in serial links and digital receivers.'},
{t:'ul', items:[
 '<b>RS-485.</b> An RS-485 pair at $1$ Mb/s sends $s(t)=\\pm A$ on the difference of two wires, with $A=2$ V. That is polar signalling with $s_m=\\pm A\\sqrt{T_b}$.',
 '<b>UART.</b> A UART takes $16$ samples a bit. The sum $y=\\sum_{n=0}^{15}x[n]$ is a correlator with a rectangular $\\psi$, run on samples.',
 '<b>Decision statistic.</b> The values of $y$ for $4000$ bits at $E_b/N_0=6$ dB form two bumps. They sit at $\\pm\\sqrt{E_b}$, each with spread $\\sigma=\\sqrt{N_0/2}$.',
 '<b>Sampling instant.</b> Sampled $0.1T_b$ early, the output keeps $0.9\\sqrt{E_b}$. The signal energy seen drops to $0.81E_b$, a loss of $0.92$ dB.'
]},
{t:'box', kind:'def', hd:'Two points on a line', html:'Every antipodal link sends $\\pm A$ for one bit. After the demodulator only the number $y=\\pm\\sqrt{E_b}+n$ is left.'},
{t:'box', kind:'def', hd:'A correlator on samples', html:'A digital receiver adds samples instead of integrating. The sum of $N$ samples a bit is the correlator with $\\psi$ sampled $N$ times.'},
{t:'box', kind:'warn', hd:'Timing', html:'The correlator is read at the end of the bit. An offset of $\\epsilon$ scales the signal term by $1-\\epsilon/T_b$.'},

/* ================================================================ 2.3 === */
{t:'h2', num:'2.3', text:'The decision and its error'},

{t:'h3', text:'The decision statistic'},
{t:'p', text:'The demodulator output $y$ at $t=T_b$ is the <b>decision statistic</b>. It is all the receiver keeps of the bit.'},
{t:'eqbox', cap:'The statistic', tex:'y=s_m+n,\\qquad s_m=\\pm\\sqrt{E_b},\\qquad n\\sim\\mathcal{N}\\!\\left(0,\\tfrac{N_0}{2}\\right)',
 after:'The symbol sets the mean of $y$. The noise sets its spread.'},
{t:'p', text:'Given the symbol, $y$ is Gaussian with mean $s_m$ and variance $\\sigma^{2}=N_0/2$. Put these into the Gaussian density.'},
{t:'eqbox', cap:'Conditional density', tex:'\\begin{aligned}f_Y(y\\mid s_1)&=\\frac{1}{\\sqrt{2\\pi\\sigma^{2}}}\\exp\\!\\left(-\\frac{(y-\\sqrt{E_b})^{2}}{2\\sigma^{2}}\\right)\\\\&=\\frac{1}{\\sqrt{\\pi N_0}}\\exp\\!\\left(-\\frac{(y-\\sqrt{E_b})^{2}}{N_0}\\right)\\end{aligned}',
 after:'The second line uses $2\\sigma^{2}=N_0$. For $s_0$, replace $-\\sqrt{E_b}$ by $+\\sqrt{E_b}$ in the exponent. With $E_b=1$ and $N_0=0.5$, $\\sigma=\\sqrt{0.25}=0.5$ for either symbol.'},
{t:'fig', svg:()=>figStat(),
 cap:'The density of $y$ for each symbol, drawn with $E_b=1$ and $N_0=0.5$. The density given $s_0$ is dashed and the density given $s_1$ solid. Each is a Gaussian centred on its symbol, and the two overlap.'},

{t:'h3', text:'The two conditional errors'},
{t:'p', text:'The receiver decides $s_1$ when $y>\\lambda$ and $s_0$ otherwise. Each symbol then has its own error probability: the area of its density on the wrong side of $\\lambda$.'},
{t:'eqbox', cap:'Error given $s_0$', tex:'\\begin{aligned}P(\\text{err}\\mid s_0)&=\\int_{\\lambda}^{\\infty}\\frac{1}{\\sqrt{\\pi N_0}}\\,e^{-(y+\\sqrt{E_b})^{2}/N_0}\\,dy\\\\&=\\int_{(\\lambda+\\sqrt{E_b})/\\sigma}^{\\infty}\\frac{1}{\\sqrt{2\\pi}}\\,e^{-z^{2}/2}\\,dz\\\\&=Q\\!\\left(\\frac{\\lambda+\\sqrt{E_b}}{\\sigma}\\right)\\end{aligned}',
 after:'Substitute $z=(y+\\sqrt{E_b})/\\sigma$ with $\\sigma=\\sqrt{N_0/2}$. The lower limit $y=\\lambda$ becomes $z=(\\lambda+\\sqrt{E_b})/\\sigma$. Since $dy=\\sigma\\,dz$ and $\\sigma/\\sqrt{\\pi N_0}=1/\\sqrt{2\\pi}$, the integrand becomes the unit Gaussian density.'},
{t:'eqbox', cap:'Error given $s_1$', tex:'P(\\text{err}\\mid s_1)=\\int_{-\\infty}^{\\lambda}f_Y(y\\mid s_1)\\,dy=Q\\!\\left(\\frac{\\sqrt{E_b}-\\lambda}{\\sigma}\\right)',
 after:'The same substitution with $z=(\\sqrt{E_b}-y)/\\sigma$. Here $Q(x)=\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$ is the Gaussian tail. For example, $E_b=1$, $\\sigma=0.5$ and $\\lambda=0$ give $P(\\text{err}\\mid s_0)=Q\\bigl((0+1)/0.5\\bigr)=Q(2)=0.0228$.'},
{t:'p', text:'Moving $\\lambda$ trades one error against the other. One area grows as the other shrinks.'},
{t:'fig', svg:()=>figErrors(0.3),
 cap:'The two conditional densities with $E_b=1$ and $N_0=0.5$, and the threshold at $\\lambda=0.3$. Each red area is one conditional error. Moving $\\lambda$ to the right shrinks the error given $s_0$ and grows the error given $s_1$.'},

{t:'h3', text:'The optimal threshold'},
{t:'p', text:'The best threshold minimises the average error probability. The priors $p_0=P(s_0)$ and $p_1=P(s_1)$ weight the two conditional errors.'},
{t:'eqbox', cap:'Minimise the average error', tex:'\\begin{aligned}P_e(\\lambda)&=p_0\\,P(\\text{err}\\mid s_0)+p_1\\,P(\\text{err}\\mid s_1)\\\\\\frac{dP_e}{d\\lambda}&=-p_0\\,f_Y(\\lambda\\mid s_0)+p_1\\,f_Y(\\lambda\\mid s_1)=0\\end{aligned}',
 after:'Differentiate each integral with respect to its limit $\\lambda$. The error given $s_0$ has $\\lambda$ as its lower limit, so its derivative carries a minus sign.'},
{t:'p', text:'At the minimum the two weighted densities are equal. Cancel the common factor $1/\\sqrt{\\pi N_0}$, take logarithms, then expand the two squares.'},
{t:'eq', tex:'\\begin{aligned}p_0\\,e^{-(\\lambda+\\sqrt{E_b})^{2}/N_0}&=p_1\\,e^{-(\\lambda-\\sqrt{E_b})^{2}/N_0}\\\\\\ln p_0-\\frac{(\\lambda+\\sqrt{E_b})^{2}}{N_0}&=\\ln p_1-\\frac{(\\lambda-\\sqrt{E_b})^{2}}{N_0}\\\\(\\lambda+\\sqrt{E_b})^{2}-(\\lambda-\\sqrt{E_b})^{2}&=N_0\\ln\\frac{p_0}{p_1}\\\\4\\lambda\\sqrt{E_b}&=N_0\\ln\\frac{p_0}{p_1}\\end{aligned}'},
{t:'p', text:'The $\\lambda^{2}$ and $E_b$ terms cancel in the difference of the two squares. Divide by $4\\sqrt{E_b}$.'},
{t:'eqbox', cap:'The optimal threshold', big:true, tex:'\\lambda_{\\mathrm{opt}}=\\frac{N_0}{4\\sqrt{E_b}}\\ln\\frac{p_0}{p_1}',
 after:'For example, $p_0=0.7$, $E_b=1$ and $N_0=0.5$ give $\\lambda_{\\mathrm{opt}}=\\frac{0.5}{4}\\ln\\frac{0.7}{0.3}=0.125(0.847)=0.106$. It moves toward the less likely symbol.'},
{t:'fig', svg:()=>figThreshold(),
 cap:'The two densities weighted by their priors, for $p_0=0.7$, $E_b=1$ and $N_0=0.5$. The weighted density of $s_0$ is dashed. They cross at $\\lambda_{\\mathrm{opt}}$, right of zero. The shaded area is $P_e$.'},

{t:'h3', text:'Threshold, priors and noise'},
{t:'p', text:'The formula for $\\lambda_{\\mathrm{opt}}$ shows two effects.'},
{t:'ol', items:[
 'The threshold moves away from the more likely symbol, so that symbol gets the larger region.',
 'The move grows with $N_0$. With little noise, $y$ decides and the prior hardly matters.'
]},
{t:'p', text:'With equal priors, $p_0=p_1=0.5$, the logarithm is $\\ln(0.5/0.5)=\\ln1=0$. Then $\\lambda_{\\mathrm{opt}}=0$ for every $N_0$.'},
{t:'box', kind:'err', hd:'Common error', html:'Use $\\ln(p_0/p_1)$, not $\\ln(p_1/p_0)$. With $p_0>p_1$ the threshold is positive, so the more likely $s_0$ keeps more of the axis.'},
{t:'fig', svg:()=>figThresholdLive(0.7,0),
 cap:'The weighted densities for $p_0=0.7$ at $E_b/N_0=0$ dB, with $E_b=1$. The noise density is twice that of the last figure, and the threshold has moved twice as far, to $\\lambda_{\\mathrm{opt}}=0.212$.'},

{t:'h3', text:'The Q function'},
{t:'p', text:'The Gaussian tail has no closed form. It is written as a function of its own, $Q(x)$.'},
{t:'eqbox', cap:'Definition', tex:'Q(x)=\\frac{1}{\\sqrt{2\\pi}}\\int_{x}^{\\infty}e^{-z^{2}/2}\\,dz=\\tfrac12\\operatorname{erfc}\\!\\left(\\frac{x}{\\sqrt2}\\right)',
 after:'$Q(x)$ is the probability that a Gaussian of mean $0$ and variance $1$ exceeds $x$.'},
{t:'p', text:'A few values recur throughout the course.'},
{t:'eqbox', cap:'Values', tex:'Q(0)=0.5,\\quad Q(1)=0.159,\\quad Q(2)=0.0228,\\quad Q(3)=1.35\\times10^{-3}',
 after:'For large $x$, $Q(x)\\le\\tfrac12e^{-x^{2}/2}$, so the tail falls faster than any power of $x$.'},
{t:'p', text:'A Gaussian value of mean $0$ and standard deviation $\\sigma$ is divided by $\\sigma$ before $Q$ is used. The probability that it exceeds $3\\sigma$ is $Q(3)=1.35\\times10^{-3}$.'},
{t:'fig', svg:()=>figQ(1),
 cap:'$Q(x)$ is the shaded area under the standard normal density $\\phi(z)$ to the right of $x$, here at $x=1$.'},

{t:'h3', text:'The bit error probability'},
{t:'p', text:'With equal priors the threshold is $\\lambda=0$. Put $\\lambda=0$ in both conditional errors, and the two become equal.'},
{t:'eqbox', cap:'Equal priors', tex:'\\begin{aligned}P_b&=\\tfrac12\\,Q\\!\\left(\\frac{\\sqrt{E_b}}{\\sigma}\\right)+\\tfrac12\\,Q\\!\\left(\\frac{\\sqrt{E_b}}{\\sigma}\\right)=Q\\!\\left(\\frac{\\sqrt{E_b}}{\\sigma}\\right)\\\\\\frac{\\sqrt{E_b}}{\\sigma}&=\\frac{\\sqrt{E_b}}{\\sqrt{N_0/2}}=\\sqrt{\\frac{2E_b}{N_0}}\\end{aligned}'},
{t:'p', text:'The result is the bit error probability of polar signalling.'},
{t:'eqbox', cap:'Polar signalling', big:true, tex:'P_b=Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right)',
 after:'$2E_b/N_0$ is the peak SNR of the matched filter, so $P_b=Q\\bigl(\\sqrt{\\eta_{\\max}}\\bigr)$. For example, $E_b/N_0=4$, which is $6.02$ dB, gives $P_b=Q(\\sqrt8)=Q(2.83)=2.3\\times10^{-3}$. Dropping the factor $2$ gives $Q(2)=2.3\\times10^{-2}$.'},
{t:'p', text:'The error probability falls slowly at low $E_b/N_0$ and steeply at high $E_b/N_0$.'},
{t:'fig', svg:()=>figPe(9.6),
 cap:'Bit error probability of polar signalling against $E_b/N_0$. The marked point is $E_b/N_0=9.6$ dB, where $P_b=9.74\\times10^{-6}$.'},

{t:'ex', hd:'Example 2.2 — unequal priors: the threshold', rows:[
 ['Given','Polar signalling with $E_b=1$, $N_0=0.1$ and $P(s_1)=0.3$.'],
 ['Find','(a) The optimal threshold $\\lambda_{\\mathrm{opt}}$.'],
 ['Method','The priors are unequal, so the threshold is not zero. Use $\\lambda_{\\mathrm{opt}}=\\frac{N_0}{4\\sqrt{E_b}}\\ln\\frac{p_0}{p_1}$ with $p_0=1-P(s_1)=0.7$ and $p_1=0.3$.'],
 ['Solution','$\\lambda_{\\mathrm{opt}}=\\frac{0.1}{4(1)}\\ln\\frac{0.7}{0.3}=0.025(0.8473)=0.0212$.'],
 ['Check','Both weighted densities are equal there. $p_0f_Y(\\lambda\\mid s_0)=\\frac{0.7}{\\sqrt{0.1\\pi}}e^{-(1.0212)^{2}/0.1}=1.249\\,e^{-10.428}=3.70\\times10^{-5}$. $p_1f_Y(\\lambda\\mid s_1)=\\frac{0.3}{\\sqrt{0.1\\pi}}e^{-(0.9788)^{2}/0.1}=0.535\\,e^{-9.581}=3.70\\times10^{-5}$.']
]},
{t:'fig', svg:()=>figExLog(),
 cap:'Example 2.2: the two weighted densities on a logarithmic scale, where each is a parabola. The weighted density of $s_0$ is dashed. They cross at $\\lambda_{\\mathrm{opt}}=0.0212$, just right of zero.'},
{t:'box', kind:'err', hd:'Common error', html:'Use $p_0=0.7$, not the given $0.3$, for $s_0$. Swapping them gives $-0.0212$.'},

{t:'ex', hd:'Example 2.3 — unequal priors: the error probability', rows:[
 ['Given','$E_b=1$, $N_0=0.1$, $p_0=0.7$ and $\\lambda_{\\mathrm{opt}}=0.0212$, from Example 2.2.'],
 ['Find','(b) $P_e$ at $\\lambda_{\\mathrm{opt}}$, against $P_e$ at $\\lambda=0$.'],
 ['Method','Weight the two conditional errors by their priors: $P_e=p_0\\,Q\\bigl((\\lambda+\\sqrt{E_b})/\\sigma\\bigr)+p_1\\,Q\\bigl((\\sqrt{E_b}-\\lambda)/\\sigma\\bigr)$, with $\\sigma=\\sqrt{N_0/2}=0.2236$.'],
 ['Solution','$P(\\text{err}\\mid s_0)=Q(1.0212/0.2236)=Q(4.567)=2.48\\times10^{-6}$. $P(\\text{err}\\mid s_1)=Q(0.9788/0.2236)=Q(4.377)=6.01\\times10^{-6}$. In units of $10^{-6}$, $P_e=0.7(2.48)+0.3(6.01)=3.53$, so $P_e=3.53\\times10^{-6}$.'],
 ['Check','At $\\lambda=0$ both conditional errors are $Q(1/0.2236)=Q(4.472)$, so $P_e=Q(4.472)=3.87\\times10^{-6}$. The ratio $3.87/3.53=1.10$, so the zero threshold is about $10$ per cent worse.']
]},
{t:'fig', svg:()=>figExPe(),
 cap:'Example 2.3: $P_e$ against the threshold for the same link. The minimum sits at $\\lambda_{\\mathrm{opt}}=0.0212$. At $\\lambda=0$ (grey dot) it is about $10$ per cent higher.'},
{t:'box', kind:'err', hd:'Common error', html:'Use $\\sigma=\\sqrt{N_0/2}$, not $\\sqrt{N_0}$. The wrong $\\sigma$ raises $P_e$ over a hundred times.'},

{t:'h3', text:'Error rates around us'},
{t:'p', text:'The error probability sets link targets, moves the threshold for rare events, and is measured by counting errors.'},
{t:'ul', items:[
 '<b>Ethernet.</b> Wired Ethernet asks for $P_b<10^{-10}$. Polar signalling reaches it at $E_b/N_0=13.1$ dB, where $\\sqrt{2E_b/N_0}=6.36$.',
 '<b>Rare events.</b> A sensor reports a rare event with prior $p_1=0.1$. With $E_b=1$ and $N_0=0.5$, $\\lambda_{\\mathrm{opt}}=0.125\\ln 9=0.275$, moved toward the rare symbol.',
 '<b>The tail on decades.</b> On a logarithmic scale, the Gaussian tail $Q(x)=\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$ keeps steepening. Above $x=3$ each unit step in $x$ divides $Q(x)$ by more than $40$.',
 '<b>Error counts.</b> A tester counts errors in blocks of $10^{5}$ bits at $P_b=10^{-4}$. It expects $10$ a block, and the counts scatter around that.'
]},
{t:'box', kind:'def', hd:'Target error rate', html:'A standard fixes the largest $P_b$ a link may have. The curve $Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$ turns that target into the $E_b/N_0$ the link needs.'},
{t:'box', kind:'def', hd:'Counting errors', html:'A measured $P_b$ is errors divided by bits. About $10$ errors are needed for a steady estimate, so $P_b=10^{-4}$ needs about $10^{5}$ bits.'},
{t:'box', kind:'warn', hd:'Rare symbols', html:'When one symbol is rare, $\\lambda_{\\mathrm{opt}}$ moves toward it. The receiver then needs stronger evidence before it decides the rare symbol.'},

/* ================================================================ 2.4 === */
{t:'h2', num:'2.4', text:'Intersymbol interference'},

{t:'h3', text:'Intersymbol interference'},
{t:'p', text:'A first-order RC lowpass is the simplest bandlimited channel. It has one parameter, the $3$ dB bandwidth $B$.'},
{t:'eqbox', cap:'The RC channel', tex:'H(f)=\\frac{1}{1+jf/B},\\qquad h(t)=\\frac{1}{\\tau}e^{-t/\\tau}\\ (t\\ge0),\\qquad\\tau=\\frac{1}{2\\pi B}',
 after:'The channel responds to a sudden change with the time constant $\\tau$.'},
{t:'p', text:'Send one unit bit on $[0,T_b]$. Inside the bit the output is the integral of $h$. It never reaches $1$ inside the bit, and it decays after the bit ends.'},
{t:'eqbox', cap:'One bit', tex:'\\begin{aligned}r(t)&=\\int_0^{t}\\frac{1}{\\tau}e^{-u/\\tau}\\,du=1-e^{-t/\\tau},\\quad 0\\le t\\le T_b\\\\r(T_b)&=1-q,\\qquad q=e^{-T_b/\\tau}=e^{-2\\pi BT_b}\\end{aligned}',
 after:'The share $q$ is the part of the bit\'s level still missing at the end of the bit. For $BT_b=0.25$, $q=e^{-2\\pi(0.25)}=e^{-\\pi/2}=0.208$ and $r(T_b)=1-q=0.792$.'},
{t:'fig', svg:()=>figIsiBuild(),
 cap:'Six bits $1,1,0,1,0,0$ through an RC channel with $BT_b=0.25$. The sent bits are dashed cyan and each bit\'s own response is dashed violet. Their sum is the received waveform (green), and the dots are its samples at the end of each bit.'},

{t:'h3', text:'The interference term'},
{t:'p', text:'After its bit ends, a response decays as $(1-q)e^{-(t-T_b)/\\tau}$. One bit later it is $(1-q)q$, and $m$ bits later $(1-q)q^{m}$.'},
{t:'eqbox', cap:'One sample', tex:'y_k=a_k(1-q)+\\sum_{m=1}^{\\infty}a_{k-m}\\,(1-q)\\,q^{m},\\qquad a_k=\\pm1',
 after:'Each earlier bit $a_{k-m}$ adds its tail to the sample of bit $k$. The sum of the tails is the <b>intersymbol interference</b>.'},
{t:'p', text:'The interference is largest when every earlier bit has the sign opposite to the current one. Its size is then a geometric series.'},
{t:'eqbox', cap:'Worst case', tex:'\\sum_{m=1}^{\\infty}(1-q)\\,q^{m}=(1-q)\\,\\frac{q}{1-q}=q',
 after:'The sample then shrinks from $1-q$ to $(1-q)-q=1-2q$. For example, a $1$ after a long run of $0$s at $BT_b=0.25$ gives $1-2(0.208)=0.584$.'},
{t:'figrow', n:2, items:[
 {svg:()=>figIsiTermTop(), cap:'The bits $0,0,0,1$ after a line idle at the level of a $0$, with $BT_b=0.25$. The last sample is marked.'},
 {svg:()=>figIsiTermBottom(), cap:'The last sample split into its own share $1-q$ (violet) and the tails $-(1-q)q^{m}$ of the earlier bits (red).'}
]},

{t:'ex', hd:'Example 2.4 — the samples of a bit pattern', rows:[
 ['Given','Bits $0\\,0\\,0\\,1\\,1\\,1\\,0\\,1$ sent after a line idle at the level of a $0$ ($a_k=-1$), through an RC channel with $BT_b=0.25$, so $q=0.208$.'],
 ['Find','The sample at the end of the seventh bit, $y_7$.'],
 ['Method','Every earlier bit leaves a tail in the sample. Add the bit\'s own share, the tails of the three $1$s, and the tails of every earlier bit and the idle line, all $-1$.'],
 ['Solution','$y_7=-(1-q)+(1-q)(q+q^{2}+q^{3})-(1-q)\\sum_{m=4}^{\\infty}q^{m}$. The middle term is $q-q^{4}$ and the last is $q^{4}$, by the geometric series. So $y_7=-(1-q)+(q-q^{4})-q^{4}=-1+2q-2q^{4}=-1+2(0.2079)-2(0.0019)=-0.588$.'],
 ['Check','The sample is negative, so the $0$ is still decided correctly.']
]},
{t:'fig', svg:()=>figExIsi(),
 cap:'Example 2.4: the sent pattern (dashed) and the channel output (green), with its value at the end of each bit. The seventh sample is $-0.588$.'},
{t:'box', kind:'err', hd:'Common error', html:'Use the full history, not only the previous bit. Each earlier bit still contributes its own tail $(1-q)q^{m}$.'},

{t:'h3', text:'The eye diagram'},
{t:'p', text:'An <b>eye diagram</b> shows the interference of every bit pattern at once. Cut the received waveform into pieces $2T_b$ long, centred on the sampling instants, and draw them all on one axis.'},
{t:'p', text:'The vertical gap at the sampling instant is the <b>opening</b> of the eye. The worst pattern has every earlier bit opposite to the current one.'},
{t:'eqbox', cap:'Opening', tex:'\\min_{\\text{patterns}}|y_k|=(1-q)-q=1-2q,\\qquad\\text{opening}=2(1-2q)',
 after:'For $BT_b=0.3$, $q=e^{-0.6\\pi}=0.152$, so the opening is $2(1-2q)=2(0.696)=1.39$.'},
{t:'fig', svg:()=>figEye(),
 cap:'The eye of the RC channel with $BT_b=0.3$. Each trace is the received waveform over two bits, centred on a sampling instant, for one of $128$ bit patterns. Laid on top of each other they form the eye.'},

{t:'h3', text:'Eye closure'},
{t:'p', text:'A narrower channel closes the eye. It is fully closed when the opening reaches zero. Set $1-2q=0$ and take logarithms.'},
{t:'eqbox', cap:'Closure', big:true, tex:'\\begin{aligned}1-2q&=0\\\\e^{-2\\pi BT_b}&=\\tfrac12\\\\BT_b&=\\frac{\\ln2}{2\\pi}=0.110\\end{aligned}',
 after:'Below $BT_b=0.110$ some patterns cross zero at the sampling instant, and decisions fail with no noise at all. At $BT_b=0.1$, $q=e^{-0.2\\pi}=0.533>0.5$, so $1-2q=-0.067<0$ and the eye is closed.'},
{t:'box', kind:'ok', hd:'Noise margin', html:'Noise must move a sample by more than $1-2q$ to cause an error. A half-closed eye halves the margin, which costs $6$ dB of SNR.'},
{t:'box', kind:'err', hd:'Common error', html:'Use the worst pattern, not a typical one. A random stream may run for a long time before it shows the pattern that closes the eye.'},
{t:'fig', svg:()=>figEyeClose(0.15),
 cap:'The eye at $BT_b=0.15$, where $q=0.390$ and the opening has shrunk to $0.441$. Below $BT_b=0.110$ the eye is closed.'},

{t:'h3', text:'Noise on the eye'},
{t:'p', text:'A real sample carries noise as well as interference. Each sample then has three parts.'},
{t:'eqbox', cap:'One sample', tex:'y_k=\\underbrace{a_k(1-q)}_{\\text{own bit}}+\\underbrace{\\text{ISI}_k}_{\\text{earlier bits}}+\\underbrace{n_k}_{\\text{noise}}',
 after:'Interference moves each sample to one of a few levels. Noise then spreads every level into a bell.'},
{t:'box', kind:'warn', hd:'Worst pattern', html:'The levels nearest zero fail first. Their margin is $1-2q$, not $1-q$, so a half-closed eye needs much less noise to fail.'},
{t:'p', text:'As the noise grows from zero, the worst-pattern samples cross zero first. At $BT_b=0.3$ they sit at $\\pm(1-2q)=\\pm0.70$, the levels closest to the threshold.'},
{t:'fig', svg:()=>figEyeNoise(0.3,0.2),
 cap:'The eye at $BT_b=0.3$ with noise of standard deviation $\\sigma=0.2$. The bars at the right count $1024$ samples taken at $t=0$. Violet bars fall on the correct side of zero, red bars on the wrong side.'},

{t:'h3', text:'Intersymbol interference around us'},
{t:'p', text:'Intersymbol interference appears in cables, radio echoes and optical fibre.'},
{t:'ul', items:[
 '<b>Cable.</b> A long twisted pair acts like the RC channel with $BT_b=0.15$. One bit leaves $(1-q)q^{m}$ in the sample $m$ bits later, with $q=e^{-2\\pi BT_b}=0.39$.',
 '<b>Radio echo.</b> An echo three symbols late with gain $0.6$ gives $h[n]=\\delta[n]+0.6\\,\\delta[n-3]$. Each sample then carries $0.6\\,a_{k-3}$ from an older symbol.',
 '<b>Optical fibre.</b> A $10$ Gb/s light pulse with $\\sigma_0=20$ ps spreads to $\\sigma=\\sqrt{20^{2}+34^{2}}=39.4$ ps after $20$ km of fibre. It then reaches into the next bit, $100$ ps away.',
 '<b>Eye opening.</b> The eye opening $2(1-2q)$ of the RC channel shrinks as $BT_b$ falls. It reaches zero at $BT_b=\\ln 2/(2\\pi)=0.110$.'
]},
{t:'box', kind:'def', hd:'Channel memory', html:'Every bandlimited channel spreads a pulse beyond its own bit. The sample of one bit then carries part of its neighbours.'},
{t:'box', kind:'def', hd:'Echoes', html:'A radio echo is intersymbol interference with a delay. An echo $d$ symbols late with gain $g$ adds $g\\,a_{k-d}$ to $y_k$.'},
{t:'box', kind:'warn', hd:'Errors without noise', html:'When the eye is closed, some bit patterns are decided wrongly with no noise at all. More transmit power does not remove them.'},

/* ================================================================ 2.5 === */
{t:'h2', num:'2.5', text:'Nyquist and the raised cosine'},

{t:'h3', text:'A pulse with zero interference'},
{t:'p', text:'A pulse adds nothing to the samples of its neighbours when it is zero at every sampling instant but its own. This holds however long the pulse lasts.'},
{t:'eqbox', cap:'Zero interference', tex:'p(kT_b)=\\begin{cases}1,&k=0\\\\0,&k\\neq0\\end{cases}'},
{t:'p', text:'The sinc pulse has this property. Here $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$, with $\\operatorname{sinc}(0)=1$.'},
{t:'eqbox', cap:'The sinc pulse', tex:'p(t)=\\operatorname{sinc}\\!\\left(\\frac{t}{T_b}\\right),\\qquad p(kT_b)=\\frac{\\sin(\\pi k)}{\\pi k}=0\\quad(k\\neq0)',
 after:'For example, with $T_b=0.1$ ms, $p(t)=0$ every $0.1$ ms except at $t=0$.'},
{t:'fig', svg:()=>figSincTrain(),
 cap:'$p(t)=\\operatorname{sinc}(t/T_b)$ (solid) with two of its neighbours (dashed). At every sampling instant only one pulse is non-zero.'},

{t:'h3', text:'Nyquist\'s criterion for zero intersymbol interference'},
{t:'p', text:'The zero-interference condition can be written in frequency. Sample the pulse at $t=kT_b$ and use the replication result of Chapter 1, with $f_s=R_b=1/T_b$.'},
{t:'eqbox', cap:'Sample the pulse', tex:'\\begin{aligned}p_\\delta(t)&=\\sum_{k}p(kT_b)\\,\\delta(t-kT_b)\\\\P_\\delta(f)&=R_b\\sum_{n}P(f-nR_b)\\end{aligned}'},
{t:'p', text:'Zero interference leaves only the sample $p(0)=1$. Then $p_\\delta(t)=\\delta(t)$, whose transform is $1$. Set $P_\\delta(f)=1$ and divide by $R_b$.'},
{t:'eqbox', cap:'Nyquist\'s criterion', big:true, tex:'p(kT_b)=\\delta[k]\\iff\\sum_{n=-\\infty}^{\\infty}P(f-nR_b)=T_b',
 after:'The copies of $P(f)$ spaced $R_b$ apart must add to a constant.'},
{t:'p', text:'For example, the triangle $P(f)=T_b(1-|f|/R_b)$ for $|f|<R_b$ has the pulse $p(t)=\\operatorname{sinc}^{2}(t/T_b)$. Its copies add to $T_b$, so the criterion holds. Directly, $p(T_b)=\\operatorname{sinc}^{2}(1)=0$.'},
{t:'fig', svg:()=>figTiling(),
 cap:'The triangular $P(f)$ of width $2R_b$ (cyan) and its copies at $\\pm R_b$ and $\\pm2R_b$ (dashed). Their sum (violet) is a constant, so $p(t)$ has zero interference.'},

{t:'h3', text:'The minimum bandwidth'},
{t:'p', text:'The copies are spaced $R_b$ apart. If $P(f)=0$ for $|f|>B_T$ with $B_T<R_b/2$, the copies leave gaps, and their sum cannot be constant.'},
{t:'eqbox', cap:'Nyquist bandwidth', big:true, tex:'B_T\\ge W=\\frac{R_b}{2}',
 after:'$W=R_b/2$ is the <b>Nyquist bandwidth</b>. For example, a link at $R_b=64$ kb/s needs at least $W=64/2=32$ kHz.'},
{t:'p', text:'At $B_T=W$ only one spectrum fills the axis: the rectangle of width $2W=R_b$. Its inverse transform is the sinc pulse.'},
{t:'eqbox', cap:'The only pulse at $B_T=W$', tex:[
 'P(f)=\\frac{1}{2W}\\,\\Pi\\!\\left(\\frac{f}{2W}\\right)\\;\\leftrightarrow\\;p(t)=\\operatorname{sinc}(2Wt)=\\operatorname{sinc}\\!\\left(\\frac{t}{T_b}\\right)',
 'p(t)=\\int_{-W}^{W}\\frac{1}{2W}e^{j2\\pi ft}\\,df=\\frac{\\sin(2\\pi Wt)}{2\\pi Wt}=\\operatorname{sinc}(2Wt)'],
 after:'$\\Pi(f/2W)$ is $1$ for $|f|<W$ and $0$ elsewhere. Since $2W=R_b=1/T_b$, this pulse is the sinc pulse above.'},
{t:'fig', svg:()=>figNyqChannel(),
 cap:'The rectangle of width $2W=R_b$ (cyan) and its copies at multiples of $R_b$ (dashed). They meet edge to edge and fill the axis with no gap.'},

{t:'h3', text:'Timing and the sinc pulse'},
{t:'p', text:'The sinc pulse is impractical. Suppose the receiver samples at $t=\\epsilon$ instead of $t=0$. Every neighbour then adds a small term.'},
{t:'eqbox', cap:'A late sample', tex:'y_0=a_0\\operatorname{sinc}\\!\\left(\\frac{\\epsilon}{T_b}\\right)+\\sum_{k\\neq0}a_k\\operatorname{sinc}\\!\\left(k+\\frac{\\epsilon}{T_b}\\right)',
 after:'The wanted term barely drops. At $\\epsilon=0.1T_b$ it is $\\operatorname{sinc}(0.1)=\\sin(0.1\\pi)/(0.1\\pi)=0.309/0.314=0.984$. The interference is the problem.'},
{t:'box', kind:'warn', hd:'Slow tails', html:'The terms fall only as $1/(\\pi|k|)$. The sum of their sizes behaves like $\\sum1/k$, which grows without bound. A sinc pulse also lasts forever in both directions.'},
{t:'fig', svg:()=>figSincOffset(0.1),
 cap:'A sample taken $\\epsilon=0.1T_b$ late. The violet stem is the wanted term and each red stem is a neighbour\'s contribution. The sum of their sizes over $1\\le|k|\\le20$ is $0.71$.'},

{t:'h3', text:'The raised-cosine spectrum'},
{t:'p', text:'A practical pulse widens the spectrum beyond $W$ and tapers its edges. The <b>raised cosine</b> does this and still meets Nyquist\'s criterion. Its <b>roll-off factor</b> $\\alpha$ runs from $0$ to $1$.'},
{t:'eqbox', cap:'Raised-cosine spectrum', tex:'P(f)=\\begin{cases}\\dfrac{1}{2W},&|f|<f_1\\\\[6pt]\\dfrac{1}{4W}\\Bigl[1+\\cos\\dfrac{\\pi(|f|-f_1)}{2W-2f_1}\\Bigr],&f_1\\le|f|<2W-f_1\\\\[6pt]0,&|f|\\ge2W-f_1\\end{cases}',
 after:'$W=R_b/2$ and $f_1=W(1-\\alpha)$. The spectrum is flat up to $f_1$, then falls along half a cosine period to zero at $2W-f_1$.'},
{t:'eqbox', cap:'Bandwidth', big:true, tex:'B_T=2W-f_1=2W-W(1-\\alpha)=W(1+\\alpha)=\\frac{R_b}{2}(1+\\alpha)',
 after:'$\\alpha=0$ is the rectangle, with $B_T=W$. $\\alpha=1$ doubles the bandwidth to $R_b$. For example, $W=5$ kHz and $\\alpha=0.25$ give $B_T=5(1.25)=6.25$ kHz.'},
{t:'fig', svg:()=>figRcSpec(0.5),
 cap:'The raised-cosine spectrum with $\\alpha=0.5$ (cyan), its copies at $\\pm2W$ (dashed) and their sum (violet). The spectrum widens from $W$ to $B_T=1.5W$, and the copies still add to a constant.'},

{t:'h3', text:'The raised-cosine pulse'},
{t:'p', text:'The inverse transform of the raised-cosine spectrum is the raised-cosine pulse.'},
{t:'eqbox', cap:'The pulse', tex:'p(t)=\\operatorname{sinc}\\!\\left(\\frac{t}{T_b}\\right)\\frac{\\cos(\\pi\\alpha t/T_b)}{1-4\\alpha^{2}t^{2}/T_b^{2}}',
 after:'The sinc factor keeps the zeros at $t=kT_b$. Here $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$.'},
{t:'box', kind:'ok', hd:'Faster decay', html:'For $\\alpha>0$ the second factor falls as $1/t^{2}$, so the tails fall as $1/|t|^{3}$. A timing error then collects little interference.'},
{t:'p', text:'The second factor can add zeros of its own. With $\\alpha=1$, $\\cos(1.5\\pi)=0$ and the denominator $1-4(2.25)=-8$ is not zero, so $p(1.5T_b)=0$.'},
{t:'fig', svg:()=>figRcPulse(0.5),
 cap:'The raised-cosine pulse with $\\alpha=0.5$ (solid) against the sinc pulse (dashed). The zeros at $t=kT_b$ stay where they are, and the tails die out sooner.'},

{t:'ex', hd:'Example 2.5 — a raised-cosine link', rows:[
 ['Given','A link sends $R_b=20$ kb/s with raised-cosine pulses and $\\alpha=0.5$.'],
 ['Find','$W$, $f_1$ and $B_T$.'],
 ['Method','Each of the three follows from $R_b$ and $\\alpha$: $W=R_b/2$, $f_1=W(1-\\alpha)$ and $B_T=W(1+\\alpha)$. The spectrum is flat up to $f_1$ and falls to zero at $B_T$, with its half-height point at $W$.'],
 ['Solution','$W=20/2=10$ kHz. $f_1=10(1-0.5)=5$ kHz. $B_T=10(1+0.5)=15$ kHz.'],
 ['Check','$B_T-W=W-f_1=5$ kHz, so the roll-off is symmetric about $W$.']
]},
{t:'fig', svg:()=>figExRc(),
 cap:'Example 2.5: the ideal rectangle of width $2W$ (dashed) and the raised-cosine spectrum with $\\alpha=0.5$, which reaches $B_T=15$ kHz.'},
{t:'box', kind:'err', hd:'Common error', html:'Use $W=R_b/2=10$ kHz, not $R_b=20$ kHz. The wrong $W$ gives $B_T=30$ kHz, twice the true value.'},

{t:'h3', text:'Splitting the raised cosine'},
{t:'p', text:'The raised cosine can be shared between the two ends of the link. $H_T$ shapes the pulse at the transmitter and $H_R$ filters at the receiver. Their product must meet Nyquist\'s criterion.'},
{t:'eqbox', cap:'Split', tex:'H_T(f)\\,H_R(f)=P(f),\\qquad H_T(f)=H_R(f)=\\sqrt{P(f)}'},
{t:'box', kind:'ok', hd:'Matched and free of interference', html:'$H_R=H_T^{*}$ for a real, even $\\sqrt{P(f)}$, so the receive filter is matched to the pulse. The link then has both the smallest $P_b$ and zero interference.'},
{t:'p', text:'At $f=W$ the raised cosine is at half height, $2W\\,P(W)=0.5$. With $\\alpha=0.5$, the square-root filter there is $\\sqrt{2W\\,P(W)}=\\sqrt{0.5}=0.707$.'},
{t:'fig', svg:()=>figSrrc(),
 cap:'The raised cosine with $\\alpha=0.5$ (cyan) and its square root (amber, dashed). Two square-root filters in a row give the raised cosine.'},

{t:'h3', text:'Pulse shaping around us'},
{t:'p', text:'Broadcast and mobile standards fix the roll-off factor and the bandwidth.'},
{t:'ul', items:[
 '<b>Satellite television.</b> Satellite television at $R_s=27.5$ Mbaud with $\\alpha=0.35$ uses $B_T=13.75(1.35)=18.6$ MHz at baseband.',
 '<b>3G mobile.</b> 3G mobile sends $3.84$ Mchip/s with $\\alpha=0.22$. $B_T=1.92(1.22)=2.34$ MHz fits inside the $\\pm2.5$ MHz of its $5$ MHz channel.',
 '<b>The pulse.</b> The raised-cosine pulse of $\\alpha=0.35$ is zero at every other sampling instant, so the samples carry no interference.',
 '<b>Timing.</b> A sample taken $\\epsilon$ late collects interference, summed here over $1\\le|k|\\le30$. The raised cosine with $\\alpha=0.5$ collects far less than the sinc pulse.'
]},
{t:'box', kind:'def', hd:'Roll-off in standards', html:'Satellite television uses $\\alpha=0.35$, $0.25$ or $0.20$. 3G mobile uses $\\alpha=0.22$. A small $\\alpha$ saves bandwidth.'},
{t:'box', kind:'def', hd:'Bandwidth', html:'$B_T=\\tfrac{R_s}{2}(1+\\alpha)$ at baseband. On a carrier the occupied band is twice that, $R_s(1+\\alpha)$.'},
{t:'box', kind:'warn', hd:'Timing', html:'A small $\\alpha$ gives long tails. A sample taken late then collects interference from many neighbours.'},

/* ================================================================ 2.6 === */
{t:'h2', num:'2.6', text:'The link in practice'},

{t:'h3', text:'The equalizer'},
{t:'p', text:'An <b>equalizer</b> is a filter after the channel that removes interference. The simplest one adds $w$ times the waveform one bit earlier.'},
{t:'eqbox', cap:'One tap', tex:'z(t)=y(t)+w\\,y(t-T_b)'},
{t:'p', text:'The pulse after the equalizer is $r(t)+w\\,r(t-T_b)$. Sample it $m$ bits after its own bit. The pulse leaves its own tail, and the delayed copy leaves the tail one bit younger.'},
{t:'eqbox', cap:'The equalized pulse', tex:'\\begin{aligned}g_0&=1-q\\\\g_m&=(1-q)\\,q^{m}+w\\,(1-q)\\,q^{m-1}\\\\&=(1-q)\\,q^{m-1}(q+w),\\qquad m\\ge1\\end{aligned}'},
{t:'box', kind:'ok', hd:'Zero forcing', html:'Each tail sample is $q$ times the one before, so $w=-q$ cancels them all. The tap also adds a delayed copy of the noise.'},
{t:'p', text:'For example, $BT_b=0.25$ gives $q=0.208$. The tap $w=-0.208$ makes $q+w=0$, so every $g_m$ with $m\\ge1$ vanishes.'},
{t:'figrow', n:2, items:[
 {svg:()=>figEqEye(0.1,-0.53), cap:'The eye after a one-tap equalizer, for $BT_b=0.1$ and $w=-0.53$. Without the tap this eye is closed.'},
 {svg:()=>figEqTaps(0.1,-0.53), cap:'The equalized pulse sampled $m$ bits later. Violet is the bit itself and red is what it leaves on later bits. With $w$ near $-q=-0.533$ the tail is almost gone.'}
]},

{t:'h3', text:'Finding the sampling instant'},
{t:'p', text:'The receiver must find the sampling instant on its own. The matched-filter output peaks at the instant it wants. An <b>early–late gate</b> finds that peak.'},
{t:'p', text:'The gate takes two extra samples, $\\delta$ before and $\\delta$ after the clock $\\tau$. The output is symmetric about its peak, so the two agree only there.'},
{t:'eqbox', cap:'Error signal', tex:'e=|y(\\tau-\\delta)|-|y(\\tau+\\delta)|',
 after:'If $e>0$ the clock is late and moves earlier. If $e<0$ it moves later.'},
{t:'p', text:'The larger sample lies on the side of the peak. For example, an early sample of $0.62$ and a late sample of $0.80$ put the peak after the clock, so the clock is early.'},
{t:'fig', svg:()=>figTiming(),
 cap:'The early–late gate on the matched-filter output of a rectangular pulse, with the clock (green) $0.4T_b$ late. The early and late samples (dashed) sit $\\delta=0.35T_b$ either side. Here $e=0.70>0$, so the clock moves earlier.'},

{t:'h3', text:'The spectrum of a bit stream'},
{t:'p', text:'A bit stream occupies a band of frequencies, and a neighbouring channel must stay clear of it. For independent, equally likely $\\pm1$ bits the spectrum has a simple form.'},
{t:'eqbox', cap:'Power spectrum', tex:'S(f)=\\frac{|G_T(f)|^2}{T_b}',
 after:'$G_T(f)$ is the transmit filter. The stream has the spectrum of one pulse.'},
{t:'box', kind:'warn', hd:'Neighbours', html:'A rectangular pulse keeps only $90\\%$ of its power inside $|f-f_c|<R_b$. A raised cosine stops at $(1+\\alpha)R_b/2$.'},
{t:'p', text:'On a carrier each band is $(1+\\alpha)R_b$ wide. For example, channels $1.25$ MHz apart that carry $R_b=1$ Mb/s each need $(1+\\alpha)(1\\ \\text{MHz})\\le1.25$ MHz, so $\\alpha\\le0.25$.'},
{t:'fig', svg:()=>figPsd(0.5,1.25),
 cap:'Spectra around one carrier, for $\\alpha=0.5$ and a channel spacing $\\Delta=1.25R_b$. The raised cosine is solid, the rectangular pulse dashed, and the neighbouring channel dotted. The red area is power that lands in the neighbour, and the numbers give its share for each pulse.'},

{t:'h3', text:'Regenerative repeaters'},
{t:'p', text:'A long link is split into hops, with a repeater after each hop. There are two kinds of repeater.'},
{t:'ul', items:[
 'An <b>analog</b> repeater amplifies the signal and the noise together.',
 'A <b>regenerative</b> repeater decides the bits and sends a clean waveform on.'
]},
{t:'p', text:'After $K$ hops the two chains differ. A regenerative chain adds up the small error probability of each hop. An analog chain adds up the noise of each hop, so its $N_0$ grows $K$ times.'},
{t:'eqbox', cap:'After $K$ hops', tex:'\\begin{aligned}P_{\\text{regen}}&\\approx K\\,Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)\\\\P_{\\text{analog}}&=Q\\bigl(\\sqrt{2E_b/(KN_0)}\\bigr)\\end{aligned}',
 after:'For $K=50$ hops and $P_b=10^{-6}$, regeneration needs $E_b/N_0=11.8$ dB and amplification $27.5$ dB. A chain of $100$ regenerative repeaters with $p=10^{-6}$ a hop has $P_b\\approx Kp=100\\times10^{-6}=10^{-4}$.'},
{t:'fig', svg:()=>figRepeater(),
 cap:'Four hops of the bits $1,0,1,1,0,0,1,0$. Top: the amplified chain carries the noise of every hop, and a red dot is a wrong decision. Bottom: the regenerative chain sends a clean waveform on, and a wrong bit, drawn red, stays wrong.'},

/* ================================================================ 2.7 === */
{t:'h2', num:'2.7', text:'Summary'},

{t:'h3', text:'From bits to decisions'},
{t:'p', text:'The whole link has four stages.'},
{t:'ol', items:[
 'Send each bit as $\\pm\\sqrt{E_b}\\,\\psi(t)$.',
 'The channel adds white noise of density $N_0/2$.',
 'Correlate with $\\psi(t)$ and read $y_k$ at the end of the bit.',
 'Decide by comparing $y_k$ with $\\lambda_{\\mathrm{opt}}$.'
]},
{t:'box', kind:'ok', hd:'Two limits', html:'Noise sets $P_b=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$. Bandwidth sets $R_b\\le2B_T/(1+\\alpha)$ for zero interference.'},
{t:'p', text:'For example, a polar link at $E_b/N_0=9.6$ dB with equal priors has $E_b/N_0=10^{0.96}=9.12$. Then $P_b=Q(\\sqrt{18.2})=Q(4.27)=9.7\\times10^{-6}$, about $10^{-5}$.'},
{t:'fig', svg:()=>figChain(),
 cap:'Eight bits through the link. Each bit becomes $\\pm A$ in $s(t)$, noise is added in $x(t)$, and the correlator gives one number $y_k$ a bit. The sign of $y_k$ is the decision, and the second decision is wrong (red).'},

{t:'h3', text:'Quick check'},
{t:'p', text:'Six short predictions, each with its reason.'},
{t:'q', n:'1', text:'<b>Matched filter.</b> The filter matched to $s(t)$ on $[0,T]$ has the impulse response $s(t)$, $s(T-t)$ or $s(t-T)$?', ans:'$s(T-t)$. Reverse the pulse in time, then shift it right by $T$.'},
{t:'q', n:'2', text:'<b>Peak SNR.</b> With $E=2\\ \\mu$J and $N_0=10^{-7}$ W/Hz, the largest peak SNR is $20$, $40$ or $80$?', ans:'$40$, since $2E/N_0=2(2\\times10^{-6})/10^{-7}=40$.'},
{t:'q', n:'3', text:'<b>Threshold.</b> With equal priors, the optimal threshold is $0$, $N_0/4$ or $\\sqrt{E_b}$?', ans:'$0$, since $\\ln(p_0/p_1)=\\ln1=0$.'},
{t:'q', n:'4', text:'<b>Error probability.</b> $E_b/N_0$ rises from $4$ to $8$. $P_b$ falls from $2.3\\times10^{-3}$ to $1.2\\times10^{-3}$, $3.2\\times10^{-5}$ or $10^{-9}$?', ans:'$3.2\\times10^{-5}$, since $Q(\\sqrt{16})=Q(4)=3.2\\times10^{-5}$.'},
{t:'q', n:'5', text:'<b>Interference.</b> An RC channel has $BT_b=0.25$. The worst-case total interference $q$ is $0.208$, $0.5$ or $0.792$?', ans:'$0.208$, since $q=e^{-2\\pi(0.25)}=e^{-\\pi/2}=0.208$.'},
{t:'q', n:'6', text:'<b>Bandwidth.</b> $R_b=1$ Mb/s with a raised cosine of $\\alpha=0.5$ needs $B_T=0.5$, $0.75$ or $1$ MHz?', ans:'$0.75$ MHz, since $B_T=\\tfrac{R_b}{2}(1+\\alpha)=0.5(1.5)=0.75$ MHz.'},

{t:'page'},
{t:'h3', text:'Results of the chapter'},
{t:'p', text:'Twelve questions recall the results this chapter carries forward.'},
{t:'table', cap:'Summary of Chapter 2: baseband transmission of digital signals.', head:['Question','Result','Anchor'], rows:[
 ['Which filter gives the largest peak SNR?','The matched filter $h(t)=k\\,g(T-t)$, or $H(f)=k\\,G^{*}(f)\\,e^{-j2\\pi fT}$, sampled at $t=T$.','PS CH8.3.2'],
 ['What is that largest peak SNR?','$\\eta_{\\max}=2E/N_0$. It depends on the pulse energy $E$, not on its shape.','PS CH8.3.2'],
 ['Where do the two symbols of polar signalling sit?','At $\\pm\\sqrt{E_b}$ on the axis of the unit-energy $\\psi(t)$, a distance $2\\sqrt{E_b}$ apart.','PS CH8.2.1'],
 ['When do the correlator and the matched filter agree?','At $t=T_b$, where both give $\\int_0^{T_b}x(t)\\,\\psi(t)\\,dt$, for any shape of $\\psi$.','PS CH8.3.1'],
 ['What noise is left in the demodulator output?','$y=s_m+n$, with $n$ Gaussian of mean $0$ and variance $N_0/2$.','PS CH8.3.1'],
 ['Where does the optimal threshold go?','$\\lambda_{\\mathrm{opt}}=\\frac{N_0}{4\\sqrt{E_b}}\\ln\\frac{p_0}{p_1}$, at $0$ for equal priors and toward the less likely symbol otherwise.','PS CH8.3.3'],
 ['What is $Q(x)$?','The Gaussian tail $Q(x)=\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$, the chance that a unit Gaussian exceeds $x$.','PS CH8.3.3'],
 ['What is $P_b$ for polar signalling?','$P_b=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$ with equal priors and a matched filter.','PS CH8.3.3'],
 ['How much interference does an RC channel add?','A bit $m$ bits back adds $(1-q)q^{m}$, with $q=e^{-2\\pi BT_b}$. The worst case totals $q$.','PS CH10.1.1'],
 ['When does the eye close?','The opening is $2(1-2q)$. It closes at $BT_b=\\ln2/(2\\pi)=0.110$, and errors then occur without noise.','&mdash;'],
 ['What is Nyquist\'s criterion?','$p(kT_b)=\\delta[k]$ exactly when $\\sum_nP(f-nR_b)=T_b$. It needs $B_T\\ge R_b/2$.','PS CH10.3.1'],
 ['What bandwidth does a raised cosine need?','$B_T=\\tfrac{R_b}{2}(1+\\alpha)$. The tails fall as $1/|t|^{3}$ for $\\alpha>0$.','PS CH10.3.1']
]},
{t:'p', text:'Match the filter to the pulse and read it at the end of the bit. Place the threshold from the priors. Check $B_T$ against $R_b/2$ before choosing a pulse. Chapter 3 extends these steps to more than two waveforms.'},

{t:'h3', text:'Projects to try'},
{t:'p', text:'Four optional projects use the chapter on simulated links. Each gives an aim, what it practises, a few steps and what to look for.'},
{t:'box', kind:'def', hd:'Measure a bit error rate', html:'Simulate a polar link and compare the measured error rate with $Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$.<br><b>Practises:</b> the correlator receiver and its decision statistic. Setting the noise variance from $E_b/N_0$. How many bits a reliable estimate of $P_b$ needs.<ol><li>Draw $10^{6}$ random bits and map them to $\\pm1$.</li><li>Add Gaussian noise of variance $N_0/2$ for $E_b/N_0$ from $0$ to $10$ dB.</li><li>Decide by the sign of each value and count the errors.</li><li>Plot the measured $P_b$ on a logarithmic axis with the $Q$ curve over it.</li></ol><b>Look for:</b> the points lie on the curve until the error count gets small. There they scatter, because too few errors were seen.'},
{t:'box', kind:'def', hd:'Find an echo in noise', html:'Hide a known pulse in strong noise and find its delay with a matched filter.<br><b>Practises:</b> correlation with a template. Why a long pulse with a wide bandwidth gives a sharp peak. Reading a delay from the peak position.<ol><li>Make a chirp of $1000$ samples that sweeps a wide band.</li><li>Place it at an unknown delay inside $10\\,000$ samples of noise that hides it.</li><li>Correlate the record with the chirp and find the largest peak.</li><li>Repeat with a plain rectangular pulse of the same energy.</li></ol><b>Look for:</b> the chirp gives one narrow peak at the true delay. The rectangle gives a broad triangle whose top is hard to place in noise.'},
{t:'box', kind:'def', hd:'Draw the eye of a cable', html:'Send random bits through a lowpass channel and watch the eye close as the bandwidth falls.<br><b>Practises:</b> intersymbol interference from a bandlimited channel. The eye diagram as an overlay of short pieces. The link between eye opening and error rate.<ol><li>Build an RC lowpass with time constant $\\tau=1/(2\\pi B)$.</li><li>Pass $2000$ random polar bits through it at $BT_b=0.5$, $0.25$ and $0.12$.</li><li>Cut the output into pieces $2T_b$ long around each sample and plot them together.</li><li>Add a little noise and count the errors at each bandwidth.</li></ol><b>Look for:</b> the eye narrows as $BT_b$ falls and is nearly shut near $0.11$. The error count jumps once the eye closes.'},
{t:'box', kind:'def', hd:'Shape pulses with a raised cosine', html:'Compare the sinc pulse with raised-cosine pulses in bandwidth and in sensitivity to timing.<br><b>Practises:</b> the raised-cosine pulse and its roll-off $\\alpha$. The spectrum of a pulse train. Why a small $\\alpha$ needs a precise clock.<ol><li>Build raised-cosine pulses with $\\alpha=0$, $0.25$ and $0.5$, truncated to $\\pm8T_b$.</li><li>Send random polar bits with each and plot the spectrum of the result.</li><li>Sample the received train slightly late, by $0.05T_b$ to $0.3T_b$.</li><li>Plot the eye for each $\\alpha$ at each timing error.</li></ol><b>Look for:</b> a larger $\\alpha$ widens the spectrum. It also keeps the eye open for a larger timing error.'}
];
})();
