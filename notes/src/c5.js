/* Course notes — Chapter 5.

   The chapter follows the slides of Module 5 one for one: each numbered
   section is a section of the module, each h3 a teaching slide in slide
   order, and each worked-example slide a numbered Example. A figure is the
   slide's figure drawn at one fixed state: a slider at one representative
   value, a figure played in frames at its last frame. The drawing code below
   is the slide's, so the data, the labels and the colours are the same. */
(function(){
const P=PLOT, C=P.COL;

/* ---- numbers ----------------------------------------------------------- */
/* Q(x) through erfc, with a fractional error below 1.2e-7, so a curve on a
   logarithmic axis keeps its shape. */
function erfc(x){ const z=Math.abs(x), t=1/(1+0.5*z);
  const r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+
    t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));
  return x>=0?r:2-r; }
const Qf=x=>0.5*erfc(x/Math.SQRT2);
const dB=d=>Math.pow(10,d/10);
const todB=x=>10*Math.log10(x);
const sincF=x=>Math.abs(x)<1e-9?1:Math.sin(Math.PI*x)/(Math.PI*x);
const clamp01=x=>Math.max(0,Math.min(1,x));
const f2=v=>v.toFixed(2);
const num=(v,d=2)=>{ const s=v.toFixed(d); return /^-0\.0*$/.test(s)?s.slice(1):s; };
const sci=(v,d=2)=>{ if(!(v>0)) return '0'; const e=Math.floor(Math.log10(v)), m=v/Math.pow(10,e);
  return e>=-1?num(v,3):m.toFixed(d)+'\\times10^{'+e+'}'; };
