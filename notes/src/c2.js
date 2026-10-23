/* Course notes — Chapter 2.

   The chapter follows the slides of Module 2 one for one: its numbered
   sections are the module's sections, each heading inside a section is one
   teaching slide, and every figure is the slide's figure drawn at one static
   state (the last frame of a stepped figure, a named slider setting of a live
   one). The figure helpers below repeat the ones in `83_scenes_m2.js`,
   `88_scenes_m2r.js` and `88_scenes_m2x.js`, with the same seeds, so the noisy figures are the same
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

/* ---- 2.1 random signals --------------------------------------------------
   The figures of `88_scenes_m2r.js`, with the same seeds, each at the last
   frame of its stepped figure or at the slider setting the slide opens on. */
const SZ=o=>Object.assign({w:560,h:380,pad:{l:56,r:26,t:24,b:42}},o);
/* a stationary Gaussian process with R(tau)=exp(-|tau|/tc) and unit power */
function ou(z,dt,tc){ const a=Math.exp(-dt/tc), b=Math.sqrt(1-a*a), x=[z[0]];
  for(let k=1;k<z.length;k++) x.push(a*x[k-1]+b*z[k]); return x; }
const path=(x,dt,t1)=>t=>{ if(t<0||t>t1) return NaN;
  const u=t/dt, k=Math.max(0,Math.min(x.length-2,Math.floor(u))), f=u-k; return x[k]*(1-f)+x[k+1]*f; };
const dN=x=>Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);
const side3=(a,hA,b,c,hB)=>`<svg viewBox="0 0 560 ${hA+hB}" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,560,hA)}${place(b.svg(),0,hA,280,hB)}${place(c.svg(),280,hA,280,hB)}</svg>`;

const EN_DT=0.02, EN_T1=9, EN_T0=5;
const EN_P=[0,1,2,3,4,5,6,7].map(i=>ou(gauss(20260401+i,451,1),EN_DT,0.4));
const EN_BW=0.25, EN_LO=-3.25;
const EN_H=(()=>{ const c=Array(26).fill(0);
  gauss(20260411,2000,1).forEach(x=>{ const k=Math.floor((x-EN_LO)/EN_BW); if(k>=0&&k<26) c[k]++; }); return c; })();
function figEnsemble(){
  const a=P.Axes(SZ({w:700,h:300,xr:[0,13.4],yr:[-3.5,4.1],xlabel:'t\\;(\\text{ms})',ylabel:'X(t)',
    xticksOverride:[0,2,4,6,8],yticksOverride:[-2,0,2]}));
  a.raw('<g opacity="0.55">'); for(let i=1;i<8;i++) a.curve(path(EN_P[i],EN_DT,EN_T1),{color:C.in,width:1.3,n:700}); a.raw('</g>');
  a.curve(path(EN_P[0],EN_DT,EN_T1),{color:C.in,width:2.5,n:900});
  a.poly([[EN_T0,-3.5],[EN_T0,3.2]],{color:C.mid,width:1.6,dash:'5 4'});
  EN_P.forEach(x=>a.point(EN_T0,path(x,EN_DT,EN_T1)(EN_T0),{color:C.mid,r:4.2}));
  a.note(EN_T0,3.55,'t_0',{tex:true,fs:15,color:C.mid,anchor:'middle'});
  const X0=9.7, L=3.2/Math.max(...EN_H);
  EN_H.forEach((c,k)=>{ if(c) a.rect(X0,EN_LO+k*EN_BW+0.015,X0+L*c,EN_LO+(k+1)*EN_BW-0.015,{fill:C.dec.mid,stroke:C.mid,width:1}); });
  const pts=[]; for(let i=0;i<=120;i++){ const y=-3.3+6.6*i/120; pts.push([X0+L*2000*EN_BW*dN(y),y]); }
  a.poly(pts,{color:C.mid,width:2.4});
  a.note(13.3,3.55,'f_{X(t_0)}(x)',{tex:true,fs:15,color:C.mid,anchor:'end'});
  return a.svg();
}

const AC_DT=0.02, AC_TC=1, AC_T1=1.5;
const AC_P=[0,1,2].map(i=>ou(gauss(20260421+i,301,1),AC_DT,AC_TC));
const AC_Z1=gauss(20260431,300,1), AC_Z2=gauss(20260432,300,1);
function figAcf(tau){
  const rho=Math.exp(-tau/AC_TC), s=Math.sqrt(1-rho*rho), hA=160, hB=270;
  const a=P.Axes({w:560,h:hA,xr:[0,6],yr:[-3.2,3.2],xlabel:'t\\;(\\text{ms})',ylabel:'x(t)',
    pad:{l:56,r:26,t:22,b:40},xticksOverride:[0,1,2,3,4,5,6],yticksOverride:[-2,0,2]});
  AC_P.forEach(x=>a.curve(path(x,AC_DT,6),{color:C.in,width:1.5,n:700}));
  [AC_T1,AC_T1+tau].forEach(t=>{ a.vline(t,{color:C.mid,dash:'5 4',width:1.4,opacity:0.9});
    AC_P.forEach(x=>a.point(t,path(x,AC_DT,6)(t),{color:C.mid,r:4})); });
  const b=P.Axes({w:300,h:hB,xr:[-3.3,3.3],yr:[-3.3,3.3],xlabel:'X(t)',ylabel:'X(t+\\tau)',
    pad:{l:52,r:14,t:24,b:42},xticksOverride:[-2,0,2],yticksOverride:[-2,0,2]});
  let sum=0;
  AC_Z1.forEach((z,i)=>{ const y=rho*z+s*AC_Z2[i]; sum+=z*y;
    if(Math.abs(z)<3.25&&Math.abs(y)<3.25)
      b.raw(`<circle cx="${b.sx(z).toFixed(2)}" cy="${b.sy(y).toFixed(2)}" r="2.6" fill="${C.mid}" opacity="0.6"/>`); });
  const c=P.Axes({w:260,h:hB,xr:[0,3.2],yr:[-0.08,1.32],xlabel:'\\tau\\;(\\text{ms})',ylabel:'R_X(\\tau)',
    pad:{l:48,r:18,t:24,b:42},xticksOverride:[0,1,2,3],yticksOverride:[0,0.5,1]});
  c.curve(t=>Math.exp(-t/AC_TC),{color:C.mid,width:2.5,n:400});
  c.point(tau,rho,{color:C.mid,r:5.2});
  c.note(3.15,1.17,`\\hat R_X(\\tau)=${(sum/AC_Z1.length).toFixed(2)}`,{tex:true,fs:15,color:C.ink,anchor:'end'});
  return `<svg viewBox="0 0 560 ${hA+hB}" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,560,hA)}${place(b.svg(),0,hA,300,hB)}${place(c.svg(),300,hA,260,hB)}</svg>`;
}

const RW=t=>4*Math.exp(-Math.abs(t)/2)*Math.cos(2*Math.PI*t);
function figWss(){
  const a=P.Axes(SZ({w:700,h:300,xr:[-3.2,3.2],yr:[-5.6,6],xlabel:'\\tau\\;(\\text{ms})',ylabel:'R_X(\\tau)\\;(\\text{V}^{2})',
    xticksOverride:[-3,-2,-1,0,1,2,3],yticksOverride:[-4,-2,2,4]}));
  a.rect(-3.2,-4,3.2,4,{fill:C.dec.mid});
  a.hline(4,{color:C.slate,dash:'6 4',width:1.4,opacity:1}); a.hline(-4,{color:C.slate,dash:'6 4',width:1.4,opacity:1});
  a.note(3.15,-4.9,'|R_X(\\tau)|\\le R_X(0)',{tex:true,fs:15,color:C.slate,anchor:'end'});
  a.curve(RW,{color:C.mid,width:2.6,n:900});
  a.note(-3.1,5.25,'R_X(-\\tau)=R_X(\\tau)',{tex:true,fs:15,color:C.mid});
  a.point(0,4,{color:C.mid,r:5.4});
  a.note(0.22,5.25,'R_X(0)=P_X=4',{tex:true,fs:15,color:C.mid});
  return a.svg();
}

/* Stationarity: three recordings read at t and t + 1 ms (slide figWssShift). */
function figWssShift(v){
  const t0=v&&v.t!=null?v.t:1, tau=1;
  const a=P.Axes(SZ({xr:[0,6],yr:[-3.4,5.4],xlabel:'t\\;(\\text{ms})',ylabel:'X(t)\\;(\\text{V})',xticksOverride:[0,1,2,3,4,5,6],yticksOverride:[-2,0,2]}));
  AC_P.forEach((x,i)=>a.curve(path(x,AC_DT,6),{color:[C.in,C.h,C.err][i],width:1.6,n:700}));
  [t0,t0+tau].forEach(t=>{a.vline(t,{color:C.mid,dash:'5 4',width:1.4,opacity:0.9});
    AC_P.forEach(x=>a.point(t,path(x,AC_DT,6)(t),{color:C.mid,r:4}));});
  a.span(t0,t0+tau,4.45,'\\tau=1\\ \\text{ms}',{tex:true,fs:15,color:C.mid});
  return a.svg();
}
/* Strict-sense stationarity: 300 recordings read at t = 1 ms and t + 1 ms (slide figSssShift). */
const SS_N=300;
const SS_P=AC_P.concat([...Array(SS_N-3).keys()].map(i=>ou(gauss(20260601+i,301,1),AC_DT,AC_TC)));
function figSssShift(v){
  const t0=v&&v.t!=null?v.t:1, tau=1;
  const a=P.Axes(SZ({xr:[-3.3,3.3],yr:[-3.3,3.3],xlabel:'X(t)\\;(\\text{V})',ylabel:'X(t+\\tau)\\;(\\text{V})',xticksOverride:[-2,0,2],yticksOverride:[-2,0,2]}));
  SS_P.forEach((x,i)=>{const f=path(x,AC_DT,6),u=f(t0),w=f(t0+tau);
    if(i>=3&&Math.abs(u)<3.25&&Math.abs(w)<3.25)a.point(u,w,{color:C.mid,r:2.8});});
  AC_P.forEach((x,i)=>{const f=path(x,AC_DT,6);a.point(f(t0),f(t0+tau),{color:[C.in,C.h,C.err][i],r:5});});
  return a.svg();
}

/* The white-noise limit: R_w(tau)/(N0/2) = 2B sinc(2B tau), B in kHz, tau in
   ms. The peak 2B grows and the lobe narrows while the area stays 1, so the
   curve tends to the impulse delta(tau) as B grows. */
function figWhiteLimit(v){
  const B=v&&v.B!=null?v.B:1, r=t=>2*B*sinc(2*B*t);
  const a=P.Axes(SZ({xr:[-1.2,1.2],yr:[-2.6,11.6],xlabel:'\\tau\\;(\\text{ms})',ylabel:'R_w(\\tau)/(N_0/2)\\;(\\text{kHz})',xticksOverride:[-1,-0.5,0,0.5,1],yticksOverride:[2,4,6,8,10]}));
  a.area(r,-1.2,1.2,{color:C.dec.mid,n:1800});a.curve(r,{color:C.mid,width:2.6,n:1800});
  a.point(0,2*B,{color:C.mid,r:5});
  a.note(0.08,2*B+0.35,'2B',{tex:true,fs:15,color:C.mid});
  a.note(1.15,10.6,'\\text{area}=1',{tex:true,fs:15,color:C.ink,anchor:'end'});
  return a.svg();
}

function figExPhase(){
  const a=P.Axes(SZ({xr:[-1.6,1.6],yr:[-4,4],xlabel:'t\\;(\\text{ms})',ylabel:'x(t)\\;(\\text{V})',xticksOverride:[-1.5,-1,-0.5,0.5,1,1.5],yticksOverride:[-3,0,3]}));
  a.curve(t=>3*Math.sin(2*Math.PI*t),{color:C.in,width:2.6,n:700});return a.svg();
}

const PS_DT=0.01, PS_Z=gauss(20260441,1001,1);
function figPsdR(tc){
  const hA=160, hB=270, S=f=>2*tc/(1+Math.pow(2*Math.PI*f*tc,2));
  const a=P.Axes({w:560,h:hA,xr:[0,10],yr:[-3.4,3.4],xlabel:'t\\;(\\text{ms})',ylabel:'x(t)',
    pad:{l:56,r:26,t:22,b:40},xticksOverride:[0,2,4,6,8,10],yticksOverride:[-2,0,2]});
  a.curve(path(ou(PS_Z,PS_DT,tc),PS_DT,10),{color:C.in,width:1.5,n:1000});
  const b=P.Axes({w:280,h:hB,xr:[-2.2,2.2],yr:[-0.06,1.3],xlabel:'\\tau\\;(\\text{ms})',ylabel:'R_X(\\tau)',
    pad:{l:48,r:16,t:24,b:42},xticksOverride:[-2,-1,0,1,2],yticksOverride:[0.5,1]});
  b.curve(t=>Math.exp(-Math.abs(t)/tc),{color:C.mid,width:2.5,n:900});
  const c=P.Axes({w:280,h:hB,xr:[-2.2,2.2],yr:[0,2.35],xlabel:'f\\;(\\text{kHz})',ylabel:'S_X\\;(\\text{V}^{2}/\\text{kHz})',
    pad:{l:48,r:16,t:24,b:42},xticksOverride:[-2,-1,0,1,2],yticksOverride:[0.5,1,1.5,2]});
  c.area(S,-2.2,2.2,{color:C.dec.in,n:600});
  c.curve(S,{color:C.in,width:2.6,n:900});
  c.note(2.15,2.12,'P_X=1',{tex:true,fs:15,color:C.ink,anchor:'end'});
  return side3(a,hA,b,c,hB);
}

const WH_DF=0.05, WH_PH=(()=>{ const r=rng(20260451), o=[]; for(let k=0;k<200;k++) o.push(2*Math.PI*r()); return o; })();
function figWhite(B){
  const hA=160, hB=270, K=Math.max(1,Math.floor(B/WH_DF-0.5)+1), g=Math.sqrt(2/K);
  const a=P.Axes({w:560,h:hA,xr:[0,3],yr:[-3.4,3.4],xlabel:'t\\;(\\text{ms})',ylabel:'x(t)/\\sigma',
    pad:{l:56,r:26,t:22,b:40},xticksOverride:[0,0.5,1,1.5,2,2.5,3],yticksOverride:[-2,0,2]});
  a.curve(t=>{ let s=0; for(let k=0;k<K;k++) s+=Math.cos(2*Math.PI*(k+0.5)*WH_DF*t+WH_PH[k]); return g*s; },
    {color:C.in,width:1.4,n:1200});
  const b=P.Axes({w:280,h:hB,xr:[-1.2,1.2],yr:[-0.3,1.3],xlabel:'\\tau\\;(\\text{ms})',ylabel:'R_X(\\tau)/N_0B',
    pad:{l:48,r:16,t:24,b:42},xticksOverride:[-1,0,1],yticksOverride:[0.5,1]});
  b.curve(t=>sinc(2*B*t),{color:C.mid,width:2.5,n:1400});
  const z=1/(2*B);
  [-z,z].forEach(t=>b.point(t,0,{color:C.mid,r:4.4}));
  b.note(z+0.06,0.16,'\\tfrac{1}{2B}',{tex:true,fs:15,color:C.mid});
  const c=P.Axes({w:280,h:hB,xr:[-10,10],yr:[0,1.45],xlabel:'f\\;(\\text{kHz})',ylabel:'S_X(f)',
    pad:{l:48,r:16,t:24,b:42},xticksOverride:[-10,-5,0,5,10],yticksOverride:[1],ytickfmt:()=>''});
  c.poly([[-10,1],[10,1]],{color:C.in,width:1.4,dash:'4 5'});
  c.rect(-B,0,B,1,{fill:C.dec.in});
  c.poly([[-10,0],[-B,0],[-B,1],[B,1],[B,0],[10,0]],{color:C.in,width:2.6});
  c.note(-9.7,1.16,'\\tfrac{N_0}{2}',{tex:true,fs:15,color:C.in});
  return side3(a,hA,b,c,hB);
}

const LT_X=noiseFn(20260461,0.02,1,-0.5,6);
const LT_Y=(()=>{ const rc=1/(2*Math.PI), dt=0.005, y=[0]; let v=0;
  for(let k=1;k<=Math.round(6.5/dt);k++){ const t=-0.5+k*dt; v+=(LT_X(t)-v)*dt/rc; y.push(v); }
  return t=>{ const u=(t+0.5)/dt, k=Math.max(0,Math.min(y.length-2,Math.floor(u))), f=u-k; return y[k]*(1-f)+y[k+1]*f; }; })();
function figLti(){
  const h1=230, h2=160, H2=x=>1/(1+x*x), Sy=x=>0.5*H2(x);
  const a=P.Axes({w:560,h:h1,xr:[-5,5],yr:[0,2.05],xlabel:'f\\;(\\text{kHz})',ylabel:'S(f),\\;|H(f)|^{2}',
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[-4,-2,0,2,4],yticksOverride:[]});
  a.curve(()=>0.5,{color:C.in,width:1.5,dash:'6 5',n:4});
  a.curve(H2,{color:C.h,width:2.2,dash:'7 5',n:600});
  a.note(-4.9,0.63,'\\tfrac{N_0}{2}',{tex:true,fs:15,color:C.in});
  a.area(Sy,-5,5,{color:C.dec.out,n:400}); a.curve(Sy,{color:C.out,width:2.6,n:600});
  a.note(0.35,1.55,'|H(f)|^{2}',{tex:true,fs:15,color:C.h});
  a.note(0.55,0.3,'S_Y(f)',{tex:true,fs:15,color:C.out});
  const b=P.Axes({w:560,h:h2,xr:[0,5],yr:[-3.2,3.2],xlabel:'t\\;(\\text{ms})',ylabel:'x(t),\\;y(t)',
    pad:{l:56,r:26,t:22,b:40},xticksOverride:[0,1,2,3,4,5],yticksOverride:[-2,0,2]});
  b.curve(LT_X,{color:C.in,width:1.1,n:1200,opacity:0.55});
  b.curve(LT_Y,{color:C.out,width:2.6,n:800});
  return stack(560,[[a.svg(),h1],[b.svg(),h2]]);
}

function figNoiseBw(rc){
  const bn=1/(4*rc), f3=1/(2*Math.PI*rc), H2=f=>1/(1+Math.pow(2*Math.PI*f*rc,2));
  const a=P.Axes(SZ({w:700,h:280,xr:[-2,2],yr:[0,1.55],xlabel:'f\\;(\\text{kHz})',ylabel:'|H(f)|^{2}',
    xticksOverride:[-2,-1,0,1,2],yticksOverride:[0.5,1]}));
  a.area(H2,-2,2,{color:C.dec.h,n:600});
  a.poly([[-bn,0],[-bn,1],[bn,1],[bn,0]],{color:C.slate,width:2,dash:'7 5'});
  [-f3,f3].forEach(x=>a.poly([[x,0],[x,0.5]],{color:C.muted,width:1.4,dash:'3 4'}));
  a.curve(H2,{color:C.h,width:2.6,n:900});
  a.note(-1.95,1.38,`B_{\\text{neq}}=${Math.round(1000*bn)}\\ \\text{Hz}`,{tex:true,fs:15,color:C.slate});
  a.note(-1.95,1.18,`f_{3\\text{dB}}=${Math.round(1000*f3)}\\ \\text{Hz}`,{tex:true,fs:15,color:C.muted});
  return a.svg();
}

/* a generic lowpass with |H|^2 = 1/(1+(f/f0)^2), area pi f0, so B_neq = pi f0/2 */
function figNoiseBwGen(bn){
  const f0=2*bn/Math.PI, H2=f=>1/(1+Math.pow(f/f0,2));
  const a=P.Axes(SZ({w:700,h:280,xr:[-2,2],yr:[0,1.55],xlabel:'f\\;(\\text{kHz})',ylabel:'|H(f)|^{2}',
    xticksOverride:[-2,-1,0,1,2],yticksOverride:[0.5,1]}));
  a.area(H2,-2,2,{color:C.dec.h,n:600});
  a.poly([[-bn,0],[-bn,1],[bn,1],[bn,0]],{color:C.slate,width:2,dash:'7 5'});
  a.curve(H2,{color:C.h,width:2.6,n:900});
  a.note(-1.95,1.38,`B_{\\text{neq}}=${Math.round(1000*bn)}\\ \\text{Hz}`,{tex:true,fs:15,color:C.slate});
  return a.svg();
}

