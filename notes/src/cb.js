/* Course notes — Appendix B.

   The four laboratories of the course, each one run here rather than described.
   Every figure in this appendix is computed when the page is drawn: the noise is
   generated, the filter is applied, the errors are counted. Nothing is a picture
   of a result obtained elsewhere, so a number in the text and the curve beside
   it cannot drift apart.

   The random generator is seeded, so the same figure appears on every machine
   and in every rendering. That is the only difference between what runs here and
   what a student runs in the laboratory, where the seed is whatever the clock
   happened to be.

   The numbers quoted in the running text were read off this code. If a
   simulation here is edited, they are re-read. */
(function(){
const P=PLOT, C=P.COL;
const ax=o=>P.Axes(Object.assign({w:700,h:210,pad:{l:54,r:20,t:18,b:34},
  xtarget:7,ytarget:4},o));

/* ---- the shared numerical kit ----------------------------------------- */

/* mulberry32: a small generator with a good enough spread for counting errors,
   and short enough to read. */
function rng(seed){ let a=seed>>>0; return function(){
  a=(a+0x6D2B79F5)>>>0; let t=Math.imul(a^(a>>>15),1|a);
  t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
/* Box-Muller: two uniform numbers in, one Gaussian number out. */
function gaussFrom(r,n,s){ const o=new Array(n); for(let i=0;i<n;i++){
  const u=Math.max(1e-12,r()), v=r();
  o[i]=s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); } return o; }
function Q(x){ const t=1/(1+0.2316419*Math.abs(x));
  const d=0.3989422804014327*Math.exp(-x*x/2);
  const p=d*t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
  return x>=0?p:1-p; }
const lg=x=>Math.log(x)/Math.LN2;
const dB=v=>10*Math.log10(v);
const L10=v=>Math.log10(Math.max(1e-12,v));

/* ======================================================================= */
/* B.1 — quantization                                                       */
/* ======================================================================= */

/* The waveform of the first laboratory. Each group is given two whole numbers;
   these are the pair the worked case uses. */
const F1=3, F2=4, FS=2*F2;
const xt=t=>F1*Math.sin(2*Math.PI*F1*t)+F2*Math.cos(2*Math.PI*F2*t);
const XN=Array.from({length:17},(_,n)=>xt(n/FS));       /* 2 s at the Nyquist rate */
const XDENSE=Array.from({length:2001},(_,n)=>xt(2*n/2000));
const XLO=Math.min(...XN), XHI=Math.max(...XN);

/* One uniform quantizer: L equal cells across the range, each sample replaced
   by the middle of the cell it lands in. */
function quantize(x,L,lo,hi){
  const d=(hi-lo)/L;
  return x.map(v=>{ let k=Math.floor((v-lo)/d); k=Math.max(0,Math.min(L-1,k));
    return lo+(k+0.5)*d; });
}
function cellOf(v,L,lo,hi){
  const d=(hi-lo)/L; let k=Math.floor((v-lo)/d);
  return Math.max(0,Math.min(L-1,k));
}
/* The measured ratio and the ratio the small-step model predicts, both in dB. */
function sqnrOf(x,L){
  const lo=Math.min(...x), hi=Math.max(...x), d=(hi-lo)/L;
  const xq=quantize(x,L,lo,hi);
  const ps=x.reduce((s,v)=>s+v*v,0)/x.length;
  const pe=x.reduce((s,v,i)=>s+(v-xq[i])**2,0)/x.length;
  return { d, meas:dB(ps/pe), model:dB(ps/(d*d/12)) };
}

/* ======================================================================= */
/* B.2 — the matched filter                                                 */
/* ======================================================================= */

const TB=16, AMP=1, EB=AMP*AMP*TB;

/* One run of the whole chain, sample by sample, exactly as the laboratory
   builds it: the waveform, the noise added to it, the filter matched to the
   pulse, and the value that filter holds at the end of each bit. */
function chain(bits,snrdB,seed){
  const r=rng(seed), N0=EB/Math.pow(10,snrdB/10), sg=Math.sqrt(N0/2);
  const n=bits.length*TB, s=new Array(n), x=new Array(n), y=new Array(n);
  const w=gaussFrom(r,n,sg);
  for(let m=0;m<n;m++){ s[m]=bits[Math.floor(m/TB)]?AMP:-AMP; x[m]=s[m]+w[m]; }
  let acc=0;
  for(let m=0;m<n;m++){
    acc+=x[m]; if(m>=TB) acc-=x[m-TB];
    y[m]=acc/Math.sqrt(TB);
  }
  const rx=bits.map((b,i)=>y[i*TB+TB-1]>0?1:0);
  return {s,x,y,rx};
}
/* The same chain with nothing drawn, repeated until the errors can be counted. */
function ber(snrdB,N,seed){
  const r=rng(seed), N0=EB/Math.pow(10,snrdB/10), sg=Math.sqrt(N0/2);
  let err=0;
  for(let i=0;i<N;i++){
    const b=r()<0.5?0:1, w=gaussFrom(r,TB,sg);
    let acc=0;
    for(let k=0;k<TB;k++) acc+=((b?AMP:-AMP)+w[k])/Math.sqrt(TB);
    if((acc>0?1:0)!==b) err++;
  }
  return err/N;
}
const B2BITS=[1,0,1,1,0,0,1,0,1,1,1,0,0,1,0,1];
const B2RUN=chain(B2BITS,2,7);
const B2SWEEP=(()=>{ const d=[],p=[];
  for(let v=0;v<=5.0001;v+=0.25){ const g=Math.round(v*100)/100;
    d.push(g); p.push(ber(g,5000,20250101+d.length*7919)); }
  return {d,p}; })();

/* ======================================================================= */
/* B.3 — 16-QAM                                                             */
/* ======================================================================= */

const LEV=[-3,-1,1,3];
const QPTS=[]; LEV.forEach(a=>LEV.forEach(b=>QPTS.push([a,b])));
const ESQ=QPTS.reduce((s,p)=>s+p[0]*p[0]+p[1]*p[1],0)/16;   /* 10 */
const EBQ=ESQ/4;                                            /* four bits a symbol */
const decide=v=>v<-2?-3:v<0?-1:v<2?1:3;
const N0of=d=>EBQ/Math.pow(10,d/10);

/* Symbols drawn uniformly, noise added on each axis, the nearest point taken. */
function qamRun(ebn0dB,Ns,seed,keep){
  const r=rng(seed), sg=Math.sqrt(N0of(ebn0dB)/2);
  let err=0; const cloud=[];
  for(let i=0;i<Ns;i++){
    const si=LEV[Math.min(3,Math.floor(r()*4))], sq=LEV[Math.min(3,Math.floor(r()*4))];
    const n=gaussFrom(r,2,sg), ri=si+n[0], rq=sq+n[1];
    if(decide(ri)!==si||decide(rq)!==sq) err++;
    if(keep&&i<keep) cloud.push([ri,rq]);
  }
  return {ser:err/Ns, cloud};
}
const nnSER=d=>3*Q(Math.sqrt(4/(2*N0of(d))));
/* A rate of one in two thousand measured on twenty thousand symbols is ten
   errors, and ten errors is not a measurement. So the number of symbols is
   raised as the expected rate falls, aiming at a few hundred errors a point
   throughout — which is what makes the right-hand end of the curve worth
   reading at all. */
const qamNs=d=>Math.min(400000,Math.max(50000,Math.round(600/nnSER(d))));
const QAMSWEEP=(()=>{ const d=[],p=[],n=[];
  for(let v=0;v<=12.0001;v+=0.5){ const g=Math.round(v*10)/10;
    d.push(g); n.push(qamNs(g)); p.push(qamRun(g,qamNs(g),606000+d.length*4093).ser); }
  return {d,p,n}; })();

/* ======================================================================= */
/* B.4 — Huffman                                                            */
/* ======================================================================= */

/* Merge the two least likely symbols, over and over, and read the codewords off
   the tree that grows. */
function huffman(al){
  if(al.length===1) return {[al[0].s]:'0'};
  const pool=al.map(o=>({p:o.p,s:o.s,l:null,r:null}));
  while(pool.length>1){
    pool.sort((a,b)=>a.p-b.p||(a.s==null?-1:1));
    const x=pool.shift(), y=pool.shift();
    pool.push({p:x.p+y.p,l:x,r:y,s:null});
  }
  const out={};
  (function walk(n,c){ if(n.s!=null){ out[n.s]=c||'0'; return; }
    walk(n.l,c+'0'); walk(n.r,c+'1'); })(pool[0],'');
  return out;
}
function codeStats(q){
  const H=-q.filter(v=>v>0).reduce((s,v)=>s+v*lg(v),0);
  const al=q.map((p,s)=>({s,p})).filter(o=>o.p>0);
  const cd=huffman(al);
  const L=al.reduce((s,o)=>s+o.p*cd[o.s].length,0);
  return {H,L,cd,al,eta:H/L,cr:100*(1-L/4)};
}
const DIGITS=[1,2,3,4,5,6,5,4,3,2,1];
const PDIG=(()=>{ const c=new Array(10).fill(0); DIGITS.forEach(d=>c[d]++);
  return c.map(v=>v/DIGITS.length); })();
const SDIG=codeStats(PDIG);
/* Part III: ten counts from a binomial trial, normalised into a distribution. */
function binomSource(rho,seed){
  const r=rng(seed);
  const w=Array.from({length:10},()=>{ let k=0; for(let i=0;i<50;i++) if(r()<rho) k++; return k; });
  const tot=w.reduce((a,b)=>a+b,0)||1;
  return w.map(v=>v/tot);
}
const PLOW=binomSource(0.01,1009), SLOW=codeStats(PLOW);
const PHIGH=binomSource(0.99,1009), SHIGH=codeStats(PHIGH);
/* The second part of the laboratory: a thousand symbols drawn from the same
   statistics, encoded, and the length of the result compared with the length of
   the same thousand symbols written four bits each. */
const ENC=(()=>{
  const r=rng(424242), cum=[]; let a=0;
  PDIG.forEach((q,i)=>{ a+=q; cum.push([a,i]); });
  let bits=0;
  for(let i=0;i<1000;i++){ const u=r();
    const d=(cum.find(c=>u<=c[0])||cum[cum.length-1])[1];
    bits+=SDIG.cd[d].length; }
  return {bits, fixed:4000, cr:100*(1-bits/4000)};
})();

/* A bar for every symbol of the alphabet, whether or not it occurs. */
function probBars(q,opts){
  opts=opts||{};
  const top=Math.max(...q)*1.28;
  /* The digit under each bar is written as an annotation rather than left to
     the tick machinery: the alphabet starts at zero, and a tick sitting on the
     axis itself is the one label that gets lost. */
  const a=ax({w:opts.w||330,h:opts.h||190,xr:[-0.75,9.75],yr:[-top*0.22,top],
    ylabel:'p_i',pad:{l:50,r:16,t:16,b:26},zeroAxes:false,
    xticksOverride:[],ytarget:4});
  q.forEach((p,i)=>{
    if(p>0) a.rect(i-0.32,0,i+0.32,p,{fill:C.dec.in,stroke:C.in});
    a.note(i,-top*0.11,String(i),{fs:10.5,color:C.muted,anchor:'middle'});
  });
  return a.svg();
}

/* A binary code tree, leaves evenly spaced and every parent at the mean of its
   two children. Placing a node at its binary value instead would put the
   deepest pair a pixel apart. */
function codeTree(codes,names,opts){
  opts=opts||{};
  const depth=Math.max(...codes.map(c=>c.length));
  const nodes=new Set(['']);
  codes.forEach(c=>{ for(let i=1;i<=c.length;i++) nodes.add(c.slice(0,i)); });
  const kids=n=>Array.from(nodes).filter(m=>m.length===n.length+1&&m.slice(0,-1)===n);
  const order=Array.from(nodes).sort((a,b)=>b.length-a.length||(a<b?-1:1));
  const row={}; let k=0;
  order.filter(n=>kids(n).length===0).forEach(n=>{ row[n]=k++; });
  order.forEach(n=>{ const c=kids(n); if(c.length) row[n]=c.reduce((s,m)=>s+row[m],0)/c.length; });
  const span=Math.max(1,k-1);
  const a=ax({w:opts.w||620,h:opts.h||230,xr:[-0.3,depth+1.25],yr:[-0.6,span+0.6],
    pad:{l:16,r:16,t:14,b:14},xticksOverride:[],yticksOverride:[],
    grid:false,zeroAxes:false,arrows:false});
  const Y=n=>span-row[n];
  Array.from(nodes).forEach(n=>{
    if(n==='') return;
    const par=n.slice(0,-1);
    a.poly([[par.length,Y(par)],[n.length,Y(n)]],{color:C.rule,width:1.5});
    a.note((par.length+n.length)/2,(Y(par)+Y(n))/2+span*0.05,n.slice(-1),
      {fs:11,color:C.muted,anchor:'middle'});
  });
  Array.from(nodes).forEach(n=>{
    const leaf=codes.indexOf(n);
    if(leaf<0){ a.point(n.length,Y(n),{color:C.rule,r:2.6}); return; }
    a.point(n.length,Y(n),{color:C.in,r:4});
    a.note(n.length+0.16,Y(n)+0.13,names[leaf],{fs:11.5,color:C.ink});
  });
  return a.svg();
}

/* ======================================================================= */

window.CB = [

{t:'h1', num:'APPENDIX B', text:'The laboratories'},
{t:'p', lead:true, text:'The course has four laboratories, and each one takes a result the chapters derive on paper and asks you to measure it instead. This appendix runs all four. Every curve, cloud and staircase on the pages that follow was computed when this page was drawn — the noise was generated, the filter was applied, the errors were counted — so what you see is the outcome of a run and not a drawing of one.'},
{t:'p', text:'That matters for one reason above all. A formula tells you what should happen; a measurement tells you what did. Where the two agree you have learnt that the derivation is sound. Where they disagree you have learnt something better: which assumption in the derivation the experiment broke. Each of the four sections below ends on that disagreement, because it is the part of the laboratory worth carrying away.'},
{t:'p', text:'Your own numbers will not match these. Each laboratory starts from a number your group is given, so the input waveform, the bit pattern and the source statistics all differ from group to group, and the random noise differs from run to run. What must match is the <em>shape</em>: the slope of a curve, the size of a gap, the direction a quantity moves when a setting changes. Read the figures for those.'},

{t:'box', kind:'ok', hd:'The four in one line each', html:'<b>B.1</b> builds a uniform quantizer and measures the signal-to-quantization-noise ratio it achieves, then encodes the result as a bit stream and draws it as a waveform. <b>B.2</b> sends bits through a noisy channel, recovers them with a matched filter, and measures the bit error rate against the formula of Chapter 2. <b>B.3</b> does the same for sixteen-point quadrature amplitude modulation and puts the measured symbol error rate beside the union bound of Chapter 4. <b>B.4</b> builds a Huffman code for a source and measures how much it compresses.'},

/* ==================================================================== B.1 */
{t:'h2', num:'B.1', text:'Quantization, the signal-to-quantization-noise ratio and PCM'},
{t:'p', text:'The first laboratory walks the whole of Chapter 1 in one sitting. You start with a continuous waveform, sample it at the Nyquist rate, quantize the samples with a uniform quantizer of your own writing, measure the ratio of signal power to quantization-error power, encode each quantized sample as a binary word, and draw the resulting bit stream as a polar NRZ waveform. Then you double the number of levels and do it again.'},
{t:'p', text:'The waveform is $x(t)=f_1\\sin(2\\pi f_1 t)+f_2\\cos(2\\pi f_2 t)$, where $f_1$ and $f_2$ are two whole numbers your group is given. The case run here has $f_1=3$ and $f_2=4$, so the highest frequency present is $4$ Hz and the Nyquist rate is $f_s=8$ samples a second. Over the two seconds the laboratory asks for, that is seventeen samples — and seventeen is a smaller number than it looks, which is the point the section ends on.'},

{t:'p', text:'The quantizer itself is four lines. Find the smallest and largest sample. Divide the distance between them into $L$ equal cells, so the step is $\\Delta=(x_{\\max}-x_{\\min})/L$. Decide which cell each sample falls in. Replace it by the middle of that cell, which is the value that minimises the error inside the cell when nothing is known about where in the cell the sample sits.'},

{t:'fig', svg:()=>{
  const a=ax({w:700,h:250,xr:[0,1],yr:[-8,8],xlabel:'t',ylabel:'x(t)',
    xtarget:5,ytarget:4});
  const L=8, d=(XHI-XLO)/L;
  for(let k=0;k<L;k++) a.hline(XLO+(k+0.5)*d,{color:C.grid,dash:'2 5',opacity:.9});
  a.curve(xt,{color:C.muted,width:1.2,n:1400});
  const idx=[0,1,2,3,4,5,6,7,8];
  a.stem(idx.map(n=>[n/FS,XN[n]]),{color:C.in,r:3.4});
  const xq=quantize(XN,L,XLO,XHI);
  idx.forEach(n=>a.point(n/FS,xq[n],{color:C.out,r:4.2}));
  return a.svg();
}, cap:'The first second of the run. The pale line is $x(t)$, the stems are the samples $x_n$ taken every $1/8$ s, and the filled circles are the quantized values $\\hat{x}_n$ at $L=8$. The dotted lines are the eight representation levels, spaced $\\Delta=1.640$ V apart. Every circle sits on a dotted line: that is all quantization does.'},

{t:'p', text:'With $L=8$ each sample needs $R=\\log_2 8=3$ bits, and at $f_s=8$ samples a second the stream leaves the encoder at $R_b=Rf_s=24$ bit/s. At $L=16$ it is $32$ bit/s. That is the price of the second experiment, and it is worth naming before the reward is measured: a third more bits a second.'},

{t:'figrow', n:2, items:[
 {svg:()=>{
   const a=ax({w:330,h:230,xr:[XLO,XHI],yr:[XLO,XHI],xlabel:'x',ylabel:'\\hat{x}',
     pad:{l:46,r:16,t:16,b:32},xtarget:4,ytarget:4});
   const L=8, d=(XHI-XLO)/L, pts=[];
   for(let i=0;i<=1000;i++){ const v=XLO+(XHI-XLO)*i/1000;
     pts.push([v,quantize([v],L,XLO,XHI)[0]]); }
   a.poly(pts,{color:C.mid,width:2});
   return a.svg();
 }, cap:'The quantizer itself, drawn by feeding it a thousand values across its range. Eight treads, each $\\Delta=1.640$ V wide, each one tread high.'},
 {svg:()=>{
   const L=8, nb=4, bits=[];
   for(let n=0;n<nb;n++){ const k=cellOf(XN[n],L,XLO,XHI);
     for(let j=2;j>=0;j--) bits.push((k>>j)&1); }
   const a=ax({w:330,h:230,xr:[0,bits.length],yr:[-1.9,1.9],xlabel:'t/T_b',
     pad:{l:46,r:16,t:16,b:32},xtarget:6,yticksOverride:[-1,0,1],grid:false});
   const pts=[];
   bits.forEach((b,i)=>{ for(let j=0;j<=20;j++) pts.push([i+j/20,b?1:-1]); });
   for(let i=1;i<bits.length;i++) a.vline(i,{color:C.rule,dash:'2 4',opacity:.55});
   a.poly(pts,{color:C.in,width:1.9});
   bits.forEach((b,i)=>a.note(i+0.5,1.42,String(b),{fs:10.5,color:C.muted,anchor:'middle'}));
   return a.svg();
 }, cap:'The first four samples encoded and sent. Each sample becomes a three-bit word for its cell, and each bit becomes one bit interval of a polar NRZ waveform: high for a one, low for a zero.'}
]},

{t:'eqbox', cap:'What the laboratory measures', tex:[
 '\\mathrm{SQNR}=\\frac{E[X^{2}]}{E\\bigl[(X-\\hat{X})^{2}\\bigr]}\\ \\longrightarrow\\ \\mathrm{SQNR}\\big|_{\\mathrm{dB}}=10\\log_{10}\\mathrm{SQNR}'],
 after:'Both averages are taken over the samples you actually have. The numerator is the mean square of the samples and the denominator the mean square of the difference between each sample and its quantized value — the same quantity Chapter 1 models as $\\Delta^{2}/12$, but here counted rather than assumed.'},

{t:'p', text:'On this waveform the measurement gives $17.80$ dB at $L=8$ and $23.83$ dB at $L=16$. The difference is $6.03$ dB, which is the six decibels a bit that Section 1.4 predicts, arrived at by counting. That agreement is the main result of the laboratory, and it holds for a reason that has nothing to do with this particular waveform: doubling $L$ halves $\\Delta$, halving $\\Delta$ quarters $\\Delta^{2}/12$, and a factor of four is $6.02$ dB.'},

{t:'fig', svg:()=>{
  const a=ax({w:660,h:270,xr:[1,6],yr:[0,42],xlabel:'R',
    ylabel:'\\mathrm{SQNR}\\;(\\mathrm{dB})',
    pad:{l:58,r:22,t:18,b:36},xtarget:5,ytarget:6});
  const Rs=[1,2,3,4,5,6];
  a.poly(Rs.map(R=>[R,sqnrOf(XN,Math.pow(2,R)).model]),{color:C.h,width:2.1,dash:'6 4'});
  Rs.forEach(R=>a.point(R,sqnrOf(XN,Math.pow(2,R)).meas,{color:C.out,r:4.6}));
  return a.svg();
}, cap:'Measured against modelled, for one to six bits a sample, both computed from the seventeen samples the laboratory takes. The dashed line is the small-step model $10\\log_{10}\\bigl(P_X/(\\Delta^{2}/12)\\bigr)$ and the circles are the ratio actually measured. The circles rise about six decibels a bit, as they should. But they sit below the line by between $1.0$ and $2.9$ dB, and the gap neither closes nor settles as $R$ grows. Something is wrong, and the next note says what.'},

{t:'box', kind:'err', hd:'Seventeen samples is not a population', html:'The measured points and the modelled line disagree by up to $2.9$ dB, and the gap does not shrink as $L$ grows. It is tempting to blame the model, and Section 1.4 gives a real reason it could be blamed — the error is not quite uniform across a cell. But measure the same waveform with two thousand samples instead of seventeen and the gap falls to less than $0.6$ dB everywhere. The model was right; the estimate was noisy. Both $E[X^{2}]$ and $E[(X-\\hat{X})^{2}]$ are averages, and an average over seventeen numbers has a spread of its own. This is the error to name in your report: do not draw a conclusion about a model from a sample too small to test it.'},

{t:'box', kind:'warn', hd:'Sampling exactly at the Nyquist rate', html:'The waveform here has a $4$ Hz component and the laboratory samples at exactly $8$ Hz, which is the boundary the sampling theorem is stated at rather than inside. At exactly twice its frequency, a cosine is sampled at the same two points of every cycle, so that component contributes the same alternating $\\pm 4$ to every sample and none of its shape survives. The reconstruction is still correct here because the component is a cosine and lands on its peaks; move the phase and it would not be. Chapter 1 asks for $f_s>2W$ and means the strict inequality.'},

/* ==================================================================== B.2 */
{t:'h2', num:'B.2', text:'The matched filter and the bit error rate'},
{t:'p', text:'The second laboratory builds the receiver of Chapter 2 and measures how often it is wrong. A bit stream becomes a waveform, white Gaussian noise is added to it, a filter matched to the pulse is applied, the filter output is read once a bit, and each reading is compared with a threshold. Then the count of wrong decisions is put beside $Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$.'},
{t:'p', text:'The signalling is antipodal. The pulse $\\psi(t)=1/\\sqrt{T_b}$ over one bit interval has unit energy, and a bit is sent as $s_1=A\\sqrt{T_b}$ or $s_0=-A\\sqrt{T_b}$ times that pulse — which is a constant $+A$ or $-A$ held for the interval, so the transmitted waveform is the polar NRZ line code of B.1. Its energy a bit is $E_b=A^{2}T_b$. The noise is added to every sample with variance $N_0/2$, the two-sided density, and the signal-to-noise ratio quoted throughout is $10\\log_{10}(E_b/N_0)$.'},

{t:'fig', svg:()=>{
  const n=B2BITS.length*TB;
  const a=ax({w:700,h:215,xr:[0,B2BITS.length],yr:[-6.5,6.5],xlabel:'t/T_b',
    ylabel:'x(t)',xtarget:8,ytarget:3});
  a.poly(B2RUN.x.map((v,m)=>[(m+0.5)/TB,v]),{color:C.noise,width:1.05});
  a.poly(B2RUN.s.map((v,m)=>[(m+0.5)/TB,v]),{color:C.in,width:2.4});
  for(let i=1;i<B2BITS.length;i++) a.vline(i,{color:C.rule,dash:'2 5',opacity:.5});
  return a.svg();
}, cap:'Sixteen bits at $E_b/N_0=2$ dB. The clean square wave is the transmitted $s(t)$; the hairline around it is $x(t)=s(t)+w(t)$, which is everything the receiver is given. Nothing about the square wave is visible in the hairline at this noise level, and that is the honest picture — the receiver does not see the signal, it computes with it.'},

{t:'fig', svg:()=>{
  const a=ax({w:700,h:210,xr:[0,B2BITS.length],yr:[-9,9],xlabel:'t/T_b',
    ylabel:'y(t)',xtarget:8,ytarget:4});
  a.poly(B2RUN.y.map((v,m)=>[(m+1)/TB,v]),{color:C.out,width:1.7});
  a.hline(0,{color:C.h,dash:'5 4',opacity:.95});
  for(let i=1;i<B2BITS.length;i++) a.vline(i,{color:C.rule,dash:'2 5',opacity:.5});
  B2BITS.forEach((b,i)=>{
    const v=B2RUN.y[i*TB+TB-1], wrong=(v>0?1:0)!==b;
    a.point(i+1,v,{color:wrong?C.err:C.ink,r:wrong?5.2:3.8});
  });
  return a.svg();
}, cap:'The matched-filter output for the same sixteen bits, read once at the end of every bit interval. The dashed line is the threshold $\\lambda=0$, which is where equal priors put it. Fifteen of the sixteen readings are on the correct side of it. The eleventh is not, and it is drawn in red: at $2$ dB the formula expects about one wrong bit in twenty-seven, and this run produced one in sixteen.'},

{t:'p', text:'One run of sixteen bits settles nothing — one error could as easily have been none or three. The second part of the laboratory therefore drops the picture and repeats the experiment: five thousand bits at each signal-to-noise ratio from $0$ to $5$ dB in quarter-decibel steps, counting errors and dividing by five thousand.'},

{t:'fig', svg:()=>{
  const a=ax({w:640,h:280,xr:[0,5],yr:[-2.6,-0.9],
    xlabel:'E_b/N_0\\;(\\mathrm{dB})',ylabel:'P_b',
    ytickfmt:P.decade,yticksOverride:P.decades(-2.6,-0.9),zeroAxes:false,
    pad:{l:60,r:22,t:20,b:38},xtarget:5,ytarget:4});
  a.curve(d=>L10(Q(Math.sqrt(2*Math.pow(10,d/10)))),{color:C.in,width:2.2,n:400});
  B2SWEEP.d.forEach((d,i)=>{ if(B2SWEEP.p[i]>0) a.point(d,L10(B2SWEEP.p[i]),{color:C.out,r:4}); });
  return a.svg();
}, cap:'Measured bit error rate against the formula, five thousand bits a point. The line is $Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$ and the circles are counted errors. Nowhere on the sweep do the two differ by more than $0.005$, and yet the circles clearly wander further from the line towards the right. The next note is about why those two statements are both true.'},

{t:'box', kind:'warn', hd:'Why the circles scatter, and why they scatter more on the right', html:'Counting $k$ errors in $N$ bits estimates a probability with a spread of about $\\sqrt{p(1-p)/N}$. At $0$ dB, $p\\approx0.079$, and five thousand bits give a spread of $0.004$ — small beside $0.079$, so the leftmost circle sits close to the line. At $5$ dB, $p\\approx0.006$ and the spread is $0.001$, which is a sixth of the value itself: five thousand bits expect about thirty errors there and this run produced forty, so the rightmost circle sits a third above the line. The absolute scatter falls and the relative scatter grows, and on a logarithmic axis it is the relative scatter you see. This is why an error-rate curve needs more bits a point the further right it goes, and why reaching down to $10^{-6}$ needs millions. Section B.3 does exactly that.'},

{t:'box', kind:'err', hd:'The three-decibel mistake', html:'Two conventions can each cost a factor of two here and neither shows on the page. The first is the noise density: the variance added to each sample is $N_0/2$ because $N_0/2$ is the <em>two-sided</em> density, and using $N_0$ moves every measured point $3$ dB to the left. The second is the signalling: $Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$ is antipodal, where the two waveforms are opposites. If you build on-off signalling by mistake — sending nothing for a zero — the right formula is $Q\\bigl(\\sqrt{E_b/N_0}\\bigr)$ and your points will sit $3$ dB to the right of the curve you drew. A measured curve parallel to the theoretical one and $3$ dB away from it is almost never noise. It is one of these two.'},

/* ==================================================================== B.3 */
{t:'h2', num:'B.3', text:'Sixteen-point QAM and the union bound'},
{t:'p', text:'The third laboratory moves from one dimension to two. Symbols are drawn from the sixteen-point square constellation of Section 5.4, noise is added independently on each axis, the receiver takes the nearest point, and the fraction of symbols decided wrongly is put beside the nearest-neighbour approximation of Section 4.4.'},
{t:'p', text:'Write the sixteen points as $s_I+js_Q$ with each coordinate drawn from $\\{-3,-1,1,3\\}$ in units of half the minimum distance. Then the average symbol energy is $E_{s}=10$ in those units, the minimum distance is $d_{\\min}=2$, and since each symbol carries four bits the average energy a bit is $E_b=E_s/4=2.5$. Check that against Section 5.4: $d_{\\min}^{2}=6E_s/(M-1)=60/15=4$, which is $2^{2}$. The two routes agree, which is the first thing to verify before generating any noise at all.'},
{t:'p', text:'The optimal thresholds follow from the same picture. Because the two axes are independent and the levels on each are evenly spaced, the decision boundaries are the three vertical lines and the three horizontal lines midway between neighbouring levels: $\\lambda\\in\\{-2,0,2\\}$ on each axis. There is nothing to derive beyond the minimum-distance rule of Chapter 4 — in a square grid, nearest point means nearest level on each axis separately.'},

{t:'figrow', n:2, items:[
 {svg:()=>{
   const a=ax({w:330,h:300,xr:[-5.4,5.4],yr:[-5.4,5.4],xlabel:'\\psi_1',ylabel:'\\psi_2',
     pad:{l:44,r:16,t:16,b:32},xtarget:3,ytarget:3,grid:false});
   const run=qamRun(6,4000,606000+13*4093,1200);
   run.cloud.forEach(p=>a.point(p[0],p[1],{color:C.noise,r:1.15,ring:'none',ringw:0}));
   [-2,0,2].forEach(v=>{ a.vline(v,{color:C.rule,dash:'4 4',opacity:.85});
     a.hline(v,{color:C.rule,dash:'4 4',opacity:.85}); });
   QPTS.forEach(p=>a.point(p[0],p[1],{color:C.in,r:4}));
   return a.svg();
 }, cap:'$E_b/N_0=6$ dB. The clouds touch, so a large fraction of the symbols land across a boundary. The measured symbol error rate here is $0.108$: about one symbol in nine is decided wrongly.'},
 {svg:()=>{
   const a=ax({w:330,h:300,xr:[-5.4,5.4],yr:[-5.4,5.4],xlabel:'\\psi_1',ylabel:'\\psi_2',
     pad:{l:44,r:16,t:16,b:32},xtarget:3,ytarget:3,grid:false});
   const run=qamRun(11,4000,606000+23*4093,1200);
   run.cloud.forEach(p=>a.point(p[0],p[1],{color:C.noise,r:1.15,ring:'none',ringw:0}));
   [-2,0,2].forEach(v=>{ a.vline(v,{color:C.rule,dash:'4 4',opacity:.85});
     a.hline(v,{color:C.rule,dash:'4 4',opacity:.85}); });
   QPTS.forEach(p=>a.point(p[0],p[1],{color:C.in,r:4}));
   return a.svg();
 }, cap:'$E_b/N_0=11$ dB. Five decibels more energy a bit, and the clouds have pulled apart into sixteen separate blobs. The measured rate falls to $0.0022$, about fifty times better.'}
]},

{t:'p', text:'Twelve hundred received symbols are drawn in each picture so that the clouds can be seen. The rates quoted beneath them do not come from those twelve hundred: a rate of $0.0022$ measured on twelve hundred symbols would be three errors, and three is not a measurement. They come from the sweep below, which uses fifty thousand symbols at $6$ dB and a quarter of a million at $11$ dB. Choosing how many symbols to run is part of the experiment, and Section B.2 said why.'},

{t:'eqbox', cap:'What the bound predicts', tex:[
 'P_e\\;\\approx\\;N_{\\min}\\,Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right),\\qquad N_{\\min}=3,\\quad d_{\\min}^{2}=4'],
 after:'$N_{\\min}$ is the average number of nearest neighbours: four corner points have two each, eight edge points three, and four inner points four, and $(4\\cdot2+8\\cdot3+4\\cdot4)/16=3$. It is an average over the constellation and it does not have to be a whole number.'},

{t:'fig', svg:()=>{
  const a=ax({w:640,h:300,xr:[0,12],yr:[-3.4,-0.25],
    xlabel:'E_b/N_0\\;(\\mathrm{dB})',ylabel:'P_e',
    ytickfmt:P.decade,yticksOverride:P.decades(-3.4,-0.3),zeroAxes:false,
    pad:{l:60,r:22,t:20,b:38},xtarget:6,ytarget:4});
  a.curve(d=>L10(nnSER(d)),{color:C.in,width:2.2,n:400});
  QAMSWEEP.d.forEach((d,i)=>{ if(QAMSWEEP.p[i]>0) a.point(d,L10(QAMSWEEP.p[i]),{color:C.out,r:4}); });
  return a.svg();
}, cap:'Measured symbol error rate against the nearest-neighbour approximation. The number of symbols is raised as the rate falls — fifty thousand at the left, four hundred thousand at the right — so that every circle rests on a few hundred errors. The circles sit below the line at the left and join it by about $8$ dB. That gap is not an error in either the simulation or the formula: it is what the approximation is.'},

{t:'box', kind:'ok', hd:'Why the measurement is allowed to be better than the bound', html:'The union bound counts every way a symbol can be mistaken for another and adds the probabilities. Those events overlap — a noise vector large enough to carry a point past two neighbours at once is counted twice — so the sum is larger than the probability of the union, which is why it is a bound and not an equality. At low signal-to-noise ratio the overlaps are common and the bound is loose: here it is $17\\%$ above the measurement at $0$ dB. At high signal-to-noise ratio a single hop to a nearest neighbour dominates everything else and the overlaps vanish, so the bound tightens onto the truth. From $8$ dB on, line and circles agree to within about a tenth either way, and that remaining tenth is the counting spread of a few hundred errors rather than a disagreement — which is why individual circles out there sit above the line as often as below it.'},

{t:'box', kind:'err', hd:'Symbol energy and bit energy, once', html:'Every quantity in this laboratory can be written per symbol or per bit, and $E_s=4E_b$ for a sixteen-point constellation. Convert once, at the point where $N_0$ is computed from the signal-to-noise ratio, and never again. The common failure is to compute $N_0$ from $E_b$ and then use $E_s$ in the $Q$ function — or the reverse — which moves the whole curve by $10\\log_{10}4=6.02$ dB. A measured curve exactly six decibels from the predicted one, in a laboratory with four bits a symbol, has this and nothing else wrong with it.'},

/* ==================================================================== B.4 */
{t:'h2', num:'B.4', text:'Huffman coding and how much it compresses'},
{t:'p', text:'The fourth laboratory leaves the channel behind. A source emits symbols with known probabilities, and the question is how few bits a symbol are needed on average to write down what it emitted, with no loss at all. Chapter 6 gives the floor — the entropy — and gives the algorithm that comes closest to it. Here both are measured.'},
{t:'p', text:'The source alphabet is the ten digits. Your group counts how often each digit occurs in a number it is given and divides by how many digits there are, which gives a probability for each. The case run here uses the eleven digits $1\\,2\\,3\\,4\\,5\\,6\\,5\\,4\\,3\\,2\\,1$: five digits occur twice and one occurs once, so five symbols have probability $2/11$, one has $1/11$, and four have probability zero and take no codeword at all.'},

{t:'box', kind:'err', hd:'Dividing by the wrong total', html:'The probabilities must come from dividing each count by the <em>number of symbols</em>. Dividing by anything else — the sum of the digit values, say — gives a set of numbers that does not add up to one, and everything downstream is then quietly wrong: the entropy is not an entropy, the codebook is built for a source that does not exist, and the efficiency can come out above $100\\%$. Print the sum of your probability vector and confirm it is one before you compute anything from it. It is one line, and it catches the only mistake in this laboratory that produces plausible numbers instead of an error message.'},

{t:'figrow', n:2, items:[
 {svg:()=>probBars(PDIG,{w:330,h:200}),
  cap:'The source statistics $p_i$ over the ten-digit alphabet. Four digits do not occur, and a symbol of probability zero is left out of both the entropy and the codebook.'},
 {svg:()=>{
   const al=SDIG.al;
   return codeTree(al.map(o=>SDIG.cd[o.s]),al.map(o=>String(o.s)),{w:330,h:200});
 }, cap:'The code the algorithm builds. Reading a path from the root, left is a $0$ and right a $1$; the digit at each leaf is the symbol that path spells.'}
]},

{t:'p', text:'The entropy of this source is $H=2.550$ bits a symbol and the code the algorithm builds has average length $\\bar{L}=2.636$ bits a symbol, so the efficiency is $\\eta=H/\\bar{L}=96.7\\%$. Two things are worth checking in your report before anything else. The first is that $H\\le\\bar{L}<H+1$, which Section 6.6 guarantees and which is here $2.550\\le2.636<3.550$. The second is that $\\bar{L}$ is below the three bits a fixed-length code would need for six symbols, and below the four bits a fixed-length code would need if all ten digits could occur.'},

{t:'box', kind:'warn', hd:'A tie in the algorithm is not a mistake', html:'Whenever two nodes have the same probability, the algorithm may merge either, and different choices give different codebooks with the same average length. Your codewords will not match the ones drawn above and need not. What must match is $\\bar{L}$, because Huffman is optimal and the optimal average length is unique even when the code is not. If two groups get different average lengths for the same statistics, one of them has an error; if they get different codebooks, neither of them does. Section 6.7 develops the tie-breaking rule that also minimises the variance of the codeword length.'},

{t:'p', text:'The second part encodes a thousand symbols drawn from the same statistics and compares the length of the result with the length of the same thousand symbols written in fixed-length binary. Ten possible digits need four bits each, so the fixed-length version is $4000$ bits; the Huffman version comes to $2621$ bits. The compression ratio is $1-2621/4000=34.5\\%$, against the $1-\\bar{L}/4=34.1\\%$ that the average length alone predicts. The two agree to within half a point, and they are not required to agree exactly: $\\bar{L}$ is an average over the distribution, while a thousand draws is a sample of it. If your two numbers differ by much more than a point, the encoder was given the wrong codebook.'},

{t:'p', text:'The third part asks what the source statistics themselves are worth. Ten counts are drawn from a binomial trial with $50$ attempts and success probability $\\rho$, then normalised into a distribution. At $\\rho=0.01$ almost every attempt fails, so most counts come out zero and the surviving symbols are few. At $\\rho=0.99$ almost every attempt succeeds, so all ten counts come out near $50$ and the distribution is nearly flat.'},

{t:'figrow', n:2, items:[
 {svg:()=>probBars(PLOW,{w:330,h:200}),
  cap:'$\\rho=0.01$. Five symbols survive and the rest have probability zero. $H=2.322$ bits, $\\bar{L}=2.400$ bits.'},
 {svg:()=>probBars(PHIGH,{w:330,h:200}),
  cap:'$\\rho=0.99$. All ten symbols occur about equally often. $H=3.322$ bits, $\\bar{L}=3.395$ bits.'}
]},

{t:'table', head:['Source','$H$','$\\bar{L}$','$\\eta$','Compression against $4$ bits'], rows:[
 ['The digit source','$2.550$','$2.636$','$96.7\\%$','$34.1\\%$'],
 ['$\\rho=0.01$','$2.322$','$2.400$','$96.7\\%$','$40.0\\%$'],
 ['$\\rho=0.99$','$3.322$','$3.395$','$97.8\\%$','$15.1\\%$']
]},

{t:'box', kind:'ok', hd:'What the third part is really asking', html:'The efficiency barely moves — $96.7\\%$, $96.7\\%$, $97.8\\%$ — while the compression moves from $40\\%$ to $15\\%$. Those two numbers measure different things and the laboratory is built to separate them. Efficiency asks how close the code got to the entropy of <em>its own</em> source, and Huffman is always close. Compression asks how far below four bits a symbol the source could be pushed at all, and that is set by the entropy, not by the code. At $\\rho=0.99$ the source is nearly uniform over ten symbols, its entropy is $3.322$ bits — within a hundredth of $\\log_2 10$, the largest it can be — and no lossless code of any kind can do much better than the fixed-length one. There is nothing left to remove.'}

];
})();