const rgba=(hex,al)=>{ const h=hex.replace('#','');
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${al})`; };
/* The dB value at which a falling curve g(dB) meets a target, by bisection. */
function reach(g,target,lo=-10,hi=60){
  for(let i=0;i<90;i++){ const m=(lo+hi)/2; if(g(m)>target) lo=m; else hi=m; }
  return (lo+hi)/2; }
/* Seeded noise, the same draws the slides use, so a count a figure prints is
   the count on the slide. */
function rng(seed){ let a=seed>>>0; return function(){
  a=(a+0x6D2B79F5)>>>0; let t=Math.imul(a^(a>>>15),1|a);
  t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
function gauss(seed,n,s){ const r=rng(seed),o=[]; for(let i=0;i<n;i++){
  const u=Math.max(1e-12,r()), v=r();
  o.push(s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)); } return o; }

/* ---- the figure frame ---------------------------------------------------- */
/* One panel inside a larger figure, and panels stacked from the top. */
const place=(svg,x,y,w,h)=>svg.replace('<svg ',`<svg x="${x}" y="${y}" width="${w}" height="${h}" `);
const stack=(w,parts)=>{ let y=0,s='';
  parts.forEach(([svg,h])=>{ s+=place(svg,0,y,w,h); y+=h; });
  return `<svg viewBox="0 0 ${w} ${y}" xmlns="http://www.w3.org/2000/svg" role="img">${s}</svg>`; };
/* A slide figure set at a fraction of the text width, centred, so that its
   labels print at the size of the running text. */
const nar=(svg,frac)=>{ const m=/viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg), W=+m[1], H=+m[2], O=W/frac;
  return `<svg viewBox="0 0 ${f2(O)} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">${place(svg,f2((O-W)/2),0,W,H)}</svg>`; };
const SZ=o=>Object.assign({w:560,h:320,pad:{l:56,r:26,t:24,b:42}},o);

/* ---- drawing helpers, as on the slides ----------------------------------- */
function arrow(a,x0,y0,x1,y1,o={}){
  const X0=a.sx(x0),Y0=a.sy(y0),X1=a.sx(x1),Y1=a.sy(y1),L=Math.hypot(X1-X0,Y1-Y0);
  if(L<3) return;
  const ux=(X1-X0)/L, uy=(Y1-Y0)/L, hd=12*(o.head||1), col=o.color||C.in;
  a.raw(`<line x1="${f2(X0)}" y1="${f2(Y0)}" x2="${f2(X1-hd*0.8*ux)}" y2="${f2(Y1-hd*0.8*uy)}" stroke="${col}" stroke-width="${o.width||2.6}" stroke-linecap="round"/>`
    +`<path d="M${f2(X1)},${f2(Y1)} L${f2(X1-hd*ux-hd*0.42*uy)},${f2(Y1-hd*uy+hd*0.42*ux)} L${f2(X1-hd*ux+hd*0.42*uy)},${f2(Y1-hd*uy-hd*0.42*ux)} Z" fill="${col}"/>`);
}
function seg(a,pts,o={}){
  if(pts.length<2) return;
  const d='M'+pts.map(p=>f2(a.sx(p[0]))+','+f2(a.sy(p[1]))).join('L');
  a.raw(`<path d="${d}" fill="none" stroke="${o.color||C.muted}" stroke-width="${o.width||1.4}" stroke-linejoin="round" stroke-linecap="round"${o.dash?` stroke-dasharray="${o.dash}"`:''}${o.opacity!=null?` opacity="${o.opacity.toFixed(3)}"`:''}/>`);
}
function trace(a,f,lo,hi,o={}){
  const n=o.n||600, pts=[];
  lo=Math.max(lo,a.o.xr[0]); hi=Math.min(hi,a.o.xr[1]);
  if(hi<=lo) return;
  for(let i=0;i<=n;i++){ const t=lo+(hi-lo)*i/n; pts.push([t,f(t)]); }
  seg(a,pts,o);
}
function dot(a,x,y,o={}){
  a.raw(`<circle cx="${f2(a.sx(x))}" cy="${f2(a.sy(y))}" r="${o.r||6}" fill="${o.color||C.in}" stroke="${o.ring||'#FCF9F3'}" stroke-width="${o.ringw||1.4}"${o.opacity!=null?` opacity="${o.opacity.toFixed(3)}"`:''}/>`);
}
function ring(a,x,y,o={}){
  a.raw(`<circle cx="${f2(a.sx(x))}" cy="${f2(a.sy(y))}" r="${o.r||13}" fill="none" stroke="${o.color||C.out}" stroke-width="${o.width||2.6}"/>`);
}
const circle=(a,r,o={})=>{ const pts=[]; const c=o.c||[0,0];
  for(let i=0;i<=160;i++){ const u=2*Math.PI*i/160; pts.push([c[0]+r*Math.cos(u),c[1]+r*Math.sin(u)]); }
  seg(a,pts,Object.assign({color:C.muted,width:1.2,dash:'4 5'},o)); };
const arc=(a,r,t0,t1,o={})=>{ const pts=[], n=60;
  for(let i=0;i<=n;i++){ const u=t0+(t1-t0)*i/n; pts.push([r*Math.cos(u),r*Math.sin(u)]); }
  seg(a,pts,o); };
/* Noise draws: small dots in the hairline tone, red where the decision is wrong. */
function cloudPts(a,pts,o={}){
  let s=''; const r=o.r||2.1;
  pts.forEach(([x,y,bad])=>{ const col=bad?C.err:(o.color||C.noise);
    s+=`<circle cx="${f2(a.sx(x))}" cy="${f2(a.sy(y))}" r="${bad?r+0.9:r}" fill="${col}" stroke="${col}" stroke-width="0.6"/>`; });
  a.raw(s);
}
const lbl=(a,x,y,s,col,anchor,fs)=>a.note(x,y,s,{tex:true,fs:fs||15,color:col||C.ink,anchor:anchor||'start'});
function bottomTicks(a,vals,fmt){
  const f=fmt||(v=>String(v));
  vals.forEach(v=>{ const X=f2(a.sx(v));
    a.raw(`<line x1="${X}" y1="${a.y0}" x2="${X}" y2="${a.y0+5}" stroke="${C.axis}" stroke-width="1.2"/>`);
    a.raw(`<text x="${X}" y="${f2(a.y0+19)}" font-size="13.5" fill="${C.muted}" text-anchor="middle">${f(v)}</text>`); });
  return a;
}
function leftTicks(a,vals,fmt){
  const f=fmt||(v=>String(v));
  vals.forEach(v=>{ const Y=a.sy(v);
    a.raw(`<line x1="${a.x0}" y1="${f2(Y)}" x2="${a.x1}" y2="${f2(Y)}" stroke="${C.grid}" stroke-width="1"/>`);
    a.raw(`<line x1="${a.x0}" y1="${f2(Y)}" x2="${a.x0-5}" y2="${f2(Y)}" stroke="${C.axis}" stroke-width="1.2"/>`);
    a.raw(`<text x="${f2(a.x0-10)}" y="${f2(Y+4.5)}" font-size="13.5" fill="${C.muted}" text-anchor="end">${f(v)}</text>`); });
  return a;
}
const TAx=o=>{ const xt=o.xt; const a=P.Axes(Object.assign({},o,{xticksOverride:[]})); return xt?bottomTicks(a,xt,o.xfmt):a; };
const bare=o=>Object.assign({xticksOverride:[],yticksOverride:[],grid:false,zeroAxes:false,arrows:false},o);
/* A signal-space plane drawn to one scale on both axes. `need` is the least
   range each axis must show; the other range widens to fill the box. */
function plane(o){
  const base=Object.assign({w:460,h:360,pad:{l:48,r:24,t:24,b:40},xlabel:'\\psi_1',ylabel:'\\psi_2'},o);
  delete base.need;
  const [nx,ny]=o.need;
  const pr=P.Axes(Object.assign({},base,{xr:nx,yr:ny}));
  const k=Math.min((pr.x1-pr.x0)/(nx[1]-nx[0]),(pr.y0-pr.y1)/(ny[1]-ny[0]));
  const cx=(nx[0]+nx[1])/2, cy=(ny[0]+ny[1])/2;
  const hx=(pr.x1-pr.x0)/k/2, hy=(pr.y0-pr.y1)/k/2;
  return P.Axes(Object.assign({},base,{xr:[cx-hx,cx+hx],yr:[cy-hy,cy+hy]}));
}

/* ---- decision regions: the box clipped by one half-plane per other point -- */
function clipHalf(poly,ax,ay,c){
  const out=[], n=poly.length, val=p=>ax*p[0]+ay*p[1]-c;
  for(let k=0;k<n;k++){ const A=poly[k], B=poly[(k+1)%n], va=val(A), vb=val(B);
    if(va<=0) out.push(A);
    if((va<=0)!==(vb<=0)){ const t=va/(va-vb); out.push([A[0]+t*(B[0]-A[0]),A[1]+t*(B[1]-A[1])]); } }
  return out;
}
function cells(pts,box){
  return pts.map((p,i)=>{
    let poly=[[box[0],box[2]],[box[1],box[2]],[box[1],box[3]],[box[0],box[3]]];
    pts.forEach((q,j)=>{ if(j===i||!poly.length) return;
      poly=clipHalf(poly,2*(q[0]-p[0]),2*(q[1]-p[1]),q[0]*q[0]+q[1]*q[1]-p[0]*p[0]-p[1]*p[1]); });
    return poly; });
}
const REGCOL=()=>[C.dec.in,C.dec.out,C.dec.mid,C.dec.h,C.dec.err];
function fillPoly(a,poly,fill){
  if(poly.length<3) return;
  a.raw(`<path d="M${poly.map(p=>f2(a.sx(p[0]))+','+f2(a.sy(p[1]))).join('L')}Z" fill="${fill}" stroke="none"/>`);
}
function inside(poly,p,eps){
  let sgn=0;
  for(let k=0;k<poly.length;k++){ const A=poly[k], B=poly[(k+1)%poly.length];
    const cr=(B[0]-A[0])*(p[1]-A[1])-(B[1]-A[1])*(p[0]-A[0]);
    if(Math.abs(cr)<(eps||1e-9)*Math.hypot(B[0]-A[0],B[1]-A[1])) continue;
    const s=Math.sign(cr); if(!sgn) sgn=s; else if(s!==sgn) return false; }
  return true;
}
function drawCells(a,pts,o={}){
  const box=[a.o.xr[0],a.o.xr[1],a.o.yr[0],a.o.yr[1]];
  const cs=cells(pts,box), fills=o.fills||REGCOL();
  cs.forEach((poly,i)=>fillPoly(a,poly,fills[i%fills.length]));
  if(o.lines===false) return cs;
  const onBox=(p,q)=>[0,1].some(k=>Math.abs(p[0]-q[0])<1e-9&&Math.abs(p[0]-box[k])<1e-9)
                   ||[2,3].some(k=>Math.abs(p[1]-q[1])<1e-9&&Math.abs(p[1]-box[k])<1e-9);
  cs.forEach((poly,i)=>{ for(let k=0;k<poly.length;k++){ const p=poly[k], q=poly[(k+1)%poly.length];
    if(onBox(p,q)) continue;
    const mid=[(p[0]+q[0])/2,(p[1]+q[1])/2];
    const owner=cs.findIndex((c,j)=>j!==i&&c.length>2&&inside(c,mid,1e-7));
    if(owner>=0&&owner<i) continue;
    seg(a,[p,q],{color:o.lineCol||C.muted,width:o.lineW||1.3}); } });
  return cs;
}
const nearest=(pts,x,y)=>{ let best=0,bd=Infinity;
  pts.forEach((p,k)=>{ const d=(x-p[0])*(x-p[0])+(y-p[1])*(y-p[1]); if(d<bd){bd=d;best=k;} });
  return best; };
const altFill=n=>Array.from({length:n},(_,i)=>i%2?C.dec.mid:C.dec.in);

/* A curve on a logarithmic axis stops at the lower edge of the axis. */
let LGF=-99;
const lg10=v=>{ const y=Math.log10(Math.max(1e-14,v)); return y<LGF-0.02?NaN:y; };
const logAx=o=>{ const a=TAx(Object.assign({ytickfmt:P.decade,zeroAxes:false},o)); LGF=a.o.yr[0]; return a; };

/* ---- the point sets and error probabilities of the chapter ---------------- */
const PSKpts=(M,r=1,off=0)=>Array.from({length:M},(_,k)=>[r*Math.cos(2*Math.PI*k/M+off),r*Math.sin(2*Math.PI*k/M+off)]);
const gray=i=>i^(i>>1);
const bin=(v,k)=>v.toString(2).padStart(k,'0');
const pop=x=>{ let c=0; while(x){ c+=x&1; x>>=1; } return c; };
/* QPSK with Gray labels: 00 at 45 degrees, then 01, 11, 10 anticlockwise. */
const QPSK=[[1,1],[-1,1],[-1,-1],[1,-1]], QLAB=['00','01','11','10'];
const Q1=QPSK.map(p=>[p[0]/Math.SQRT2,p[1]/Math.SQRT2]);
const LV4=[-3,-1,1,3], G4=['00','01','11','10'];
const QAM16=[]; LV4.forEach(x=>LV4.forEach(y=>QAM16.push([x,y])));
const PE={
  bpsk: g=>Qf(Math.sqrt(2*g)),
  bfsk: g=>Qf(Math.sqrt(g)),
  dpsk: g=>0.5*Math.exp(-g),
  ncfsk:g=>0.5*Math.exp(-g/2),
  psk:  (M,g)=>M===2?Qf(Math.sqrt(2*g)):2*Qf(Math.sqrt(2*Math.log2(M)*g)*Math.sin(Math.PI/M)),
  pam:  (M,g)=>2*(M-1)/M*Qf(Math.sqrt(6*Math.log2(M)*g/(M*M-1))),
  qamNN:(M,g)=>4*(1-1/Math.sqrt(M))*Qf(Math.sqrt(3*Math.log2(M)*g/(M-1))),
  qam:  (M,g)=>{ const p=2*(1-1/Math.sqrt(M))*Qf(Math.sqrt(3*Math.log2(M)*g/(M-1))); return 1-(1-p)*(1-p); },
  orthU:(M,g)=>(M-1)*Qf(Math.sqrt(Math.log2(M)*g))
};
/* The exact symbol error of M orthogonal signals. */
function orthExact(M,g){
  const mu=Math.sqrt(2*Math.log2(M)*g), n=400, lo=mu-9, hi=mu+9, h=(hi-lo)/n;
  let s=0;
  for(let i=0;i<=n;i++){ const y=lo+i*h, w=(i===0||i===n)?1:(i%2?4:2);
    const q=Qf(y), miss=-Math.expm1((M-1)*Math.log1p(-Math.min(q,1-1e-16)));
    s+=w*Math.exp(-(y-mu)*(y-mu)/2)*miss; }
  return s*h/3/Math.sqrt(2*Math.PI);
}
const G5={ bpsk:reach(d=>PE.bpsk(dB(d)),1e-5,0,20), bfsk:reach(d=>PE.bfsk(dB(d)),1e-5,0,20) };

/* ===================================================== 5.1 figures ======= */
/* A baseband pulse stream, a raised-cosine bump every 0.2 ms, times a 40 kHz
   carrier, and the two half-height copies of its spectrum at +-f_c. */
const CAR={an:[1,-1,1,1,-1,1],fc:40,W:5};
const bump=t=>Math.abs(t)<0.2?Math.pow(Math.cos(Math.PI*t/0.4),2):0;
const sBase=t=>CAR.an.reduce((s,a,n)=>s+0.9*a*bump(t-0.1-0.2*n),0);
const specB=f=>Math.abs(f)<CAR.W?Math.pow(Math.cos(Math.PI*f/(2*CAR.W)),2):0;
function figCarrier(){
  const H=380, hA=180;
  const a=TAx({w:560,h:hA,xr:[0,1.2],yr:[-1.3,1.45],xlabel:'t\\;(\\text{ms})',ylabel:'s(t),\\;u(t)',
    pad:{l:56,r:26,t:24,b:36},xt:[0,0.4,0.8],yticksOverride:[-1,0,1]});
  trace(a,sBase,0,1.2,{color:C.muted,width:1.3,dash:'5 4'});
  trace(a,t=>-sBase(t),0,1.2,{color:C.muted,width:1.3,dash:'5 4'});
  trace(a,t=>sBase(t)*Math.cos(2*Math.PI*CAR.fc*t),0,1.2,{color:C.in,width:1.7,n:2400});
  const b=P.Axes({w:560,h:H-hA,xr:[-55,55],yr:[0,1.3],xlabel:'f\\;(\\text{kHz})',ylabel:'|U(f)|',
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[-40,-20,0,20,40],yticksOverride:[],grid:false});
  leftTicks(b,[0.5,1]);
  [-CAR.fc,CAR.fc].forEach(m=>b.curve(fr=>0.5*specB(fr-m),{color:C.in,width:2.6,n:1200}));
  b.span(CAR.fc-CAR.W,CAR.fc+CAR.W,0.66,'2W',{tex:true,color:C.mid,fs:15});
  lbl(b,-CAR.fc,0.62,'\\tfrac12S(f+f_c)',C.in,'middle',14);
  return stack(560,[[a.svg(),hA],[b.svg(),H-hA]]);
}

/* The IQ modulator for the four QPSK symbols 00 01 11 10: the plane, I(t)
   and Q(t), and the carrier burst, two carrier cycles a symbol. */
const FCT=2;
const IQ_I=t=>QPSK[Math.min(3,Math.max(0,Math.floor(t)))][0];
const IQ_Q=t=>QPSK[Math.min(3,Math.max(0,Math.floor(t)))][1];
const iqBurst=t=>IQ_I(t)*Math.cos(2*Math.PI*FCT*t)-IQ_Q(t)*Math.sin(2*Math.PI*FCT*t);
const QOFF=[[0.52,0.2,'start'],[-0.52,0.2,'end'],[-0.52,-0.45,'end'],[0.52,-0.45,'start']];
function figIQ(){
  const W=560, H=440, hA=158, hB=97;
  const a=plane({w:W,h:hA,need:[[-2.3,2.3],[-1.75,1.8]],xlabel:'I',ylabel:'Q',xticksOverride:[],yticksOverride:[],pad:{l:56,r:26,t:24,b:36}});
  QPSK.forEach((p,k)=>{ dot(a,p[0],p[1],{color:C.in,r:6.5}); lbl(a,p[0]+QOFF[k][0],p[1]+QOFF[k][1],'\\mathtt{'+QLAB[k]+'}',C.in,QOFF[k][2]); });
  const b=TAx({w:W,h:hB,xr:[-0.05,4.05],yr:[-1.6,2.7],xlabel:'',ylabel:'I(t),\\;Q(t)',pad:{l:56,r:26,t:20,b:8},yticksOverride:[-1,1]});
  for(let n=1;n<4;n++) b.vline(n,{color:C.muted,dash:'2 4',width:1});
  const stair=j=>{ const pts=[]; for(let n=0;n<4;n++) pts.push([n,QPSK[n][j]],[n+1,QPSK[n][j]]); return pts; };
  seg(b,stair(0),{color:C.mid,width:2.4}); seg(b,stair(1),{color:C.mid,width:2.4,dash:'7 5'});
  for(let n=0;n<4;n++) lbl(b,n+0.5,1.55,'\\mathtt{'+QLAB[n]+'}',C.ink,'middle',16);
  const c=TAx({w:W,h:H-hA-hB,xr:[-0.05,4.05],yr:[-1.9,1.9],xlabel:'t/T',ylabel:'s(t)',pad:{l:56,r:26,t:20,b:36},xt:[0,1,2,3],yticksOverride:[-1,1]});
  [Math.SQRT2,-Math.SQRT2].forEach(y=>seg(c,[[0,y],[4,y]],{color:C.muted,width:1.1,dash:'4 5'}));
  trace(c,iqBurst,0,4,{color:C.in,width:2.2,n:500});
  return stack(W,[[a.svg(),hA],[b.svg(),hB],[c.svg(),H-hA-hB]]);
}

/* BPSK for the bits 1 1 0 1 over the faint carrier. */
const BP_BITS=[1,1,0,1];
function figBPSK(){
  const a=TAx({w:560,h:250,pad:{l:56,r:26,t:24,b:42},xr:[-0.05,4.05],yr:[-1.6,2.05],xlabel:'t/T_b',ylabel:'s(t)',xt:[0,1,2,3],yticksOverride:[-1,0,1]});
  for(let n=1;n<4;n++) a.vline(n,{color:C.muted,dash:'2 4',width:1});
  trace(a,t=>Math.cos(2*Math.PI*FCT*t),0,4,{color:C.muted,width:1.4,dash:'4 5',opacity:0.6,n:800});
  BP_BITS.forEach((b,n)=>lbl(a,n+0.5,1.6,String(b),C.ink,'middle',17));
  trace(a,t=>(BP_BITS[Math.min(3,Math.floor(t))]?1:-1)*Math.cos(2*Math.PI*FCT*t),0,4,{color:C.in,width:2.6,n:900});
  return a.svg();
}

/* BFSK: two tones over one bit at Delta f T_b = 0.5, and their correlation. */
const rhoF=x=>Math.abs(x)<1e-9?1:Math.sin(2*Math.PI*x)/(2*Math.PI*x);
function figBFSK(){
  const df=0.5, H=400, hA=180;
  const a=TAx({w:560,h:hA,xr:[0,1.02],yr:[-1.5,1.75],xlabel:'t/T_b',ylabel:'s_0(t),\\;s_1(t)',
    pad:{l:56,r:26,t:24,b:36},xt:[0,0.5],yticksOverride:[-1,0,1]});
  trace(a,t=>Math.cos(6*Math.PI*t),0,1,{color:C.in,width:2.0,dash:'6 5',n:500});
  trace(a,t=>Math.cos(2*Math.PI*(3+df)*t),0,1,{color:C.in,width:2.5,n:500});
  const b=TAx({w:560,h:H-hA,xr:[0,2.05],yr:[-0.4,1.12],xlabel:'\\Delta f\\,T_b',ylabel:'\\rho',
    pad:{l:56,r:26,t:24,b:42},xt:[0,0.5,1,1.5,2],yticksOverride:[0,0.5,1]});
  b.curve(rhoF,{color:C.mid,width:2.4});
  dot(b,df,0,{color:C.mid,r:6});
  dot(b,0.715,-0.217,{color:C.mid,r:5});
  lbl(b,0.9,-0.3,'-0.217',C.mid,'start',14);
  lbl(b,2.0,0.9,'\\rho=0\\ \\text{at}\\ \\Delta f\\,T_b=0.5',C.mid,'end');
  return stack(560,[[a.svg(),hA],[b.svg(),H-hA]]);
}

/* BASK for 1 0 1 1 0 with peak energy E = 2, and its two points on one axis. */
const BA_BITS=[1,0,1,1,0];
function figBASK(){
  const hA=190, hb=220, H=hA+hb;
  const a=TAx({w:560,h:hA,xr:[-0.05,5.05],yr:[-2.5,3.2],xlabel:'t/T_b',ylabel:'s(t)',
    pad:{l:56,r:26,t:24,b:36},xt:[0,1,2,3,4],yticksOverride:[-2,0,2]});
  for(let n=1;n<5;n++) a.vline(n,{color:C.muted,dash:'2 4',width:1});
  trace(a,t=>BA_BITS[Math.min(4,Math.floor(t))]?2*Math.cos(2*Math.PI*FCT*t):0,0,5,{color:C.in,width:2.4,n:1000});
  BA_BITS.forEach((b,n)=>lbl(a,n+0.5,2.55,String(b),C.ink,'middle',17));
  const c=P.Axes({w:560,h:hb,xr:[-0.9,2.6],yr:[-1.2,1.3],xlabel:'\\psi',ylabel:'',
    pad:{l:56,r:26,t:24,b:42},xticksOverride:[0],yticksOverride:[],grid:false});
  const r2=Math.SQRT2;
  c.rect(-0.9,-1.2,r2/2,1.3,{fill:C.dec.in}); c.rect(r2/2,-1.2,2.6,1.3,{fill:C.dec.out});
  c.vline(r2/2,{color:C.ink,dash:'6 4',width:1.5,opacity:1});
  dot(c,0,0,{color:C.in,r:7}); dot(c,r2,0,{color:C.in,r:7});
  lbl(c,-0.1,0.35,'\\mathbf{s}_0=0',C.in,'end');
  lbl(c,r2,0.35,'\\mathbf{s}_1=\\sqrt{E}',C.in,'middle');
  c.span(0,r2,-0.75,'',{color:C.mid});
  lbl(c,r2+0.1,-0.8,'d=\\sqrt{E}=\\sqrt{2E_b}',C.mid,'start');
  lbl(c,r2/2+0.05,1.0,'\\text{threshold}',C.ink,'start',14);
  return stack(560,[[a.svg(),hA],[c.svg(),hb]]);
}

/* The two binary curves with the 3 dB gap at 1e-5, read at 10 dB. */
function figBinaryPe(){
  const x0=10;
  const a=logAx(SZ({xr:[0,15],yr:[-7,0.3],xlabel:'E_b/N_0\\;(\\text{dB})',ylabel:'P_b',xt:[0,3,6,9,12],yticksOverride:P.decades(-7,0)}));
  a.curve(d=>lg10(PE.bfsk(dB(d))),{color:C.err,width:2.4,dash:'7 5'});
  a.curve(d=>lg10(PE.bpsk(dB(d))),{color:C.err,width:2.6});
  arrow(a,G5.bpsk,-5,G5.bfsk,-5,{color:C.ink,width:1.8,head:0.7});
  lbl(a,G5.bpsk+0.3,-4.75,'3\\text{ dB}',C.ink,'start');
  a.vline(x0,{color:C.ink,dash:'5 4',width:1.3});
  const pb=PE.bpsk(dB(x0)), pf=PE.bfsk(dB(x0));
  dot(a,x0,Math.log10(pb),{color:C.err,r:5.5}); dot(a,x0,Math.log10(pf),{color:C.err,r:5.5});
  lbl(a,0.4,-5.95,'\\text{BPSK: }P_b='+sci(pb),C.err);
  lbl(a,0.4,-6.65,'\\text{BFSK, BASK: }P_b='+sci(pf),C.err);
  return a.svg();
}

/* ===================================================== 5.2 figures ======= */
function figMPSK(M){
  const pts=PSKpts(M), d=2*Math.sin(Math.PI/M);
  const a=plane({need:[[-1.75,1.75],[-1.6,1.6]],xticksOverride:[-1,1],yticksOverride:[-1,1]});
  drawCells(a,pts,{fills:altFill(M),lines:false});
  for(let j=0;j<M;j++){ const u=(2*j+1)*Math.PI/M; seg(a,[[0,0],[1.3*Math.cos(u),1.3*Math.sin(u)]],{color:C.muted,width:1.3}); }
  circle(a,1,{color:C.muted,width:1.1});
  if(M>2) arc(a,0.36,0,2*Math.PI/M,{color:C.mid,width:2});
  seg(a,[pts[0],pts[1]],{color:C.err,width:2.8});
  pts.forEach(p=>a.point(p[0],p[1],{color:C.in,r:M>16?4.5:6}));
  lbl(a,a.o.xr[0]+0.06,a.o.yr[1]-0.18,'M='+M+':\\ d_{\\min}='+num(d,3)+'\\sqrt{E_s}',C.err);
  return a.svg();
}

/* A QPSK burst and its two halves, each decided on its own. */
function figQPSK(){
  const H=400, hp=124;
  const panel=(h,ylabel,fn,last)=>{
    const a=TAx({w:560,h,xr:[-0.05,4.05],yr:[-1.9,2.3],xlabel:last?'t/T':'',ylabel,
      pad:{l:56,r:26,t:20,b:last?36:8},xt:last?[0,1,2,3]:null,yticksOverride:[-1,1]});
    for(let n=1;n<4;n++) a.vline(n,{color:C.muted,dash:'2 4',width:1});
    trace(a,fn,0,4,{color:C.in,width:2.2,n:900});
    return a; };
  const A=panel(hp,'s(t)',iqBurst,false);
  const B=panel(hp,'s_I(t)',t=>IQ_I(t)*Math.cos(2*Math.PI*FCT*t),false);
  const D=panel(H-2*hp,'s_Q(t)',t=>-IQ_Q(t)*Math.sin(2*Math.PI*FCT*t),true);
  for(let n=0;n<4;n++){
    lbl(B,n+0.5,1.78,QPSK[n][0]>0?'+1':'-1',C.out,'middle',16);
    lbl(D,n+0.5,1.78,QPSK[n][1]>0?'+1':'-1',C.out,'middle',16); }
  return stack(560,[[A.svg(),hp],[B.svg(),hp],[D.svg(),H-2*hp]]);
}

/* 8-PSK decided by the angle: three received points and the phase each picks. */
const DET=[[50,1.18,[0.12,0.13,'start']],[160,0.82,[-0.12,0.2,'end']],[-100,1.08,[-0.14,-0.12,'end']]];
function figPSKDetect(){
  const pts=PSKpts(8);
  const a=plane({need:[[-1.75,1.75],[-1.6,1.6]],xticksOverride:[-1,1],yticksOverride:[-1,1],xlabel:'y_1',ylabel:'y_2'});
  drawCells(a,pts,{fills:altFill(8)});
  pts.forEach(p=>a.point(p[0],p[1],{color:C.in,r:6}));
  DET.forEach(([deg,r,L])=>{
    const th=deg*Math.PI/180, x=r*Math.cos(th), y=r*Math.sin(th);
    arc(a,0.3,0,th,{color:C.mid,width:2});
    seg(a,[[0,0],[x,y]],{color:C.mid,width:1.4,dash:'4 4'});
    const m=nearest(pts,x,y);
    ring(a,pts[m][0],pts[m][1]);
    dot(a,x,y,{color:C.out,r:6.5});
    lbl(a,x+L[0],y+L[1],'\\theta='+deg+'^{\\circ}',C.mid,L[2]); });
  return a.svg();
}

/* M-PSK symbol error from the nearest-neighbour form, read at 10 dB. */
const PSK_DASH={2:null,4:'2 4',8:'7 5',16:'12 5 3 5',32:'3 3'};
function figMPSKPe(){
  const x0=10;
  const a=logAx(SZ({xr:[0,26],yr:[-7,1.7],xlabel:'E_b/N_0\\;(\\text{dB})',ylabel:'P_e',xt:[0,5,10,15,20],yticksOverride:P.decades(-7,0)}));
  [2,4,8,16,32].forEach(M=>a.curve(d=>lg10(PE.psk(M,dB(d))),{color:C.err,width:M===2?2.8:2.2,dash:PSK_DASH[M]}));
  [[4,'M=2,\\,4'],[8,'M=8'],[16,'M=16'],[32,'M=32']].forEach(([M,t])=>{
    const x=reach(d=>PE.psk(M,dB(d)),1e-6,0,40); lbl(a,x-0.6,-6.3,t,C.err,'end',13); });
  seg(a,[[x0,-5.8],[x0,0.05]],{color:C.ink,dash:'5 4',width:1.3});
  [4,8].forEach(M=>dot(a,x0,Math.log10(PE.psk(M,dB(x0))),{color:C.err,r:5.5}));
  lbl(a,0.4,1.2,'M=4:\\ P_e='+sci(PE.psk(4,dB(x0))),C.err,'start');
  lbl(a,13.4,1.2,'M=8:\\ P_e='+sci(PE.psk(8,dB(x0))),C.err,'start');
  return a.svg();
}

/* 8-PSK labels: each chord carries the number of bits in which its two labels
   differ, violet for one and red for more. */
function figGray(useGray){
  const pts=PSKpts(8), labOf=i=>useGray?gray(i):i;
  const a=plane({w:400,h:330,pad:{l:40,r:20,t:24,b:34},need:[[-1.95,1.95],[-1.6,1.6]],xticksOverride:[],yticksOverride:[]});
  circle(a,1,{color:C.muted,width:1.1});
  for(let i=0;i<8;i++){ const j=(i+1)%8, c=pop(labOf(i)^labOf(j));
    seg(a,[pts[i],pts[j]],{color:c>1?C.err:C.mid,width:2.4});
    const u=(2*i+1)*Math.PI/8; lbl(a,0.7*Math.cos(u),0.7*Math.sin(u)-0.07,String(c),c>1?C.err:C.mid,'middle',15); }
  pts.forEach((p,i)=>{ a.point(p[0],p[1],{color:C.in,r:6});
    const u=2*Math.PI*i/8, onX=i%4===0, onY=i%4===2;
    const x=onY?0.1:1.3*Math.cos(u), y=onX?0.12:1.3*Math.sin(u)-0.06;
    lbl(a,x,y,'\\mathtt{'+bin(labOf(i),3)+'}',C.in,onY||x>0?'start':'end'); });
  return a.svg();
}

/* The worked 8-PSK example: the wedge of the sent point and the two
   half-planes nearer a neighbour. */
function figExPSK(){
  const pts=PSKpts(8);
  const a=plane({need:[[-1.5,1.9],[-1.5,1.5]],xticksOverride:[],yticksOverride:[]});
  const X=a.o.xr, Y=a.o.yr, full=[[X[0],Y[0]],[X[1],Y[0]],[X[1],Y[1]],[X[0],Y[1]]];
  circle(a,1,{color:C.muted,width:1.1});
  const u=Math.PI/8, su=Math.sin(u), cu=Math.cos(u);
  fillPoly(a,clipHalf(clipHalf(full,-su,cu,0),-su,-cu,0),C.dec.in);
  const L=Math.min(X[1]/cu,Y[1]/su);
  [u,-u].forEach(w=>seg(a,[[0,0],[L*Math.cos(w),L*Math.sin(w)]],{color:C.ink,width:1.4,dash:'6 4'}));
  [1,7].forEach(j=>{ const q=pts[j];
    fillPoly(a,clipHalf(full,1-q[0],-q[1],0),rgba(C.err,0.14));
    seg(a,[pts[0],q],{color:C.mid,width:2.6}); });
  lbl(a,0.68,0.4,'d_{\\min}',C.mid,'end');
  pts.forEach(p=>a.point(p[0],p[1],{color:C.in,r:6}));
  lbl(a,1.1,-0.22,'\\mathbf{s}_0',C.in);
  return a.svg();
}

/* A carrier-phase error of 20 degrees on QPSK: 200 noisy symbols, decided in
   the fixed quadrants, with the turned points ringed. */
const PO_Z=gauss(5202,400,1), PO_S=0.18;
function figPhaseOffset(){
  const phi=20, t=phi*Math.PI/180, c=Math.cos(t), s=Math.sin(t);
  const a=plane({need:[[-1.75,1.75],[-1.6,1.6]],xticksOverride:[-1,1],yticksOverride:[-1,1],xlabel:'y_1',ylabel:'y_2'});
  drawCells(a,Q1);
  const cl=[]; let k=0;
  for(let i=0;i<200;i++){ const p=Q1[i%4];
    const x=c*p[0]-s*p[1]+PO_S*PO_Z[2*i], y=s*p[0]+c*p[1]+PO_S*PO_Z[2*i+1];
    const bad=nearest(Q1,x,y)!==i%4; if(bad) k++; cl.push([x,y,bad]); }
  cloudPts(a,cl);
  Q1.forEach(p=>a.point(p[0],p[1],{color:C.in,r:6.5}));
  Q1.forEach(p=>ring(a,c*p[0]-s*p[1],s*p[0]+c*p[1],{color:C.out,r:9,width:2.2}));
  arc(a,0.42,Math.PI/4,Math.PI/4+t,{color:C.mid,width:2.2});
  lbl(a,a.o.xr[0]+0.06,a.o.yr[1]-0.14,'\\varphi='+phi+'^{\\circ}:\\ \\text{wrong }'+k+'\\text{ of }200',k?C.err:C.ink,'start',13);
  return a.svg();
}

/* Differential encoding of 1 0 1 1 from theta_0 = 0. */
const DP_BITS=[1,0,1,1], DP_TH=[0,1,1,0,1];
function figDPSK(){
  const a=TAx({w:560,h:250,pad:{l:56,r:26,t:24,b:42},xr:[-0.6,4.6],yr:[-0.3,1.8],xlabel:'n',ylabel:'\\theta_n/\\pi',xt:[0,1,2,3,4],yticksOverride:[0,0.5,1]});
  DP_BITS.forEach((b,i)=>lbl(a,i+1,1.5,'b_'+(i+1)+'='+b,C.ink,'middle',16));
  a.stem(DP_TH.map((y,i)=>[i,y]),{color:C.in,showZero:true});
  lbl(a,0.12,0.1,'\\theta_0=0',C.in,'start',14);
  return a.svg();
}

/* Binary DPSK against BPSK, read at 10 dB. */
const G_DPSK=reach(d=>PE.dpsk(dB(d)),1e-5,0,20);
function figDPSKPe(){
  const x0=10;
  const a=logAx(SZ({xr:[0,15],yr:[-7,0.3],xlabel:'E_b/N_0\\;(\\text{dB})',ylabel:'P_b',xt:[0,3,6,9,12],yticksOverride:P.decades(-7,0)}));
  a.curve(d=>lg10(PE.dpsk(dB(d))),{color:C.err,width:2.4,dash:'7 5'});
  a.curve(d=>lg10(PE.bpsk(dB(d))),{color:C.err,width:2.6});
  arrow(a,G5.bpsk-0.9,-5,G5.bpsk,-5,{color:C.ink,width:1.8,head:0.6});
  arrow(a,G_DPSK+0.9,-5,G_DPSK,-5,{color:C.ink,width:1.8,head:0.6});
  lbl(a,G_DPSK+1.0,-4.9,'0.75\\text{ dB}',C.ink,'start');
  a.vline(x0,{color:C.ink,dash:'5 4',width:1.3});
  const pb=PE.bpsk(dB(x0)), pd=PE.dpsk(dB(x0));
  dot(a,x0,Math.log10(pb),{color:C.err,r:5.5}); dot(a,x0,Math.log10(pd),{color:C.err,r:5.5});
  lbl(a,0.4,-5.95,'\\text{BPSK: }P_b='+sci(pb),C.err);
  lbl(a,0.4,-6.65,'\\text{DPSK: }P_b='+sci(pd),C.err);
  return a.svg();
}

/* ===================================================== 5.3 figures ======= */
/* M-ASK on one axis at unit average energy, with its thresholds. */
function figMask(M){
  const A=Math.sqrt(3/(M*M-1)), pts=Array.from({length:M},(_,m)=>(2*m+1-M)*A);
  const a=P.Axes({w:560,h:230,pad:{l:56,r:26,t:24,b:42},xr:[-2,2],yr:[-1,1.6],xlabel:'\\psi',ylabel:'',xticksOverride:[-1,0,1],yticksOverride:[],grid:false});
  const th=pts.slice(1).map((p,i)=>(p+pts[i])/2), edges=[-2,...th,2];
  pts.forEach((p,i)=>a.rect(edges[i],-1,edges[i+1],1,{fill:i%2?C.dec.mid:C.dec.in}));
  th.forEach(t=>seg(a,[[t,-1],[t,1]],{color:C.ink,width:1.3,dash:'6 4'}));
  a.span(pts[M-2],pts[M-1],-0.45,'',{color:C.err});
  lbl(a,pts[M-1]+0.07,-0.45,'d_{\\min}',C.err,'start');
  pts.forEach(p=>dot(a,p,0,{color:C.in,r:7}));
  lbl(a,-1.95,1.28,'M='+M+':\\ d_{\\min}='+num(2*A,3)+'\\sqrt{E_s}',C.err,'start',13);
  return a.svg();
}

/* Four-level ASK: the neighbour count of each point and their average. */
const A4=[-3,-1,1,3], NB4=[1,2,2,1];
function figExASK4(){
  const a=P.Axes({w:560,h:230,pad:{l:56,r:26,t:24,b:42},xr:[-4.3,4.3],yr:[-1.7,2.7],xlabel:'\\psi/A',ylabel:'',xticksOverride:A4,yticksOverride:[],grid:false});
  [-2,0,2].forEach(t=>seg(a,[[t,-1],[t,0.5]],{color:C.muted,width:1.2,dash:'5 4'}));
  A4.forEach((x,k)=>{ lbl(a,x,1.25,String(NB4[k]),C.mid,'middle',17); dot(a,x,0,{color:C.in,r:7}); lbl(a,x,-1.25,'\\mathbf{s}_'+(k+1),C.in,'middle'); });
  lbl(a,0.3,2.2,'\\bar N_{\\min}=\\tfrac{1+2+2+1}{4}=1.5',C.ink,'start',17);
  return a.svg();
}

/* 16-QAM from two 4-level axes: the grid with its Gray labels, and the
   neighbours of each point. */
const nb16=p=>QAM16.filter(q=>Math.abs((p[0]-q[0])**2+(p[1]-q[1])**2-4)<1e-9).length;
function figQAM(counts){
  const a=plane({w:400,h:360,pad:{l:40,r:20,t:24,b:34},need:[[-4.8,4.8],[-4.6,4.4]],xticksOverride:[],yticksOverride:[]});
  if(counts) QAM16.forEach(p=>QAM16.forEach(q=>{
    if(Math.abs((p[0]-q[0])**2+(p[1]-q[1])**2-4)<1e-9&&(q[0]>p[0]||q[1]>p[1])) seg(a,[p,q],{color:C.mid,width:1.6,opacity:0.6}); }));
  QAM16.forEach(p=>{ dot(a,p[0],p[1],{color:C.in,r:6.5});
    if(!counts) lbl(a,p[0],p[1]+0.45,'\\mathtt{'+G4[LV4.indexOf(p[0])]+G4[LV4.indexOf(p[1])]+'}',C.in,'middle',13);
    else lbl(a,p[0]+0.3,p[1]+0.3,String(nb16(p)),C.mid,'start',15); });
  return a.svg();
}

/* Square QAM: exact against nearest-neighbour, read at 12 dB for 16-QAM. */
function figQAMPe(){
  const x0=12;
  const a=logAx(SZ({xr:[0,24],yr:[-7,2.5],xlabel:'E_b/N_0\\;(\\text{dB})',ylabel:'P_e',xt:[0,5,10,15],yticksOverride:P.decades(-7,0)}));
  [4,16,64].forEach(M=>{
    a.curve(d=>lg10(PE.qamNN(M,dB(d))),{color:C.mid,width:2.0,dash:'3 4'});
    a.curve(d=>lg10(PE.qam(M,dB(d))),{color:C.err,width:2.5});
    const x=reach(d=>PE.qam(M,dB(d)),1e-6,0,40); lbl(a,x-0.35,-6.3,'M='+M,C.err,'end',13); });
  seg(a,[[x0,-5.8],[x0,0.05]],{color:C.ink,dash:'5 4',width:1.3});
  const pe=PE.qam(16,dB(x0)), pn=PE.qamNN(16,dB(x0));
  dot(a,x0,Math.log10(pe),{color:C.err,r:5.5});
  lbl(a,0.4,1.95,'16\\text{-QAM exact: }'+sci(pe),C.err,'start');
  lbl(a,0.4,1.15,'\\text{nearest neighbour: }'+sci(pn),C.mid,'start');
  return a.svg();
}

/* Four eight-point sets with d_min = 2, side by side. */
const C8=1+Math.SQRT2, R3=1+Math.sqrt(3);
const SQ=[[1,1],[-1,1],[-1,-1],[1,-1]];
const SH=[
  {n:'(a)',pts:SQ.concat([[3,1],[-3,1],[-3,-1],[3,-1]]),d:[[1,1],[3,1]]},
  {n:'(b)',pts:SQ.concat([[C8,C8],[-C8,C8],[-C8,-C8],[C8,-C8]]),d:[[1,1],[C8,C8]]},
  {n:'(c)',pts:[[2,0],[0,2],[-2,0],[0,-2],[2,2],[-2,2],[-2,-2],[2,-2]],d:[[2,0],[2,2]]},
  {n:'(d)',pts:SQ.concat([[R3,0],[0,R3],[-R3,0],[0,-R3]]),d:[[1,1],[R3,0]]}
];
const Eav=pts=>pts.reduce((s,p)=>s+p[0]*p[0]+p[1]*p[1],0)/pts.length;
function figShape(S){
  const a=plane({w:300,h:320,pad:{l:36,r:14,t:24,b:34},need:[[-3.8,3.8],[-3.8,4.6]],xticksOverride:[],yticksOverride:[]});
  const radii=[...new Set(S.pts.map(p=>Math.hypot(p[0],p[1]).toFixed(4)))].map(Number);
  radii.forEach(r=>circle(a,r,{color:C.muted,width:1.1}));
  seg(a,S.d,{color:C.mid,width:2.8});
  S.pts.forEach(p=>dot(a,p[0],p[1],{color:C.in,r:6.5}));
  lbl(a,a.o.xr[0]+0.2,a.o.yr[1]-0.45,'\\text{'+S.n+'}\\ \\ E_{\\text{av}}='+num(Eav(S.pts),2),C.ink,'start',17);
  return a.svg();
}
function figShapes(){
  return `<svg viewBox="0 0 1200 320" xmlns="http://www.w3.org/2000/svg" role="img">${SH.map((S,i)=>place(figShape(S),300*i,0,300,320)).join('')}</svg>`;
}

/* 16-QAM on the grid +-1, +-3 with its decision boundaries. */
function figExQAM16(){
  const a=plane({need:[[-4.6,4.6],[-4.3,4.6]],xticksOverride:[-3,-1,1,3],yticksOverride:[-3,-1,1,3]});
  drawCells(a,QAM16,{fills:['none'],lineW:2.2,lineCol:C.ink});
  QAM16.forEach(p=>dot(a,p[0],p[1],{color:C.in,r:6.5}));
  return a.svg();
}

/* M-PSK and square M-QAM at the same average energy, at M = 16. */
const qamSq=M=>{ const L=Math.sqrt(M), lv=Array.from({length:L},(_,i)=>2*i+1-L), pts=[];
  lv.forEach(x=>lv.forEach(y=>pts.push([x,y]))); const e=Math.sqrt(Eav(pts)); return pts.map(p=>[p[0]/e,p[1]/e]); };
const advQ=M=>10*Math.log10((3/(M-1))/(2*Math.pow(Math.sin(Math.PI/M),2)));
function figQAMvsPSK(){
  const M=16, q=qamSq(M), ps=PSKpts(M);
  const dq=Math.sqrt(6/(M-1)), dp=2*Math.sin(Math.PI/M);
  const a=plane({need:[[-1.9,1.9],[-1.6,2.4]],xticksOverride:[],yticksOverride:[]});
  circle(a,1,{color:C.muted,width:1.1});
  ps.forEach(p=>ring(a,p[0],p[1],{color:C.in,r:5.5,width:1.8}));
  q.forEach(p=>dot(a,p[0],p[1],{color:C.in,r:5}));
  seg(a,[ps[0],ps[1]],{color:C.err,width:2.6,dash:'5 3'});
  seg(a,[q[0],q[1]],{color:C.err,width:2.6});
  const x0=a.o.xr[0]+0.06, y0=a.o.yr[1]-0.2;
  lbl(a,x0,y0,'M='+M+':\\ d_{\\text{QAM}}='+num(dq,3),C.err,'start',13);
  lbl(a,x0,y0-0.3,'d_{\\text{PSK}}='+num(dp,3),C.err,'start',13);
  lbl(a,x0,y0-0.6,'10\\log_{10}\\bigl(d_{\\text{QAM}}^{2}/d_{\\text{PSK}}^{2}\\bigr)='+num(advQ(M),2)+'\\text{ dB}',C.ink,'start',13);
  return a.svg();
}

/* ===================================================== 5.4 figures ======= */
/* Three orthogonal signals in an isometric view of three axes, with the
   equal chords and a received point decided by its largest output. */
const iso=p=>[(p[0]-p[1])*0.866,p[2]-0.5*(p[0]+p[1])];
const RX3=[0.82,0.34,0.22];
function figMFSK(){
  const a=plane(bare({need:[[-1.6,1.6],[-1.05,1.55]],xlabel:'',ylabel:''}));
  const E=[[1,0,0],[0,1,0],[0,0,1]];
  E.forEach((e,j)=>{ const q=iso(e.map(x=>1.45*x));
    arrow(a,0,0,q[0],q[1],{color:C.h,width:1.8,head:0.7});
    const L=iso(e.map(x=>1.62*x)); lbl(a,L[0],L[1]-0.05,'\\psi_'+(j+1),C.h,j===0?'start':j===1?'end':'middle'); });
  [[0,1],[1,2],[0,2]].forEach(([i,j])=>seg(a,[iso(E[i]),iso(E[j])],{color:C.mid,width:2.4,opacity:0.55}));
  const m=iso([0,0.5,0.5]); lbl(a,m[0]-0.12,m[1]+0.05,'d=\\sqrt{2E_s}',C.mid,'end');
  E.forEach(e=>{ const q=iso(e); dot(a,q[0],q[1],{color:C.in,r:7}); });
  const r=iso(RX3), p1=iso([RX3[0],0,0]);
  seg(a,[r,p1],{color:C.mid,width:1.4,dash:'4 4'});
  dot(a,r[0],r[1],{color:C.out,r:6.5});
  const s1=iso(E[0]); ring(a,s1[0],s1[1]);
  lbl(a,0,a.o.yr[0]+0.08,'r_1='+RX3[0]+'>r_2='+RX3[1]+'>r_3='+RX3[2],C.out,'middle');
  return a.svg();
}

/* The exact bit error of M orthogonal signals, M = 2 to 64, with the limit
   at ln 2 that Chapter 6 derives. */
const ORTH_MS=[2,4,8,16,32,64];
const orthPbM=(M,g)=>Math.pow(2,Math.log2(M)-1)/(M-1)*orthExact(M,g);
const WALL=10*Math.log10(Math.LN2);
function figOrthM(){
  const a=leftTicks(logAx(SZ({xr:[-4,16],yr:[-7,0.3],xlabel:'E_b/N_0\\;(\\text{dB})',ylabel:'P_b',xt:[-4,0,4,8,12],yticksOverride:[],grid:false})),P.decades(-7,-1),P.decade);
  a.rect(-4,-7,WALL,0.3,{fill:rgba(C.muted,0.12)});
  a.vline(WALL,{color:C.muted,width:1.4,dash:'3 4'});
  lbl(a,WALL+0.25,-0.55,'\\text{limit, Chapter 6}',C.muted,'start',13);
  ORTH_MS.forEach((M,i)=>a.curve(d=>lg10(orthPbM(M,dB(d))),{color:C.err,width:i===5?2.8:1.5,opacity:i===5?1:0.45,n:240}));
  [2,64].forEach(M=>{ const x=reach(d=>orthPbM(M,dB(d)),1e-5,-2,16); dot(a,x,-5,{color:C.err,r:5.5});
    lbl(a,x+(M===2?0.3:-0.3),-5.55,'M='+M+':\\ '+num(x,1)+'\\text{ dB}',C.err,M===2?'start':'end',14); });
  return a.svg();
}

/* Noncoherent BFSK: a tone of unknown phase phi = 60 degrees gives y_c and
   y_s with envelope 1, and the price of noncoherent detection. */
const G_NC=reach(d=>PE.ncfsk(dB(d)),1e-5,0,20);
function figNoncoh(){
  const phi=60, t=phi*Math.PI/180, H=430, hA=250;
  const a=plane({h:hA,need:[[-1.5,1.5],[-1.3,1.45]],xlabel:'y_c',ylabel:'y_s',xticksOverride:[],yticksOverride:[],pad:{l:56,r:26,t:24,b:36}});
  circle(a,1,{color:C.muted,width:1.1});
  const x=Math.cos(t), y=Math.sin(t);
  seg(a,[[x,y],[x,0]],{color:C.mid,width:1.4,dash:'4 4'});
  seg(a,[[0,0],[x,0]],{color:C.mid,width:3.2});
  seg(a,[[0,0],[x,y]],{color:C.out,width:2.2});
  arc(a,0.3,0,t,{color:C.mid,width:2});
  dot(a,x,y,{color:C.out,r:6.5});
  lbl(a,a.o.xr[1]-0.05,a.o.yr[0]+0.12,'\\varphi=60^{\\circ}:\\ y_c='+num(x)+',\\ \\ \\sqrt{y_c^{2}+y_s^{2}}=1',C.mid,'end');
  const b=logAx({w:560,h:H-hA,xr:[6,16],yr:[-7,0.3],xlabel:'E_b/N_0\\;(\\text{dB})',ylabel:'P_b',
    pad:{l:56,r:26,t:24,b:42},xt:[6,8,10,12,14],yticksOverride:[-6,-4,-2,0]});
  b.curve(d=>lg10(PE.bfsk(dB(d))),{color:C.err,width:2.6});
  b.curve(d=>lg10(PE.ncfsk(dB(d))),{color:C.err,width:2.4,dash:'7 5'});
  dot(b,G5.bfsk,-5,{color:C.err,r:5}); dot(b,G_NC,-5,{color:C.err,r:5});
  lbl(b,G5.bfsk-0.2,-5.6,num(G5.bfsk,1),C.err,'end',14);
  lbl(b,G_NC+0.2,-4.6,num(G_NC,1)+'\\text{ dB}',C.err,'start',14);
  return stack(560,[[a.svg(),hA],[b.svg(),H-hA]]);
}

/* ===================================================== 5.5 figures ======= */
/* At a fixed bit rate, k = 2 bits a symbol: the sinc^2 main lobe narrows to
   R_b, and the band each family needs. */
function figSpectrum(){
  const k=2, M=4, H=400, hA=230;
  const a=P.Axes({w:560,h:hA,xr:[-2.2,2.2],yr:[0,3.2],xlabel:'f/R_b',ylabel:'S(f)',
    pad:{l:56,r:26,t:24,b:40},xticksOverride:[-2,-1,0,1,2],yticksOverride:[]});
  a.curve(x=>Math.pow(sincF(x),2),{color:C.muted,width:1.4,dash:'5 4',n:800});
  a.curve(x=>k*Math.pow(sincF(k*x),2),{color:C.in,width:2.6,n:1200});
  a.span(-1/k,1/k,k+0.75,'',{color:C.mid});
  lbl(a,1/k+0.08,k+0.75,'2R_b/'+k+'='+num(2/k,2)+'R_b',C.mid,'start');
  lbl(a,2.15,1.5,'M='+M+'\\ (k='+k+')',C.in,'end');
  const b=P.Axes({w:560,h:H-hA,xr:[0,3.6],yr:[0,3.2],xlabel:'W/R_b',ylabel:'',
    pad:{l:56,r:26,t:18,b:40},xticksOverride:[0,1,2,3],yticksOverride:[],grid:false});
  [['\\text{PAM (SSB)}',1/(2*k)],['\\text{PSK, QAM}',1/k],['\\text{orthogonal}',M/(2*k)]].forEach(([name,w],i)=>{ const y=2.6-i;
    b.rect(0,y-0.3,w,y+0.3,{fill:rgba(C.in,0.3)}); seg(b,[[w,y-0.3],[w,y+0.3]],{color:C.in,width:2.4});
    lbl(b,w+0.06,y-0.1,name+':\\ '+num(w,2),C.in,'start',14); });
  return stack(560,[[a.svg(),hA],[b.svg(),H-hA]]);
}

/* QPSK, offset QPSK and MSK over eight bits: the path of (I, Q) and the
   envelope, one scheme a panel. */
const MS_I=[1,-1,-1,1], MS_Q=[1,-1,1,-1], MS_D=[1,1,-1,1,-1,-1,1,1], MS_TAU=0.3;
const ramp=(t,t0)=>clamp01((t-t0)/MS_TAU+0.5);
const held=(sq,t,off)=>{ let x=sq[0];
  for(let j=1;j<sq.length;j++) x+=(sq[j]-sq[j-1])*ramp(t,2*j+off); return x/Math.SQRT2; };
const MSK_WAYS=[
  t=>[held(MS_I,t,0),held(MS_Q,t,0)],
  t=>[held(MS_I,t,0),held(MS_Q,t,1)],
  t=>{ let th=Math.PI/4; MS_D.forEach((d,n)=>{ th+=d*Math.PI/2*clamp01(t-n); }); return [Math.cos(th),Math.sin(th)]; }
];
function figMSKway(j){
  const W=340, hA=250, hB=150;
  const a=plane({w:W,h:hA,need:[[-1.4,1.4],[-1.3,1.45]],xlabel:'I',ylabel:'Q',xticksOverride:[-1,1],yticksOverride:[-1,1],pad:{l:46,r:18,t:24,b:36}});
  circle(a,1,{color:C.muted,width:1.1});
  const way=MSK_WAYS[j];
  seg(a,Array.from({length:801},(_,i)=>way(8*i/800)),{color:C.in,width:2.4});
  QPSK.forEach(p=>dot(a,p[0]/Math.SQRT2,p[1]/Math.SQRT2,{color:C.in,r:5}));
  const b=TAx({w:W,h:hB,xr:[0,8],yr:[0,1.35],xlabel:'t/T_b',ylabel:'|s(t)|',pad:{l:46,r:18,t:20,b:40},xt:[0,4,8],yticksOverride:[0,1]});
  seg(b,Array.from({length:801},(_,i)=>{ const t=8*i/800, p=way(t); return [t,Math.hypot(p[0],p[1])]; }),{color:C.in,width:2.4});
  return stack(W,[[a.svg(),hA],[b.svg(),hB]]);
}
const pskPsd=x=>Math.pow(sincF(2*x),2);
const mskPsd=x=>{ const den=1-16*x*x; return Math.abs(den)<1e-6?Math.pow(Math.PI/4,2):Math.pow(Math.cos(2*Math.PI*x)/den,2); };
function figMSKspec(){
  const c=logAx({w:560,h:260,xr:[0,2],yr:[-4,0.2],xlabel:'fT_b',ylabel:'S(f)/S(0)',
    pad:{l:56,r:26,t:24,b:42},xt:[0,0.5,0.75,1,1.5,2],yticksOverride:[-4,-3,-2,-1,0]});
  c.curve(x=>lg10(pskPsd(x)),{color:C.in,width:2.4,dash:'7 5',n:1200});
  c.curve(x=>lg10(mskPsd(x)),{color:C.in,width:2.6,n:1200});
  lbl(c,1.95,-0.4,'\\text{dashed: QPSK, offset QPSK}',C.in,'end',14);
  lbl(c,1.95,-0.85,'\\text{solid: MSK}',C.in,'end',14);
  return c.svg();
}

/* The bandwidth-efficiency plane at a target P_e = 1e-5. */
const L2=Math.log2;
const FAM=[
  {n:'PAM',dash:'2 4',Ms:[2,4,8,16,32,64],r:M=>2*L2(M),pe:(M,g)=>PE.pam(M,g)},
  {n:'PSK',dash:null,Ms:[4,8,16,32,64],r:M=>L2(M),pe:(M,g)=>PE.psk(M,g)},
  {n:'QAM',dash:'7 5',Ms:[16,64],r:M=>L2(M),pe:(M,g)=>PE.qamNN(M,g)},
  {n:'orthogonal',dash:'12 5 3 5',Ms:[2,4,8,16,32,64],r:M=>2*L2(M)/M,pe:(M,g)=>PE.orthU(M,g)}
];
const needAt=(fam,M,tgt)=>reach(d=>fam.pe(M,dB(d)),tgt,-5,60);
function figPlane(){
  const e=-5, tgt=1e-5;
  const a=TAx(SZ({h:380,xr:[-4,36],yr:[-3,4.4],xlabel:'E_b/N_0\\;(\\text{dB})',ylabel:'R_b/W',xt:[0,10,20],
    yticksOverride:[],grid:false,zeroAxes:false}));
  leftTicks(a,[-3,-2,-1,0,1,2,3,4],u=>u>=0?String(Math.pow(2,u)):'1/'+Math.pow(2,-u));
  a.hline(0,{color:C.muted,width:1,dash:'2 4'});
  const lim=[]; for(let u=-3;u<=4.001;u+=0.05){ const r=Math.pow(2,u); lim.push([todB((Math.pow(2,r)-1)/r),u]); }
  seg(a,lim,{color:C.muted,width:1.6,dash:'3 4'});
  lbl(a,-3.6,3.55,'\\text{limit, Chapter 6}',C.muted,'start',13);
  const LB={PAM:[-0.2,-0.5,'end'],PSK:[0.6,-0.12,'start'],QAM:[-0.8,0.2,'end'],orthogonal:[0.6,-0.12,'start']};
  FAM.forEach(fm=>{ const pts=fm.Ms.map(M=>[needAt(fm,M,tgt),L2(fm.r(M))]), p=pts[fm.n==='QAM'?0:pts.length-1], L=LB[fm.n];
    seg(a,pts,{color:C.in,width:2.2,dash:fm.dash});
    pts.forEach(q=>dot(a,q[0],q[1],{color:C.in,r:5}));
    lbl(a,p[0]+L[0],p[1]+L[1],'\\text{'+fm.n+'}',C.in,L[2],14); });
  lbl(a,35.5,0.35,'\\text{bandwidth-limited}',C.ink,'end',14);
  lbl(a,35.5,-0.75,'\\text{power-limited}',C.ink,'end',14);
  lbl(a,35.5,-2.6,'P_e=10^{'+e+'}',C.err,'end');
  return a.svg();
}

/* E_b/N_0 for P_e = 1e-5 against bits a symbol, for each family. */
function figCompare(){
  const a=TAx(SZ({xr:[0.6,7.6],yr:[0,36],xlabel:'k=\\log_2M',ylabel:'E_b/N_0\\;(\\text{dB})',xt:[1,2,3,4,5,6],yticksOverride:[0,10,20,30]}));
  FAM.forEach(fm=>{ const Ms=fm.n==='PSK'?[2].concat(fm.Ms):fm.n==='QAM'?[4].concat(fm.Ms):fm.Ms;
    const pts=Ms.map(M=>[L2(M),needAt(fm,M,1e-5)]), p=pts[pts.length-1];
    seg(a,pts,{color:C.in,width:2.4,dash:fm.dash});
    pts.forEach(q=>dot(a,q[0],q[1],{color:C.in,r:5}));
    lbl(a,p[0]+0.15,p[1]-0.6,'\\text{'+fm.n+'}',C.in,'start',14); });
  return a.svg();
}

/* Adaptive modulation at E_s/N_0 = 22 dB, with Gray labels (P_b = P_e/k). */
const AD=[{n:'\\text{BPSK}',k:1,pb:g=>PE.bpsk(g)},{n:'\\text{QPSK}',k:2,pb:g=>PE.bpsk(g/2)},
  {n:'16\\text{-QAM}',k:4,pb:g=>PE.qam(16,g/4)/4},{n:'64\\text{-QAM}',k:6,pb:g=>PE.qam(64,g/6)/6},
  {n:'256\\text{-QAM}',k:8,pb:g=>PE.qam(256,g/8)/8}];
AD.forEach(s=>{ s.th=reach(d=>s.pb(dB(d)),1e-5,0,60); });
function figAdaptive(){
  const x0=22;
  const a=TAx(SZ({xr:[0,40],yr:[0,9.4],xlabel:'E_s/N_0\\;(\\text{dB})',ylabel:'k\\;(\\text{bits a symbol})',xt:[0,10,20,30,40],yticksOverride:[0,2,4,6,8]}));
  const st=[[0,0]]; AD.forEach(s=>{ st.push([s.th,st[st.length-1][1]],[s.th,s.k]); }); st.push([40,8]);
  seg(a,st,{color:C.in,width:2.6});
  AD.forEach(s=>lbl(a,s.th-0.6,s.k-0.35,s.n,C.in,'end',13));
  let cur=-1; AD.forEach((s,i)=>{ if(x0>=s.th) cur=i; });
  seg(a,[[x0,0],[x0,AD[cur].k]],{color:C.ink,dash:'5 4',width:1.3});
  dot(a,x0,AD[cur].k,{color:C.out,r:6.5});
  lbl(a,0.5,8.6,AD[cur].n+':\\ '+AD[cur].k+'\\text{ bits a symbol at }'+x0+'\\text{ dB}',C.out,'start');
  return a.svg();
}

/* The link budget, every quantity in decibels. Noise takes no colour, so the
   noise levels are drawn in the ink and the muted tone. */
const KT0=-174;
const lossDb=(d,f)=>20*Math.log10(4*Math.PI*d*f/3e8);
function figNoise(){
  const nf=5, y7=KT0+nf+70;
  const a=TAx(SZ({xr:[-0.3,8.3],yr:[-190,-64],xlabel:'B\\;(\\text{Hz})',ylabel:'N\\;(\\text{dBm})',
    xt:[0,2,4,6,8],xfmt:P.decade,yticksOverride:[],grid:false,zeroAxes:false}));
  leftTicks(a,[-170,-150,-130,-110,-90,-70]);
  seg(a,[[-0.3,y7],[7,y7]],{color:C.muted,width:1.2,dash:'3 4'});
  seg(a,[[7,-190],[7,y7]],{color:C.muted,width:1.2,dash:'3 4'});
  a.curve(x=>KT0+10*x,{color:C.muted,width:1.8,dash:'7 5'});
  a.curve(x=>KT0+nf+10*x,{color:C.ink,width:2.6});
  dot(a,0,KT0,{color:C.muted,r:5});
  dot(a,7,y7,{color:C.ink,r:6});
  lbl(a,0.3,-186,'-174\\text{ dBm at }1\\text{ Hz}',C.muted,'start',14);
  lbl(a,-0.15,-80,'B=10\\text{ MHz: }N='+num(y7,1)+'\\text{ dBm}',C.ink,'start');
  lbl(a,2.6,KT0+nf+26+12,'\\text{NF}='+nf+'\\text{ dB}',C.ink,'end',14);
  lbl(a,4.2,-152,'\\text{thermal only, }kT_0',C.muted,'start',14);
  return a.svg();
}
/* The budget as a waterfall at d = 1 km: transmit power, antenna gains and
   path loss as arrows, and the margin above the QPSK sensitivity. */
const LBG={pt:20,g:10,f:2.4e9,pmin:-89.4,keep:10};
function figBudget(){
  const d=1000, lp=lossDb(d,LBG.f);
  const lv=[LBG.pt,LBG.pt+LBG.g,LBG.pt+LBG.g-lp,LBG.pt+2*LBG.g-lp], pr=lv[3], mg=pr-LBG.pmin;
  const cx=[0.5,1.7,2.9,4.1,5.4];
  const a=TAx(SZ({h:380,xr:[0,7],yr:[-112,44],xlabel:'',ylabel:'\\text{power}\\;(\\text{dBm})',xt:[],yticksOverride:[],grid:false,zeroAxes:false}));
  leftTicks(a,[-100,-80,-60,-40,-20,0,20,40]);
  a.hline(LBG.pmin,{color:C.ink,dash:'6 4',width:1.4,opacity:0.9});
  lbl(a,0.12,LBG.pmin+4.5,'P_{\\min}='+num(LBG.pmin,1)+'\\text{ dBm}',C.ink,'start');
  seg(a,[[cx[0]-0.3,lv[0]],[cx[0]+0.3,lv[0]]],{color:C.in,width:4});
  lbl(a,0.2,lv[0]+6,num(lv[0],0)+'\\text{ dBm}',C.in,'start');
  arrow(a,cx[1],lv[0],cx[1],lv[1],{color:C.h,width:2.4,head:0.7});
  lbl(a,cx[1]+0.12,(lv[0]+lv[1])/2-2,'+'+LBG.g+'\\text{ dB}',C.h,'start');
  arrow(a,cx[2],lv[1],cx[2],lv[2],{color:C.h,width:2.4,head:0.8});
  lbl(a,cx[2]+0.12,(lv[1]+lv[2])/2,'-'+num(lp,1)+'\\text{ dB}',C.h,'start');
  arrow(a,cx[3],lv[2],cx[3],lv[3],{color:C.h,width:2.4,head:0.7});
  lbl(a,cx[3]-0.12,(lv[2]+lv[3])/2-2,'+'+LBG.g+'\\text{ dB}',C.h,'end');
  seg(a,[[cx[4]-0.3,pr],[cx[4]+0.3,pr]],{color:C.out,width:4});
  lbl(a,cx[4],pr+5,num(pr,1)+'\\text{ dBm}',C.out,'middle');
  seg(a,[[cx[4],LBG.pmin],[cx[4],pr]],{color:C.mid,width:2.2});
  seg(a,[[cx[4]-0.1,LBG.pmin],[cx[4]+0.1,LBG.pmin]],{color:C.mid,width:2.2});
  lbl(a,cx[4]+0.18,(pr+LBG.pmin)/2-2,num(mg,1)+'\\text{ dB}',C.mid,'start');
  ['P_t','G_t','L_p','G_r','P_r'].forEach((n,i)=>lbl(a,cx[i],-107,n,C.ink,'middle'));
  return a.svg();
}
/* The worked example: received power against distance at 5.8 GHz, against
   each sensitivity plus the 15 dB margin. */
const EXL={f:5.8e9,top:44,m:15,s:[['\\text{QPSK}',-81.4],['16\\text{-QAM}',-74.6]]};
const kmTick=x=>{ const d=Math.pow(10,x); return d<1?d.toFixed(1):String(Math.round(d)); };
function figExLink(){
  const a=TAx(SZ({xr:[-1,1],yr:[-92,-40],xlabel:'d\\;(\\text{km})',ylabel:'P_r\\;(\\text{dBm})',
    xt:[-1,Math.log10(0.2),Math.log10(0.5),0,Math.log10(2),Math.log10(5),1],xfmt:kmTick,yticksOverride:[],grid:false,zeroAxes:false}));
  leftTicks(a,[-90,-80,-70,-60,-50,-40]);
  EXL.s.forEach(([n,pm],i)=>{
    const th=pm+EXL.m, x=(EXL.top-th-lossDb(1000,EXL.f))/20;
    seg(a,[[-1,th],[1,th]],{color:C.ink,width:1.4,dash:'6 4'});
    seg(a,[[x,-92],[x,th]],{color:C.muted,width:1.2,dash:'3 4'});
    dot(a,x,th,{color:C.out,r:6});
    lbl(a,0.97,th+1.6,n,C.ink,'end',14);
    lbl(a,i?x-0.03:x+0.03,-88,'d='+num(Math.pow(10,x),2)+'\\text{ km}',C.out,i?'end':'start',14); });
  a.curve(x=>EXL.top-lossDb(1000*Math.pow(10,x),EXL.f),{color:C.out,width:2.6});
  lbl(a,0.97,-45,'\\text{received power }P_r(d)',C.out,'end');
  return a.svg();
}

/* ===================================================== 5.6 figure ======== */
/* Two bits through a QPSK link: the bits 10 pick the point (1, -1), the IQ
   modulator makes the carrier, noise is added, two correlators return the
   received point, and the receiver picks the nearest point. */
const CH_N=400, CH_Z=gauss(5601,CH_N,0.5), CH_A=[-0.24,-0.27];
const psi1=t=>Math.SQRT2*Math.cos(2*Math.PI*FCT*t), psi2=t=>-Math.SQRT2*Math.sin(2*Math.PI*FCT*t);
const CH=(()=>{ const t=[],sv=[],r=[],c1=[0],c2=[0],dt=1/CH_N;
  for(let i=0;i<CH_N;i++){ const u=(i+0.5)*dt, v=psi1(u)-psi2(u);
    t.push(u); sv.push(v); r.push(v+CH_A[0]*psi1(u)+CH_A[1]*psi2(u)+CH_Z[i]); }
  for(let i=0;i<CH_N;i++){ c1.push(c1[i]+r[i]*psi1(t[i])*dt); c2.push(c2[i]+r[i]*psi2(t[i])*dt); }
  return {t,s:sv,r,c1,c2,rv:[c1[CH_N],c2[CH_N]]}; })();
function figChain(){
  const W=560, H=470, ha=200, hb=114;
  const a=plane({w:W,h:ha,need:[[-2.1,2.1],[-1.8,1.7]],xticksOverride:[],yticksOverride:[],pad:{l:56,r:26,t:24,b:36}});
  drawCells(a,QPSK);
  QPSK.forEach((p,k)=>{ dot(a,p[0],p[1],{color:C.in,r:6.5}); lbl(a,p[0]+QOFF[k][0],p[1]+QOFF[k][1],'\\mathtt{'+QLAB[k]+'}',C.in,QOFF[k][2]); });
  const [x,y]=CH.rv; dot(a,x,y,{color:C.out,r:6.5}); ring(a,1,-1,{r:10});
  lbl(a,2.5,0.9,'\\mathbf r=('+num(x)+','+num(y)+')',C.out,'start');
  const b=TAx({w:W,h:hb,xr:[0,1],yr:[-3.6,3.6],xlabel:'',ylabel:'s(t),\\;r(t)',pad:{l:56,r:26,t:20,b:10},yticksOverride:[-2,0,2]});
  seg(b,CH.t.map((u,i)=>[u,CH.s[i]]),{color:C.in,width:2.2,opacity:0.4});
  seg(b,CH.t.map((u,i)=>[u,CH.r[i]]),{color:C.out,width:1.3});
  const c=TAx({w:W,h:H-ha-hb,xr:[0,1.12],yr:[-1.6,1.3],xlabel:'t/T',ylabel:'c_1,\\;c_2',pad:{l:56,r:26,t:20,b:36},xt:[0,0.5,1],yticksOverride:[-1,1]});
  seg(c,CH.t.map((u,i)=>[u,CH.c1[i+1]]),{color:C.mid,width:2.4});
  seg(c,CH.t.map((u,i)=>[u,CH.c2[i+1]]),{color:C.mid,width:2.4,dash:'7 5'});
  lbl(c,1.02,CH.rv[0]-0.1,'r_1',C.mid); lbl(c,1.02,CH.rv[1]-0.1,'r_2',C.mid);
  return stack(W,[[a.svg(),ha],[b.svg(),hb],[c.svg(),H-ha-hb]]);
}

/* ======================================================================== */
window.C5 = [

{t:'h1', num:'CHAPTER 5', text:'Digital modulation methods'},
{t:'p', lead:true, text:'A carrier has an amplitude, a phase and a frequency. Keying one of them, or two at once, puts bits on the carrier. Every scheme of this chapter is a set of points. Its error rate follows from their distances, through the receiver of Chapter 4. More points carry more bits. PSK and QAM pay for them in energy, and orthogonal signals pay in band.'},

/* ------------------------------------------------------------------ 5.1 --- */
{t:'h2', num:'5.1', text:'Putting bits on a carrier'},

{t:'h3', text:'Bits on a carrier'},
{t:'p', text:'A baseband signal $s(t)$ has its spectrum near $f=0$. Multiplying it by a carrier $\\cos(2\\pi f_ct)$ moves that spectrum to $\\pm f_c$. To see this, write the cosine as two complex exponentials.'},
{t:'eq', tex:'u(t)=s(t)\\cos(2\\pi f_ct)=\\tfrac12s(t)\\,e^{j2\\pi f_ct}+\\tfrac12s(t)\\,e^{-j2\\pi f_ct}'},
{t:'p', text:'Multiplying a signal by $e^{j2\\pi f_ct}$ shifts its spectrum up by $f_c$. Apply this to each term.'},
{t:'eqbox', cap:'Modulation shifts the spectrum', tex:'u(t)=s(t)\\cos(2\\pi f_ct)\\;\\Longrightarrow\\;U(f)=\\tfrac12S(f-f_c)+\\tfrac12S(f+f_c)',
 after:'Each copy keeps the shape of $S(f)$ at half the height.'},
{t:'p', text:'The carrier also halves the energy. Use $\\cos^{2}x=\\tfrac12+\\tfrac12\\cos2x$ under the integral.'},
{t:'eq', tex:'\\begin{aligned}\\int s^{2}(t)\\cos^{2}(2\\pi f_ct)\\,dt&=\\tfrac12\\int s^{2}(t)\\,dt+\\tfrac12\\int s^{2}(t)\\cos(4\\pi f_ct)\\,dt\\\\&\\approx\\tfrac12E_s\\end{aligned}'},
{t:'p', text:'The second integral nearly vanishes when $f_c\\gg W$. There $s^{2}(t)$ changes slowly while the cosine swings through many cycles, so its positive and negative parts cancel.'},
{t:'p', text:'Each copy runs from $f_c-W$ to $f_c+W$. The passband signal needs a band of $2W$, twice the baseband width. For example, $W=5$ kHz on a $40$ kHz carrier occupies $35$ to $45$ kHz, a band of $2W=10$ kHz.'},
{t:'fig', svg:()=>nar(figCarrier(),0.6), cap:'A baseband pulse stream $s(t)$ with band $W=5$ kHz, and its product $u(t)$ with a $40$ kHz carrier (top). The spectrum of $u(t)$ holds two half-height copies at $\\pm f_c$, each $2W$ wide (bottom).'},

{t:'h3', text:'The IQ modulator'},
{t:'p', text:'Two baseband numbers can share one carrier frequency. The IQ modulator puts $I$ on the cosine and $Q$ on the sine.'},
{t:'eqbox', cap:'The IQ modulator', tex:'s(t)=I\\cos(2\\pi f_ct)-Q\\sin(2\\pi f_ct)',
 after:'Two baseband numbers ride two carriers $90^{\\circ}$ apart. One point $(I,Q)$ of the plane is one symbol.'},
{t:'p', text:'The same point can be written in polar form. Put $I=A\\cos\\theta$ and $Q=A\\sin\\theta$, then use $\\cos(a+b)=\\cos a\\cos b-\\sin a\\sin b$.'},
{t:'eq', tex:'\\begin{aligned}A\\cos(2\\pi f_ct+\\theta)&=A\\cos\\theta\\cos(2\\pi f_ct)-A\\sin\\theta\\sin(2\\pi f_ct)\\\\&=I\\cos(2\\pi f_ct)-Q\\sin(2\\pi f_ct)\\end{aligned}'},
{t:'eqbox', cap:'Amplitude and phase', tex:'s(t)=A\\cos(2\\pi f_ct+\\theta),\\qquad A=\\sqrt{I^{2}+Q^{2}},\\quad \\theta=\\operatorname{atan2}(Q,I)',
 after:'PSK moves only $\\theta$ and ASK moves only $A$.'},
{t:'p', text:'The cosine and the sine carriers are orthogonal. Their product is $\\cos x\\sin x=\\tfrac12\\sin2x$, which averages to zero over many carrier cycles.'},
{t:'eq', tex:'\\int\\cos(2\\pi f_ct)\\sin(2\\pi f_ct)\\,dt=\\tfrac12\\int\\sin(4\\pi f_ct)\\,dt\\approx0'},
{t:'p', text:'So a correlator on the cosine sees $I$ alone, and one on the sine sees $Q$ alone. For example, the symbol $(I,Q)=(-1,+1)$ lies in the second quadrant, so its carrier phase is $\\theta=\\operatorname{atan2}(1,-1)=135^{\\circ}$.'},
{t:'fig', svg:()=>nar(figIQ(),0.6), cap:'Four QPSK symbols at $(\\pm1,\\pm1)$, sent in the order $\\mathtt{00}$, $\\mathtt{01}$, $\\mathtt{11}$, $\\mathtt{10}$. Each point sets $I$ (solid) and $Q$ (dashed) for one symbol, and the carrier burst below follows them.', short:'The IQ modulator sending four QPSK symbols.'},

{t:'h3', text:'Binary phase-shift keying'},
{t:'p', text:'Binary phase-shift keying (BPSK) sends a one as the carrier and a zero as the carrier inverted. The phase is $0$ or $\\pi$.'},
{t:'eqbox', cap:'BPSK', tex:'s_1(t)=\\sqrt{\\frac{2E_b}{T_b}}\\cos(2\\pi f_ct),\\qquad s_0(t)=-s_1(t)'},
{t:'p', text:'Take the basis function $\\psi(t)=\\sqrt{2/T_b}\\cos(2\\pi f_ct)$. Then $s_1(t)=\\sqrt{E_b}\\,\\psi(t)$ and $s_0(t)=-\\sqrt{E_b}\\,\\psi(t)$. The two points sit on one axis at $\\pm\\sqrt{E_b}$, so they are antipodal.'},
{t:'eq', tex:'d_{\\min}=\\sqrt{E_b}-\\bigl(-\\sqrt{E_b}\\bigr)=2\\sqrt{E_b}'},
{t:'p', text:'The binary result of Chapter 4 is $P_b=Q\\bigl(\\sqrt{d^{2}/2N_0}\\bigr)$. Here $Q(x)=\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$ is the Gaussian tail. Substitute $d^{2}=4E_b$.'},
{t:'eq', tex:'\\frac{d^{2}}{2N_0}=\\frac{4E_b}{2N_0}=\\frac{2E_b}{N_0}'},
{t:'eqbox', cap:'Key result · BPSK', tex:'d_{\\min}=2\\sqrt{E_b},\\qquad P_b=Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right)',
 after:'BPSK is baseband antipodal signalling times $\\cos(2\\pi f_ct)$. The carrier changes the band, not the error rate. With $E_b=4$ the two points are $2\\sqrt4=4$ apart.'},
{t:'fig', svg:()=>nar(figBPSK(),0.6), cap:'BPSK for the bits $1\\,1\\,0\\,1$, two carrier cycles a bit, over the faint unmodulated carrier. A one sends the carrier and a zero sends it inverted.'},

{t:'h3', text:'Binary frequency-shift keying'},
{t:'p', text:'Binary frequency-shift keying (BFSK) sends a one and a zero as two tones of energy $E_b$ each.'},
{t:'eqbox', cap:'BFSK', tex:'s_i(t)=\\sqrt{\\frac{2E_b}{T_b}}\\cos(2\\pi f_it),\\qquad f_1=f_0+\\Delta f'},
{t:'p', text:'The two tones are orthogonal only for certain spacings $\\Delta f$. Their correlation over one bit measures how far they are from orthogonal. Expand the product with $\\cos a\\cos b=\\tfrac12\\cos(a-b)+\\tfrac12\\cos(a+b)$.'},
{t:'eq', tex:'\\rho=\\frac{1}{E_b}\\int_0^{T_b}s_0(t)\\,s_1(t)\\,dt=\\frac{1}{T_b}\\int_0^{T_b}\\Bigl[\\cos(2\\pi\\Delta f\\,t)+\\cos\\bigl(2\\pi(f_0+f_1)t\\bigr)\\Bigr]dt'},
{t:'p', text:'The sum-frequency term averages out when $f_0\\gg1/T_b$. The difference term integrates to a sine.'},
{t:'eq', tex:'\\rho\\approx\\frac{1}{T_b}\\left[\\frac{\\sin(2\\pi\\Delta f\\,t)}{2\\pi\\Delta f}\\right]_0^{T_b}=\\frac{\\sin(2\\pi\\Delta fT_b)}{2\\pi\\Delta fT_b}'},
{t:'eqbox', cap:'Correlation', tex:'\\rho=\\frac{1}{E_b}\\int_0^{T_b}s_0(t)\\,s_1(t)\\,dt\\approx\\frac{\\sin(2\\pi\\Delta fT_b)}{2\\pi\\Delta fT_b}',
 after:'$\\rho=0$ at $\\Delta f=n/(2T_b)$. The first zero comes at $2\\pi\\Delta fT_b=\\pi$, so $\\Delta f=1/(2T_b)$ is the least spacing that keeps the tones orthogonal. The lowest value, $\\rho=-0.217$, falls at $\\Delta f=0.715/T_b$.'},
{t:'p', text:'At an orthogonal spacing the two points lie on two axes at right angles, each $\\sqrt{E_b}$ from the origin. By Pythagoras, $d^{2}=E_b+E_b=2E_b$.'},
{t:'eqbox', cap:'Key result · BFSK', tex:'d_{\\min}=\\sqrt{2E_b},\\qquad P_b=Q\\!\\left(\\sqrt{\\frac{E_b}{N_0}}\\right)',
 after:'Two orthogonal points have $d^{2}=2E_b$, against $4E_b$ for BPSK. BFSK needs $3$ dB more energy.'},
{t:'fig', svg:()=>nar(figBFSK(),0.6), cap:'Two tones over one bit, $f_0T_b=3$ (dashed) and $f_0+\\Delta f$ (solid), at $\\Delta f\\,T_b=0.5$ (top). Their correlation against the spacing: $\\rho=0$ first at $\\Delta f=1/(2T_b)$, and $\\rho=-0.217$ is the lowest value (bottom).', short:'Two BFSK tones and their correlation against the spacing.'},

{t:'h3', text:'Binary amplitude-shift keying'},
{t:'p', text:'Binary amplitude-shift keying (BASK), also called on-off keying, sends the carrier for a one and nothing for a zero.'},
{t:'eqbox', cap:'BASK', tex:'s_1(t)=\\sqrt{\\frac{2E}{T_b}}\\cos(2\\pi f_ct),\\qquad s_0(t)=0'},
{t:'p', text:'Ones and zeros are equally likely, and only the ones cost energy. The average energy a bit is therefore half the peak energy $E$.'},
{t:'eq', tex:'E_b=\\tfrac12E+\\tfrac12(0)=\\frac{E}{2}'},
{t:'p', text:'The two points sit at $0$ and $\\sqrt E$ on one axis. Write their distance in terms of $E_b$.'},
{t:'eq', tex:'d=\\sqrt E-0=\\sqrt E=\\sqrt{2E_b}'},
{t:'eqbox', cap:'Key result · BASK', tex:'d=\\sqrt{E}=\\sqrt{2E_b},\\qquad P_b=Q\\!\\left(\\sqrt{\\frac{E_b}{N_0}}\\right)',
 after:'This is the distance of BFSK at the same average energy. For example, a peak energy $E=2$ gives $E_b=E/2=1$.'},
{t:'box', kind:'err', hd:'Common error', html:'Use the average $E_b=E/2$, not the peak $E$, in $P_b$. Only the ones carry energy.'},
{t:'fig', svg:()=>nar(figBASK(),0.6), cap:'On-off keying of $1\\,0\\,1\\,1\\,0$ with peak energy $E=2$ a bit (top). Its two points on one axis, with the threshold halfway (bottom).'},

{t:'h3', text:'Three binary schemes compared'},
{t:'p', text:'The three schemes differ only in the squared distance between their two points.'},
{t:'eqbox', cap:'Squared distance', tex:'\\text{BPSK: }d^{2}=4E_b,\\qquad \\text{BFSK, BASK: }d^{2}=2E_b',
 after:'Half the squared distance costs a factor $2$ in energy, $10\\log_{10}2=3$ dB.'},
{t:'p', text:'To give the same argument of $Q$, BFSK needs $E_b/N_0$ twice as large as BPSK does. So BPSK reaches $P_b=10^{-5}$ at $9.6$ dB, and BFSK reaches it at $9.6+3.0=12.6$ dB.'},
{t:'p', text:'BFSK and BASK need the same average $E_b/N_0$. BASK spends it only on the ones.'},
{t:'fig', svg:()=>nar(figBinaryPe(),0.6), cap:'Bit error of BPSK (solid) and of BFSK and BASK (dashed). At $10^{-5}$ the dashed curve sits $3$ dB to the right. The dots read both curves at $E_b/N_0=10$ dB, the case of Example 5.1.', short:'Bit error of the three binary schemes.'},

{t:'ex', hd:'Example 5.1 — a binary link', rows:[
 ['Given','A link receives $P=4\\times10^{-15}$ W at $R_b=100$ kb/s, with $N_0=4\\times10^{-21}$ W/Hz.'],
 ['Find','$P_b$ for BPSK and for BFSK.'],
 ['Method','Both error formulas depend only on $E_b/N_0$. The energy a bit is power times bit time, $E_b=P/R_b$. Divide it by $N_0$.'],
 ['Solution','$E_b=P/R_b=4\\times10^{-15}/10^{5}=4\\times10^{-20}$ J, so $E_b/N_0=10$, or $10$ dB. BPSK: $P_b=Q(\\sqrt{20})=3.87\\times10^{-6}$. BFSK: $P_b=Q(\\sqrt{10})=7.83\\times10^{-4}$.'],
 ['Check','BFSK needs twice the energy for the same distance. It would match BPSK at $8\\times10^{-15}$ W.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $E_b=P/R_b$, not $P$, over $N_0$. The ratio $P/N_0=10^{6}$ Hz is not a signal-to-noise ratio.'},

{t:'h3', text:'Binary keying around us'},
{t:'ul', items:[
 'An NFC reader sends $106$ kb/s by switching the amplitude of a $13.56$ MHz carrier, $s(t)=A(t)\\cos(2\\pi f_ct)$. One bit lasts $9.43\\ \\mu$s.',
 'FM radio sends RDS data at $1187.5$ b/s by phase keying a $57$ kHz subcarrier, $s(t)=\\pm\\cos(2\\pi f_ct)$. One bit holds $48$ carrier cycles.',
 'A car key fob switches a $433.92$ MHz carrier on and off. Bit $n$ sends $A[n]\\cos(2\\pi f_ct)$ with $A[n]\\in\\{0,1\\}$.',
 'GPS phase-keys a $1575.42$ MHz carrier at $1.023$ Mchip/s. Its spectrum $T_c\\operatorname{sinc}^{2}((f-f_c)T_c)$, with $\\operatorname{sinc}x=\\sin(\\pi x)/(\\pi x)$, has nulls at $\\pm1.023$ MHz.'
]},
{t:'ul', items:[
 '<b>One switch a bit.</b> Each system changes one thing about its carrier for each bit: the amplitude or the sign.',
 '<b>Energy on the ones.</b> On-off keying spends energy only on the ones. With equal ones and zeros, $E_b$ is half the peak energy.',
 '<b>Bit rate and band.</b> A faster bit rate widens the spectrum. The GPS main lobe is $2\\times1.023=2.046$ MHz wide.'
]},

/* ------------------------------------------------------------------ 5.2 --- */
{t:'h2', num:'5.2', text:'Phase-shift keying'},

{t:'h3', text:'M-ary phase-shift keying'},
{t:'p', text:'M-ary PSK puts $M$ points on a circle of radius $\\sqrt{E_s}$. All points have equal energy and differ only in phase. Each symbol carries $k=\\log_2M$ bits, so $E_s=kE_b$.'},
{t:'eqbox', cap:'M-PSK', tex:'s_m(t)=\\sqrt{\\frac{2E_s}{T}}\\cos\\!\\left(2\\pi f_ct+\\frac{2\\pi m}{M}\\right),\\quad m=0,\\ldots,M-1'},
{t:'p', text:'Two neighbours are each $\\sqrt{E_s}$ from the origin, and the angle between them is $2\\pi/M$. The cosine rule gives their squared distance.'},
{t:'eq', tex:'\\begin{aligned}d_{\\min}^{2}&=E_s+E_s-2E_s\\cos\\frac{2\\pi}{M}\\\\&=2E_s\\Bigl(1-\\cos\\frac{2\\pi}{M}\\Bigr)\\\\&=4E_s\\sin^{2}\\frac{\\pi}{M}\\end{aligned}'},
{t:'p', text:'The last line uses $1-\\cos2x=2\\sin^{2}x$ with $x=\\pi/M$.'},
{t:'eqbox', cap:'Neighbour distance', tex:'d_{\\min}=2\\sqrt{E_s}\\,\\sin\\frac{\\pi}{M}',
 after:'At $M=2$, $d_{\\min}=2\\sqrt{E_s}$: this is BPSK. Each doubling of $M$ nearly halves $d_{\\min}$. QPSK with $E_s=2$ has $d_{\\min}=2\\sqrt2\\,\\sin(\\pi/4)=2\\sqrt2/\\sqrt2=2$.'},
{t:'fig', svg:()=>nar(figMPSK(8),0.55), cap:'8-PSK with $E_s=1$ and its wedges. The red chord is $d_{\\min}=2\\sin(\\pi/8)\\sqrt{E_s}=0.765\\sqrt{E_s}$.'},

{t:'h3', text:'QPSK as two BPSK links'},
{t:'p', text:'QPSK is M-PSK with $M=4$. Written through the IQ modulator, it splits into a cosine half and a sine half. Each half is a BPSK signal.'},
{t:'eq', tex:'s(t)=\\underbrace{I\\cos(2\\pi f_ct)}_{\\text{BPSK on }\\cos}-\\underbrace{Q\\sin(2\\pi f_ct)}_{\\text{BPSK on }\\sin}'},
{t:'p', text:'The carriers are orthogonal, so the noise on one half does not reach the other. The symbol energy $E_s=2E_b$ splits equally, and each bit sees its own BPSK link with energy $E_b$.'},
{t:'eqbox', cap:'Key result · QPSK', tex:'P_b=Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right),\\qquad P_e=1-(1-P_b)^{2}\\approx2P_b',
 after:'A symbol is right only when both halves are right. QPSK carries twice the bits of BPSK in the same band, at the same bit error.'},
{t:'fig', svg:()=>nar(figQPSK(),0.6), cap:'The QPSK burst of the IQ modulator (top) and its two halves. Each half is a BPSK signal, and the receiver decides each sign on its own (green).'},

{t:'h3', text:'Detecting PSK by phase'},
{t:'p', text:'The receiver uses two correlators on the basis of the IQ modulator.'},
{t:'eqbox', cap:'Two correlators', tex:[
  'y_1=\\int_0^{T}r(t)\\,\\psi_1(t)\\,dt,\\qquad y_2=\\int_0^{T}r(t)\\,\\psi_2(t)\\,dt',
  '\\psi_1(t)=\\sqrt{2/T}\\cos(2\\pi f_ct),\\qquad \\psi_2(t)=-\\sqrt{2/T}\\sin(2\\pi f_ct)']},
{t:'p', text:'Write the received vector $\\mathbf y$ in polar form, with length $\\|\\mathbf y\\|$ and angle $\\theta$. Its squared distance to the point $\\mathbf s_m$ follows from the cosine rule.'},
{t:'eq', tex:'\\|\\mathbf y-\\mathbf s_m\\|^{2}=\\|\\mathbf y\\|^{2}+E_s-2\\|\\mathbf y\\|\\sqrt{E_s}\\,\\cos\\Bigl(\\theta-\\frac{2\\pi m}{M}\\Bigr)'},
{t:'p', text:'Only the cosine depends on $m$. The distance is least where that cosine is largest, which is where $2\\pi m/M$ is nearest $\\theta$.'},
{t:'eqbox', cap:'Phase decision', tex:'\\theta=\\operatorname{atan2}(y_2,y_1),\\qquad \\hat m=\\text{the }m\\text{ with }\\tfrac{2\\pi m}{M}\\text{ nearest }\\theta',
 after:'All points have equal energy, so the nearest point has the nearest phase. The length of $\\mathbf y$ plays no part.'},
{t:'p', text:'For example, an 8-PSK receiver measures $\\theta=50^{\\circ}$. The phases are $45^{\\circ}$ apart, and $50^{\\circ}$ is $5^{\\circ}$ from $45^{\\circ}$ and $40^{\\circ}$ from $90^{\\circ}$. The receiver picks $45^{\\circ}$.'},
{t:'fig', svg:()=>nar(figPSKDetect(),0.55), cap:'8-PSK and its wedges, with received points at $\\theta=50^{\\circ}$, $160^{\\circ}$ and $-100^{\\circ}$. For each one the receiver picks the point of nearest phase (green ring).'},

{t:'h3', text:'M-PSK error probability'},
{t:'p', text:'Each point has two neighbours at $d_{\\min}$. The nearest-neighbour form of Chapter 4 is $P_e\\approx\\bar N_{\\min}\\,Q\\bigl(\\sqrt{d_{\\min}^{2}/2N_0}\\bigr)$, with $\\bar N_{\\min}=2$. Substitute the neighbour distance.'},
{t:'eq', tex:'\\frac{d_{\\min}^{2}}{2N_0}=\\frac{4E_s\\sin^{2}(\\pi/M)}{2N_0}=\\frac{2E_s}{N_0}\\sin^{2}\\frac{\\pi}{M}'},
{t:'eqbox', cap:'Symbol error', tex:'P_e\\approx2Q\\!\\left(\\sqrt{\\frac{2E_s}{N_0}}\\,\\sin\\frac{\\pi}{M}\\right),\\qquad E_s=kE_b'},
{t:'p', text:'Doubling $M$ brings the points closer. To keep the same $d_{\\min}$, the symbol energy must grow by the ratio of the two $\\sin^{2}$ terms. From QPSK to 8-PSK:'},
{t:'eq', tex:'\\frac{E_{s,8}}{E_{s,4}}=\\frac{\\sin^{2}(\\pi/4)}{\\sin^{2}(\\pi/8)}=\\frac{0.5}{0.1464}=3.41\\;(5.33\\text{ dB})'},
{t:'p', text:'Each 8-PSK symbol now carries $3$ bits, not $2$. Per bit the cost is $5.33-10\\log_{10}1.5=5.33-1.76=3.57$ dB. For large $M$, $\\sin(\\pi/M)\\approx\\pi/M$, so each doubling divides $\\sin^{2}$ by $4$. The cost then tends to $6$ dB a doubling.'},
{t:'fig', svg:()=>nar(figMPSKPe(),0.6), cap:'Symbol error of M-PSK for $M=2$ to $32$, from the nearest-neighbour form, exact for $M=2$. $M=2$ and $4$ nearly share one curve. The dots read QPSK and 8-PSK at $E_b/N_0=10$ dB.', short:'Symbol error of M-PSK.'},

{t:'h3', text:'Gray labels'},
{t:'p', text:'A symbol error nearly always lands on a neighbour. Gray labels make neighbours differ in one bit.'},
{t:'eqbox', cap:'Gray code', tex:'g=i\\oplus\\lfloor i/2\\rfloor',
 after:'For $i=0,\\ldots,7$ this gives $\\mathtt{000},\\mathtt{001},\\mathtt{011},\\mathtt{010},\\mathtt{110},\\mathtt{111},\\mathtt{101},\\mathtt{100}$. Neighbours differ in one bit.'},
{t:'p', text:'For example, $i=5$ is $\\mathtt{101}$ and $\\lfloor5/2\\rfloor=2$ is $\\mathtt{010}$. Their bitwise sum is $\\mathtt{101}\\oplus\\mathtt{010}=\\mathtt{111}$, the sixth label of the list.'},
{t:'p', text:'With Gray labels a neighbour costs one bit of the $k$ bits of a symbol. The bit error is then the symbol error divided by $k$.'},
{t:'eqbox', cap:'Bits from symbols', tex:'P_b\\approx\\frac{P_e}{\\log_2M}',
 after:'For example, 8-PSK with Gray labels at $P_e=3\\times10^{-3}$ has $P_b\\approx P_e/3=10^{-3}$.'},
{t:'box', kind:'warn', hd:'Natural labels', html:'Natural labels put $\\mathtt{011}$ beside $\\mathtt{100}$. That one symbol error costs three bits.'},
{t:'figrow', n:2, items:[
 {svg:()=>figGray(false), cap:'8-PSK with natural labels. Each chord shows how many bits its two labels differ in. The chords between $\\mathtt{011}$ and $\\mathtt{100}$ and between $\\mathtt{111}$ and $\\mathtt{000}$ cost three.', short:'8-PSK with natural labels.'},
 {svg:()=>figGray(true), cap:'8-PSK with Gray labels. Every chord costs one bit.'}
]},

{t:'ex', hd:'Example 5.2 — 8-PSK', rows:[
 ['Given','8-PSK with Gray labels at $E_b/N_0=10$ dB.'],
 ['Find','The symbol error $P_e$ and the bit error $P_b$.'],
 ['Method','Use the nearest-neighbour form, since each point has two neighbours at $d_{\\min}$. First turn $E_b/N_0$ into $E_s/N_0$. Then divide $P_e$ by $3$ for Gray labels.'],
 ['Solution','$10$ dB is a ratio of $10$, and each symbol carries $3$ bits, so $E_s/N_0=3(10)=30$. The argument of $Q$ is $x=\\sqrt{2(30)}\\,\\sin(\\pi/8)=2.96$. So $P_e\\approx2Q(2.96)=2(1.52\\times10^{-3})=3.0\\times10^{-3}$ and $P_b\\approx P_e/3=1.0\\times10^{-3}$.'],
 ['Check','The sent point sits inside a wedge of $\\pm22.5^{\\circ}$. Each of its two neighbours, $d_{\\min}$ away, contributes one $Q$ term.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $E_s=3E_b$, not $E_b$, inside $Q$. With $E_b$ the argument is $1.71$ and $P_e$ comes out as $0.087$.'},
{t:'fig', svg:()=>nar(figExPSK(),0.55), cap:'Example 5.2: the sent point $\\mathbf s_0$ and its wedge of $\\pm22.5^{\\circ}$. The red half-planes lie nearer a neighbour, each $d_{\\min}$ away.'},

{t:'h3', text:'A carrier phase error'},
{t:'p', text:'A receiver whose carrier is off by $\\varphi$ receives'},
{t:'eqbox', cap:'A phase error', tex:'r(t)=\\sqrt{\\tfrac{2E_s}{T}}\\cos(2\\pi f_ct+\\theta_m+\\varphi)+n(t)',
 after:'It sees every point turned by $\\varphi$.'},
{t:'box', kind:'warn', hd:'Ambiguity', html:'M-PSK looks the same after a turn of $2\\pi/M$. A receiver can lock its carrier to any of these $M$ phases.'},
{t:'p', text:'For example, take QPSK with $\\varphi=90^{\\circ}$ and no noise. Each point lands exactly on a neighbour, so every symbol is decided as that neighbour. No decision is right.'},
{t:'p', text:'Differential encoding avoids the problem. It sends the bits in the change of phase from one symbol to the next. A constant $\\varphi$ then cancels.'},
{t:'fig', svg:()=>nar(figPhaseOffset(),0.55), cap:'QPSK with $200$ noisy symbols at a carrier phase error $\\varphi=20^{\\circ}$, decided in the fixed quadrants. The green rings are the points turned by $\\varphi$. Red dots are wrong decisions.', short:'QPSK with a carrier phase error of 20 degrees.'},

{t:'h3', text:'Differential PSK'},
{t:'p', text:'Differential PSK (DPSK) puts each bit in the change of phase, not in the phase itself.'},
{t:'eqbox', cap:'Differential encoding', tex:'\\theta_n=\\theta_{n-1}+\\pi b_n\\pmod{2\\pi}'},
{t:'p', text:'For example, send the bits $1\\,0\\,1\\,1$ from $\\theta_0=0$. A one adds $\\pi$ and a zero adds nothing.'},
{t:'eq', tex:'\\theta_1=\\pi,\\quad \\theta_2=\\pi,\\quad \\theta_3=2\\pi\\equiv0,\\quad \\theta_4=\\pi'},
{t:'p', text:'Three ones add $3\\pi$, which is $\\pi$ modulo $2\\pi$. So the final phase is $\\theta_4=\\pi$.'},
{t:'p', text:'The receiver compares each received point with the one before. Their dot product is $\\|\\mathbf y_n\\|\\|\\mathbf y_{n-1}\\|\\cos(\\theta_n-\\theta_{n-1})$, which is negative when the phase has changed by $\\pi$.'},
{t:'eqbox', cap:'Differential detection', tex:'\\hat b_n=1\\quad\\text{when}\\quad\\mathbf y_n\\cdot\\mathbf y_{n-1}<0',
 after:'A constant phase error turns both points by the same angle. A turn does not change the dot product, so the error cancels.'},
{t:'box', kind:'warn', hd:'Errors in pairs', html:'One badly received symbol spoils two comparisons, with the symbol before and the one after. DPSK errors tend to come in pairs.'},
{t:'fig', svg:()=>nar(figDPSK(),0.6), cap:'Differential encoding of the bits $1\\,0\\,1\\,1$ from $\\theta_0=0$. A one adds $\\pi$ to the phase and a zero adds nothing, so $\\theta_n/\\pi$ runs $0,1,1,0,1$.'},

{t:'h3', text:'DPSK error probability'},
{t:'p', text:'Binary DPSK needs no carrier phase. The previous symbol is the reference.'},
{t:'eqbox', cap:'Key result · binary DPSK', tex:'P_b=\\frac12e^{-E_b/N_0}'},
{t:'p', text:'The price is small. Solve $\\tfrac12e^{-x}=10^{-5}$ for the ratio $x=E_b/N_0$.'},
{t:'eq', tex:'x=\\ln\\bigl(5\\times10^{4}\\bigr)=10.82,\\qquad 10\\log_{10}10.82=10.34\\text{ dB}'},
{t:'p', text:'At $P_b=10^{-5}$ binary DPSK needs $10.34$ dB against $9.59$ dB for BPSK. It costs $0.75$ dB, less than $1$ dB. At $E_b/N_0=10$ dB, $P_b=\\tfrac12e^{-10}=2.27\\times10^{-5}$, where BPSK gives $3.87\\times10^{-6}$.'},
{t:'box', kind:'warn', hd:'Four phases and more', html:'For $M\\ge4$, differential detection costs about $3$ dB over coherent PSK. The reference symbol is as noisy as the one decided.'},
{t:'fig', svg:()=>nar(figDPSKPe(),0.6), cap:'Bit error of coherent BPSK (solid) and binary DPSK (dashed). At $10^{-5}$ they are $0.75$ dB apart. The dots read both at $E_b/N_0=10$ dB.', short:'Bit error of binary DPSK against BPSK.'},

{t:'h3', text:'Phase keying around us'},
{t:'ul', items:[
 '802.11b Wi-Fi at $1$ Mb/s sends one bit a microsecond as a phase change of $0$ or $\\pi$: $\\theta_n=\\theta_{n-1}+\\pi b_n$. At $2$ Mb/s it uses four phase changes.',
 'Satellite television (DVB-S) sends QPSK with Gray labels. Each bit sees its own BPSK link, $P_b=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$.',
 'Bluetooth EDR at $2$ Mb/s uses $\\pi/4$-DQPSK. Each symbol turns the phase by $\\Delta\\theta\\in\\{\\pm\\pi/4,\\pm3\\pi/4\\}$, so no step passes through the origin.',
 'Satellite DVB-S2 adds 8PSK to QPSK. Neighbouring points are $d_{\\min}=2\\sqrt{E_s}\\sin(\\pi/8)=0.765\\sqrt{E_s}$ apart.'
]},
{t:'ul', items:[
 '<b>Phase alone.</b> PSK keeps the amplitude constant. The power amplifier sees one level.',
 '<b>Differential phase.</b> 802.11b and Bluetooth EDR carry the bits in phase changes. The receiver needs no absolute carrier phase.',
 '<b>Crowding.</b> Beyond eight points the circle crowds. Satellite links then add a second ring, and other links move to QAM.'
]},

/* ------------------------------------------------------------------ 5.3 --- */
{t:'h2', num:'5.3', text:'Amplitude and quadrature'},

{t:'h3', text:'M-ary amplitude-shift keying'},
{t:'p', text:'M-ary amplitude-shift keying (M-ASK), also called PAM, puts $M$ equally spaced amplitudes on one carrier. Neighbours are $d$ apart.'},
{t:'eqbox', cap:'M-ASK', tex:'s_m=(2m-1-M)\\,\\frac d2,\\qquad m=1,\\ldots,M',
 after:'The amplitudes are $\\pm d/2$, $\\pm3d/2$, and so on.'},
{t:'p', text:'The average energy is the mean of the squared amplitudes, with each level equally likely.'},
{t:'eq', tex:'E_s=\\frac1M\\sum_{m=1}^{M}s_m^{2}=\\frac{d^{2}}{4M}\\sum_{m=1}^{M}(2m-1-M)^{2}'},
{t:'p', text:'The numbers $2m-1-M$ run over the odd values $\\pm1,\\pm3,\\ldots,\\pm(M-1)$. Their squares sum to $M(M^{2}-1)/3$. For $M=4$ that is $1+9+1+9=20=4(15)/3$.'},
{t:'eqbox', cap:'Average energy', tex:'E_s=\\frac{d^{2}}{4M}\\cdot\\frac{M(M^{2}-1)}{3}=\\frac{(M^{2}-1)\\,d^{2}}{12}',
 after:'4-ASK with levels $\\pm1$, $\\pm3$ has $d=2$ and $E_s=(1+9+9+1)/4=5$, or $(16-1)(4)/12=5$.'},
{t:'p', text:'Count the neighbours. The average count is $\\bar N_{\\min}=\\bigl(2(M-2)+2\\bigr)/M=2(M-1)/M$. Then write $d$ in terms of $E_s$.'},
{t:'eq', tex:'d^{2}=\\frac{12E_s}{M^{2}-1}\\quad\\Longrightarrow\\quad\\frac{d^{2}}{2N_0}=\\frac{6E_s}{(M^{2}-1)N_0}'},
{t:'eqbox', cap:'Key result · M-ASK', tex:'P_e=\\frac{2(M-1)}{M}\\,Q\\!\\left(\\sqrt{\\frac{6E_s}{(M^{2}-1)N_0}}\\right)',
 after:'Inner points have two neighbours and the end points one. Each doubling of $M$ costs about $6$ dB.'},
{t:'fig', svg:()=>nar(figMask(4),0.6), cap:'4-ASK on one axis at unit average energy, with its thresholds halfway between levels. The spacing shrinks as $\\sqrt{12/(M^{2}-1)}$.'},

{t:'ex', hd:'Example 5.3 — four-level ASK', rows:[
 ['Given','4-ASK with levels $\\pm A$, $\\pm3A$ at $E_s/N_0=25$.'],
 ['Find','The symbol error $P_e$, and the average neighbour count $\\bar N_{\\min}$.'],
 ['Method','Use the nearest-neighbour form. Write $d_{\\min}=2A$ in terms of $E_s$, and count the neighbours of each point.'],
 ['Solution','$E_s=A^{2}(9+1+1+9)/4=5A^{2}$ and $d_{\\min}=2A$, so $d_{\\min}^{2}/2N_0=4A^{2}/2N_0=2E_s/5N_0=2(25)/5=10$. The end points have $1$ neighbour and the inner two have $2$, so $\\bar N_{\\min}=(1+2+2+1)/4=1.5$. Then $P_e\\approx1.5\\,Q(\\sqrt{10})=1.5(7.83\\times10^{-4})=1.17\\times10^{-3}$.'],
 ['Check','The M-ASK formula with $M=4$ gives the same: $2(3)/4=1.5$ and $6(25)/15=10$.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $\\bar N_{\\min}=1.5$, not $2$. The two end points have one neighbour each.'},
{t:'fig', svg:()=>nar(figExASK4(),0.6), cap:'Example 5.3: four levels at $\\pm A$, $\\pm3A$ with the neighbour count of each point, $1$, $2$, $2$, $1$, and their average $1.5$.'},

{t:'h3', text:'Quadrature amplitude modulation'},
{t:'p', text:'Quadrature amplitude modulation (QAM) runs one ASK signal on the cosine and another on the sine. Square M-QAM is two $\\sqrt M$-level ASK axes at right angles.'},
{t:'eqbox', cap:'Square QAM', tex:'s(t)=I\\cos(2\\pi f_ct)-Q\\sin(2\\pi f_ct),\\qquad I,\\,Q\\in\\left\\{\\pm\\tfrac d2,\\pm\\tfrac{3d}{2},\\ldots\\right\\}',
 after:'Each axis carries $\\sqrt M$ levels, $d$ apart. Gray labels on each axis give neighbours that differ in one bit.'},
{t:'p', text:'The energy of a point is the sum of the energies on the two axes. Each axis is a $\\sqrt M$-level ASK, so put $\\sqrt M$ in place of $M$ in the ASK energy.'},
{t:'eqbox', cap:'Average energy', tex:'E_s=2\\cdot\\frac{\\bigl((\\sqrt M)^{2}-1\\bigr)d^{2}}{12}=\\frac{(M-1)\\,d^{2}}{6}',
 after:'16-QAM with $d=2$ gives $E_s=15(4)/6=10$.'},
{t:'p', text:'Count the neighbours of 16-QAM. Its $4$ corners have $2$ neighbours, its $8$ edge points $3$ and its $4$ inner points $4$.'},
{t:'eq', tex:'\\bar N_{\\min}=\\frac{4(2)+8(3)+4(4)}{16}=\\frac{48}{16}=3=4\\Bigl(1-\\frac{1}{\\sqrt{16}}\\Bigr)'},
{t:'p', text:'In general $\\bar N_{\\min}=4(1-1/\\sqrt M)$. The distance in terms of $E_s$ is $d^{2}=6E_s/(M-1)$, so $d^{2}/2N_0=3E_s/((M-1)N_0)$.'},
{t:'eqbox', cap:'Key result · square QAM', tex:'P_e\\approx4\\left(1-\\frac{1}{\\sqrt M}\\right)Q\\!\\left(\\sqrt{\\frac{3E_s}{(M-1)N_0}}\\right)'},
{t:'figrow', n:2, items:[
 {svg:()=>figQAM(false), cap:'16-QAM as 4-ASK on the cosine and 4-ASK on the sine, with Gray labels on each axis.'},
 {svg:()=>figQAM(true), cap:'The neighbours of each 16-QAM point: $2$ at a corner, $3$ on an edge, $4$ inside. Their average is $\\bar N_{\\min}=48/16=3$.'}
]},

{t:'h3', text:'QAM error probability'},
{t:'p', text:'A symbol is right only when both axes are right. Each axis is a $\\sqrt M$-level ASK with its own error $P_{\\sqrt M}$.'},
{t:'eqbox', cap:'Exact square QAM', tex:'P_e=1-\\bigl(1-P_{\\sqrt M}\\bigr)^{2},\\qquad P_{\\sqrt M}=2\\left(1-\\tfrac{1}{\\sqrt M}\\right)Q\\!\\left(\\sqrt{\\tfrac{3E_s}{(M-1)N_0}}\\right)'},
{t:'p', text:'Expand the square to compare this with the nearest-neighbour form.'},
{t:'eq', tex:'1-\\bigl(1-P_{\\sqrt M}\\bigr)^{2}=2P_{\\sqrt M}-P_{\\sqrt M}^{2}'},
{t:'p', text:'The nearest-neighbour form keeps only $2P_{\\sqrt M}$. At high SNR the square is tiny, so the two forms are close. For example, $P_{\\sqrt M}=10^{-3}$ gives $P_e=1-(1-10^{-3})^{2}=1.999\\times10^{-3}$, about $2\\times10^{-3}$.'},
{t:'box', kind:'warn', hd:'Three dB a bit', html:'At a fixed $d_{\\min}$, $E_s$ grows as $M-1$. Doubling $M$ nearly doubles $M-1$, so each extra bit a symbol costs about $3$ dB of $E_s/N_0$.'},
{t:'fig', svg:()=>nar(figQAMPe(),0.6), cap:'Symbol error of square QAM for $M=4$, $16$ and $64$. Solid: exact. Dashed: nearest-neighbour form. The dot reads 16-QAM at $E_b/N_0=12$ dB.', short:'Symbol error of square QAM.'},

{t:'h3', text:'Eight-point constellations'},
{t:'p', text:'Take four sets of eight points, all with neighbours $d_{\\min}=2$ apart. At high SNR they err at about the same rate. The best set needs the least energy.'},
{t:'p', text:'The average energy of each set is the mean of $x^{2}+y^{2}$ over its points. Each set has four points at one radius and four at another.'},
{t:'eq', tex:'\\begin{aligned}\\text{(a)}\\quad E&=\\tfrac18\\bigl(4\\cdot2+4\\cdot10\\bigr)=6\\\\\\text{(b)}\\quad E&=\\tfrac18\\bigl(4\\cdot2+4\\cdot2(1+\\sqrt2)^{2}\\bigr)=6.83\\\\\\text{(c)}\\quad E&=\\tfrac18\\bigl(4\\cdot4+4\\cdot8\\bigr)=6\\\\\\text{(d)}\\quad E&=\\tfrac18\\bigl(4\\cdot2+4(1+\\sqrt3)^{2}\\bigr)=4.73\\end{aligned}'},
{t:'p', text:'Set (d) puts four points on an inner square at $(\\pm1,\\pm1)$ and four on the axes at $1+\\sqrt3$. The point $(1+\\sqrt3,0)$ is $\\sqrt{3+1}=2$ from $(1,1)$, so $d_{\\min}$ stays $2$.'},
{t:'eqbox', cap:'Gain', tex:'10\\log_{10}\\frac{6}{4.73}=1.03\\text{ dB}',
 after:'Set (d) saves about $1$ dB over the rectangle (a). The packing matters, not the grid.'},
{t:'fig', svg:()=>figShapes(), cap:'Four sets of eight points, each with $d_{\\min}=2$ (violet chord), and the average energy of each. Set (d) needs the least.', short:'Four eight-point constellations.'},

{t:'ex', hd:'Example 5.4 — 16-QAM', rows:[
 ['Given','16-QAM with $d_{\\min}=2$ and $E_s/N_0=80$, about $19$ dB.'],
 ['Find','The energy $E_s$, the symbol error $P_e$ and the bit error $P_b$ with Gray labels.'],
 ['Method','Use the nearest-neighbour form of square QAM. Find $E_s$ from $d$, write $d_{\\min}^{2}/2N_0$ in terms of $E_s/N_0$, and divide $P_e$ by $4$ bits.'],
 ['Solution','$E_s=(M-1)d^{2}/6=15(4)/6=10$. Then $d_{\\min}^{2}/2N_0=3E_s/15N_0=E_s/5N_0=16$, and $\\bar N_{\\min}=3$. So $P_e\\approx3\\,Q(\\sqrt{16})=3\\,Q(4)=9.5\\times10^{-5}$ and $P_b\\approx P_e/4=2.4\\times10^{-5}$.'],
 ['Check','The grid $\\pm1$, $\\pm3$ on both axes gives $E_s=5+5=10$ directly. The boundaries sit halfway between levels, at $0$ and $\\pm2$ on each axis.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $\\bar N_{\\min}=3$, not $4$. Only the four inner points have four neighbours.'},
{t:'fig', svg:()=>nar(figExQAM16(),0.55), cap:'Example 5.4: 16-QAM on the grid $\\pm1$, $\\pm3$ with its decision boundaries at $0$ and $\\pm2$ on each axis.'},

{t:'h3', text:'QAM against PSK'},
{t:'p', text:'At the same average energy, QAM spreads its points over the plane and PSK keeps them on a circle. Both distances come from the results above.'},
{t:'eqbox', cap:'Distance at equal energy', tex:'d_{\\text{QAM}}^{2}=\\frac{6E_s}{M-1},\\qquad d_{\\text{PSK}}^{2}=4E_s\\sin^{2}\\frac{\\pi}{M}'},
{t:'p', text:'Their ratio measures the advantage of QAM. The energy $E_s$ cancels.'},
{t:'eqbox', cap:'Advantage', tex:'R_M=\\frac{d_{\\text{QAM}}^{2}}{d_{\\text{PSK}}^{2}}=\\frac{6E_s/(M-1)}{4E_s\\sin^{2}(\\pi/M)}=\\frac{3}{2(M-1)\\sin^{2}(\\pi/M)}',
 after:'Above $1$, QAM needs less energy for the same $d_{\\min}$.'},
{t:'p', text:'For $M=16$, $\\sin^{2}(\\pi/16)=0.0381$. So $R_{16}=3/\\bigl(30\\sin^{2}(\\pi/16)\\bigr)=2.63$, or $10\\log_{10}2.63=4.20$ dB.'},
{t:'p', text:'The gap grows with $M$. QAM saves $1.65$, $4.20$, $7.02$ and $9.95$ dB over PSK at $M=8$, $16$, $32$ and $64$. PSK uses only a circle, and QAM uses the whole plane.'},
{t:'fig', svg:()=>nar(figQAMvsPSK(),0.55), cap:'16-PSK (rings) and 16-QAM (dots) at the same $E_s=1$. The dashed chord is the PSK $d_{\\min}$ and the solid one the QAM $d_{\\min}$.'},

{t:'h3', text:'QAM around us'},
{t:'ul', items:[
 'Wi-Fi 6 uses QAM with up to $1024$ points, $10$ bits a symbol. At $E_s=1$ the points are $d_{\\min}=\\sqrt{6/1023}=0.077$ apart.',
 'LTE and 5G NR use QAM with up to $256$ points. Each axis then carries one of $16$ levels, $I[n]\\in\\{\\pm1,\\pm3,\\ldots,\\pm15\\}$.',
 'ADSL splits a phone line into tones $4.3125$ kHz apart. Tone $k$ carries $b_k$ bits as a QAM set of $2^{b_k}$ points. Higher tones arrive weaker and carry fewer bits.',
 'Digital cable television uses 64-QAM and 256-QAM. Each $\\mathbf r=\\mathbf s+\\mathbf n$ lands in a small cloud, here 64-QAM at $E_s/N_0=30$ dB.'
]},
{t:'ul', items:[
 '<b>Two PAM sets.</b> Square QAM puts one PAM set on each axis. The receiver decides each axis on its own.',
 '<b>Bits a symbol.</b> $256$ points carry $8$ bits a symbol and $1024$ points carry $10$.',
 '<b>Spacing.</b> At fixed energy $d_{\\min}^{2}=6E_s/(M-1)$. Going from $256$ to $1024$ points costs $6.0$ dB.'
]},

/* ------------------------------------------------------------------ 5.4 --- */
{t:'h2', num:'5.4', text:'Frequency-shift keying and orthogonal signals'},

{t:'h3', text:'M-ary frequency-shift keying'},
{t:'p', text:'M-ary FSK sends one of $M$ tones, each orthogonal to the others. The spacing $1/(2T)$ keeps every pair orthogonal, as for BFSK.'},
{t:'eqbox', cap:'M-FSK', tex:'s_m(t)=\\sqrt{\\frac{2E_s}{T}}\\cos\\bigl(2\\pi(f_c+m\\,\\Delta f)\\,t\\bigr),\\qquad \\Delta f=\\frac{1}{2T}',
 after:'Each tone is one axis of an $M$-dimensional space, with its point at $\\sqrt{E_s}$ on that axis.'},
{t:'p', text:'Two points on different axes are at right angles. By Pythagoras their squared distance is $E_s+E_s$.'},
{t:'eqbox', cap:'Distances', tex:'\\|\\mathbf s_i-\\mathbf s_j\\|^{2}=2E_s,\\qquad i\\ne j',
 after:'Every point is a neighbour of every other, so each has $M-1$ neighbours at one distance. 8-FSK has $7$.'},
{t:'p', text:'The union bound of Chapter 4 adds one $Q$ term for each of the $M-1$ neighbours. Each term has $d^{2}/2N_0=2E_s/2N_0=E_s/N_0$.'},
{t:'eqbox', cap:'Key result · orthogonal signals', tex:'P_e\\le(M-1)\\,Q\\!\\left(\\sqrt{\\frac{E_s}{N_0}}\\right),\\qquad E_s=E_b\\log_2M',
 after:'More tones add bits without bringing the points closer. The receiver picks the largest correlator output.'},
{t:'fig', svg:()=>nar(figMFSK(),0.55), cap:'Three orthogonal signals, one on each axis at $\\sqrt{E_s}$ from the origin. Every pair is $\\sqrt{2E_s}$ apart. A received point with $r_1>r_2>r_3$ is decided as $\\mathbf s_1$ (green ring).', short:'Three orthogonal signals and a decision.'},

{t:'h3', text:'More signals, less energy'},
{t:'p', text:'A wrong symbol is any of the other $M-1$ with equal chance. Take one bit position of the $k$-bit label. It differs from the sent bit in $2^{k-1}$ of the $2^{k}$ labels, and the sent label is not one of them.'},
{t:'eqbox', cap:'Bits from symbols', tex:'P_b=\\frac{2^{k-1}}{2^{k}-1}\\,P_e'},
{t:'p', text:'At $P_b=10^{-5}$, $M=2$ needs $12.6$ dB and $M=64$ about $6.1$ dB. Each doubling of $M$ lowers the $E_b/N_0$ needed.'},
{t:'box', kind:'warn', hd:'A floor', html:'The gain has a limit. As $M$ grows, $P_b\\to0$ only above $E_b/N_0=\\ln2$, or $-1.6$ dB. More signals move the curves toward this limit, not past it. Chapter 6 shows why.'},
{t:'fig', svg:()=>nar(figOrthM(),0.6), cap:'Exact bit error of $M$ orthogonal signals for $M=2$ to $64$, with $M=64$ drawn heavy. The curves move left as $M$ grows. The shaded wall at $-1.6$ dB is the limit Chapter 6 derives.', short:'Bit error of M orthogonal signals.'},

{t:'h3', text:'Noncoherent FSK'},
{t:'p', text:'A noncoherent receiver does not know the carrier phase. For each tone it uses a cosine and a sine correlator.'},
{t:'p', text:'A tone of unit amplitude and unknown phase $\\varphi$ gives $y_c=\\cos\\varphi$ and $y_s=\\sin\\varphi$. The length of $(y_c,y_s)$ is $\\sqrt{\\cos^{2}\\varphi+\\sin^{2}\\varphi}=1$, whatever $\\varphi$ is.'},
{t:'eqbox', cap:'Envelope detector', tex:'\\ell_i=\\sqrt{y_{c,i}^{2}+y_{s,i}^{2}}',
 after:'The envelope $\\ell_i$ does not depend on $\\varphi$. The receiver picks the larger $\\ell_i$.'},
{t:'p', text:'Without the phase, the tones must stay orthogonal for every $\\varphi$. Both the cosine and the sine correlations must then vanish.'},
{t:'eq', tex:'\\frac1T\\int_0^{T}\\cos(2\\pi\\Delta f\\,t)\\,dt=\\frac{\\sin(2\\pi\\Delta fT)}{2\\pi\\Delta fT},\\qquad \\frac1T\\int_0^{T}\\sin(2\\pi\\Delta f\\,t)\\,dt=\\frac{1-\\cos(2\\pi\\Delta fT)}{2\\pi\\Delta fT}'},
{t:'p', text:'Both are zero first at $2\\pi\\Delta fT=2\\pi$. This is twice the coherent spacing.'},
{t:'eqbox', cap:'Spacing', tex:'\\Delta f=\\frac1T'},
{t:'eqbox', cap:'Key result · noncoherent BFSK', tex:'P_b=\\frac12e^{-E_b/2N_0}',
 after:'At $10^{-5}$ it needs $13.4$ dB against $12.6$ dB coherent. The exponent holds $E_b/2N_0$ in place of $E_b/N_0$, so it needs twice the energy of binary DPSK.'},
{t:'fig', svg:()=>nar(figNoncoh(),0.6), cap:'A tone with unknown phase $\\varphi=60^{\\circ}$ gives $y_c=\\cos\\varphi$ and $y_s=\\sin\\varphi$, and its envelope stays $1$ (top). Coherent (solid) and noncoherent (dashed) BFSK, $12.6$ against $13.4$ dB at $10^{-5}$ (bottom).', short:'Noncoherent detection of FSK and its price.'},

{t:'h3', text:'Frequency keying around us'},
{t:'ul', items:[
 'Caller ID and radio packet modems (Bell 202) send $1200$ b/s as $1200$ Hz for a one and $2200$ Hz for a zero. The phase runs on across each switch.',
 'Bluetooth Low Energy sends $1$ Mb/s with Gaussian FSK (GFSK). A Gaussian filter rounds each switch of frequency, so the spectrum falls off faster.',
 'GSM sends GMSK: MSK whose frequency pulse passes a Gaussian filter with $BT_b=0.3$. The Gaussian pulse spreads over about three bits, where plain MSK holds one.',
 'Digital mobile radio (DMR) uses four-level FSK. Each symbol shifts the carrier by one of four offsets $\\{\\pm d,\\pm3d\\}$ and carries $2$ bits.'
]},
{t:'ul', items:[
 '<b>Frequency carries the bits.</b> FSK keeps a constant envelope. A cheap receiver can detect it without the carrier phase.',
 '<b>Smooth switching.</b> GFSK and GMSK smooth each change of frequency. The side lobes of the spectrum then fall off faster.',
 '<b>Band grows with M.</b> Orthogonal tones need a band that grows with $M$. Radio links therefore keep $M$ at $2$ or $4$.'
]},

/* ------------------------------------------------------------------ 5.5 --- */
{t:'h2', num:'5.5', text:'Bandwidth and the choice of scheme'},

{t:'h3', text:'Spectrum and bandwidth'},
{t:'p', text:'Take PSK or QAM with a rectangular pulse of length $T$. The pulse has the Fourier transform $T\\operatorname{sinc}(fT)$, so the spectrum of the signal is a $\\operatorname{sinc}^{2}$.'},
{t:'eqbox', cap:'Spectrum', tex:'S(f)\\propto T\\operatorname{sinc}^{2}(fT),\\qquad T=kT_b',
 after:'Here $\\operatorname{sinc}x=\\sin(\\pi x)/(\\pi x)$. Longer symbols give a narrower spectrum, and the passband copy sits at $\\pm f_c$.'},
{t:'p', text:'The $\\operatorname{sinc}^{2}$ is first zero at $f=\\pm1/T$, so the main lobe is $2/T=2R_b/k$ wide. At the same bit rate, QPSK symbols last $2T_b$. Its main lobe is $R_b$ wide, half the $2R_b$ of BPSK.'},
{t:'p', text:'A band $W$ carries $2W$ dimensions a second. A scheme that uses $N$ dimensions a symbol at $R_s=R_b/\\log_2M$ symbols a second needs $W=NR_s/2$. PAM on one sideband uses one dimension, PSK and QAM two, and orthogonal signals $M$.'},
{t:'eqbox', cap:'Band of each family', tex:'\\text{PAM (SSB): }\\frac{R_b}{2\\log_2M},\\qquad\\text{PSK, QAM: }\\frac{R_b}{\\log_2M},\\qquad\\text{orthogonal: }\\frac{MR_b}{2\\log_2M}',
 after:'Orthogonal signals need $M$ dimensions a symbol, so their band grows with $M$.'},
{t:'p', text:'For example, 16-QAM at $10$ Mb/s carries $4$ bits a symbol, so $W=10/4=2.5$ MHz.'},
{t:'fig', svg:()=>nar(figSpectrum(),0.6), cap:'PSK or QAM with a rectangular pulse at a fixed bit rate, for $k=2$ (solid) and $k=1$ (dashed). The main lobe narrows to $2R_b/k$ (top). The band each family needs at $k=2$ (bottom).', short:'Spectrum and band at two bits a symbol.'},

{t:'h3', text:'Offset QPSK and MSK'},
{t:'p', text:'QPSK can swing through the origin when $I$ and $Q$ change sign at the same time. Its envelope then falls to zero.'},
{t:'box', kind:'def', hd:'Offset QPSK', html:'Delay $Q$ by $T_b$. Only one axis changes at a time, so the path never crosses the origin and the envelope stays above $1/\\sqrt2$.'},
{t:'p', text:'Minimum-shift keying (MSK) goes further. Each bit shifts the frequency by $\\pm\\Delta f/2=\\pm1/(4T_b)$, which turns the phase by $2\\pi\\cdot\\frac{1}{4T_b}\\cdot T_b=\\pi/2$ over one bit.'},
{t:'eqbox', cap:'MSK', tex:'\\Delta\\theta=\\pm\\frac{\\pi}{2}\\ \\text{a bit},\\qquad \\Delta f=\\frac{1}{2T_b}',
 after:'Each bit turns the phase by $\\pm\\pi/2$ at a steady rate. MSK is BFSK at the least orthogonal spacing, with a continuous phase.'},
{t:'p', text:'Of the three, only MSK keeps a constant envelope. Its phase moves along the circle, so $|s(t)|$ never changes.'},
{t:'box', kind:'warn', hd:'Spectrum', html:'The MSK main lobe reaches $0.75/T_b$ against $0.5/T_b$, so it is $50\\%$ wider. Its side lobes fall much faster.'},
{t:'figrow', n:3, items:[
 {svg:()=>figMSKway(0), cap:'QPSK: the path of $(I,Q)$ crosses the origin, and the envelope drops to zero.'},
 {svg:()=>figMSKway(1), cap:'Offset QPSK: one axis moves at a time, and the envelope stays above $1/\\sqrt2$.'},
 {svg:()=>figMSKway(2), cap:'MSK: the path stays on the circle, and the envelope is constant.'}
]},
{t:'fig', svg:()=>nar(figMSKspec(),0.6), cap:'Spectra of QPSK and offset QPSK (dashed) and of MSK (solid). The MSK main lobe reaches $0.75/T_b$ against $0.5/T_b$, and its side lobes fall faster.', short:'Spectra of offset QPSK and MSK.'},

{t:'h3', text:'The bandwidth-efficiency plane'},
{t:'p', text:'The bandwidth efficiency counts the bits a second that each hertz of band carries.'},
{t:'eqbox', cap:'Bandwidth efficiency', tex:'r=\\frac{R_b}{W}\\ \\text{b/s/Hz}',
 after:'From the bands above, PSK and QAM have $r=\\log_2M$, PAM on one sideband $r=2\\log_2M$, and orthogonal signals $r=2\\log_2M/M$.'},
{t:'p', text:'PAM, PSK and QAM raise $r$ with $M$. Orthogonal signals lower it. Each family then sits on a plane of $r$ against the $E_b/N_0$ it needs.'},
{t:'table', cap:'The two regions of the bandwidth-efficiency plane.', head:['Region','Families','Trade'], rows:[
 ['$r>1$: bandwidth-limited','PAM, PSK, QAM','More bits a symbol, more energy a bit.'],
 ['$r<1$: power-limited','Orthogonal signals','More band, less energy a bit.']
]},
{t:'box', kind:'warn', hd:'A limit', html:'No scheme sits left of the curve $E_b/N_0=(2^{r}-1)/r$. Chapter 6 derives it.'},
{t:'p', text:'For example, 64-QAM carries $6$ bits a symbol, so $r=6>1$. It is bandwidth-limited: it saves band and pays in energy.'},
{t:'fig', svg:()=>nar(figPlane(),0.6), cap:'$R_b/W$ against the $E_b/N_0$ each set needs for $P_e=10^{-5}$, for $M$ up to $64$. The faint curve is the limit Chapter 6 derives.', short:'The bandwidth-efficiency plane.'},

{t:'h3', text:'Comparing the families'},
{t:'p', text:'PAM, PSK and QAM are bandwidth-limited. They pay energy for each extra bit, and QAM pays the least of the three. Orthogonal signals are power-limited. They need less $E_b/N_0$ as $M$ grows, at the price of band.'},
{t:'table', cap:'Each family at $M=16$ and $P_e=10^{-5}$.', head:['Family','$E_b/N_0$','$r=R_b/W$','Region'], rows:[
 ['PAM (SSB)','$23.1$ dB','$8$','bandwidth-limited'],
 ['PSK','$18.1$ dB','$4$','bandwidth-limited'],
 ['QAM','$14.0$ dB','$4$','bandwidth-limited'],
 ['Orthogonal (FSK)','$7.7$ dB','$0.5$','power-limited']
]},
{t:'p', text:'The same $4$ bits a symbol cost four very different amounts of energy. Sixteen orthogonal tones need about $7.7$ dB, and 16-QAM about $14.0$ dB.'},
{t:'fig', svg:()=>nar(figCompare(),0.6), cap:'The $E_b/N_0$ each family needs for $P_e=10^{-5}$, against the bits a symbol. PAM and PSK climb fastest, QAM more slowly, and orthogonal signals fall.', short:'Energy per bit of each family against bits a symbol.'},

{t:'h3', text:'Adaptive modulation'},
{t:'p', text:'Adaptive modulation uses this trade as the channel changes. The receiver measures $E_s/N_0$ and reports it. The transmitter picks the largest $M$ that still meets the target bit error.'},
{t:'table', cap:'The $E_s/N_0$ each set needs for $P_b=10^{-5}$ with Gray labels.', head:['Set','Bits a symbol','$E_s/N_0$ for $P_b=10^{-5}$'], rows:[
 ['BPSK','$1$','$9.6$ dB'],
 ['QPSK','$2$','$12.6$ dB'],
 ['16-QAM','$4$','$19.5$ dB'],
 ['64-QAM','$6$','$25.6$ dB'],
 ['256-QAM','$8$','$31.5$ dB']
]},
{t:'p', text:'Each step of two bits costs about $6$ dB. The symbol rate stays fixed, so every step adds bits in the same band. A fading channel moves the link up and down the steps.'},
{t:'p', text:'For example, a channel that gives $E_s/N_0=22$ dB clears the 16-QAM step at $19.5$ dB but not 64-QAM at $25.6$ dB. The link chooses 16-QAM.'},
{t:'fig', svg:()=>nar(figAdaptive(),0.6), cap:'The largest set whose bit error stays at $10^{-5}$, with Gray labels, against $E_s/N_0$. At $22$ dB the link sends 16-QAM.', short:'Adaptive modulation against the signal-to-noise ratio.'},

{t:'h3', text:'The receiver noise floor'},
{t:'p', text:'A power in dBm is in decibels above $1$ mW, $P_{\\text{dBm}}=10\\log_{10}(P/1\\ \\text{mW})$. A ratio in dB adds to a power in dBm.'},
{t:'p', text:'Every receiver hears thermal noise. At the reference temperature $T_0=290$ K its density is $kT_0$, with Boltzmann\'s constant $k=1.38\\times10^{-23}$ J/K. The receiver adds noise of its own, counted by the noise figure $F\\ge1$.'},
{t:'eqbox', cap:'Thermal noise', tex:[
  'N_0=kT_0F,\\qquad kT_0=(1.38\\times10^{-23})(290)=4.00\\times10^{-21}\\ \\text{W/Hz}',
  '10\\log_{10}\\frac{4.00\\times10^{-21}\\ \\text{W/Hz}}{10^{-3}\\ \\text{W}}=-174\\ \\text{dBm/Hz},\\qquad \\text{NF}=10\\log_{10}F'],
 after:'The noise figure in dB is $\\text{NF}$. A receiver that adds no noise has $F=1$, or $\\text{NF}=0$ dB.'},
{t:'box', kind:'warn', hd:'One-sided density', html:'$kT_0F$ is $N_0$, not $N_0/2$. The two-sided density $N_0/2$ is $3$ dB lower, $-177$ dBm/Hz with $F=1$. It covers both signs of $f$, so both give $N=N_0B$.'},
{t:'p', text:'A band of width $B$ collects the noise power $N=N_0B$. In decibels the product becomes a sum.'},
{t:'eqbox', cap:'Noise power in a band', tex:'N=N_0B,\\qquad N_{\\text{dBm}}=-174+\\text{NF}+10\\log_{10}B',
 after:'For $B=10$ MHz, $10\\log_{10}10^{7}=70$. With $\\text{NF}=5$ dB the noise floor is $N=-174+5+70=-99$ dBm.'},
{t:'p', text:'The noise floor grows as $10\\log_{10}B$. A receiver that widens its band from $1$ MHz to $10$ MHz raises it by $10\\log_{10}10=10$ dB.'},
{t:'fig', svg:()=>nar(figNoise(),0.6), cap:'Noise power against the band. Dashed: thermal noise alone. Solid: a receiver with noise figure $\\text{NF}=5$ dB, which lies $5$ dB higher. The guides read the floor at $B=10$ MHz.', short:'The receiver noise floor against the band.'},

{t:'h3', text:'Sensitivity and the link budget'},
{t:'p', text:'The sensitivity $P_{\\min}$ is the least received power that meets the target error. The energy a bit is the received power times the bit time, $E_b=P_r/R_b$. So $E_b/N_0=P_r/(R_bN_0)$. Solve for $P_r$ at the required ratio.'},
{t:'eq', tex:'P_{\\min}=\\Big(\\frac{E_b}{N_0}\\Big)_{\\text{req}}R_bN_0=\\Big(\\frac{E_b}{N_0}\\Big)_{\\text{req}}R_b\\,kT_0F'},
{t:'eqbox', cap:'Sensitivity', tex:'P_{\\min}=-174+\\text{NF}+10\\log_{10}R_b+\\Big(\\frac{E_b}{N_0}\\Big)_{\\text{req,dB}}\\ \\text{dBm}',
 after:'The band cancels. QPSK at $10$ Mb/s needs $E_b/N_0=9.6$ dB for $P_b=10^{-5}$. With $\\text{NF}=5$ dB it needs $-174+5+70+9.6=-89.4$ dBm.'},
{t:'p', text:'The received power comes from the transmit power, the two antennas and the path. In free space the Friis formula gives it. The antenna gains $G_t$ and $G_r$ are measured against an antenna that radiates equally in every direction, and $\\lambda=c/f_c$ is the wavelength.'},
{t:'eq', tex:'P_r=P_tG_tG_r\\Big(\\frac{\\lambda}{4\\pi d}\\Big)^{2}'},
{t:'p', text:'Take $10\\log_{10}$ of both sides. The products become sums, and the last factor becomes the path loss $L_p$.'},
{t:'eqbox', cap:'Free-space budget', tex:'P_r=P_t+G_t+G_r-L_p,\\qquad L_p=20\\log_{10}\\frac{4\\pi d}{\\lambda}',
 after:'Powers are in dBm and antenna gains in dBi. At $2.4$ GHz, $\\lambda=12.5$ cm and $L_p=20\\log_{10}(4\\pi\\cdot1000/0.125)=100.0$ dB at $1$ km.'},
{t:'p', text:'The loss $L_p$ grows with $d^{2}$. Each doubling of the range raises it by $20\\log_{10}2=6$ dB, so $P_r$ falls by $6$ dB.'},
{t:'p', text:'The margin $P_r-P_{\\min}$ covers fading and losses the free-space model leaves out. The range of a link is the largest $d$ at which the margin is still met.'},
{t:'p', text:'Take $P_t=20$ dBm and two $10$ dBi antennas at $2.4$ GHz. At $1$ km, $P_r=20+10+10-100.0=-60.0$ dBm, which is $29.4$ dB above the QPSK sensitivity of $-89.4$ dBm. Keeping a $10$ dB margin allows $L_p=119.4$ dB, a range of $9.3$ km.'},
{t:'fig', svg:()=>nar(figBudget(),0.6), cap:'The budget at $d=1$ km: $P_t=20$ dBm, two $10$ dBi antennas and the path loss at $2.4$ GHz, against the sensitivity of QPSK at $10$ Mb/s. The violet bracket is the margin.', short:'A free-space link budget at 1 km.'},

{t:'ex', hd:'Example 5.5 — a link budget', rows:[
 ['Given','A $5.8$ GHz link has a band $B=25$ MHz with roll-off $\\alpha=0.25$. It has $P_t=20$ dBm, $G_t=G_r=12$ dBi and $\\text{NF}=7$ dB, and it keeps a $15$ dB margin. For $P_b=10^{-5}$, QPSK needs $E_b/N_0=9.6$ dB and 16-QAM $13.4$ dB.'],
 ['Find','The bit rate, the sensitivity and the range of each scheme. Which reaches farther?'],
 ['Method','The band fixes the symbol rate $R_s=B/(1+\\alpha)$. The sensitivity follows from $R_b$ and $\\text{NF}$. The allowed loss is $L_p=P_t+G_t+G_r-P_{\\min}-\\text{margin}$, and inverting $L_p=20\\log_{10}(4\\pi d/\\lambda)$ gives $d=(\\lambda/4\\pi)\\,10^{L_p/20}$.'],
 ['Solution','$R_s=25/1.25=20$ Msym/s, so QPSK carries $40$ Mb/s and 16-QAM $80$ Mb/s. Then $10\\log_{10}(40\\times10^{6})=76.0$ and $10\\log_{10}(80\\times10^{6})=79.0$, and $-174+\\text{NF}=-167$ dBm/Hz. QPSK: $P_{\\min}=-167+76.0+9.6=-81.4$ dBm and $L_p=20+24+81.4-15=110.4$ dB. 16-QAM: $P_{\\min}=-167+79.0+13.4=-74.6$ dBm and $L_p=20+24+74.6-15=103.6$ dB. With $\\lambda=3\\times10^{8}/5.8\\times10^{9}=5.17$ cm, $\\lambda/4\\pi=4.12\\times10^{-3}$ m. So QPSK reaches $d=4.12\\times10^{-3}\\cdot10^{110.4/20}=1.36$ km and 16-QAM $d=4.12\\times10^{-3}\\cdot10^{103.6/20}=0.62$ km. QPSK reaches farther.'],
 ['Check','The two sensitivities differ by $-74.6-(-81.4)=6.8$ dB: $3.8$ dB of $E_b/N_0$ and $3.0$ dB of bit rate. A loss $6.8$ dB smaller is a range $10^{6.8/20}=2.19$ times shorter, and $1.36/0.62=2.19$.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $20\\log_{10}$, not $10\\log_{10}$, to turn a loss into range. A loss of $6.8$ dB is a factor $2.2$ in range, not $4.8$. The loss $L_p$ grows with $d^{2}$.'},
{t:'fig', svg:()=>nar(figExLink(),0.6), cap:'Example 5.5: received power against distance, with each sensitivity plus the $15$ dB margin. Where they cross is the range.', short:'The link budget of Example 5.5 against distance.'},

{t:'h3', text:'Choosing a scheme around us'},
{t:'ul', items:[
 'Satellite DVB-S2 also sends 16APSK: $4$ points on an inner ring and $12$ on an outer ring. Two amplitudes suit a satellite amplifier better than the three of 16-QAM.',
 'Bluetooth Classic sends $1$ million symbols a second. GFSK carries $1$ bit a symbol, $\\pi/4$-DQPSK carries $2$ and 8DPSK $3$, for $1$, $2$ and $3$ Mb/s.',
 'GSM sends GMSK, whose envelope stays constant. A 16-QAM envelope jumps between three levels, so its amplifier must stay linear.',
 'LTE and 5G NR change the modulation as the channel changes, from QPSK with $k=2$ up to 256-QAM with $k=8$ bits a symbol.'
]},
{t:'ul', items:[
 '<b>Energy or band.</b> A link short of band packs more bits into each symbol. A link short of energy spreads them over orthogonal signals.',
 '<b>Amplifier cost.</b> A constant envelope lets the amplifier run near saturation. That matters in a handset and on a satellite.',
 '<b>Adapt.</b> Most modern links measure the channel and change $M$ as it changes.'
]},

/* ------------------------------------------------------------------ 5.6 --- */
{t:'h2', num:'5.6', text:'Summary'},

{t:'h3', text:'From bits to decisions'},
{t:'p', text:'A link carries bits to decisions in four moves.'},
{t:'ol', items:[
 'Map $k$ bits to a point of the set.',
 'The IQ modulator puts the point on the carrier.',
 'Two correlators turn $r(t)$ into $\\mathbf r$.',
 'The receiver picks the nearest point.'
]},
{t:'p', text:'Here the error rate follows from $E_b/N_0$ and the set. Chapter 6 asks how many bits a second a band and a power can carry at all.'},
{t:'p', text:'The number of bits a second is the symbol rate times $k=\\log_2M$. For example, 16-QAM at $10^{6}$ symbols a second carries $k=\\log_216=4$ bits a symbol, so $4\\times10^{6}$ b/s.'},
{t:'fig', svg:()=>nar(figChain(),0.6), cap:'The bits $\\mathtt{10}$ through a QPSK link. Top: the point $(1,-1)$ and the received point. Middle: the carrier $s(t)$ (faint) and the noisy $r(t)$. Bottom: the two correlator outputs, which end at $r_1$ and $r_2$.', short:'Two bits through a QPSK link.'},

{t:'h3', text:'Quick check'},
{t:'q', n:'1', text:'BPSK reaches $P_b=10^{-5}$ at $9.6$ dB. Where does BFSK reach it?', ans:'$12.6$ dB. Half the squared distance costs $3$ dB.'},
{t:'q', n:'2', text:'How many bits does each 8-PSK symbol carry?', ans:'$3$ bits, since $\\log_28=3$.'},
{t:'q', n:'3', text:'4-ASK moves to 8-ASK at the same $d_{\\min}$. By about how much does $E_s$ grow?', ans:'About $6$ dB. $E_s\\propto M^{2}-1$, so $10\\log_{10}(63/15)=6.2$ dB.'},
{t:'q', n:'4', text:'Against what does a DPSK receiver decide each symbol?', ans:'The previous symbol. The bit is in the change of phase from the symbol before.'},
{t:'q', n:'5', text:'Orthogonal signals at a fixed bit rate go from $M=8$ to $M=16$. What does the band do?', ans:'It widens. $W=MR_b/(2\\log_2M)$ goes from $1.33R_b$ to $2R_b$.'},
{t:'q', n:'6', text:'At a fixed bit rate, how wide is the QPSK main lobe next to that of BPSK?', ans:'Half as wide. Its symbols last twice as long.'},

{t:'h3', text:'Results of the chapter'},
{t:'table', cap:'Summary of Chapter 5: the results the chapter carries forward.', head:['Question','Result','Anchor'], rows:[
 ['What does a carrier do to the spectrum?','$U(f)=\\tfrac12S(f-f_c)+\\tfrac12S(f+f_c)$. The band doubles to $2W$ and the energy halves.','PS CH8.5.1'],
 ['What does the IQ modulator send?','$s(t)=I\\cos(2\\pi f_ct)-Q\\sin(2\\pi f_ct)$: one point of the plane a symbol.','PS CH8.6, 8.7'],
 ['How do the binary schemes compare?','BPSK: $Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$. BFSK and BASK: $Q\\bigl(\\sqrt{E_b/N_0}\\bigr)$, $3$ dB worse.','PS CH8.3.3, 8.6.1, 9.5'],
 ['What is the M-PSK neighbour distance?','$d_{\\min}=2\\sqrt{E_s}\\sin(\\pi/M)$, and $P_e\\approx2Q\\bigl(\\sqrt{2E_s/N_0}\\sin(\\pi/M)\\bigr)$.','PS CH8.6.1, 8.6.3'],
 ['What do Gray labels buy?','Neighbours differ in one bit, so $P_b\\approx P_e/\\log_2M$.','PS CH8.6.1, 8.6.3'],
 ['What does DPSK save, and what does it cost?','No carrier phase. $P_b=\\tfrac12e^{-E_b/N_0}$, under $1$ dB behind BPSK.','PS CH8.6.4, 8.6.5'],
 ['What is the M-ASK error?','$\\frac{2(M-1)}{M}Q\\bigl(\\sqrt{6E_s/((M^{2}-1)N_0)}\\bigr)$, about $6$ dB a doubling.','PS CH8.5.3'],
 ['What is the square-QAM error?','$4(1-1/\\sqrt M)\\,Q\\bigl(\\sqrt{3E_s/((M-1)N_0)}\\bigr)$, with $E_s=(M-1)d^{2}/6$.','PS CH8.7.3'],
 ['How much does QAM save over PSK?','$4.20$ dB at $M=16$ and $9.95$ dB at $M=64$.','PS CH8.7.3'],
 ['What do M orthogonal signals give?','$M-1$ neighbours at $\\sqrt{2E_s}$. The $E_b/N_0$ needed falls as $M$ grows, toward $-1.6$ dB.','PS CH9.1.1, 9.1.2'],
 ['What does noncoherent BFSK need?','Tones $1/T$ apart and an envelope detector. $P_b=\\tfrac12e^{-E_b/2N_0}$.','PS CH9.5.2, 9.5.3'],
 ['What is MSK?','BFSK at $\\Delta f=1/(2T_b)$ with a continuous phase. Its envelope is constant.','PS CH9.6.1, 9.6.2'],
 ['How wide is each family?','PSK and QAM: $R_b/\\log_2M$. Orthogonal: $MR_b/(2\\log_2M)$.','PS CH10.2, 9.7'],
 ['Where does each family sit on the plane?','PAM, PSK and QAM: bandwidth-limited, $r>1$. Orthogonal: power-limited, $r<1$.','PS CH9.7']
]},
{t:'p', text:'Pick the point set, read $d_{\\min}$ and $\\bar N_{\\min}$, and apply the receiver of Chapter 4. Chapter 6 asks how far any scheme can go.'}

];
})();