/* the sum of n independent uniform sources, scaled to unit variance */
const CL_X=[...Array(361)].map((_,i)=>-3.6+0.02*i);
function cltDens(n){
  const cf=(s,W,dw)=>{ let r=0; for(let w=dw/2;w<W;w+=dw){ r+=Math.pow(Math.sin(w)/w,n)*Math.cos(w*s); } return r*dw/Math.PI; };
  const c=Math.sqrt(n/3);
  return CL_X.map(z=>c*Math.max(0,cf(c*z,n<10?60:8,n<10?0.01:0.005)));
}
function figClt(){
  const d=cltDens(30);
  const at=z=>{ const u=(z+3.6)/0.02, i=Math.max(0,Math.min(359,Math.floor(u))), w=u-i; return d[i]*(1-w)+d[i+1]*w; };
  const a=P.Axes(SZ({w:700,h:280,xr:[-3.6,3.6],yr:[0,0.62],xlabel:'z',ylabel:'f_Z(z)',
    xticksOverride:[-3,-2,-1,0,1,2,3],yticksOverride:[0.2,0.4]}));
  a.area(at,-3.6,3.6,{color:C.dec.mid,n:720});
  a.curve(at,{color:C.mid,width:2.6,n:720});
  a.curve(dN,{color:C.slate,width:1.8,n:500});
  return a.svg();
}

/* ---- 2.2 the matched filter --------------------------------------------- */
const RX_W=bandNoise(7,30,0.5,-0.2,1.4);
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

/* The filter problem, as on the slides: one rectangular pulse in white noise
   of N0 = 0.08 on a grid of dt = T/200, the same seed, through an RC filter
   or the matched filter. The input is drawn through a Gaussian smoothing of
   T/50, as on the slides. */
const FP_N0=0.08, FP_DT=1/200, FP_T0=-6, FP_T1=2.4;
const FP_K=Math.round((FP_T1-FP_T0)/FP_DT)+1;
const FP_W=gauss(20261209,FP_K,Math.sqrt(FP_N0/(2*FP_DT)));
const fpG=t=>(t>=0&&t<=1)?1:0;
const rcSig=(t,tau)=>t<0?0:t<=1?1-Math.exp(-t/tau):(1-Math.exp(-1/tau))*Math.exp(-(t-1)/tau);
const mfSig=t=>t<0?0:t<1?t:t<2?2-t:0;
const rcRatio=x=>2*Math.pow(1-Math.exp(-x),2)/x;
function fpNoise(tau){ const n=new Float64Array(FP_K);
  if(tau){ const a=Math.exp(-FP_DT/tau); let s=0; for(let k=0;k<FP_K;k++){ s=a*s+FP_W[k]*FP_DT/tau; n[k]=s; } }
  else { let s=0; for(let k=0;k<FP_K;k++){ s+=FP_W[k]*FP_DT; if(k>=200) s-=FP_W[k-200]*FP_DT; n[k]=s; } }
  return t=>{ const x=(t-FP_T0)/FP_DT, k=Math.max(0,Math.min(FP_K-2,Math.floor(x))), f=x-k; return (1-f)*n[k]+f*n[k+1]; }; }
const FP_X=(()=>{ const R=12, w=[];
  for(let i=-R;i<=R;i++) w.push(Math.exp(-i*i/32));
  const sw=w.reduce((a,b)=>a+b,0), o=[];
  for(let k=Math.round((-0.2-FP_T0)/FP_DT);k+R<FP_K;k+=2){
    let s=0; for(let i=-R;i<=R;i++) s+=w[i+R]*FP_W[k+i]; const t=FP_T0+k*FP_DT;
    if(t>2.3) break; o.push([t,fpG(t)+s/sw]); } return o; })();
const fpFilter=tau=>tau
  ? {sig:t=>rcSig(t,tau),sd:Math.sqrt(FP_N0/(4*tau)),n:fpNoise(tau),ratio:rcRatio(1/tau)}
  : {sig:mfSig,sd:Math.sqrt(FP_N0/2),n:fpNoise(0),ratio:1};
function fpOutput(a,F){
  const N=250, pts=[];
  for(let i=0;i<=N;i++){ const t=-0.2+2.5*i/N; pts.push([a.sx(t),a.sy(F.sig(t)+F.sd)]); }
  for(let i=N;i>=0;i--){ const t=-0.2+2.5*i/N; pts.push([a.sx(t),a.sy(F.sig(t)-F.sd)]); }
  a.under(`<path d="M${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L')}Z" fill="${C.noiseSoft}"/>`);
  a.curve(t=>F.sig(t)+F.n(t),{color:C.mid,width:1.2,opacity:0.4,n:900});
  a.curve(F.sig,{color:C.mid,width:2.6,n:600});
  a.vline(1,{color:C.muted});
  a.point(1,F.sig(1),{color:C.mid,r:5});
}
const etaNote=r=>`\\eta=${r.toFixed(2)}\\cdot\\dfrac{2E}{N_0}`;
/* the noisy input, and one filter's output under it */
function figFpInput(){
  const a=ax1({h:190,xr:[-0.2,2.3],yr:[-3.2,4.4],xlabel:'t/T',ylabel:'x(t)',xticksOverride:[0,1,2],yticksOverride:[-2,0,2,4]});
  a.poly(FP_X,{color:C.out,width:1.3});
  a.poly([[-0.2,0],[0,0],[0,1],[1,1],[1,0],[2.3,0]],{color:C.in,width:2.4});
  return a.svg();
}
function figFpOut(tau){
  const F=fpFilter(tau);
  const a=ax2({xr:[-0.2,2.3],yr:[-1.1,2.1],xlabel:'t/T',ylabel:'y(t)',xticksOverride:[0,1,2],yticksOverride:[-1,0,1,2]});
  fpOutput(a,F);
  return a.svg();
}

/* the RC filter at T/tau = x, and eta/(2E/N0) against T/tau on a log axis */
const RC_BEST=1.2564;
function figSnr(x){
  const F=fpFilter(+(1/x).toPrecision(6));
  const a=ax1({h:230,xr:[-0.2,2.3],yr:[-1.1,1.9],xlabel:'t/T',ylabel:'y(t)',xticksOverride:[0,1,2],yticksOverride:[-1,0,1]});
  fpOutput(a,F);
  a.note(1.06,F.sig(1)+F.sd+0.28,'g_0(T)',{tex:true,fs:14,color:C.mid});
  a.note(0.06,1.6,etaNote(F.ratio),{tex:true,fs:14,color:C.mid});
  const b=ax1({h:200,xr:[0,2.3],yr:[0,1.3],xlabel:'T/\\tau',ylabel:'\\eta\\,/\\,(2E/N_0)',
    xticksOverride:[0.2,1.2,2.2],xtickfmt:u=>u<1?'0.1':u<2?'1':'10',yticksOverride:[0.5,1]});
  b.hline(1,{color:C.muted,dash:'5 4'});
  b.note(1.72,1.07,'\\text{the bound}',{tex:true,fs:13,color:C.muted});
  b.curve(u=>rcRatio(Math.pow(10,u-1.2)),{color:C.h,width:2.4,n:400});
  const ub=Math.log10(RC_BEST)+1.2;
  b.point(ub,rcRatio(RC_BEST),{color:C.mid,r:5});
  b.note(ub+0.08,0.48,'0.81',{tex:true,fs:13,color:C.h});
  return stack(700,[[a.svg(),230],[b.svg(),200]]);
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

/* eta/(2E/N0) = 2b/(1 + b^2) against the width b of |H(f)| */
function figBoundCurve(){
  const a=ax1({h:230,xr:[0,3.2],yr:[0,1.25],xlabel:'b',ylabel:'\\eta\\,/\\,(2E/N_0)',
    xticksOverride:[0,0.5,1,2,3],yticksOverride:[0.5,0.8,1]});
  a.hline(1,{color:C.muted,dash:'5 4'});
  a.note(2.3,1.1,'\\text{the bound}',{tex:true,fs:13,color:C.muted});
  a.curve(b=>schwarzRatio(b),{color:C.h,width:2.6,n:500});
  [[0.5,0.8],[2,0.8]].forEach(([x,y])=>a.point(x,y,{color:C.h,r:4.5}));
  a.point(1,1,{color:C.mid,r:5});
  a.note(1.06,1.1,'b=1',{tex:true,fs:14,color:C.mid});
  return a.svg();
}

/* the ramp g(t) = t/T, its reversal g(-t), and h(t) = g(T - t) */
function figMatchedBuild(){
  const a=ax1({xr:[-1.35,1.35],yr:[-0.2,1.35],xlabel:'t/T',ylabel:'g(t),\\;h(t)',
    xticksOverride:[-1,-0.5,0,0.5,1]});
  a.poly([[0,0],[1,1],[1,0]],{color:C.in,width:2.4});
  a.poly([[0,0],[-1,1],[-1,0]],{color:C.h,width:2.0,dash:'7 5'});
  a.poly([[1,0],[0,1],[0,0]],{color:C.h,width:2.6});
  a.note(1.05,0.78,'g(t)',{tex:true,fs:14,color:C.in});
  a.note(-1.28,1.12,'g(-t)',{tex:true,fs:14,color:C.h});
  a.note(0.06,1.14,'h(t)=g(T-t)',{tex:true,fs:14,color:C.h});
  return a.svg();
}

/* the sliding overlap of the ramp at t = T/2, and y(t)/E drawn as far as the
   slide has gone: y/E = 1.5t^2 - 0.5t^3 up to T, even about T */
function figConvTop(){
  const t=0.5, g=u=>(u>=0&&u<=1)?u:0;
  const a=ax2({xr:[-1.2,2.3],yr:[-0.2,1.4],xlabel:'\\tau/T',ylabel:'g(\\tau),\\;h(t-\\tau)',xticksOverride:[-1,0,1,2],ytarget:2});
  a.area(u=>g(u)*g(1-t+u),-1.2,2.3,{color:C.dec.mid});
  a.poly([[-1.2,0],[0,0],[1,1],[1,0],[2.3,0]],{color:C.in,width:2.4});
  a.poly([[-1.2,0],[t-1,0],[t,1],[t,0],[2.3,0]],{color:C.h,width:2.2,dash:'7 5'});
  return a.svg();
}
function figConvBottom(){
  const t=0.5, yh=u=>u<=0?0:u>=1?1:1.5*u*u-0.5*u*u*u, y=u=>u<=1?yh(u):yh(2-u);
  const a=ax2({xr:[-1.2,2.3],yr:[-0.2,1.4],xlabel:'t/T',ylabel:'y(t)/E',xticksOverride:[-1,0,1,2],ytarget:2});
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
  a.note(0.06,1.12,'g(t)/A',{tex:true,fs:14,color:C.ink});
  a.poly([[-0.2,0],[0,0],[1,1],[2,0],[2.4,0]],{color:C.mid,width:2.6});
  a.point(1,1,{color:C.mid,r:5});
  a.note(1.08,1.14,'y(T)=A^{2}T',{tex:true,fs:14,color:C.mid});
  return a.svg();
}

/* Bandlimited Gaussian noise, as on the slides: K cosines over (0, B) with
   Gaussian weights, tabulated, then set to mean 0 and RMS exactly s. */
function bandNoise(seed,B,s,t0,t1){
  const L=t1-t0, K=Math.max(8,Math.round(B*L)), z=gauss(seed,2*K,1);
  const dt=1/(16*B), N=Math.ceil(L/dt)+1, x=new Float64Array(N);
  let m=0, q=0;
  for(let i=0;i<N;i++){ const t=i*dt; let v=0;
    for(let k=0;k<K;k++){ const w=2*Math.PI*(k+0.5)*B/K*t; v+=z[2*k]*Math.cos(w)+z[2*k+1]*Math.sin(w); }
    x[i]=v; m+=v; }
  m/=N; for(let i=0;i<N;i++){ x[i]-=m; q+=x[i]*x[i]; }
  const g=s/Math.sqrt(q/N); for(let i=0;i<N;i++) x[i]*=g;
  return t=>{ const u=(t-t0)/dt, k=Math.max(0,Math.min(N-2,Math.floor(u))), f=u-k; return (1-f)*x[k]+f*x[k+1]; };
}

/* Additive Gaussian noise: five polar bits under sigma = 0.1, 0.5 and 1, one
   noise realisation of RMS 1 scaled by sigma, with the band g(t) +/- sigma. */
const AW_B=[1,0,1,0,1], AW_W=bandNoise(20261014,20,1,-0.2,5.2);
const awG=t=>{ const k=Math.floor(t); return (k>=0&&k<5)?(AW_B[k]?1:-1):0; };
function figAwgnPanel(s,last){
  const a=P.Axes({w:700,h:last?150:128,xr:[-0.15,5.15],yr:[-4.4,4.4],xlabel:last?'t/T':'',ylabel:`x(t),\\;\\sigma=${s}`,
    pad:{l:56,r:22,t:22,b:last?40:18},xticksOverride:[0,1,2,3,4,5],yticksOverride:[-4,0,4]});
  const pts=[], N=400;
  for(let j=0;j<=N;j++){ const t=5*j/N; pts.push([a.sx(t),a.sy(awG(t)+s)]); }
  for(let j=N;j>=0;j--){ const t=5*j/N; pts.push([a.sx(t),a.sy(awG(t)-s)]); }
  a.under(`<path d="M${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L')}Z" fill="${C.noiseSoft}"/>`);
  a.curve(t=>t>=0&&t<=5?awG(t)+s*AW_W(t):NaN,{color:C.out,width:1.2,n:2400});
  a.poly([[-0.15,0],[0,0],[0,1],[1,1],[1,-1],[2,-1],[2,1],[3,1],[3,-1],[4,-1],[4,1],[5,1],[5,0],[5.15,0]],{color:C.in,width:2.2});
  return a.svg();
}
function figAwgn(){
  return stack(700,[[figAwgnPanel(0.1,false),128],[figAwgnPanel(0.5,false),128],[figAwgnPanel(1,true),150]]);
}

/* the output of the RC filter with tau = T/4 split into its two parts */
function figSplit(){
  const F=fpFilter(0.25);
  const a=ax2({xr:[-0.2,2.3],yr:[-1.1,2.1],xlabel:'t/T',ylabel:'g_0(t),\\;n(t)',xticksOverride:[0,1,2],yticksOverride:[-1,0,1,2]});
  const pts=[], N=250;
  for(let i=0;i<=N;i++){ const t=-0.2+2.5*i/N; pts.push([a.sx(t),a.sy(F.sd)]); }
  for(let i=N;i>=0;i--){ const t=-0.2+2.5*i/N; pts.push([a.sx(t),a.sy(-F.sd)]); }
  a.under(`<path d="M${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L')}Z" fill="${C.noiseSoft}"/>`);
  a.curve(F.n,{color:C.muted,width:1.3,n:900});
  a.curve(F.sig,{color:C.mid,width:2.6,n:600});
  a.vline(1,{color:C.muted});
  const b=ax2({xr:[-0.2,2.3],yr:[-1.1,2.1],xlabel:'t/T',ylabel:'y(t)=g_0(t)+n(t)',xticksOverride:[0,1,2],yticksOverride:[-1,0,1,2]});
  fpOutput(b,F);
  b.note(1.12,F.sig(1)+F.n(1)-0.05,'n(T)',{tex:true,fs:14,color:C.err});
  return `<svg viewBox="0 0 700 230" xmlns="http://www.w3.org/2000/svg" role="img">${place(a.svg(),0,0,340,230)}${place(b.svg(),360,0,340,230)}</svg>`;
}

/* white noise through an RC filter with tau = T/4: the flat input density,
   the output density (N0/2)|H(f)|^2 and the area under it */
const npH2=f=>1/(1+Math.pow(2*Math.PI*f*0.25,2));
function figNoisePower(){
  const a=ax1({h:230,xr:[-4,4],yr:[0,1.45],xlabel:'fT',ylabel:'S(f)/(N_0/2)',xticksOverride:[-4,-2,0,2,4],yticksOverride:[0.5,1],ytickfmt:()=>''});
  a.curve(()=>1,{color:C.in,width:1.5,dash:'6 5',n:4});
  a.note(-3.9,1.13,'S_W(f)=\\tfrac{N_0}{2}',{tex:true,fs:14,color:C.in});
  a.area(npH2,-4,4,{color:C.dec.out,n:400});
  a.curve(npH2,{color:C.out,width:2.6,n:600});
  a.note(1.0,0.45,'S_N(f)=\\tfrac{N_0}{2}|H(f)|^{2}',{tex:true,fs:14,color:C.out});
  return a.svg();
}

/* the ramp's output with the reversal (the matched filter) and without it */
const yRev=u=>{ const w=u<=1?u:2-u; return w<=0?0:1.5*w*w-0.5*w*w*w; };
const yUnrev=u=>u<=0?0:u<=1?0.5*u*u*u:u<=2?3*(u/2-1/3-u*(u-1)*(u-1)/2+Math.pow(u-1,3)/3):0;
function figNoReversal(){
  const a=ax1({h:230,xr:[-0.2,2.3],yr:[-0.12,1.3],xlabel:'t/T',ylabel:'y(t)/E',xticksOverride:[0,0.5,1,1.5,2],yticksOverride:[0.5,1]});
  a.curve(yRev,{color:C.mid,width:2.6,n:600});
  a.curve(yUnrev,{color:C.err,width:2.2,dash:'7 5',n:600});
  a.vline(1,{color:C.muted});
  a.point(1,1,{color:C.mid,r:5}); a.point(1,0.5,{color:C.err,r:5});
  a.note(1.06,1.14,'y(T)=E',{tex:true,fs:14,color:C.mid});
  a.note(0.42,0.62,'h=g:\\ y(T)=0.50E',{tex:true,fs:14,color:C.err,anchor:'end'});
  return a.svg();
}

/* the matched filter of the rectangular pulse with a gain k */
function figGain(k){
  const F=fpFilter(0);
  const a=ax2({xr:[-0.2,2.3],yr:[-0.9,2.6],xlabel:'t/T',ylabel:'y(t)',xticksOverride:[0,1,2],yticksOverride:[-0.5,0,1,2]});
  const pts=[], N=250;
  for(let i=0;i<=N;i++){ const t=-0.2+2.5*i/N; pts.push([a.sx(t),a.sy(k*(F.sig(t)+F.sd))]); }
  for(let i=N;i>=0;i--){ const t=-0.2+2.5*i/N; pts.push([a.sx(t),a.sy(k*(F.sig(t)-F.sd))]); }
  a.under(`<path d="M${pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join('L')}Z" fill="${C.noiseSoft}"/>`);
  a.curve(t=>k*(F.sig(t)+F.n(t)),{color:C.mid,width:1.2,opacity:0.4,n:900});
  a.curve(t=>k*F.sig(t),{color:C.mid,width:2.6,n:600});
  a.vline(1,{color:C.muted});
  a.point(1,k,{color:C.mid,r:5});
  return a.svg();
}

/* the matched filter of the ramp g(t) = sqrt(3) t/T (E = 1) in frequency:
   |H| = |G|, and the two phases with their sum -2 pi f T, as on the slide */
const rampG=f=>{ const w=2*Math.PI*f, r3=Math.sqrt(3);
  if(Math.abs(w)<1e-6) return [r3/2,-r3*w/3];
  const c=Math.cos(w), s=Math.sin(w); return [r3*(c+w*s-1)/(w*w), r3*(w*c-s)/(w*w)]; };
const MFF=(()=>{ const N=440, F=[], mag=[], ph=new Array(N+1);
  for(let i=0;i<=N;i++){ const f=-2.2+4.4*i/N, g=rampG(f); F.push(f); mag.push(Math.hypot(g[0],g[1])); ph[i]=Math.atan2(g[1],g[0]); }
  const c=N/2; ph[c]=0;
  for(let i=c+1;i<=N;i++){ let d=ph[i]-ph[i-1]; d-=2*Math.PI*Math.round(d/(2*Math.PI)); ph[i]=ph[i-1]+d; }
  for(let i=c-1;i>=0;i--){ let d=ph[i]-ph[i+1]; d-=2*Math.PI*Math.round(d/(2*Math.PI)); ph[i]=ph[i+1]+d; }
  return {F,mag,ph}; })();
function figMfMag(){
  const a=ax2({xr:[-2.2,2.2],yr:[0,1.12],xlabel:'fT',ylabel:'|G(f)|,\\;|H(f)|',xticksOverride:[-2,-1,0,1,2],yticksOverride:[0.5,1]});
  const {F,mag}=MFF;
  a.poly(F.map((x,i)=>[x,mag[i]]),{color:C.in,width:2.8});
  a.poly(F.map((x,i)=>[x,mag[i]]),{color:C.h,width:2.2,dash:'7 6'});
  return a.svg();
}
function figMfPhase(){
  const a=ax2({xr:[-2.2,2.2],yr:[-4.6,4.6],xlabel:'fT',ylabel:'\\text{phase}/\\pi',xticksOverride:[-2,-1,0,1,2],yticksOverride:[-4,-2,0,2,4]});
  const {F,ph}=MFF;
  a.poly(F.map((x,i)=>[x,ph[i]/Math.PI]),{color:C.in,width:2.4});
  a.poly(F.map((x,i)=>[x,(-ph[i]-2*Math.PI*x)/Math.PI]),{color:C.h,width:2.4,dash:'7 6'});
  a.curve(x=>-2*x,{color:C.mid,width:2.8,n:4});
  return a.svg();
}

/* the correlator output z(t)/E = (t/T)^3 for the noiseless ramp, dumped at T,
   against the matched-filter output y(t)/E */
function figMfCorr(){
  const a=ax1({h:230,xr:[-0.2,2.2],yr:[-0.15,1.35],xlabel:'t/T',ylabel:'\\text{output}/E',xticksOverride:[0,0.5,1,1.5,2],yticksOverride:[0.5,1]});
  a.curve(u=>u>=0&&u<=1?u*u*u:NaN,{color:C.mid,width:2.6,n:500});
  a.poly([[1,1],[1,0],[2.2,0]],{color:C.mid,width:1.6,dash:'3 4'});
  a.curve(yRev,{color:C.mid,width:2.2,dash:'8 6',n:600});
  a.point(0.5,0.125,{color:C.mid,r:4}); a.point(0.5,yRev(0.5),{color:C.mid,r:4}); a.point(1,1,{color:C.mid,r:5});
  a.note(0.44,0.42,'0.31E',{tex:true,fs:14,color:C.mid,anchor:'end'});
  a.note(0.6,0.06,'0.13E',{tex:true,fs:14,color:C.mid});
  a.note(1.06,1.18,'z(T)=y(T)=E',{tex:true,fs:14,color:C.mid});
  return a.svg();
}

/* the SNR at the sampling instant t0 for the rectangular pulse,
   eta(t0)/(2E/N0) = (1 - |t0 - T|/T)^2, with t0 = 1.1T marked */
function figSnrTiming(){
  const r=t=>Math.pow(Math.max(0,1-Math.abs(t-1)),2);
  const a=ax1({h:230,xr:[-0.2,2.2],yr:[-0.1,1.3],xlabel:'t_0/T',ylabel:'\\eta(t_0)\\,/\\,(2E/N_0)',xticksOverride:[0,0.5,1,1.5,2],yticksOverride:[0.5,1]});
  a.curve(r,{color:C.mid,width:2.6,n:500});
  a.vline(1.1,{color:C.ink,dash:'6 4',width:1.4,opacity:1});
  a.point(1.1,r(1.1),{color:C.mid,r:5});
  a.note(1.16,0.9,'0.81',{tex:true,fs:14,color:C.mid});
  return a.svg();
}

/* 5000 samples y(T) for each polar bit, k = 1, E = 1, N0 = 0.5, as
   densities on bins 0.2 wide, with the two Gaussian densities */
const SD_N1=gauss(20261015,5000,0.5), SD_N0=gauss(20261016,5000,0.5);
function figSampleDist(){
  const a=ax1({h:240,xr:[-3,3],yr:[-0.04,1.0],xlabel:'y(T)',ylabel:'\\text{density}',xticksOverride:[-2,-1,0,1,2],yticksOverride:[0.4,0.8],ytickfmt:()=>''});
  [[SD_N1,1,C.dec.mid],[SD_N0,-1,'none']].forEach(([z,m,fill])=>{ const c=new Array(30).fill(0);
    z.forEach(v=>{ const k=Math.floor((m+v+3)/0.2); if(k>=0&&k<30) c[k]++; });
    c.forEach((h,k)=>{ if(h) a.rect(-3+k*0.2,0,-3+(k+1)*0.2,h/(5000*0.2),{fill,stroke:C.mid,width:1}); }); });
  a.area(y=>dens(y,1,0.5),-3,0,{color:C.dec.err});
  a.curve(y=>dens(y,-1,0.5),{color:C.mid,width:2.4,dash:'8 5'});
  a.curve(y=>dens(y,1,0.5),{color:C.mid,width:2.6});
  return a.svg();
}

/* ---- 2.3 the demodulator ----------------------------------------------- */
/* The three unit-energy pulses of the section, T_b = 1, and the matched-filter
   output s_m R(t - T_b), tabulated exactly at multiples of 1/4. */
const PSI={rect:t=>(t>=0&&t<1)?1:0, man:t=>(t>=0&&t<1)?(t<0.5?1:-1):0,
  step:t=>(t>=0&&t<1)?(t<0.25||t>=0.5?1:-1):0};
const psiR=key=>{ const p=PSI[key], v=[];
  for(let k=-4;k<=4;k++){ let s=0; for(let q=0;q<4;q++){ const u=q/4+1/8; s+=p(u)*p(u+k/4); } v.push(s/4); }
  return s=>{ if(s<=-1||s>=1) return 0; const x=(s+1)*4, k=Math.min(7,Math.floor(x)), f=x-k; return (1-f)*v[k]+f*v[k+1]; }; };
const PSI_R={rect:psiR('rect'), man:psiR('man'), step:psiR('step')};
const rectPts=(h,x1=1.45)=>[[-0.3,0],[0,0],[0,h],[1,h],[1,0],[x1,0]];

function figBasisUnit(){
  const a=ax1({h:240,xr:[-0.3,1.45],yr:[-0.3,2.9],xlabel:'t/T_b',ylabel:'\\psi(t),\\;\\psi^{2}(t)',
    xticksOverride:[0,0.5,1],yticksOverride:[]});
  a.area(()=>2.25,0,1,{color:C.dec.mid});
  a.poly(rectPts(1.5),{color:C.h,width:2,dash:'6 5'});
  a.poly(rectPts(2.25),{color:C.mid,width:2.4});
  a.note(1.05,1.5,'\\psi(t)=1/\\sqrt{T_b}',{tex:true,fs:14,color:C.h});
  a.note(1.05,2.25,'\\psi^{2}(t)=1/T_b',{tex:true,fs:14,color:C.mid});
  a.note(0.5,0.9,'\\text{area}=1',{tex:true,fs:14,color:C.mid,anchor:'middle'});
  return a.svg();
}
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
  const a=ax2({xr:[-2,2],yr:[-1,1.2],xlabel:'\\text{axis of }\\psi(t)',
    xticksOverride:[],yticksOverride:[],grid:false,arrows:false,zeroAxes:false});
  a.poly([[-2,0],[2,0]],{color:C.axis,width:1.5});
  a.point(-1.4,0,{color:C.in,r:7}); a.point(1.4,0,{color:C.in,r:7});
  a.note(-1.4,-0.6,'s_0=-\\sqrt{E_b}',{tex:true,fs:14,color:C.in,anchor:'middle'});
  a.note(1.4,-0.6,'s_1=+\\sqrt{E_b}',{tex:true,fs:14,color:C.in,anchor:'middle'});
  a.span(-1.4,1.4,0.62,'d=2\\sqrt{E_b}',{tex:true,fs:14,color:C.muted});
  return a.svg();
}

/* The convolution of the matched-filter demodulator at t = T_b/2, rectangular
   psi, s_m = 1: the overlap is shaded above, and y(t) below is the triangle
   with the value 0.5 marked at that time. */
function figDemodConv(){
  const t=0.5, tri=s=>Math.max(0,1-Math.abs(s-1));
  const a=ax1({h:190,xr:[-1.2,2.3],yr:[-0.3,1.75],xlabel:'\\tau/T_b',ylabel:'s_m\\psi(\\tau),\\;h(t-\\tau)',
    xticksOverride:[-1,0,1,2],yticksOverride:[0,1]});
  a.area(()=>1,0,t,{color:C.dec.mid});
  a.poly([[-1.2,0],[0,0],[0,1],[1,1],[1,0],[2.3,0]],{color:C.in,width:2.4});
  a.poly([[-1.2,0],[t-1,0],[t-1,1],[t,1],[t,0],[2.3,0]],{color:C.h,width:2.2,dash:'7 5'});
  a.note(0.55,1.2,'s_m\\psi(\\tau)',{tex:true,fs:14,color:C.in,anchor:'middle'});
  a.note(t-0.95,1.5,'h(t-\\tau),\\ t=T_b/2',{tex:true,fs:14,color:C.h});
  const b=ax1({h:200,xr:[-1.2,2.3],yr:[-0.2,1.45],xlabel:'t/T_b',ylabel:'y(t)',
    xticksOverride:[-1,0,1,2],yticksOverride:[0,0.5,1]});
  b.curve(tri,{color:C.mid,width:2.6,n:700});
  b.vline(1,{color:C.muted});
  b.point(t,tri(t),{color:C.mid,r:5});
  b.note(t+0.08,tri(t)+0.1,'y(T_b/2)=0.5',{tex:true,fs:14,color:C.mid});
  return stack(700,[[a.svg(),190],[b.svg(),200]]);
}

const DM_W=noiseFn(30,0.04,0.75,-1,3);
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
  const N=600, yv=[]; for(let j=0;j<=200;j++){ const t=2*j/200; let s=0;
    for(let i=0;i<N;i++){ const u=(i+0.5)/N; if(u<=t && u>=t-1) s+=x(u); } yv.push([t,s/N]); }
  const a=P.Axes({w:700,h:250,xr:[-0.15,2.2],yr:[-1.4,3.0],xlabel:'t/T_b',ylabel:'x(t),\\;y(t)',
    pad:{l:56,r:22,t:24,b:42},xticksOverride:[0,0.5,1,1.5,2],yticksOverride:[-1,0,1,2]});
  a.curve(t=>t>=0&&t<=1?x(t):NaN,{color:C.out,width:1.3,n:900,opacity:0.5});
  a.poly([[-0.15,0],[0,0],[0,1],[1,1],[1,0],[2.2,0]],{color:C.in,width:2.2});
  a.poly([[-0.15,0],[0,0],[1,1],[2,0],[2.2,0]],{color:C.mid,width:1.6,dash:'6 5'});
  a.poly(yv,{color:C.mid,width:2.6});
  a.vline(1,{color:C.muted});
  a.point(1,1,{color:C.ink,r:3.5}); a.point(1,yv[100][1],{color:C.mid,r:5});
  a.poly([[1.07,1],[1.07,yv[100][1]]],{color:C.muted,width:2.4});
  a.note(1.06,2.35,`y(T_b)=s_m+n,\\;\\; n=${(yv[100][1]-1).toFixed(2)}`,{tex:true,fs:14,color:C.mid});
  return stack(700,[[top,124],[a.svg(),250]]);
}

/* The same noisy bit, the output split: signal part dashed, noise part
   grey, their sum violet. */
function figDemodSplit(){
  const x=t=>(t>=0&&t<=1)?1+DM_W(t):0, tri=s=>Math.max(0,1-Math.abs(s-1));
  const N=600, yv=[]; for(let j=0;j<=200;j++){ const t=2*j/200; let s=0;
    for(let i=0;i<N;i++){ const u=(i+0.5)/N; if(u<=t && u>=t-1) s+=x(u); } yv.push([t,s/N]); }
  const a=ax1({h:230,xr:[-0.15,2.2],yr:[-0.6,1.5],xlabel:'t/T_b',ylabel:'y(t)',
    xticksOverride:[0,1,2],yticksOverride:[0,0.5,1]});
  a.poly([[-0.15,0],[0,0],[1,1],[2,0],[2.2,0]],{color:C.mid,width:2,dash:'6 5'});
  a.poly(yv.map(p=>[p[0],p[1]-tri(p[0])]),{color:C.muted,width:1.8});
  a.poly(yv,{color:C.mid,width:2.6});
  a.note(1.1,1.08,'\\text{signal part},\\ y(t)',{tex:true,fs:14,color:C.mid});
  a.note(1.45,-0.42,'n(t)',{tex:true,fs:14,color:C.muted});
  return a.svg();
}

/* The noiseless matched-filter outputs of the three pulses with s_m = 1:
   rectangle solid, Manchester dashed, three steps dotted. All reach 1 at T_b. */
function figShapesOut(){
  const a=ax1({h:240,xr:[-0.2,2.2],yr:[-0.75,1.45],xlabel:'t/T_b',ylabel:'y(t)',
    xticksOverride:[0,1,2],yticksOverride:[-0.5,0,0.5,1]});
  a.curve(t=>PSI_R.rect(t-1),{color:C.mid,width:2.6,n:800});
  a.curve(t=>PSI_R.man(t-1),{color:C.mid,width:2.2,dash:'8 5',n:800});
  a.curve(t=>PSI_R.step(t-1),{color:C.mid,width:2.2,dash:'2 4',n:800});
  a.vline(1,{color:C.muted});
  a.point(1,1,{color:C.mid,r:5});
  a.note(1.08,1.2,'y(T_b)=s_m=1',{tex:true,fs:14,color:C.mid});
  return a.svg();
}

/* The ten-bit polar stream of the slide, with the same noise: the received
   x(t) above, and below the noiseless output y0(t) dashed, the noisy output
   y(t) and its samples at t = kT_b, with the bits read from their signs. */
const TR_B=[0,1,0,1,1,0,0,1,0,0], TR_W=noiseFn(20261020,0.02,1.8,-1,12);
function figTrain(){
  const g=t=>{ const k=Math.floor(t); return (k>=0&&k<10)?(TR_B[k]?1:-1):0; };
  const x=t=>g(t)+((t>=0&&t<10)?TR_W(t):0);
  const y0=[], y=[], dt=0.005;
  for(let j=0;j<=560;j++){ const t=j*0.02; let s0=0,s1=0;
    for(let i=0;i<200;i++){ const tau=t-1+(i+0.5)*dt; if(tau<0||tau>=10) continue; s0+=g(tau)*dt; s1+=x(tau)*dt; }
    y0.push([t,s0]); y.push([t,s1]); }
  const a=ax1({h:190,xr:[-0.3,10.8],yr:[-6,8.4],xlabel:'t/T_b',ylabel:'g(t),\\;x(t)',
    xticksOverride:[0,2,4,6,8,10],yticksOverride:[-4,0,4]});
  a.curve(x,{color:C.out,width:1,n:2400});
  a.curve(g,{color:C.in,width:2.2,n:2400});
  TR_B.forEach((bit,k)=>a.note(k+0.5,7.2,String(bit),{tex:true,fs:13,color:C.in,anchor:'middle'}));
  const b=ax1({h:220,xr:[-0.3,10.8],yr:[-2.0,2.4],xlabel:'t/T_b',ylabel:'y_0(t),\\;y(t)',
    xticksOverride:[0,2,4,6,8,10],yticksOverride:[-1,0,1]});
  b.hline(0,{color:C.muted,dash:'5 4'});
  b.poly(y0,{color:C.mid,width:1.8,dash:'6 4'});
  b.poly(y,{color:C.mid,width:2.2});
  for(let k=1;k<=10;k++){ const v=y[50*k][1]; b.point(k,v,{color:C.mid,r:4.5});
    b.note(k-0.5,2.05,v>0?'1':'0',{tex:true,fs:13,color:C.out,anchor:'middle'}); }
  return stack(700,[[a.svg(),190],[b.svg(),220]]);
}

/* Correlator against matched filter for one noiseless bit, s_m = 1: the
   filter output wide, the correlator dashed and reset at T_b. */
function figCorrMf(key='rect'){
  const lo=key==='rect'?-0.2:-0.75;
  const a=ax1({xr:[-0.15,2.2],yr:[lo,1.35],xlabel:'t/T_b',ylabel:'\\text{output}',xticksOverride:[0,0.5,1,1.5,2]});
  a.raw('<g opacity="0.45">');
  a.curve(t=>PSI_R[key](t-1),{color:C.mid,width:5,n:800});
  a.raw('</g>');
  a.poly([[-0.15,0],[0,0],[1,1],[1,0],[2.2,0]],{color:C.mid,width:2.2,dash:'7 5'});
  a.vline(1,{color:C.muted});
  a.point(1,1,{color:C.mid,r:5});
  a.note(1.05,1.16,'s_m=1',{tex:true,fs:14,color:C.mid});
  return a.svg();
}

/* The (t, u) square of the noise variance for the Manchester psi: the
   product psi(t) psi(u) is +1/T_b on the shaded squares and -1/T_b on the
   others; white noise leaves only the diagonal t = u, where it is psi^2. */
function figNoisePlane(stage){
  const a=ax2({w:420,h:320,xr:[-0.12,1.18],yr:[-0.12,1.3],xlabel:'t/T_b',ylabel:'u/T_b',
    xticksOverride:[0,0.5,1],yticksOverride:[0,0.5,1],grid:false});
  a.rect(0,0,0.5,0.5,{fill:C.dec.mid,stroke:C.mid,width:1.2});
  a.rect(0.5,0.5,1,1,{fill:C.dec.mid,stroke:C.mid,width:1.2});
  a.rect(0,0.5,0.5,1,{stroke:C.mid,width:1.2,dash:'4 4'});
  a.rect(0.5,0,1,0.5,{stroke:C.mid,width:1.2,dash:'4 4'});
  a.note(0.13,0.4,'+',{tex:true,fs:16,color:C.mid,anchor:'middle'});
  a.note(0.63,0.9,'+',{tex:true,fs:16,color:C.mid,anchor:'middle'});
  a.note(0.25,0.73,'-',{tex:true,fs:16,color:C.mid,anchor:'middle'});
  a.note(0.75,0.23,'-',{tex:true,fs:16,color:C.mid,anchor:'middle'});
  if(stage){ a.poly([[0,0],[1,1]],{color:C.mid,width:3});
    a.note(0.5,1.15,'t=u:\\ \\psi(t)\\psi(u)=\\psi^{2}(t)',{tex:true,fs:14,color:C.mid,anchor:'middle'}); }
  return a.svg();
}


/* Static states of the four extension slides: the stream sampled 0.25 T_b
   late, the correlator on 20 samples, 3000 measured noise values at N0 = 0.5,
   and the two orthogonal points with their noisy outputs. */
function figStreamTiming(){
  const g=t=>{ const k=Math.floor(t); return (k>=0&&k<10)?(TR_B[k]?1:-1):0; };
  const y0=t=>{ let s=0; for(let i=0;i<200;i++){ const tau=t-1+(i+0.5)/200; s+=g(tau)/200; } return s; };
  const a=ax1({h:260,xr:[-0.3,10.8],yr:[-2.0,2.4],xlabel:'t/T_b',ylabel:'y_0(t)',
    xticksOverride:[0,2,4,6,8,10],yticksOverride:[-1,0,1]});
  a.hline(0,{color:C.muted,dash:'5 4'});
  a.curve(y0,{color:C.mid,width:2.2,n:1100});
  for(let k=1;k<=10;k++){ a.poly([[k,-1.1],[k,1.45]],{color:C.muted,width:1,dash:'3 4'});
    a.point(k+0.25,y0(k+0.25),{color:C.mid,r:4.5});
    a.note(k-0.5,2.05,String(TR_B[k-1]),{tex:true,fs:13,color:C.in,anchor:'middle'}); }
  a.note(0.1,-1.7,'\\min_k s_k\\,y_0(kT_b+\\epsilon)=0.50',{tex:true,fs:14,color:C.mid});
  return a.svg();
}
function figCorrSamples(){
  const N=20, a=ax1({h:220,xr:[-0.1,1.25],yr:[-0.15,1.3],xlabel:'t/T_b',ylabel:'y(kT_s)',
    xticksOverride:[0,0.5,1],yticksOverride:[0,0.5,1]});
  a.poly([[0,0],[1,1]],{color:C.mid,width:1.6,dash:'6 5'});
  a.stem([...Array(N)].map((_,n)=>[(n+1)/N,(n+1)/N]),{color:C.mid});
  a.note(0.02,1.15,'N=20,\\;\\; T_s=T_b/20',{tex:true,fs:14,color:C.ink});
  return a.svg();
}
const NH=(()=>{ const M=40, dt=1/M, z=gauss(20261021,3000*M,1), out=[];
  for(let i=0;i<3000;i++){ let s=0; for(let j=0;j<M;j++){ const t=(j+0.5)*dt; s+=z[i*M+j]*Math.sqrt(1/dt)*(t<0.5?1:-1)*dt; } out.push(s); }
  return out; })();
function figNoiseHist(){
  const s=0.5, BW=0.1, LO=-2, O=3;
  const a=ax1({h:240,xr:[1,5],yr:[-0.04,1.0],xlabel:'n',ylabel:'\\text{density}',xticksOverride:[1,2,3,4,5],xtickfmt:x=>String(x-O),yticksOverride:[0.4,0.8]});
  const c=new Array(40).fill(0); NH.forEach(z=>{ const k=Math.floor((s*z-LO)/BW); if(k>=0&&k<40) c[k]++; });
  c.forEach((h,k)=>{ const d=h/(NH.length*BW); if(d<=0) return;
    const x=a.sx(O+LO+k*BW), w=a.sx(O+LO+(k+1)*BW)-x, y=a.sy(Math.min(d,1));
    a.raw(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${(a.sy(0)-y).toFixed(1)}" fill="${C.dec.mid}" stroke="${C.mid}" stroke-width="1"/>`); });
  a.curve(y=>dens(y-O,0,s),{color:C.mid,width:2.4,n:500});
  return a.svg();
}
const PP_Z=gauss(20261022,240,0.18);
function figPpm(){
  const r=Math.SQRT2;
  const a=ax1({h:300,xr:[-0.9,3.6],yr:[-0.7,2.1],xlabel:'y_1',ylabel:'y_2',
    xticksOverride:[0,1],yticksOverride:[0,1],xtickfmt:()=>'',ytickfmt:()=>''});
  for(let i=0;i<60;i++){ a.point(r+PP_Z[i],PP_Z[60+i],{color:C.out,r:2.4,ring:'none'}); a.point(PP_Z[120+i],r+PP_Z[180+i],{color:C.out,r:2.4,ring:'none'}); }
  a.point(r,0,{color:C.in,r:6.5}); a.point(0,r,{color:C.in,r:6.5});
  a.poly([[r,0],[0,r]],{color:C.muted,width:1.5,dash:'5 4'});
  a.note(r+0.3,0.4,'s_1=(\\sqrt{E_b},0)',{tex:true,fs:13,color:C.in});
  a.note(0.55,r+0.12,'s_2=(0,\\sqrt{E_b})',{tex:true,fs:13,color:C.in});
  a.note(0.85,0.85,'d=\\sqrt{2E_b}',{tex:true,fs:13,color:C.muted});
  return a.svg();
}

/* ---- 2.4 the decision and its error ------------------------------------- */
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

/* ---- 2.5 intersymbol interference ---------------------------------------
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

/* ---- 2.6 Nyquist and the raised cosine ----------------------------------
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

/* ---- 2.7 the link in practice ------------------------------------------- */
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

/* Single-panel figures keep one observation readable at lecture distance. */
function figMean(){
  const a=P.Axes(SZ({xr:[0,9],yr:[-3.5,4.1],xlabel:'t\\;(\\text{ms})',ylabel:'X(t)\\;(\\text{V})',xticksOverride:[0,2,4,6,8],yticksOverride:[-2,0,2]}));
  EN_P.forEach((x,i)=>a.curve(path(x,EN_DT,EN_T1),{color:C.in,width:i?1:2.5,n:700,opacity:i?0.3:1}));
  a.hline(0,{color:C.slate,dash:'6 5',width:2}); return a.svg();
}
function figAcfPairs(v){
  const tau=v&&v.tau!=null?v.tau:0.5, rho=Math.exp(-tau), s=Math.sqrt(1-rho*rho);
  const a=P.Axes(SZ({xr:[-3.3,3.3],yr:[-3.3,3.3],xlabel:'X(t)\\;(\\text{V})',ylabel:'X(t+\\tau)\\;(\\text{V})',xticksOverride:[-2,0,2],yticksOverride:[-2,0,2]}));
  AC_Z1.forEach((z,i)=>{const y=rho*z+s*AC_Z2[i];if(Math.abs(z)<3.25&&Math.abs(y)<3.25)a.point(z,y,{color:C.mid,r:2.8});});return a.svg();
}
function figAcfCurve(v){
  const tau=v&&v.tau!=null?v.tau:1;
  const a=P.Axes(SZ({xr:[-3.2,3.2],yr:[-0.08,1.4],xlabel:'\\tau\\;(\\text{ms})',ylabel:'R_X(\\tau)\\;(\\text{V}^{2})',xticksOverride:[-3,-2,-1,0,1,2,3],yticksOverride:[0.5,1]}));
  a.curve(t=>Math.exp(-Math.abs(t)),{color:C.mid,width:2.6,n:700});a.point(tau,Math.exp(-Math.abs(tau)),{color:C.mid,r:5});return a.svg();
}
function figPsdOnly(v){
  const tc=v&&v.tc!=null?v.tc:0.3, S=f=>2*tc/(1+(2*Math.PI*f*tc)**2);
  const a=P.Axes(SZ({xr:[-4,4],yr:[0,2.4],xlabel:'f\\;(\\text{kHz})',ylabel:'S_X(f)\\;(\\text{V}^{2}/\\text{kHz})',xticksOverride:[-4,-2,0,2,4],yticksOverride:[0.5,1,1.5,2]}));
  a.area(S,-4,4,{color:C.dec.in,n:600});a.curve(S,{color:C.in,width:2.6,n:700});return a.svg();
}
function figPowerArea(){
  const a=P.Axes(SZ({xr:[-7,7],yr:[0,1.6],xlabel:'f\\;(\\text{kHz})',ylabel:'S_X(f)\\;(\\text{W}/\\text{Hz})',xticksOverride:[-5,0,5],yticksOverride:[0.5,1],ytickfmt:v=>v+'×10⁻³'}));
  a.rect(-5,0,5,1,{fill:C.dec.in});a.poly([[-7,0],[-5,0],[-5,1],[5,1],[5,0],[7,0]],{color:C.in,width:2.6});return a.svg();
}
function figWhiteSpectrum(v){
  const B=v&&v.B!=null?v.B:2;
  const a=P.Axes(SZ({xr:[-5,5],yr:[0,1.6],xlabel:'f\\;(\\text{kHz})',ylabel:'S_W(f)/(N_0/2)',xticksOverride:[-4,-2,0,2,4],yticksOverride:[0.5,1]}));
  a.rect(-B,0,B,1,{fill:C.dec.in});a.poly([[-5,0],[-B,0],[-B,1],[B,1],[B,0],[5,0]],{color:C.in,width:2.6});return a.svg();
}
function figWhiteCorrelation(v){
  const B=v&&v.B!=null?v.B:2;
  const a=P.Axes(SZ({xr:[-1.2,1.2],yr:[-0.4,1.5],xlabel:'\\tau\\;(\\text{ms})',ylabel:'R_W(\\tau)/(N_0B)',xticksOverride:[-1,-0.5,0,0.5,1],yticksOverride:[0.5,1]}));
  a.curve(t=>sinc(2*B*t),{color:C.mid,width:2.6,n:1800});[-1/(2*B),1/(2*B)].forEach(t=>a.point(t,0,{color:C.mid,r:4.5}));return a.svg();
}
function figFilterSpectrum(v){
  const f=v&&v.frame!=null?v.frame:2, H2=x=>1/(1+x*x);
  const a=P.Axes(SZ({xr:[-5,5],yr:[0,1.7],xlabel:'f\\;(\\text{kHz})',ylabel:'S(f),\\;|H(f)|^{2}',xticksOverride:[-4,-2,0,2,4],yticksOverride:[0.5,1]}));
  a.curve(()=>0.5,{color:C.in,width:1.8,dash:'6 5',n:4});
  if(f>=1)a.curve(H2,{color:C.h,width:2.2,dash:'7 5',n:600});
  if(f>=2){a.area(x=>0.5*H2(x),-5,5,{color:C.dec.out,n:600});a.curve(x=>0.5*H2(x),{color:C.out,width:2.6,n:600});}return a.svg();
}
function figFilterTime(){
  const a=P.Axes(SZ({xr:[0,5],yr:[-3.2,3.2],xlabel:'t\\;(\\text{ms})',ylabel:'x(t),\\;y(t)',xticksOverride:[0,1,2,3,4,5],yticksOverride:[-2,0,2]}));
  a.curve(LT_X,{color:C.in,width:1.1,opacity:0.45,n:1000});a.curve(LT_Y,{color:C.out,width:2.6,n:800});return a.svg();
}
function figGaussianSample(){
  const sigma=2, d=x=>Math.exp(-x*x/(2*sigma*sigma))/(sigma*Math.sqrt(2*Math.PI));
  const a=P.Axes(SZ({xr:[-7,7],yr:[0,0.3],xlabel:'n\\;(\\text{mV})',ylabel:'f_n(n)\\;(\\text{mV}^{-1})',xticksOverride:[-4,-2,0,2,4,6],yticksOverride:[0.1,0.2]}));
  a.area(d,4,7,{color:C.dec.err,n:200});a.curve(d,{color:C.mid,width:2.6,n:700});a.poly([[4,0],[4,d(4)]],{color:C.err,width:2,dash:'5 4'});return a.svg();
}


function figOutputNoise(){
  const rc=0.5, bn=1/(4*rc), H2=f=>1/(1+Math.pow(2*Math.PI*f*rc,2));
  const a=P.Axes(SZ({xr:[-2,2],yr:[0,1.5],xlabel:'f\\;(\\text{kHz})',ylabel:'S(f)/(N_0/2)',xticksOverride:[-2,-1,0,1,2],yticksOverride:[0.5,1]}));
  a.curve(()=>1,{color:C.in,width:1.5,dash:'6 5',n:4});
  a.curve(H2,{color:C.h,width:2.2,dash:'7 5',n:700});
  a.area(H2,-2,2,{color:C.dec.out,n:600});a.curve(H2,{color:C.out,width:2.6,n:700});
  a.poly([[-bn,0],[-bn,1],[bn,1],[bn,0]],{color:C.slate,width:2.2,dash:'7 5'});
  a.note(0.62,1.12,'\\text{equal area}',{tex:true,fs:15,color:C.slate});
  return a.svg();
}

window.C2 = [

{t:'h1', num:'CHAPTER 2', text:'Baseband transmission of digital signals'},
{t:'p', lead:true, text:'Each bit is sent as one waveform. The channel adds noise, and the receiver filters, samples and decides. Noise is a random signal, so the chapter first describes random signals.'},
{t:'p', text:'The matched filter gives the largest peak SNR, $2E/N_0$. Only the pulse energy counts, not its shape. With polar signalling and equal priors, $P_b=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$. A channel narrower than $R_b/2$ cannot avoid intersymbol interference.'},

/* ================================================================ 2.1 === */
{t:'h2', num:'2.1', text:'Random signals'},


{t:'h3', text:'A random signal'},
{t:'p', text:'On each trial, send the same pulse and record the receiver noise. The pulse is fixed, but the noise waveform changes.'},
{t:'p', text:'A <b>random process</b> $X(t)$ assigns one waveform to each outcome. A waveform is a <b>sample function</b>. Their collection is the <b>ensemble</b>.'},
{t:'p', text:'Fix a time $t_0$ and compare trials. Each trial supplies one value of the random variable $X(t_0)$.'},
{t:'eqbox', cap:'At a fixed time', tex:'X(t_0)\\ \\text{has density}\\ f_{X(t_0)}(x)',
 after:'Reading a thousand trials at $t_0=5$ ms gives draws of this random variable. Reading one trial over time gives one waveform.'},
{t:'fig', svg:()=>figEnsemble(),cap:'One recording is a sample function. Values at the same time across recordings describe the random variable $X(t_0)$.'},

{t:'h3', text:'The ensemble mean'},
{t:'p', text:'At a fixed time, average the readings across trials. This defines the <b>ensemble mean</b>.'},
{t:'eqbox',cap:'Mean',tex:'\\mu_X(t)=E[X(t)]',
 after:'A zero ensemble mean allows positive and negative individual readings. Replacing this expectation with a time average requires additional assumptions, such as mean ergodicity.'},
{t:'fig',svg:()=>figMean(),cap:'The recordings fluctuate while their ensemble mean is zero. The dashed line represents the population mean, not an estimate from these eight traces.'},

{t:'h3', text:'Autocorrelation'},
{t:'p',text:'Take two readings from each trial, separated by $\\tau$. Average their products across trials to obtain the <b>autocorrelation</b>.'},
{t:'eqbox',cap:'Definition',tex:'R_X(t,t+\\tau)=E[X(t)X(t+\\tau)]',
 after:'For a zero-mean process, positive autocorrelation indicates a tendency toward the same sign. Negative autocorrelation indicates the opposite tendency. Magnitudes also affect the product.'},
{t:'p',text:'Autocorrelation is not generally a normalized correlation coefficient. For nonzero means, covariance subtracts the product of the means.'},
{t:'eqbox',cap:'Covariance',tex:'C_X(t,u)=R_X(t,u)-\\mu_X(t)\\mu_X(u)',
 after:'For zero-mean noise, covariance and autocorrelation are equal. Zero covariance alone does not imply independence unless additional conditions hold.'},
{t:'fig',svg:()=>figAcfPairs({tau:0.5}),cap:'Each dot contains two readings from one trial, separated by $0.5$ ms. The correlated cloud is elongated along the diagonal.'},

{t:'h3', text:'Reading the autocorrelation'},
{t:'p',text:'In this example, autocorrelation depends only on the time gap. Its characteristic time is $\\tau_c=1$ ms.'},
{t:'eqbox',cap:'Example',tex:'\\begin{aligned}R_X(\\tau)&=e^{-|\\tau|/\\tau_c}\\ \\text{V}^{2}\\\\R_X(1\\ \\text{ms})&=e^{-1}\\ \\text{V}^{2}\\\\&\\approx0.37\\ \\text{V}^{2}\\end{aligned}',
 after:'At zero gap, $R_X(0)=1\\ \\text{V}^{2}$. Increasing the gap reduces the relationship between the readings in this example.'},
{t:'fig',svg:()=>figAcfCurve({tau:1}),cap:'The autocorrelation at a gap of $1$ ms is $0.37\\ \\text{V}^{2}$. A nonzero gap can retain a nonzero correlation.'},

{t:'h3', text:'Wide-sense stationarity'},
{t:'p',text:'For <b>wide-sense stationarity</b> (WSS), the finite mean is constant and the finite autocorrelation depends only on the gap.'},
{t:'eqbox',cap:'WSS conditions',tex:'\\mu_X(t)=\\mu_X,\\qquad R_X(t,t+\\tau)=R_X(\\tau)',
 after:'Moving the observation window preserves these ensemble statistics. It does not preserve the readings of an individual waveform.'},
{t:'p',text:'A <b>strict-sense stationary</b> process preserves every joint distribution under a common shift of all observation times. With finite second moments, this implies WSS.'},
{t:'fig',svg:()=>figWssShift({t:1}),cap:'Three recordings read at $t=1$ ms and $t+\\tau=2$ ms. Moving both readings by the same shift changes the values, but for a WSS process their average product stays $R_X(1\\ \\text{ms})=0.37\\ \\text{V}^{2}$.'},

{t:'h3', text:'Strict-sense stationarity'},
{t:'p',text:'A <b>strict-sense stationary</b> (SSS) process keeps every joint distribution when all observation times move by the same shift $\\Delta$.'},
{t:'eqbox',cap:'Shift invariance',tex:'f_{X(t_1),\\ldots,X(t_n)}(x_1,\\ldots,x_n)=f_{X(t_1+\\Delta),\\ldots,X(t_n+\\Delta)}(x_1,\\ldots,x_n)',
 after:'Here $x_i$ is a value of $X(t_i)$. This holds for every $n$, every choice of times and every shift $\\Delta$. With finite second moments, SSS implies WSS.'},
{t:'fig',svg:()=>figSssShift({t:1}),cap:'Each dot holds two readings, at $t=1$ ms and $t+\\tau=2$ ms, from one of 300 recordings. Moving $t$ leaves the shape of the cloud unchanged. Two readings show only the first two orders of the joint distribution.'},

{t:'h3', text:'Autocorrelation and power'},
{t:'p',text:'At zero gap, each reading is multiplied by itself. Its expectation is the mean-square power $P_X$.'},
{t:'eqbox',cap:'Power',tex:'R_X(0)=E[X^2(t)]=P_X'},
{t:'p',text:'For a real WSS process, exchanging the two readings leaves their product unchanged. Set $s=t-\\tau$ to obtain symmetry.'},
{t:'eqbox',cap:'Even autocorrelation',tex:'R_X(-\\tau)=E[X(s+\\tau)X(s)]=R_X(\\tau)'},
{t:'p',text:'The mean square of a sum or difference is nonnegative. Expand the square using both signs.'},
{t:'eqbox',cap:'Bound',tex:'\\begin{aligned}E[(X(t)\\pm X(t+\\tau))^2]&=2R_X(0)\\pm2R_X(\\tau)\\ge0\\\\-R_X(0)\\le R_X(\\tau)&\\le R_X(0)\\\\|R_X(\\tau)|&\\le R_X(0)\\end{aligned}'},
{t:'p',text:'For $R_X(\\tau)=4e^{-|\\tau|/2}\\cos(2\\pi\\tau)\\ \\text{V}^{2}$, with $\\tau$ in ms, $P_X=4\\ \\text{V}^{2}$. Across $1\\ \\Omega$, that corresponds to $4$ W.'},
{t:'fig',svg:()=>figWss(),cap:'The real WSS autocorrelation is even, has value $4\\ \\text{V}^{2}$ at zero, and remains bounded by that magnitude.'},

{t:'h3',text:'Worked example: a sinusoid with a random phase'},
{t:'ex', hd:'Example 2.1 — a sinusoid with a random phase', rows:[
 ['Given','$X(t)=A\\cos(2\\pi f_0t+\\Theta)$ with $A=3$ V, $f_0=1$ kHz and $\\Theta$ uniform on $[0,2\\pi)$, so its density there is $1/(2\\pi)$.'],
 ['Find','The mean $\\mu_X$, the autocorrelation $R_X(\\tau)$ and the power $P_X$.'],
 ['Method','Average over the phase with its density. Turn the product of two cosines into a sum with $\\cos a\\cos b=\\tfrac12\\cos(a-b)+\\tfrac12\\cos(a+b)$.'],
 ['Solution','The mean is $\\mu_X=\\frac{1}{2\\pi}\\int_0^{2\\pi}A\\cos(2\\pi f_0t+\\theta)\\,d\\theta=0$, since a cosine integrates to zero over a full period of $\\theta$. With $\\phi=2\\pi f_0(2t+\\tau)$, $R_X=\\frac{A^{2}}{2}E\\bigl[\\cos(2\\pi f_0\\tau)\\bigr]+\\frac{A^{2}}{2}E\\bigl[\\cos(\\phi+2\\Theta)\\bigr]$. The second average is zero for the same reason. So $R_X(\\tau)=\\frac{A^{2}}{2}\\cos(2\\pi f_0\\tau)=4.5\\cos(2\\pi f_0\\tau)\\ \\text{V}^{2}$ and $P_X=R_X(0)=4.5\\ \\text{V}^{2}$.'],
 ['Check','The mean is constant and $R_X$ depends on $\\tau$ only, so the process is wide-sense stationary. The time average of one sample function, $A^{2}\\cos^{2}$ over a period, is also $A^{2}/2=4.5\\ \\text{V}^{2}$.']
]},
{t:'fig', svg:()=>figExPhase(),
 cap:'Example 2.1: one recording with $\\theta=3\\pi/2$. Its voltage varies with time, while the ensemble mean over the uniform phase is zero.'},
{t:'box', kind:'err', hd:'Common error', html:'Use $A^{2}/2$, not $A^{2}$, for the power of the sinusoid. Dropping the $\\tfrac12$ gives $9\\ \\text{V}^{2}$.'},


{t:'h3',text:'Power spectral density'},
{t:'p',text:'The <b>power spectral density</b> (PSD) describes power per unit frequency. For a WSS process, it is the Fourier transform of the autocorrelation.'},
{t:'eqbox',cap:'Wiener–Khinchin',tex:'S_X(f)=\\int_{-\\infty}^{\\infty}R_X(\\tau)e^{-j2\\pi f\\tau}\\,d\\tau',after:'For a real process, the PSD is real, even and nonnegative. Generalized Fourier transforms include spectral lines.'},
{t:'p',text:'For the exponential autocorrelation, symmetry cancels the odd sine term. Integrate the remaining cosine term.'},
{t:'eqbox',cap:'Correlation time and bandwidth',tex:'\\begin{aligned}S_X(f)&=2\\int_0^\\infty e^{-\\tau/\\tau_c}\\cos(2\\pi f\\tau)\\,d\\tau\\\\&=\\frac{2(1/\\tau_c)}{(1/\\tau_c)^2+(2\\pi f)^2}\\\\&=\\frac{2\\tau_c}{1+(2\\pi f\\tau_c)^2}\\end{aligned}',after:'Use $\\int_0^\\infty e^{-a\\tau}\\cos(b\\tau)d\\tau=a/(a^2+b^2)$ with $a=1/\\tau_c>0$. The half-power frequency is $1/(2\\pi\\tau_c)$.'},
{t:'fig',svg:()=>figPsdOnly({tc:0.3}),cap:'With $\\tau_c=0.3$ ms, the PSD spreads around zero frequency. Increasing the correlation time narrows the spectrum while preserving total power.'},

{t:'h3',text:'Power from the spectrum'},
{t:'p',text:'Set the time gap to zero in the inverse transform. The exponential becomes one, so the integral is the total power.'},
{t:'eqbox',cap:'Spectral area',tex:'\\begin{aligned}R_X(\\tau)&=\\int_{-\\infty}^{\\infty}S_X(f)e^{j2\\pi f\\tau}\\,df\\\\P_X=R_X(0)&=\\int_{-\\infty}^{\\infty}S_X(f)\\,df\\end{aligned}'},
{t:'p',text:'For $S_X(f)=10^{-3}$ W/Hz on $|f|<5$ kHz, integrate over both halves of the band.'},
{t:'eqbox',cap:'Rectangle area',tex:'\\begin{aligned}P_X&=\\int_{-5000}^{5000}10^{-3}\\,df\\\\&=[10^{-3}f]_{-5000}^{5000}\\\\&=10^{-3}(5000-(-5000))=10\\ \\text{W}\\end{aligned}'},
{t:'fig',svg:()=>figPowerArea(),cap:'The two-sided spectrum has height $10^{-3}$ W/Hz and total width $10$ kHz. Its area is $10$ W.'},

{t:'h3',text:'Noise in a finite band'},
{t:'p',text:'Begin with zero-mean noise having a flat two-sided density $N_0/2$ on $|f|<B$. The density is zero outside the band.'},
{t:'eqbox',cap:'Noise power',tex:'\\begin{aligned}P_w&=\\int_{-B}^{B}\\frac{N_0}{2}\\,df\\\\&=\\frac{N_0}{2}(B-(-B))=N_0B\\end{aligned}',after:'The band has total width $2B$. Doubling $B$ doubles the power when the density stays fixed.'},
{t:'fig',svg:()=>figWhiteSpectrum({B:2}),cap:'The flat spectrum occupies $|f|<2$ kHz. Both frequency halves contribute to the noise power.'},

{t:'h3',text:'Bandlimited noise samples'},
{t:'p',text:'Take the inverse transform of the finite-band spectrum. The result describes relationships between noise readings at different times.'},
{t:'eqbox',cap:'Autocorrelation',tex:'\\begin{aligned}R_w(\\tau)&=\\int_{-B}^{B}\\frac{N_0}{2}e^{j2\\pi f\\tau}\\,df\\\\&=\\frac{N_0}{2}\\frac{\\sin(2\\pi B\\tau)}{\\pi\\tau}\\\\&=N_0B\\operatorname{sinc}(2B\\tau)\\end{aligned}',after:'Here $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$ and $\\operatorname{sinc}(0)=1$. The value at zero follows by continuity.'},
{t:'p',text:'The zeros occur at $\\tau=k/(2B)$ for nonzero integer $k$. For $B=1$ MHz and $\\tau=0.5\\ \\mu$s, $2B\\tau=1$, so the samples are uncorrelated.'},
{t:'fig',svg:()=>figWhiteCorrelation({B:2}),cap:'At $B=2$ kHz, the first zeros are at $\\tau=\\pm0.25$ ms. Other nonzero gaps can retain correlation.'},

{t:'h3',text:'The white-noise model'},
{t:'p',text:'Ideal <b>white noise</b> extends the constant PSD over all frequencies. Its total power is infinite, so it is a generalized model.'},
{t:'eqbox',cap:'Ideal white noise',tex:'S_w(f)=\\frac{N_0}{2},\\qquad R_w(\\tau)=\\frac{N_0}{2}\\delta(\\tau)',after:'A constant spectrum transforms to an impulse in the generalized sense. Ideal white noise is defined through weighted integrals rather than finite-variance point samples.'},
{t:'box',kind:'warn',hd:'Finite receiver band',html:'At $300$ K, thermal noise stays within $10\\%$ of flat up to $10^{12}$ Hz. Practical receiver filtering admits finite noise power.'},
{t:'fig',svg:()=>figWhiteLimit({B:4}),cap:'At $B=4$ kHz the peak is $2B=8$ kHz and the lobe is narrow, while the area stays $1$. As $B$ grows without limit, $R_w(\\tau)/(N_0/2)$ tends to the impulse $\\delta(\\tau)$.'},

{t:'h3',text:'The mean through a filter'},
{t:'p',text:'An LTI filter weights delayed input values. For a WSS input, take the expectation inside the convolution integral.'},
{t:'eqbox',cap:'Mean',tex:'\\begin{aligned}\\mu_Y&=\\int_{-\\infty}^{\\infty}h(u)E[X(t-u)]\\,du\\\\&=\\mu_X\\int_{-\\infty}^{\\infty}h(u)\\,du\\\\&=\\mu_XH(0)\\end{aligned}',after:'Line 1: $E[\\cdot]$ is linear, and $h(u)$ is not random, so $E$ acts only on $X$. Line 2: for a WSS input $E[X(t-u)]=\\mu_X$ is constant, so it leaves the integral. Line 3: since $H(f)=\\int h(u)e^{-j2\\pi fu}du$, setting $f=0$ makes the exponential $1$, so $\\int h(u)\\,du=H(0)$, the DC gain. Assume these integrals and output statistics exist. An ideal differentiator removes a constant mean when its output is defined for the input process.'},
{t:'p',text:'For $\\mu_X=3$ V and $H(f)=j2\\pi f$, $\\mu_Y=3H(0)=0$.'},
{t:'fig',svg:()=>figFilterTime(),cap:'An illustrative input recording and its RC-filtered output. The filter smooths variations. Its DC gain determines the ensemble mean.'},

{t:'h3',text:'The spectrum through a filter'},
{t:'p',text:'For a real LTI filter and a WSS input, the output PSD follows from the input PSD and the filter.'},
{t:'p',text:'For receiver noise, use $X(t)=w(t)$ and $Y(t)=n(t)$. Thus $S_n(f)=|H(f)|^2S_w(f)$.'},
{t:'eqbox',cap:'Output spectrum',tex:'\\begin{aligned}S_Y(f)&=H(f)H^*(f)S_X(f)\\\\&=|H(f)|^2S_X(f)\\end{aligned}',after:'Assume the output statistics exist. A magnitude gain of $1/2$ gives a power gain of $1/4$.'},
{t:'fig',svg:()=>figFilterSpectrum({frame:2}),cap:'The output PSD equals the input PSD multiplied by $|H(f)|^2. The RC filter passes low frequencies more strongly than high frequencies.'},

{t:'h3',text:'Filtered white noise'},
{t:'p',text:'For white input, the output PSD is $(N_0/2)|H(f)|^2$. Its area is the output noise power.'},
{t:'eqbox',cap:'Output noise power',tex:'P_n=\\frac{N_0}{2}\\int_{-\\infty}^{\\infty}|H(f)|^2df',after:'A finite-energy filter admits finite noise power. Equal areas under the power gain give equal output noise powers.'},
{t:'fig',svg:()=>figOutputNoise(),cap:'The filter gain $|H(f)|^2$ shapes the flat input PSD. The area under the output PSD is the output noise power, and a rectangle of equal area gives the same power.'},

{t:'h3',text:'Noise-equivalent bandwidth'},
{t:'p',text:'Replace the power gain by a rectangle of equal peak and area. Both filters pass equal white-noise power.'},
{t:'eqbox',cap:'Definition',tex:'\\begin{aligned}B_{\\text{neq}}&=\\frac{\\int_{-\\infty}^{\\infty}|H(f)|^2df}{2H_{\\max}^2}\\\\P_n&=N_0B_{\\text{neq}}H_{\\max}^2\\end{aligned}',after:'$H_{\\max}=\\max_f|H(f)|$. The noise-equivalent bandwidth is the half-width of this ideal filter, whose total width is $2B_{\\text{neq}}$.'},
{t:'fig',svg:()=>figNoiseBwGen(0.5),cap:'A lowpass filter and the dashed ideal filter have equal peak gain and equal total spectral area, including tails beyond the plotted range.'},

{t:'h3',text:'Noise bandwidth of an RC filter'},
{t:'p',text:'The RC filter has $|H(f)|^2=1/[1+(2\\pi fRC)^2]$ and $H_{\\max}=1$. Substitute $u=2\\pi fRC$. The infinite limits remain infinite.'},
{t:'eqbox',cap:'RC lowpass',tex:'\\begin{aligned}\\int_{-\\infty}^{\\infty}|H(f)|^2df&=\\frac{1}{2\\pi RC}\\int_{-\\infty}^{\\infty}\\frac{du}{1+u^2}\\\\&=\\frac{1}{2\\pi RC}[\\arctan u]_{-\\infty}^{\\infty}\\\\&=\\frac{1}{2\\pi RC}(\\pi/2-(-\\pi/2))\\\\&=\\frac{1}{2RC}\\\\B_{\\text{neq}}&=\\frac{1}{4RC}\\end{aligned}',after:'The $3$ dB frequency is $1/(2\\pi RC)$. The equivalent bandwidth is $\\pi/2$ times this frequency.'},
{t:'ex', hd:'Example 2.2 — white noise through an RC filter', rows:[
 ['Given','White noise with $N_0/2=10^{-8}$ W/Hz enters an RC lowpass filter with $RC=1$ ms.'],
 ['Find','The noise-equivalent bandwidth $B_{\\text{neq}}$ and the output noise power $P_n$.'],
 ['Method','Use $B_{\\text{neq}}=1/(4RC)$ with $H_{\\max}=1$, then $P_n=N_0B_{\\text{neq}}$. The formula needs only the area of $|H(f)|^{2}$.'],
 ['Solution','$B_{\\text{neq}}=1/(4\\times10^{-3})=250$ Hz. With $N_0=2\\times10^{-8}$ W/Hz, $P_n=(2\\times10^{-8})(250)=5\\times10^{-6}$ W.'],
 ['Check','Work in time instead. The impulse response is $h(t)=\\frac{1}{RC}e^{-t/RC}$ for $t\\ge0$, so $\\int_0^{\\infty}h^{2}(t)\\,dt=\\frac{1}{R^{2}C^{2}}\\cdot\\frac{RC}{2}=\\frac{1}{2RC}=500\\ \\text{s}^{-1}$. By Parseval, $P_n=\\frac{N_0}{2}\\int h^{2}\\,dt=(10^{-8})(500)=5\\times10^{-6}$ W.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $B_{\\text{neq}}=1/(4RC)$, not the $3$ dB frequency $1/(2\\pi RC)$, for the noise power. The $3$ dB width gives $3.18\\times10^{-6}$ W, which is $\\pi/2$ too small.'},


{t:'h3',text:'Gaussian noise'},
{t:'p',text:'Draw $n$ independent random numbers, each flat on $[-1,1]$, and add them. Scale the sum by $\\sqrt{n/3}$ so its variance is $1$. Repeat many times and plot how often each value of $Z$ occurs.'},
{t:'p',text:'One source gives a flat box. Two give a triangle. Five already look like a bell. Thermal noise is a sum of a huge number of tiny independent motions, so it is Gaussian.'},
{t:'p',text:'White describes the PSD. Gaussian describes joint distributions. These properties are distinct. A linear filter preserves Gaussianity when the output variance is finite.'},
{t:'fig',svg:()=>figClt(),cap:'The sum of thirty independent uniform sources, scaled to unit variance, closely follows a Gaussian density.'},

{t:'h3',text:'From a noise waveform to one sample'},
{t:'p',text:'The filtered noise $n(t)$ is a random process. At the end of a bit of duration $T_b$, the receiver reads $n=n(T_b)$.'},
{t:'eqbox',cap:'Filtered white Gaussian noise',tex:'\\begin{aligned}n=n(T_b)&\\sim\\mathcal N(0,\\sigma_n^2)\\\\\\sigma_n^2=E[n^2]&=\\frac{N_0}{2}\\int_{-\\infty}^{\\infty}|H(f)|^2df\\end{aligned}',after:'For zero-mean noise, variance equals mean-square power. The filter sets the spread of the sample distribution.'},
{t:'p',text:'A sample above a threshold occupies a tail of the Gaussian density. Normalize the threshold by the standard deviation.'},
{t:'eqbox',cap:'Gaussian tail',tex:'\\begin{aligned}P(n>a)&=Q(a/\\sigma_n)\\\\P(n>4\\ \\text{mV})&=Q(4/2)=Q(2)\\approx0.0228\\end{aligned}',after:'Here $\\sigma_n=2$ mV. For a Gaussian $X$ with mean $\\mu$ and standard deviation $\\sigma$, $P(X>z)=Q\\bigl((z-\\mu)/\\sigma\\bigr)$. This noise sample will later enter the receiver decision statistic.'},
{t:'fig',svg:()=>figGaussianSample(),cap:'A zero-mean Gaussian sample with standard deviation $2$ mV. The shaded tail above $4$ mV has probability approximately $0.0228$.'},

{t:'h3', text:'Random signals around us'},
{t:'p', text:'Random signals appear in every resistor, in speech coders, in receiver noise floors and in scrambled data.'},
{t:'ul', items:[
 '<b>Thermal noise.</b> A $1\\ \\text{k}\\Omega$ resistor at $T=290$ K in a band $B=1$ MHz has $v_{\\mathrm{rms}}=\\sqrt{4kTRB}=4.0\\ \\mu$V.',
 '<b>Pitch.</b> A vowel is a sum of harmonics of its pitch $f_0$. A speech coder finds $f_0=125$ Hz where $R(\\tau)$ peaks again, at $T_0=8$ ms.',
 '<b>Noise floor.</b> At $T=290$ K, $N_0=kT=-174$ dBm/Hz. A $20$ MHz Wi-Fi channel collects $kTB=-101$ dBm.',
 '<b>Scrambled data.</b> The $15$-chip shift-register sequence $c[n]$ has $R[k]=\\tfrac{1}{15}\\sum_nc[n]\\,c[n+k]$ equal to $1$ at $k=0$ and $-1/15$ elsewhere, so it looks white.'
]},
{t:'box', kind:'warn', hd:'Bandwidth costs noise', html:'Noise power grows by $10$ dB for every factor of $10$ in bandwidth. So a receiver filters to the band of its signal.'},

/* ================================================================ 2.2 === */
{t:'h2', num:'2.2', text:'The matched filter'},

{t:'h3', text:'Additive Gaussian noise'},
{t:'p', text:'Each bit is sent as a pulse, $g(t)=+1$ or $-1$ for one bit time $T$. The channel adds noise $w(t)$ to it. The receiver sees the sum.'},
{t:'eqbox', cap:'Additive noise', tex:'x(t)=g(t)+w(t),\\qquad w(t)\\sim\\mathcal{N}(0,\\sigma^{2})',
 after:'At each instant the noise is a Gaussian value with mean $0$ and standard deviation $\\sigma$. Its size against the pulse decides how hard the bit is to read.'},
{t:'fig', svg:()=>figAwgn(),
 cap:'Five polar bits $g(t)=\\pm1$ (cyan) and the received $x(t)$ (green) at three noise levels, $\\sigma=0.1$, $0.5$ and $1$. The shaded band is $g(t)\\pm\\sigma$. The noise is one bandlimited Gaussian realisation, scaled by $\\sigma$.',
 short:'Five polar bits under noise of standard deviation 0.1, 0.5 and 1.'},
{t:'p', text:'Read $x(t)$ at one instant $t_0$ inside a $+1$ bit. The sample is Gaussian with mean $1$ and standard deviation $\\sigma$. It has the wrong sign when the noise is below $-1$.'},
{t:'eqbox', cap:'One sample of a $+1$ bit', tex:'P\\bigl(x(t_0)<0\\bigr)=P\\bigl(w(t_0)<-1\\bigr)=Q\\Bigl(\\frac{1}{\\sigma}\\Bigr)',
 after:'$Q(x)$ is the chance that a standard Gaussian value exceeds $x$: $Q(x)=\\int_x^{\\infty}\\tfrac{1}{\\sqrt{2\\pi}}e^{-u^2/2}\\,du$. For a Gaussian $X$ with mean $\\mu$ and standard deviation $\\sigma$, $P(X>z)=Q\\bigl((z-\\mu)/\\sigma\\bigr)$. At $\\sigma=0.1$ the chance is $Q(10)$, about $10^{-23}$. At $\\sigma=0.5$ it is $Q(2)=0.023$, and at $\\sigma=1$ it is $Q(1)=0.16$. At $\\sigma=0.25$ it is $Q(4)=3.2\\times10^{-5}$.'},
{t:'p', text:'One sample is a poor guide when $\\sigma$ is near the pulse height. The receiver should use the whole bit. A filter does that, and the rest of this section finds the best one.'},

{t:'h3', text:'Choosing the receive filter'},
{t:'p', text:'The receiver reads one number, $y(T)$, and decides the bit from it. The pulse puts a value there and the noise moves it. The receive filter $h(t)$ decides how far the noise moves it.'},
{t:'p', text:'The task of this section is to choose $h(t)$ so that the pulse part of $y(T)$ is as large as possible against the noise part.'},
{t:'fig', svg:()=>figFpInput(),
 cap:'One rectangular pulse $g(t)$ (cyan) on $[0,T]$, buried in white noise. The green line is the input $x(t)$.'},
{t:'p', text:'A first try is an RC lowpass filter. Its impulse response decays with the time constant $\\tau$. The output noise power is $\\frac{N_0}{2}\\int h^{2}(t)\\,dt$, the filtered white noise result of Section 2.1.'},
{t:'eqbox', cap:'An RC filter', tex:'\\begin{aligned}h(t)&=\\frac{1}{\\tau}\\,e^{-t/\\tau},\\qquad t\\ge0\\\\E[n^{2}]&=\\frac{N_0}{2}\\int_{0}^{\\infty}\\frac{e^{-2t/\\tau}}{\\tau^{2}}\\,dt=\\frac{N_0}{2}\\cdot\\frac{1}{2\\tau}=\\frac{N_0}{4\\tau}\\end{aligned}',
 after:'A small $\\tau$ passes a wide band of noise. For example, making $\\tau$ ten times smaller makes $E[n^{2}]$ ten times larger. A large $\\tau$ passes little noise, but it also smooths the pulse away.'},
{t:'figrow', n:3, items:[
 {svg:()=>figFpOut(0.1), cap:'RC, $\\tau=T/10$: the pulse passes, and so does much noise.'},
 {svg:()=>figFpOut(2), cap:'RC, $\\tau=2T$: little noise passes, and the pulse is smoothed away.'},
 {svg:()=>figFpOut(0), cap:'The matched filter: a clear peak at $t=T$, with $\\eta$ at its bound.'}
]},
{t:'p', text:'Each panel shows the signal part of the output (heavy line), a band one noise standard deviation wide around it, and one noisy output. The rest of this section finds the best filter and the best value $\\eta$ can take.'},

{t:'h3', text:'The receiver model'},
{t:'p', text:'One bit is sent as a pulse $g(t)$ on $0\\le t\\le T$. The channel adds noise $w(t)$. The receiver passes the sum through a linear filter $h(t)$ and samples the output once, at $t=T$.'},
{t:'fig', svg:()=>figReceiver(),
 cap:'The receiver model. One pulse $g(t)$ on $[0,T]$ plus white noise $w(t)$ enters a linear filter, and the output is sampled once, at $t=T$. The lower panel shows one pulse (cyan) and the same pulse with noise on it (green).'},
{t:'eqbox', cap:'Received signal', tex:'x(t)=g(t)+w(t),\\qquad 0\\le t\\le T',
 after:'$g(t)$ is the pulse of one bit. $w(t)$ is the noise the channel adds.'},
{t:'p', text:'The noise is white and Gaussian. White means that its power spectral density is flat. Its autocorrelation is then an impulse, so noise values at two different times are uncorrelated.'},
{t:'eqbox', cap:'White noise', tex:'\\begin{aligned}S_W(f)&=\\frac{N_0}{2}\\quad\\text{for all }f\\\\R_W(\\tau)&=\\frac{N_0}{2}\\,\\delta(\\tau),\\qquad N_0=k_BT_e\\end{aligned}',
 after:'The density is two-sided: it is $N_0/2$ at every positive and every negative frequency. $k_B=1.38\\times10^{-23}$ J/K is Boltzmann\'s constant and $T_e$ is the noise temperature of the receiver in kelvin. The subscript $B$ keeps $k_B$ apart from the filter gain $k$ used below.'},
{t:'p', text:'For example, $T_e=290$ K gives $N_0=k_BT_e=(1.38\\times10^{-23})(290)=4.0\\times10^{-21}$ W/Hz. The two-sided density is then $N_0/2=2.0\\times10^{-21}$ W/Hz.'},

{t:'h3', text:'Signal part and noise part'},
{t:'p', text:'The filter is linear. So each part of the input passes through it on its own, and the output is the sum of two outputs.'},
{t:'eqbox', cap:'Two parts', tex:'y(t)=x(t)*h(t)=\\underbrace{g(t)*h(t)}_{g_0(t)}+\\underbrace{w(t)*h(t)}_{n(t)}',
 after:'The <b>signal part</b> $g_0(t)$ is the output for the pulse alone. It is the same every time the bit is sent. The <b>noise part</b> $n(t)$ is the output for the noise alone, and it is random.'},
{t:'fig', svg:()=>figSplit(),
 cap:'The noisy pulse through an RC filter with $\\tau=T/4$. Left: the signal part $g_0(t)$ (violet) and the noise part $n(t)$ alone (grey), with a band one standard deviation wide. Right: their sum $y(t)$. At $t=T$ the noise moves the sample away from $g_0(T)$ by $n(T)$.',
 short:'The filter output split into its signal part and its noise part.'},
{t:'p', text:'The noise part never vanishes. The filter cannot tell noise from pulse in the band the pulse uses. A filter with $g_0(T)\\neq0$ must have $H(f)\\neq0$ where $G(f)\\neq0$, and white noise has power at those frequencies. So the filter can only make $n(T)$ small against $g_0(T)$, never zero.'},

{t:'h3', text:'The peak pulse signal-to-noise ratio'},
{t:'p', text:'The receiver reads one value, at $t=T$. The quality of that value is the signal power there against the noise power there.'},
{t:'eqbox', cap:'Peak pulse SNR', tex:'\\eta=\\frac{|g_0(T)|^{2}}{E[n^{2}(T)]}',
 after:'The ratio $\\eta$ is the <b>peak pulse signal-to-noise ratio</b>. For example, $g_0(T)=2$ mV and $E[n^{2}(T)]=10^{-6}\\ \\text{V}^{2}$ give $\\eta=(2\\times10^{-3})^{2}/10^{-6}=4$.'},
{t:'p', text:'The instant $T$ is chosen where the signal part is largest. The signal part rises while the pulse enters the filter and falls after the pulse has passed. So it peaks at $t=T$, the end of the pulse.'},
{t:'p', text:'Convolution in time is a product in frequency. Take the inverse transform of that product and read it at $t=T$.'},
{t:'eqbox', cap:'Signal part in $f$', tex:'\\begin{aligned}G_0(f)&=G(f)\\,H(f)\\\\g_0(t)&=\\int_{-\\infty}^{\\infty}G(f)\\,H(f)\\,e^{j2\\pi ft}\\,df\\\\g_0(T)&=\\int_{-\\infty}^{\\infty}G(f)\\,H(f)\\,e^{j2\\pi fT}\\,df\\end{aligned}'},
{t:'p', text:'For the RC filter and the rectangular pulse, $g_0(T)=1-e^{-T/\\tau}$ and $E[n^{2}]=N_0/(4\\tau)$, with $E=T$. Divide one by the other and write $x=T/\\tau$.'},
{t:'eq', tex:'\\frac{\\eta}{2E/N_0}=\\frac{(1-e^{-x})^{2}}{N_0/(4\\tau)}\\cdot\\frac{N_0}{2T}=\\frac{2\\,(1-e^{-x})^{2}}{x}'},
{t:'p', text:'This ratio is largest at $x=T/\\tau\\approx1.26$, where it is $0.81$. So the best RC filter stays $0.9$ dB below the bound $2E/N_0$ derived below.'},
{t:'fig', svg:()=>figSnr(RC_BEST),
 cap:'The RC filter at its best, $T/\\tau=1.26$. Above: the signal part $g_0(t)$, a band one noise standard deviation wide, and one noisy output. Below: $\\eta$ as a fraction of $2E/N_0$ against $T/\\tau$. No RC filter passes $0.81$.'},

{t:'h3', text:'The output noise power'},
{t:'p', text:'A filter multiplies a power spectral density by $|H(f)|^{2}$. White noise has the same density $N_0/2$ at every frequency.'},
{t:'eqbox', cap:'Step 1 · filtered density', tex:'S_N(f)=S_W(f)\\,|H(f)|^{2}=\\frac{N_0}{2}\\,|H(f)|^{2}'},
{t:'p', text:'The power of a random signal is the area under its density. The noise part is stationary, so its power is the same at every $t$, and it is also $E[n^{2}(T)]$.'},
{t:'eqbox', cap:'Step 2 · noise power', tex:'E[n^{2}(t)]=\\int_{-\\infty}^{\\infty}S_N(f)\\,df=\\frac{N_0}{2}\\int_{-\\infty}^{\\infty}|H(f)|^{2}\\,df',
 after:'For the RC filter the area is $N_0/(4\\tau)$, which is $N_0/T$ at $\\tau=T/4$. For an ideal lowpass filter with $|H(f)|=1$ for $|f|<B$ the area is $\\frac{N_0}{2}\\cdot2B=N_0B$. For example, $B=1$ kHz and $N_0=2\\times10^{-9}$ W/Hz give $2\\times10^{-6}$ W.'},
{t:'fig', svg:()=>figNoisePower(),
 cap:'White noise of density $N_0/2$ (cyan, dashed) through an RC filter with $\\tau=T/4$. The output density $S_N(f)$ (green) is the input density times $|H(f)|^{2}$. The shaded area is the output noise power. The tails beyond $|f|=4/T$ hold the last tenth of it.',
 short:'The output noise density of an RC filter and the area under it.'},
{t:'p', text:'Both parts of $\\eta$ are now in the frequency domain. Put them into one fraction.'},
{t:'eqbox', cap:'The problem', tex:'\\eta=\\frac{\\Bigl|\\int G(f)\\,H(f)\\,e^{j2\\pi fT}\\,df\\Bigr|^{2}}{\\frac{N_0}{2}\\int|H(f)|^{2}\\,df}',
 after:'For a given pulse spectrum $G(f)$, find the $H(f)$ that makes $\\eta$ largest. The top wants $H$ large where $G$ is large. The bottom charges for every hertz $H$ passes.'},

{t:'h3', text:'Schwarz\'s inequality'},
{t:'p', text:'Schwarz\'s inequality bounds $\\eta$. It holds for any pair of functions.'},
{t:'eqbox', cap:'Schwarz\'s inequality', tex:'\\Bigl|\\int\\phi_1(f)\\,\\phi_2(f)\\,df\\Bigr|^{2}\\le\\int|\\phi_1(f)|^{2}\\,df\\int|\\phi_2(f)|^{2}\\,df',
 after:'Both functions must have finite energy. The square is on the magnitude of the whole integral, not inside it. Equality holds only when $\\phi_1(f)=k\\,\\phi_2^{*}(f)$ for a constant $k$.'},
{t:'p', text:'Take $\\phi_1=H(f)$ and $\\phi_2=G(f)\\,e^{j2\\pi fT}$. The left side is then $|g_0(T)|^{2}$. Since $|e^{j2\\pi fT}|=1$, the right side is $\\int|H(f)|^{2}df\\int|G(f)|^{2}df$.'},
{t:'eqbox', cap:'Apply it to $g_0(T)$', tex:'\\begin{aligned}|g_0(T)|^{2}&=\\Bigl|\\int H(f)\\,G(f)\\,e^{j2\\pi fT}\\,df\\Bigr|^{2}\\\\&\\le\\int|H(f)|^{2}df\\int|G(f)|^{2}df\\end{aligned}'},
{t:'fig', svg:()=>figSchwarz(2),
 cap:'The signal spectrum $|G(f)|$ (cyan) and a filter $|H(f)|$ (amber, dashed) of twice its width, $b=2$. The shaded overlap sets the SNR, here $0.80$ of the bound. A wider $|H|$ passes noise where the pulse has no energy, and a narrower one cuts the pulse.'},
{t:'p', text:'A gain on the filter changes nothing. If $H(f)$ becomes $3H(f)$, then $|g_0(T)|^{2}$ and $E[n^{2}(T)]$ both grow $9$ times, so $\\eta$ stays the same. Only the shape of $H$ matters.'},

{t:'h3', text:'The bound on the output SNR'},
{t:'p', text:'Write $\\eta$ with the noise power in the frequency domain. Put Schwarz\'s bound on the top.'},
{t:'eqbox', cap:'The bound', tex:'\\begin{aligned}\\eta&=\\frac{|g_0(T)|^{2}}{\\frac{N_0}{2}\\int|H(f)|^{2}df}\\\\&\\le\\frac{\\int|H(f)|^{2}df\\int|G(f)|^{2}df}{\\frac{N_0}{2}\\int|H(f)|^{2}df}\\\\&=\\frac{2}{N_0}\\int|G(f)|^{2}\\,df=\\frac{2E}{N_0}\\end{aligned}',
 after:'The factor $\\int|H(f)|^{2}df$ is above and below the line, so it cancels. Parseval\'s theorem gives $\\int|G(f)|^{2}df=E$, the pulse energy, so the bound contains no $H$. It depends on the energy of the pulse, not on its shape. For example, $E=5\\times10^{-7}$ J and $N_0=10^{-7}$ W/Hz give $\\eta_{\\max}=2(5\\times10^{-7})/10^{-7}=10$.'},
{t:'p', text:'The bound is reached when Schwarz\'s inequality holds with equality. Put $\\phi_1=H(f)$ and $\\phi_2=G(f)e^{j2\\pi fT}$ into $\\phi_1=k\\phi_2^{*}$.'},
{t:'eqbox', cap:'The equality condition', tex:'H_{\\mathrm{opt}}(f)=k\\,\\phi_2^{*}(f)=k\\,G^{*}(f)\\,e^{-j2\\pi fT}',
 after:'The conjugate of $e^{j2\\pi fT}$ is $e^{-j2\\pi fT}$, and $k$ is the constant of the equality condition. The best filter passes most where the pulse spectrum is largest.'},
{t:'fig', svg:()=>figBoundCurve(),
 cap:'The SNR of the filter of width $b$ as a fraction of the bound, $2b/(1+b^{2})$. It is $0.80$ at $b=1/2$ and at $b=2$, and it reaches $1$ only at $b=1$.'},

{t:'h3', text:'The matched filter'},
{t:'p', text:'The impulse response is the inverse transform of $H_{\\mathrm{opt}}(f)$. It takes three steps. First substitute $H_{\\mathrm{opt}}$ and join the two exponentials.'},
{t:'eqbox', cap:'Step 1 · inverse transform', tex:'\\begin{aligned}h_{\\mathrm{opt}}(t)&=\\int_{-\\infty}^{\\infty}H_{\\mathrm{opt}}(f)\\,e^{j2\\pi ft}\\,df\\\\&=k\\int_{-\\infty}^{\\infty}G^{*}(f)\\,e^{j2\\pi f(t-T)}\\,df\\end{aligned}'},
{t:'p', text:'Second, use that the pulse is real. Conjugation in time gives $g^{*}(t)\\leftrightarrow G^{*}(-f)$. A real pulse has $g=g^{*}$, so $G(f)=G^{*}(-f)$. Take the conjugate of both sides.'},
{t:'eqbox', cap:'Step 2 · a real pulse', tex:'\\begin{aligned}g(t)=g^{*}(t)\\;&\\Rightarrow\\;G(f)=G^{*}(-f)\\\\&\\Rightarrow\\;G^{*}(f)=G(-f)\\end{aligned}'},
{t:'p', text:'Third, use time reversal, $g(-s)\\leftrightarrow G(-f)$. Its inverse transform reads $g(-s)=\\int G(-f)\\,e^{j2\\pi fs}\\,df$. Here the exponent is $j2\\pi f(t-T)$, so $s=t-T$.'},
{t:'eqbox', cap:'Step 3 · reverse and shift', tex:'\\begin{aligned}h_{\\mathrm{opt}}(t)&=k\\int_{-\\infty}^{\\infty}G(-f)\\,e^{j2\\pi f(t-T)}\\,df\\\\&=k\\,g\\bigl(-(t-T)\\bigr)=k\\,g(T-t)\\end{aligned}',
 after:'The filter is the pulse reversed in time and shifted right by $T$. It is called the <b>matched filter</b>. For example, the ramp $g(t)=t/T$ on $0\\le t\\le T$ with $k=1$ has $h_{\\mathrm{opt}}(0)=g(T-0)=g(T)=1$.'},
{t:'fig', svg:()=>figMatchedBuild(),
 cap:'The matched filter of the ramp $g(t)=t/T$, built in two moves. The ramp (cyan) is reversed in time to $g(-t)$ (amber, dashed), then shifted right by $T$ to $h(t)=g(T-t)$ (amber).'},

{t:'h3', text:'The matched filter in frequency'},
{t:'p', text:'The same filter can be read in frequency. Take the magnitude and the phase of $H_{\\mathrm{opt}}(f)$ one at a time.'},
{t:'eqbox', cap:'Magnitude and phase', tex:'\\begin{aligned}H(f)&=k\\,G^{*}(f)\\,e^{-j2\\pi fT}\\\\|H(f)|&=k\\,|G(f)|\\\\\\angle H(f)&=-\\angle G(f)-2\\pi fT\\end{aligned}',
 after:'The magnitude response has the shape of the pulse spectrum. The filter passes the band where the pulse has energy and weights each frequency by $|G(f)|$. Where $G(f_1)=0$, also $|H(f_1)|=0$: the pulse has nothing there, so the filter lets no noise through.'},
{t:'p', text:'Now pass the pulse through the filter. Multiply the two spectra.'},
{t:'eqbox', cap:'The output spectrum', tex:'Y(f)=G(f)\\,H(f)=k\\,|G(f)|^{2}\\,e^{-j2\\pi fT}',
 after:'The phase $-\\angle G$ of the filter cancels the phase of the pulse. Only the linear phase $-2\\pi fT$, a delay of $T$, is left. Every frequency component of $y(t)$ is a cosine of non-negative amplitude that peaks at $t=T$, so they all add there.'},
{t:'figrow', n:2, items:[
 {svg:()=>figMfMag(), cap:'The magnitudes for the ramp $g(t)=\\sqrt{3}\\,t/T$ with $E=1$ and $k=1$. $|G(f)|$ (cyan) and $|H(f)|$ (amber, dashed) lie on each other.'},
 {svg:()=>figMfPhase(), cap:'The phases over $\\pi$: $\\angle G$ (cyan), $\\angle H$ (amber, dashed) and their sum $-2\\pi fT$ (violet), a straight line.'}
]},

{t:'h3', text:'The output of the matched filter'},
{t:'p', text:'The matched-filter output is a sliding product. Write it as a convolution and substitute $h(t)=g(T-t)$, so that $h(t-\\tau)=g(T-t+\\tau)$. That is the pulse itself, moved to start at $t-T$. For each $t$, multiply the two curves and take the area of the product.'},
{t:'eqbox', cap:'Convolution', tex:'\\begin{aligned}y(t)&=\\int_{-\\infty}^{\\infty}g(\\tau)\\,h(t-\\tau)\\,d\\tau\\\\&=\\int_{-\\infty}^{\\infty}g(\\tau)\\,g(T-t+\\tau)\\,d\\tau\\end{aligned}'},
{t:'p', text:'Convolution reverses $h$ once more. Because $h$ was already the reversed pulse, at $t=T$ the copy lies exactly on $g$. Every product is then $g^{2}\\ge0$, nothing cancels, and the area is the energy.'},
{t:'eqbox', cap:'The peak', tex:'y(T)=\\int_{-\\infty}^{\\infty}g^{2}(\\tau)\\,d\\tau=E'},
{t:'p', text:'For the ramp $g(t)=t/T$, take $T=1$, so $E=1/3$. For $0\\le t\\le1$ the copies overlap on $0\\le\\tau\\le t$.'},
{t:'eq', tex:'\\begin{aligned}y(t)&=\\int_{0}^{t}\\tau\\,(1-t+\\tau)\\,d\\tau\\\\&=\\frac{(1-t)\\,t^{2}}{2}+\\frac{t^{3}}{3}\\end{aligned}'},
{t:'p', text:'At $t=1/2$ this is $1/16+1/24=5/48$, so $y(T/2)=(5/48)/(1/3)\\,E=0.31E$. The output is even about $t=T$: $y(T+u)=\\int g(\\tau)g(\\tau-u)\\,d\\tau$, and the shift $\\tau\\to\\tau+u$ turns it into $y(T-u)$. So $y(3T/2)=0.31E$ as well.'},
{t:'figrow', n:2, items:[
 {svg:()=>figConvTop(), cap:'The overlap at $t=T/2$. The ramp $g(\\tau)$ (cyan) and the copy $h(t-\\tau)$ (amber, dashed). The shaded area is their product.'},
 {svg:()=>figConvBottom(), cap:'The output $y(t)/E$, the area of that product, drawn up to $t=T/2$. The dashed rest is even about $t=T$ and peaks at $y(T)=E$.'}
]},
{t:'p', text:'Leave out the reversal and use $h=g$. At $t=T$ the copy is $g(T-\\tau)=1-\\tau$, which runs the wrong way. The product is $\\tau(1-\\tau)$ and its area is $1/6=0.50E$. The output of $h=g$ peaks at $2(\\sqrt2-1)E=0.83E$, at $t=\\sqrt2\\,T$, and never reaches $E$.'},
{t:'fig', svg:()=>figNoReversal(),
 cap:'The ramp through its matched filter (violet) and through $h=g$, the filter without the reversal (red, dashed). Only the matched filter reaches $E$, and it does so at $t=T$.',
 short:'The ramp output with and without the reversal.'},
{t:'p', text:'The sampling instant follows. The output is largest at $t=T$, where the copies line up. The noise power is the same at every $t$. So $\\eta$ is largest at $t=T$, the first instant the whole pulse is inside the filter.'},

{t:'h3', text:'The correlator'},
{t:'p', text:'Only the sample at $t=T$ is used. Write that sample with $h(t)=g(T-t)$. The argument of $h$ is $T-\\tau$, so $h(T-\\tau)=g\\bigl(T-(T-\\tau)\\bigr)=g(\\tau)$.'},
{t:'eqbox', cap:'The sample at $t=T$', tex:'\\begin{aligned}y(T)&=\\int_{-\\infty}^{\\infty}x(\\tau)\\,h(T-\\tau)\\,d\\tau\\\\&=\\int_{0}^{T}x(\\tau)\\,g(\\tau)\\,d\\tau\\end{aligned}',
 after:'At $t=T$ the reversal is undone. The sample is the input multiplied by the pulse and integrated over the bit. A receiver that does this is a <b>correlator</b>.'},
{t:'p', text:'The correlator starts at the start of each bit, is read at $t=T$ and is then reset to zero. This is called integrate and dump. It needs the bit timing, as the matched filter does for its sampling instant.'},
{t:'p', text:'The two outputs are equal only at $t=T$. For the ramp $g(t)=t/T$ with no noise, the correlator gives $z(t)=\\int_0^t g^{2}\\,d\\tau=(t/T)^{3}E$. So $z(T/2)=E/8=0.13E$, while the matched filter gives $y(T/2)=0.31E$.'},
{t:'fig', svg:()=>figMfCorr(),
 cap:'The noiseless ramp through a correlator, $z(t)$ (solid, reset at $t=T$), and through its matched filter, $y(t)$ (dashed). The two differ before $T$ and agree at $t=T$, where both are $E$.',
 short:'The correlator and the matched filter for the ramp.'},

{t:'h3', text:'Properties of the matched filter'},
{t:'p', text:'Keep the gain $k$ and compute both parts of $\\eta$ for the matched filter. First the signal part at $t=T$.'},
{t:'eqbox', cap:'Step 1 · signal at $t=T$', tex:'\\begin{aligned}g_0(T)&=\\int_{-\\infty}^{\\infty}G(f)\\,H(f)\\,e^{j2\\pi fT}\\,df\\\\&=k\\int_{-\\infty}^{\\infty}G(f)\\,G^{*}(f)\\,e^{-j2\\pi fT}e^{j2\\pi fT}\\,df\\\\&=k\\int_{-\\infty}^{\\infty}|G(f)|^{2}\\,df=kE\\end{aligned}',
 after:'The two exponentials cancel and $GG^{*}=|G|^{2}$. Parseval\'s theorem turns the last integral into the energy $E$.'},
{t:'p', text:'Then the noise power. Use $|e^{-j2\\pi fT}|=1$.'},
{t:'eqbox', cap:'Step 2 · noise power', tex:'\\begin{aligned}E[n^{2}(t)]&=\\frac{N_0}{2}\\int_{-\\infty}^{\\infty}\\bigl|k\\,G^{*}(f)\\,e^{-j2\\pi fT}\\bigr|^{2}\\,df\\\\&=\\frac{k^{2}N_0}{2}\\int_{-\\infty}^{\\infty}|G(f)|^{2}\\,df=\\frac{k^{2}N_0E}{2}\\end{aligned}',
 after:'The noise power is not zero. The matched filter keeps the noise that shares the band of the pulse.'},
{t:'p', text:'The signal part grows as $k$ and the noise power as $k^{2}$, so the noise standard deviation grows as $k$. Doubling $k$ doubles both $g_0(T)$ and the noise standard deviation. In $\\eta$ the factor $k^{2}$ cancels, so every gain gives the same SNR.'},
{t:'figrow', n:2, items:[
 {svg:()=>figGain(0.5), cap:'The matched filter of the noisy rectangular pulse with $k=0.5$. The signal part peaks at $kE$, and the band is one noise standard deviation wide.'},
 {svg:()=>figGain(2), cap:'The same filter with $k=2$. Every part is four times larger than at $k=0.5$, so $\\eta$ is the same, $25$ for $E=1$ and $N_0=0.08$.'}
]},

{t:'h3', text:'The output SNR of the matched filter'},
{t:'p', text:'Divide the square of the signal part by the noise power.'},
{t:'eqbox', cap:'Key result · peak SNR', tex:'\\begin{aligned}\\eta&=\\frac{|g_0(T)|^{2}}{E[n^{2}(T)]}=\\frac{(kE)^{2}}{k^{2}N_0E/2}\\\\&=\\frac{2E}{N_0}\\end{aligned}',
 after:'The gain $k$ cancels. The matched filter reaches the bound, and the SNR depends on the pulse energy and on $N_0$, not on the shape of $g(t)$.'},
{t:'p', text:'The ratio $E/N_0$ compares the energy of the pulse with the spectral density of the noise. It has no unit.'},
{t:'eqbox', cap:'Units', tex:'\\frac{E}{N_0}:\\quad\\frac{\\text{J}}{\\text{W/Hz}}=\\frac{\\text{J}}{(\\text{J/s})\\cdot\\text{s}}=1'},
{t:'box', kind:'err', hd:'Common error', html:'Common error: call $N_0/2$ the noise density at the filter output. It is the density of the white noise at the filter input. At the output the density is $\\frac{N_0}{2}|H(f)|^{2}$, which is not flat.'},
{t:'p', text:'For example, a rectangular pulse and a half-sine pulse with $E=10^{-6}$ J and $N_0=10^{-7}$ W/Hz both give $\\eta_{\\max}=2(10^{-6})/10^{-7}=20$. The output of each is its autocorrelation $R_g(t-T)$, with $R_g(u)=\\int g(\\tau)g(\\tau-u)\\,d\\tau$, and both peak at $R_g(0)=E$.'},
{t:'fig', svg:()=>figEqualOutputs(),
 cap:'A rectangular pulse and a half-sine pulse of the same energy $E$, each through its own matched filter. The rectangular output is solid and the half-sine output dashed. Both peak at $t=T$ with the value $E$.'},

{t:'h3', text:'Sampling early or late'},
{t:'p', text:'A receiver may sample at a time $t_0$ that is not exactly $T$. The noise power $k^{2}N_0E/2$ is the same at every $t_0$. Only the signal part changes.'},
{t:'eqbox', cap:'SNR at $t_0$', tex:'\\begin{aligned}\\eta(t_0)&=\\frac{g_0^{2}(t_0)}{k^{2}N_0E/2}\\\\&=\\Bigl(\\frac{g_0(t_0)}{kE}\\Bigr)^{2}\\frac{2E}{N_0}\\end{aligned}'},
{t:'p', text:'For the rectangular pulse the output is the triangle, so $g_0(t_0)/(kE)=1-|t_0-T|/T$. Sampling $0.1T$ late leaves $(1-0.1)^{2}=0.81$ of $2E/N_0$. That is a loss of $10\\log_{10}0.81=-0.92$ dB.'},
{t:'fig', svg:()=>figSnrTiming(),
 cap:'The SNR at the sampling instant $t_0$ for the rectangular pulse, as a fraction of $2E/N_0$. Sampling at $t_0=1.1T$ leaves $0.81$.'},
{t:'p', text:'An earlier peak would need another filter. A filter that peaks at $t_0<T$ is $h(t)=g(t_0-t)$. It is non-zero for some $t<0$, so it would need the input before the input arrives. Such a filter is not causal. A causal matched filter needs $t_0\\ge T$, and a later $t_0$ only adds delay.'},

{t:'h3', text:'The output sample'},
{t:'p', text:'Send polar bits, $+g(t)$ for a $1$ and $-g(t)$ for a $0$, and sample the matched filter at $t=T$. The signal part is $\\pm kE$. The noise part is filtered Gaussian noise.'},
{t:'eqbox', cap:'The sample at $t=T$', tex:'\\begin{aligned}y(T)&=\\pm kE+n(T)\\\\n(T)&\\sim\\mathcal{N}\\bigl(0,\\ k^{2}N_0E/2\\bigr)\\end{aligned}',
 after:'A linear filter turns Gaussian noise into Gaussian noise. So $y(T)$ is a Gaussian random variable centred on $+kE$ or $-kE$, with $\\sigma=k\\sqrt{N_0E/2}$.'},
{t:'p', text:'Take $E=1$, $N_0=0.5$ and $k=1$. Then $\\sigma=\\sqrt{0.5/2}=0.5$. For the bit $+1$ the fraction of samples below $0$ is $Q(1/0.5)=Q(2)=0.023$. Section 2.4 chooses the threshold and computes this error probability.'},
{t:'fig', svg:()=>figSampleDist(),
 cap:'Histograms of $5000$ samples $y(T)$ for each bit, with $k=1$, $E=1$ and $N_0=0.5$: the bit $+1$ filled, the bit $-1$ dashed. The curves are the two Gaussian densities. The red area is $Q(2)$.',
 short:'Histograms of the matched-filter sample for polar bits.'},

{t:'ex', hd:'Example 2.3 — the matched filter of a rectangular pulse', rows:[
 ['Given','$g(t)=A$ on $[0,T]$, with $A=2$ V, $T=0.5$ ms and $N_0/2=10^{-4}$ W/Hz.'],
 ['Find','The matched filter $h(t)$, its output $y(t)$ and the largest peak SNR $\\eta_{\\max}$.'],
 ['Method','Reverse and shift the pulse to get $h(t)$. The output is the sliding overlap of $g$ and $h$. The largest SNR is $2E/N_0$, which needs only the energy.'],
 ['Solution','$h(t)=g(T-t)=A$ for $0\\le t\\le T$. Up to $t=T$ the pulse and the reversed copy overlap on $[0,t]$, so $y(t)=\\int_0^tA^{2}\\,d\\tau=A^{2}t$. After it they overlap on $[t-T,T]$, so $y(t)=\\int_{t-T}^{T}A^{2}\\,d\\tau=A^{2}(2T-t)$ for $T\\le t\\le2T$. The limits $\\int_0^t$ hold only for $t\\le T$. The energy is $E=A^{2}T=(2)^{2}(0.5\\times10^{-3})=2\\times10^{-3}$ J. Then $\\eta_{\\max}=2E/N_0=2(2\\times10^{-3})/(2\\times10^{-4})=20$.'],
 ['Check','$10\\log_{10}20=13.0$ dB. The peak is $y(T)=A^{2}T=E$, as the general result requires.']
]},
{t:'fig', svg:()=>figExMf(),
 cap:'Example 2.3: the pulse $g(t)/A$ (dashed) and the output of its matched filter, $y(t)/(A^{2}T)$. The output is a triangle that peaks at $y(T)=A^{2}T$.'},
{t:'box', kind:'err', hd:'Common error', html:'Use $N_0=2\\times10^{-4}$, not $N_0/2$, in $2E/N_0$. The wrong value gives $40$.'},

{t:'h3', text:'Matched filters around us'},
{t:'p', text:'The matched filter appears in radar, Wi-Fi, range finders and serial ports.'},
{t:'ul', items:[
 '<b>Radar.</b> A radar chirp lasts $T=10\\ \\mu$s and sweeps $B=5$ MHz. Its matched output is $(1-|t|/T)\\,|\\operatorname{sinc}(Bt(1-|t|/T))|$, a peak about $1/B=0.2\\ \\mu$s wide.',
 '<b>Wi-Fi.</b> Wi-Fi at $1$ and $2$ Mb/s spreads each bit over the $11$-chip Barker code $c[n]$. Its matched output $R[k]=\\sum_n c[n]\\,c[n+k]$ is $11$ at $k=0$ and $0$ or $-1$ elsewhere.',
 '<b>Range finder.</b> An ultrasonic range finder correlates the echo with the pulse it sent. The peak at $t_0=5.83$ ms gives $d=ct_0/2=1.00$ m for $c=343$ m/s.',
 '<b>Serial port.</b> A serial port at $9600$ baud integrates each bit over $T_b=1/9600=104.2\\ \\mu$s, then dumps. The integrator is the matched filter of a rectangular bit.'
]},
{t:'box', kind:'def', hd:'Correlation with a template', html:'Each receiver correlates what it hears with a copy of what was sent. That is the matched filter $h(t)=g(T-t)$ read at its peak.'},
{t:'box', kind:'def', hd:'Peak time', html:'The peak falls where the copy lines up with the echo. Its time is the delay, and the delay gives the range.'},
{t:'box', kind:'warn', hd:'Pulse compression', html:'A long chirp carries much energy, and its matched output is still a peak about $1/B$ wide. The resolution comes from the bandwidth $B$, not from the length $T$.'},

/* ================================================================ 2.3 === */
{t:'h2', num:'2.3', text:'The demodulator'},

{t:'h3', text:'The unit-energy pulse'},
{t:'p', text:'The demodulator works with one fixed pulse shape $\\psi(t)$, a rectangle one bit long. $T_b$ is the bit duration in seconds. From here on $\\psi(t)$ is called the <b>basis function</b>. Module 3 builds one for any signal set (Gram–Schmidt).'},
{t:'eqbox', cap:'The pulse', tex:'\\psi(t)=\\begin{cases}1/\\sqrt{T_b}, & 0\\le t\\le T_b\\\\[2pt] 0, & \\text{otherwise}\\end{cases}'},
{t:'p', text:'Its height is chosen so that its energy is $1$. Square the height, then integrate over the bit.'},
{t:'eqbox', cap:'Step 1 · its energy', tex:'\\begin{aligned}E_\\psi&=\\int_0^{T_b}\\psi^{2}(t)\\,dt\\\\&=\\int_0^{T_b}\\frac{1}{T_b}\\,dt\\\\&=\\frac{1}{T_b}\\cdot T_b=1\\end{aligned}',
 after:'For example, $T_b=4$ ms gives the height $1/\\sqrt{4\\times10^{-3}}=15.8\\ \\text{s}^{-1/2}$. Then $\\psi^{2}=250\\ \\text{s}^{-1}$, and $250\\times4\\times10^{-3}=1$.'},
{t:'fig', svg:()=>figBasisUnit(),
 cap:'The pulse $\\psi(t)$ (amber, dashed) and its square $\\psi^{2}(t)$ (violet). The area under $\\psi^{2}(t)$ over one bit is $1$.'},

{t:'h3', text:'Antipodal signalling'},
{t:'p', text:'Each bit is sent as the same shape times a number. The number $s_m$ carries the bit.'},
{t:'eqbox', cap:'One shape, two numbers', tex:'s_m(t)=s_m\\,\\psi(t),\\qquad m\\in\\{0,1\\}'},
{t:'p', text:'Polar NRZ takes $s_1=+A\\sqrt{T_b}$ and $s_0=-A\\sqrt{T_b}$. Multiply each number by the height of $\\psi(t)$.'},
{t:'eqbox', cap:'Polar NRZ', tex:'\\begin{aligned}s_1(t)&=+A\\sqrt{T_b}\\cdot\\frac{1}{\\sqrt{T_b}}=+A\\\\s_0(t)&=-A\\sqrt{T_b}\\cdot\\frac{1}{\\sqrt{T_b}}=-A\\end{aligned}',
 after:'The $\\sqrt{T_b}$ cancels, so the waveforms are $\\pm A$ on $0\\le t\\le T_b$. One is the negative of the other, so the signalling is called <b>antipodal</b>.'},
{t:'p', text:'The energy per bit $E_b$ is the energy of one waveform.'},
{t:'eqbox', cap:'Energy per bit', tex:'\\begin{aligned}E_b&=\\int_0^{T_b}s_1^{2}(t)\\,dt=\\int_0^{T_b}A^{2}\\,dt\\\\&=A^{2}T_b\\end{aligned}',
 after:'So $A\\sqrt{T_b}=\\sqrt{E_b}$, and the two numbers are $s_1=+\\sqrt{E_b}$ and $s_0=-\\sqrt{E_b}$. With $A=2$ V and $T_b=1$ ms in a $1\\ \\Omega$ load, $E_b=(2)^{2}(10^{-3})=4$ mJ.'},
{t:'fig', svg:()=>figBasis(),
 cap:'The basis $\\psi(t)$ (amber) and the two waveforms of polar signalling, $s_1(t)$ (cyan) and $s_0(t)$ (cyan, dashed), drawn with $T_b=1$ and $A=1.5$. Each waveform is $\\psi(t)$ times a number.'},

{t:'h3', text:'Two waveforms as two points'},
{t:'p', text:'The number that multiplies $\\psi(t)$ is found by projection. Multiply the waveform by $\\psi(t)$ and integrate over the bit.'},
{t:'eqbox', cap:'Coefficient on $\\psi$', tex:'\\begin{aligned}s_m&=\\int_0^{T_b}s_m(t)\\,\\psi(t)\\,dt\\\\s_1&=\\int_0^{T_b}A\\cdot\\frac{1}{\\sqrt{T_b}}\\,dt\\\\&=\\frac{A}{\\sqrt{T_b}}\\cdot T_b=A\\sqrt{T_b}=+\\sqrt{E_b}\\end{aligned}',
 after:'For $s_0(t)=-A$ the same steps give $s_0=-\\sqrt{E_b}$. The two waveforms have become two points on one axis, the axis of $\\psi(t)$. Module 3 draws any signal set this way.'},
{t:'p', text:'The distance between the two points measures how far noise must push the received number to cause an error.'},
{t:'eqbox', cap:'Distance', tex:'\\begin{aligned}d&=s_1-s_0\\\\&=\\sqrt{E_b}-\\bigl(-\\sqrt{E_b}\\bigr)=2\\sqrt{E_b}\\end{aligned}',
 after:'A larger distance means noise must move the received number further before it lands nearer the wrong point. For $E_b=4$ mJ, $d=2\\sqrt{4\\times10^{-3}}=2(0.0632)=0.126\\ \\sqrt{\\text{J}}$.'},
{t:'figrow', n:2, items:[
 {svg:()=>figSpaceWave(), cap:'The two waveforms of polar signalling, $s_1(t)$ (solid) and $s_0(t)$ (dashed).'},
 {svg:()=>figSpacePoints(), cap:'The same two waveforms as points on the axis of $\\psi(t)$. The points are $2\\sqrt{E_b}$ apart.'}
]},

{t:'h3', text:'The matched-filter demodulator'},
{t:'p', text:'The first demodulator is a filter matched to $\\psi(t)$. Its impulse response is $\\psi$ reversed in time and delayed by one bit. Its input is one bit plus the white Gaussian noise $w(t)$ of the channel.'},
{t:'eqbox', cap:'Filter and input', tex:'\\begin{aligned}h(t)&=\\psi(T_b-t)\\\\x(t)&=s_m\\psi(t)+w(t),\\qquad 0\\le t\\le T_b\\end{aligned}'},
{t:'p', text:'The filter is linear, so each part of $x(t)$ passes through it on its own. The output splits into a signal part and a noise part.'},
{t:'eqbox', cap:'Step 1 · split the output', tex:'\\begin{aligned}y(t)&=x(t)*h(t)\\\\&=\\underbrace{s_m\\psi(t)*h(t)}_{\\text{signal part}}+\\underbrace{w(t)*h(t)}_{n(t)}\\end{aligned}',
 after:'The noise part $n(t)$ is a random process: it changes from one transmission to the next.'},
{t:'p', text:'Send the same bit twice and only the signal part repeats. It depends on $s_m$ and $\\psi$ alone, while $n(t)$ is a new sample function every time.'},
{t:'fig', svg:()=>figDemodSplit(),
 cap:'One noisy bit with $s_m=+1$ through the filter matched to the rectangular $\\psi$. Shown: the signal part (dashed), the noise part $n(t)$ (grey) and their sum $y(t)$.',
 short:'The matched-filter output split into signal and noise parts.'},

{t:'h3', text:'The signal part as a convolution'},
{t:'p', text:'Write the signal part as a convolution integral. The limits are $0$ and $T_b$, because $\\psi(\\tau)=0$ outside the bit. Then replace $h(t-\\tau)$ by $\\psi$ at $T_b-(t-\\tau)$.'},
{t:'eqbox', cap:'Step 2 · the signal part', tex:'\\begin{aligned}s_m\\psi(t)*h(t)&=\\int_0^{T_b}s_m\\psi(\\tau)\\,h(t-\\tau)\\,d\\tau\\\\&=\\int_0^{T_b}s_m\\psi(\\tau)\\,\\psi\\bigl(T_b-(t-\\tau)\\bigr)\\,d\\tau\\end{aligned}',
 after:'The output is defined for every $t$. Only its value at $t=T_b$ is used.'},
{t:'box', kind:'err', hd:'Common error', html:'Common error: take the output to end with the bit at $T_b$. The bit and $h(t)$ each last $T_b$, so for the rectangular $\\psi$ the output is non-zero on $0<t<2T_b$.'},
{t:'fig', svg:()=>figDemodConv(),
 cap:'The convolution at $t=T_b/2$, for one noiseless bit with $s_m=1$ and the rectangular $\\psi$. The shaded overlap of $s_m\\psi(\\tau)$ and $h(t-\\tau)$ is the output $y(t)$, here $0.5$.',
 short:'The matched-filter demodulator as a convolution.'},

{t:'h3', text:'The demodulator output'},
{t:'p', text:'Sample the output at the end of the bit. Put $t=T_b$ in the signal part: the reversal and the delay of the filter cancel.'},
{t:'eqbox', cap:'Step 1 · sample at $t=T_b$', tex:'y(T_b)=\\int_0^{T_b}s_m\\psi(\\tau)\\,\\psi(\\tau)\\,d\\tau+n(T_b)',
 after:'Here $\\psi\\bigl(T_b-(T_b-\\tau)\\bigr)=\\psi(\\tau)$.'},
{t:'p', text:'$s_m$ is a constant, so it leaves the integral. What is left is the energy of $\\psi$, which is $1$.'},
{t:'eqbox', cap:'Step 2 · use unit energy', tex:'\\begin{aligned}y(T_b)&=s_m\\int_0^{T_b}\\psi^{2}(\\tau)\\,d\\tau+n(T_b)\\\\&=s_m\\cdot1+n(T_b)\\end{aligned}'},
{t:'eqbox', cap:'Key result · the demodulator output', tex:'y=s_m+n,\\qquad n=\\int_0^{T_b}w(\\tau)\\,\\psi(\\tau)\\,d\\tau',
 after:'The waveform has become one number. $s_m$ is set by the bit. $n=n(T_b)$ is a random variable with a new value on every bit. For example, with $E_b=4$ mJ, the bit $0$ and $n=0.01$, $y=-0.0632+0.01=-0.053$.'},
{t:'fig', svg:()=>figMfDemod(),
 cap:'The filter matched to $\\psi(t)$, and what it does to one noisy bit with $s_m=+1$. The received bit is green, the output violet, and its signal part dashed. At $t=T_b$ the output is $s_m$ plus a noise value $n$.'},

{t:'h3', text:'The demodulator for other pulse shapes'},
{t:'p', text:'Step 2 above used only the unit energy of $\\psi$, never its shape. So the same result holds for any unit-energy pulse. The Manchester pulse is one: $+1$ on the first half of the bit, $-1$ on the second. A pulse of three steps is another.'},
{t:'eqbox', cap:'Any unit-energy $\\psi$', tex:'\\begin{aligned}y(T_b)&=s_m\\int_0^{T_b}\\psi^{2}(\\tau)\\,d\\tau\\\\&=s_m=\\pm1\\end{aligned}',
 after:'The filter is matched to $\\psi$, so one filter serves both bits of a code: the bit $0$ is the pulse $-\\psi(t)$.'},
{t:'p', text:'The output between samples does depend on the shape. For the Manchester bit $1$ at $t=T_b/2$, the filter overlaps the first half of the bit, where $\\psi=+1$ meets $h=-1$. So $y(T_b/2)=-0.5$, and $y$ rises to $+1$ at $T_b$.'},
{t:'box', kind:'warn', hd:'Signal part only', html:'The curves in the figure carry no noise. With noise the sample is $s_m+n$, and the curve between samples moves too.'},
{t:'fig', svg:()=>figShapesOut(),
 cap:'Noiseless matched-filter outputs for $s_m=1$: the rectangle (solid), the Manchester pulse (dashed) and the pulse of three steps (dotted). The shapes differ, but each reads $1$ at $t=T_b$.',
 short:'Matched-filter outputs for three pulse shapes.'},

{t:'h3', text:'A stream of bits'},
{t:'p', text:'Bit $k$ lasts from $(k-1)T_b$ to $kT_b$. Its output peaks at $kT_b$, and the outputs of the bits before and after it are zero there. So each sample holds its own bit and its own noise value.'},
{t:'eqbox', cap:'Bit $k$', tex:'y(kT_b)=s_{m,k}+n_k,\\qquad k=1,2,\\dots'},
{t:'p', text:'Two equal bits in a row give a flat output between their samples. Take two polar $1$ bits. The falling side of the first triangle and the rising side of the second add to $1$ between them.'},
{t:'box', kind:'ok', hd:'Reading the samples', html:'A sample above $0$ is read as bit $1$, and a sample below $0$ as bit $0$. Section 2.4 places this threshold and finds how often noise moves a sample across it.'},
{t:'fig', svg:()=>figTrain(),
 cap:'Ten polar bits through the matched filter. Above: the bits and the received $x(t)$. Below: the noiseless output $y_0(t)$ (dashed), the noisy output $y(t)$ and its samples at $t=kT_b$, with the bit read from each sign.',
 short:'Ten polar bits through the matched-filter demodulator.'},

{t:'h3', text:'The sampling instant in a stream'},
{t:'p', text:'Move the sampling instant of the stream by $\\epsilon$. The triangle of bit $k$ has fallen by $\\epsilon/T_b$ there, and the triangle of the next bit has risen by the same amount.'},
{t:'eqbox', cap:'A sample taken late', tex:'y_0(kT_b+\\epsilon)=s_k\\Bigl(1-\\frac{\\epsilon}{T_b}\\Bigr)+s_{k+1}\\,\\frac{\\epsilon}{T_b},\\qquad 0\\le\\epsilon\\le T_b',
 after:'An early sample takes $s_{k-1}$ in place of $s_{k+1}$. When the neighbour has the opposite sign, the sample shrinks to $s_k(1-2\\epsilon/T_b)$.'},
{t:'p', text:'For example, a polar $1$ followed by a $0$ and sampled $0.25T_b$ late gives $y_0=(1)(0.75)+(-1)(0.25)=0.5$. Half the margin is lost.'},
{t:'box', kind:'warn', hd:'A neighbour in the sample', html:'A late or early sample lets one bit disturb another. Section 2.7 meets this effect again in a band-limited channel.'},
{t:'fig', svg:()=>figStreamTiming(),
 cap:'The noiseless output of the ten polar bits, sampled at $kT_b+0.25T_b$ instead of at the dashed lines $kT_b$. The smallest margin falls from $1$ to $0.5$.',
 short:'The bit stream sampled a quarter bit late.'},

{t:'h3', text:'The correlator demodulator'},
{t:'p', text:'The second demodulator multiplies the input by $\\psi(t)$ and integrates from the start of the bit. It is called the <b>correlator</b>.'},
{t:'eqbox', cap:'The correlator', tex:'y(t)=\\int_0^{t}x(\\tau)\\,\\psi(\\tau)\\,d\\tau,\\qquad 0\\le t\\le T_b'},
{t:'p', text:'Substitute $x(\\tau)=s_m\\psi(\\tau)+w(\\tau)$, multiply out and split the integral.'},
{t:'eqbox', cap:'Step 1 · substitute $x(\\tau)$', tex:'\\begin{aligned}y(t)&=\\int_0^{t}\\bigl[s_m\\psi(\\tau)+w(\\tau)\\bigr]\\psi(\\tau)\\,d\\tau\\\\&=s_m\\int_0^{t}\\psi^{2}(\\tau)\\,d\\tau+\\int_0^{t}w(\\tau)\\,\\psi(\\tau)\\,d\\tau\\end{aligned}',
 after:'The first term grows through the bit. The second is the noise of the correlator.'},
{t:'p', text:'Inside the bit the correlator and the matched filter give different curves. For the Manchester bit $1$ with no noise, the correlator gives $y(T_b/2)=\\int_0^{T_b/2}\\psi^{2}\\,d\\tau=0.5$, while the matched filter gives $-0.5$.'},
{t:'fig', svg:()=>figCorrMf('man'),
 cap:'One noiseless Manchester bit with $s_m=1$. The matched-filter output is the wide line and the correlator output is dashed. The correlator integrates from $0$ and is reset at $T_b$. At $t=T_b$ both read $s_m$.',
 short:'Correlator and matched filter for a Manchester bit.'},

{t:'h3', text:'The correlator on samples'},
{t:'p', text:'A digital receiver samples the input $N$ times a bit and adds the products instead of integrating. The sampling interval is $T_s=T_b/N$.'},
{t:'eqbox', cap:'The sum', tex:'y(kT_s)=\\frac{1}{N}\\sum_{n=1}^{k}r(nT_s)\\,s(nT_s),\\qquad T_s=\\frac{T_b}{N}',
 after:'The factor $1/N$ plays the part of $d\\tau/T_b$. For a noiseless rectangular bit the sum climbs in steps of $1/N$ and ends at $1$.'},
{t:'p', text:'Take $s(nT_s)=1$ and independent noise of variance $\\sigma^{2}$ on each sample. The variances of independent terms add.'},
{t:'eqbox', cap:'Noise in the sum', tex:'\\begin{aligned}\\operatorname{Var}(y)&=\\frac{1}{N^{2}}\\sum_{n=1}^{N}\\operatorname{Var}\\bigl(r(nT_s)\\bigr)\\\\&=\\frac{1}{N^{2}}\\cdot N\\sigma^{2}=\\frac{\\sigma^{2}}{N}\\end{aligned}',
 after:'With $N=20$ and $\\sigma^{2}=0.2$, the sum has noise variance $0.2/20=0.01$.'},
{t:'fig', svg:()=>figCorrSamples(),
 cap:'The running sum of a noiseless rectangular bit sampled $20$ times. It follows the dashed line of the continuous correlator.',
 short:'The correlator on 20 samples.'},

{t:'h3', text:'Correlator and matched-filter demodulators'},
{t:'p', text:'The number $y$ can be formed in two ways. The correlator is read at the end of the bit and then reset to $0$.'},
{t:'p', text:'Read the output at $t=T_b$ and use the unit energy of $\\psi$.'},
{t:'eqbox', cap:'Correlator at $T_b$', tex:'\\begin{aligned}y(T_b)&=s_m\\int_0^{T_b}\\psi^{2}(\\tau)\\,d\\tau+\\int_0^{T_b}w(\\tau)\\,\\psi(\\tau)\\,d\\tau\\\\&=s_m+n\\end{aligned}',
 after:'At $t=T_b$ the noise integral is the same $n$ as at the matched filter. At earlier times the correlator noise $\\int_0^{t}w\\psi\\,d\\tau$ and the filter noise $n(t)$ are different processes.'},

{t:'p', text:'The matched filter has the impulse response $\\psi(T_b-t)$. Write its output as a convolution and put $t=T_b$.'},
{t:'eqbox', cap:'Matched filter at $T_b$', tex:'\\begin{aligned}h(t)&=\\psi(T_b-t)\\\\y(t)&=\\int_{-\\infty}^{\\infty}x(\\tau)\\,\\psi(T_b-t+\\tau)\\,d\\tau\\\\y(T_b)&=\\int_0^{T_b}x(\\tau)\\,\\psi(\\tau)\\,d\\tau\\end{aligned}',
 after:'The last line is the correlator output, for any shape of $\\psi$. Both demodulators turn the waveform into the one number $y=s_m+n$.'},
{t:'p', text:'Away from $T_b$ the two outputs differ. Take one noiseless bit with $s_m=1$ and the rectangular $\\psi$. On $[0,T_b]$ both outputs rise along the same line.'},
{t:'p', text:'After $T_b$ the correlator has been reset, while the matched-filter output falls as $2-t/T_b$. So $y(1.5T_b)=0.5$ at the filter. Only the value at $T_b$ is used.'},
{t:'fig', svg:()=>figCorrMf(),
 cap:'One noiseless bit with $s_m=1$ and the rectangular $\\psi$. The matched-filter output is the wide line and the correlator output is dashed. The correlator integrates from $0$ and is reset at $T_b$. At $t=T_b$ both read $s_m$.'},

{t:'h3', text:'The noise sample'},
{t:'p', text:'The noise value $n$ decides how often the bit is read wrongly, so its mean and variance are needed. Start with the mean. The expectation moves inside the integral, and white noise has zero mean.'},
{t:'eqbox', cap:'Step 1 · the mean', tex:'\\begin{aligned}E[n]&=\\int_0^{T_b}E[w(\\tau)]\\,\\psi(\\tau)\\,d\\tau\\\\&=0\\end{aligned}',
 after:'So the variance of $n$ is $E[n^{2}]$.'},
{t:'p', text:'Write $n^{2}$ as the product of two integrals with different variables, $t$ and $u$. Then take the expectation inside.'},
{t:'eqbox', cap:'Step 2 · square and average', tex:'\\begin{aligned}E[n^{2}]&=E\\Bigl[\\int_0^{T_b}w(t)\\psi(t)\\,dt\\int_0^{T_b}w(u)\\psi(u)\\,du\\Bigr]\\\\&=\\int_0^{T_b}\\!\\!\\int_0^{T_b}E[w(t)w(u)]\\,\\psi(t)\\,\\psi(u)\\,dt\\,du\\end{aligned}'},
{t:'fig', svg:()=>figNoisePlane(0),
 cap:'The square of $(t,u)$ pairs in the double integral, for the Manchester $\\psi(t)$. The product $\\psi(t)\\psi(u)$ is $+1/T_b$ on the shaded squares and $-1/T_b$ on the others.',
 short:'The square of the double integral of the noise variance.'},

{t:'h3', text:'The noise variance'},
{t:'p', text:'White noise has the autocorrelation $(N_0/2)\\delta(t-u)$. The impulse sifts $\\psi(u)$ to $\\psi(t)$, and the unit energy of $\\psi$ gives the last line.'},
{t:'eqbox', cap:'Step 3 · white noise', tex:'\\begin{aligned}E[w(t)w(u)]&=\\frac{N_0}{2}\\,\\delta(t-u)\\\\E[n^{2}]&=\\frac{N_0}{2}\\int_0^{T_b}\\psi^{2}(t)\\,dt\\\\&=\\frac{N_0}{2}\\end{aligned}',
 after:'The impulse leaves only the line $t=u$, where $\\psi(t)\\psi(u)=\\psi^{2}(t)$.'},
{t:'p', text:'A linear operation on Gaussian noise gives a Gaussian random variable. Adding the constant $s_m$ moves the mean only.'},
{t:'eqbox', cap:'Key result · the noise value', tex:'n\\sim\\mathcal{N}\\Bigl(0,\\ \\frac{N_0}{2}\\Bigr),\\qquad y\\sim\\mathcal{N}\\Bigl(s_m,\\ \\frac{N_0}{2}\\Bigr)',
 after:'For example, $N_0=2\\times10^{-4}$ W/Hz gives $\\sigma^{2}=10^{-4}$, so $\\sigma=0.01$.'},
{t:'fig', svg:()=>figNoisePlane(1),
 cap:'White noise keeps only the line $t=u$ of the square. On that line the product is $\\psi^{2}(t)=1/T_b$, whatever the sign pattern of $\\psi$.',
 short:'The line t = u that white noise leaves in the double integral.'},

{t:'h3', text:'Measuring the noise value'},
{t:'p', text:'The result $\\sigma=\\sqrt{N_0/2}$ can be measured. Make many noise values $n$, each the weighted sum of its own white noise samples, and look at their spread.'},
{t:'eqbox', cap:'The prediction', tex:'\\sigma=\\sqrt{\\frac{N_0}{2}}',
 after:'With $N_0=0.5$, $3000$ values give a measured spread of $0.505$ against the predicted $0.5$. Making $N_0$ four times larger doubles $\\sigma$.'},
{t:'box', kind:'err', hd:'Common error', html:'Common error: take $\\sigma=N_0/2$. That is the variance. At $N_0=0.5$ the spread is $\\sqrt{0.25}=0.5$, not $0.25$.'},
{t:'fig', svg:()=>figNoiseHist(),
 cap:'Histogram of $3000$ noise values at $N_0=0.5$, with the Manchester $\\psi$, and the Gaussian density with $\\sigma=\\sqrt{N_0/2}=0.5$.',
 short:'Measured noise values against the Gaussian density.'},

{t:'h3', text:'Two orthogonal signals'},
{t:'p', text:'In pulse position signalling, $s_1$ fills the first half of the bit and $s_2$ the second. The two waveforms are orthogonal, so each needs its own unit-energy basis, $\\psi_1$ and $\\psi_2$, and its own correlator.'},
{t:'eqbox', cap:'Two correlators', tex:'\\begin{aligned}y_m&=\\int_0^{T_b}r(\\tau)\\,\\psi_m(\\tau)\\,d\\tau,\\qquad m=1,2\\\\s_1\\text{ sent:}\\quad y_1&=\\sqrt{E_b}+n_1,\\qquad y_2=n_2\\end{aligned}',
 after:'$\\psi_2$ is zero where $s_1$ is not, so the second output holds noise only. The received point is $(y_1,y_2)$ on a plane.'},
{t:'p', text:'The sifting step of the variance, with $\\psi_2$ in place of the second $\\psi$, gives the correlation of the two noise terms.'},
{t:'eqbox', cap:'The two noise terms', tex:'\\begin{aligned}E[n_1n_2]&=\\frac{N_0}{2}\\int_0^{T_b}\\psi_1(t)\\,\\psi_2(t)\\,dt\\\\&=0\\end{aligned}',
 after:'The two Gaussian noise terms are uncorrelated, and so independent. The points $(\\sqrt{E_b},0)$ and $(0,\\sqrt{E_b})$ are $\\sqrt{2E_b}$ apart. For $E_b=4$ mJ that is $0.089$, against $0.126$ for antipodal points.'},
{t:'fig', svg:()=>figPpm(),
 cap:'The two signal points of orthogonal signalling on the plane of the correlator outputs, with $60$ noisy outputs around each.',
 short:'Signal points of binary orthogonal signalling.'},

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

/* ================================================================ 2.4 === */
{t:'h2', num:'2.4', text:'The decision and its error'},

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

{t:'ex', hd:'Example 2.4 — unequal priors: the threshold', rows:[
 ['Given','Polar signalling with $E_b=1$, $N_0=0.1$ and $P(s_1)=0.3$.'],
 ['Find','(a) The optimal threshold $\\lambda_{\\mathrm{opt}}$.'],
 ['Method','The priors are unequal, so the threshold is not zero. Use $\\lambda_{\\mathrm{opt}}=\\frac{N_0}{4\\sqrt{E_b}}\\ln\\frac{p_0}{p_1}$ with $p_0=1-P(s_1)=0.7$ and $p_1=0.3$.'],
 ['Solution','$\\lambda_{\\mathrm{opt}}=\\frac{0.1}{4(1)}\\ln\\frac{0.7}{0.3}=0.025(0.8473)=0.0212$.'],
 ['Check','Both weighted densities are equal there. $p_0f_Y(\\lambda\\mid s_0)=\\frac{0.7}{\\sqrt{0.1\\pi}}e^{-(1.0212)^{2}/0.1}=1.249\\,e^{-10.428}=3.70\\times10^{-5}$. $p_1f_Y(\\lambda\\mid s_1)=\\frac{0.3}{\\sqrt{0.1\\pi}}e^{-(0.9788)^{2}/0.1}=0.535\\,e^{-9.581}=3.70\\times10^{-5}$.']
]},
{t:'fig', svg:()=>figExLog(),
 cap:'Example 2.4: the two weighted densities on a logarithmic scale, where each is a parabola. The weighted density of $s_0$ is dashed. They cross at $\\lambda_{\\mathrm{opt}}=0.0212$, just right of zero.'},
{t:'box', kind:'err', hd:'Common error', html:'Use $p_0=0.7$, not the given $0.3$, for $s_0$. Swapping them gives $-0.0212$.'},

{t:'ex', hd:'Example 2.5 — unequal priors: the error probability', rows:[
 ['Given','$E_b=1$, $N_0=0.1$, $p_0=0.7$ and $\\lambda_{\\mathrm{opt}}=0.0212$, from Example 2.4.'],
 ['Find','(b) $P_e$ at $\\lambda_{\\mathrm{opt}}$, against $P_e$ at $\\lambda=0$.'],
 ['Method','Weight the two conditional errors by their priors: $P_e=p_0\\,Q\\bigl((\\lambda+\\sqrt{E_b})/\\sigma\\bigr)+p_1\\,Q\\bigl((\\sqrt{E_b}-\\lambda)/\\sigma\\bigr)$, with $\\sigma=\\sqrt{N_0/2}=0.2236$.'],
 ['Solution','$P(\\text{err}\\mid s_0)=Q(1.0212/0.2236)=Q(4.567)=2.48\\times10^{-6}$. $P(\\text{err}\\mid s_1)=Q(0.9788/0.2236)=Q(4.377)=6.01\\times10^{-6}$. In units of $10^{-6}$, $P_e=0.7(2.48)+0.3(6.01)=3.53$, so $P_e=3.53\\times10^{-6}$.'],
 ['Check','At $\\lambda=0$ both conditional errors are $Q(1/0.2236)=Q(4.472)$, so $P_e=Q(4.472)=3.87\\times10^{-6}$. The ratio $3.87/3.53=1.10$, so the zero threshold is about $10$ per cent worse.']
]},
{t:'fig', svg:()=>figExPe(),
 cap:'Example 2.5: $P_e$ against the threshold for the same link. The minimum sits at $\\lambda_{\\mathrm{opt}}=0.0212$. At $\\lambda=0$ (grey dot) it is about $10$ per cent higher.'},
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

/* ================================================================ 2.5 === */
{t:'h2', num:'2.5', text:'Intersymbol interference'},

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

{t:'ex', hd:'Example 2.6 — the samples of a bit pattern', rows:[
 ['Given','Bits $0\\,0\\,0\\,1\\,1\\,1\\,0\\,1$ sent after a line idle at the level of a $0$ ($a_k=-1$), through an RC channel with $BT_b=0.25$, so $q=0.208$.'],
 ['Find','The sample at the end of the seventh bit, $y_7$.'],
 ['Method','Every earlier bit leaves a tail in the sample. Add the bit\'s own share, the tails of the three $1$s, and the tails of every earlier bit and the idle line, all $-1$.'],
 ['Solution','$y_7=-(1-q)+(1-q)(q+q^{2}+q^{3})-(1-q)\\sum_{m=4}^{\\infty}q^{m}$. The middle term is $q-q^{4}$ and the last is $q^{4}$, by the geometric series. So $y_7=-(1-q)+(q-q^{4})-q^{4}=-1+2q-2q^{4}=-1+2(0.2079)-2(0.0019)=-0.588$.'],
 ['Check','The sample is negative, so the $0$ is still decided correctly.']
]},
{t:'fig', svg:()=>figExIsi(),
 cap:'Example 2.6: the sent pattern (dashed) and the channel output (green), with its value at the end of each bit. The seventh sample is $-0.588$.'},
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

/* ================================================================ 2.6 === */
{t:'h2', num:'2.6', text:'Nyquist and the raised cosine'},

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

{t:'ex', hd:'Example 2.7 — a raised-cosine link', rows:[
 ['Given','A link sends $R_b=20$ kb/s with raised-cosine pulses and $\\alpha=0.5$.'],
 ['Find','$W$, $f_1$ and $B_T$.'],
 ['Method','Each of the three follows from $R_b$ and $\\alpha$: $W=R_b/2$, $f_1=W(1-\\alpha)$ and $B_T=W(1+\\alpha)$. The spectrum is flat up to $f_1$ and falls to zero at $B_T$, with its half-height point at $W$.'],
 ['Solution','$W=20/2=10$ kHz. $f_1=10(1-0.5)=5$ kHz. $B_T=10(1+0.5)=15$ kHz.'],
 ['Check','$B_T-W=W-f_1=5$ kHz, so the roll-off is symmetric about $W$.']
]},
{t:'fig', svg:()=>figExRc(),
 cap:'Example 2.7: the ideal rectangle of width $2W$ (dashed) and the raised-cosine spectrum with $\\alpha=0.5$, which reaches $B_T=15$ kHz.'},
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

/* ================================================================ 2.7 === */
{t:'h2', num:'2.7', text:'The link in practice'},

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

/* ================================================================ 2.8 === */
{t:'h2', num:'2.8', text:'Summary'},

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
