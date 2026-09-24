/* Course notes — Chapter 3. */
(function(){
const P=PLOT, C=P.COL;
const ax=o=>P.Axes(Object.assign({w:700,h:200,pad:{l:50,r:20,t:18,b:34},xtarget:6,ytarget:3},o));
const pw=segs=>t=>{ for(const s of segs) if(t>=s[0]&&t<s[1]) return s[2]; return 0; };
const S1=pw([[0,2,1]]), S2=pw([[2,3,1]]), S3=pw([[0,3,1]]);
const W0=pw([[0,0.5,1],[0.5,1,-1]]), W1=pw([[0,0.25,1],[0.25,0.75,-1],[0.75,1,1]]);

/* One waveform on a small panel, sampled finely enough that the steps look vertical. */
function wave(f,name,col,o){
  const a=ax(Object.assign({w:300,h:160,xr:[-0.2,3.4],yr:[-0.3,1.4],xlabel:'t',ylabel:name,
    pad:{l:44,r:18,t:20,b:34},xtarget:4,ytarget:3},o||{}));
  const [lo,hi]=(o&&o.xr)||[-0.2,3.4];
  const pts=[]; for(let i=0;i<=900;i++){const t=lo+(hi-lo)*i/900; pts.push([t,f(t)]);}
  a.poly(pts,{color:col||C.in,width:2});
  /* time ticks under the data area, where no step of the trace can cross them */
  const L=P.labelScale();
  ((o&&o.xt)||[]).forEach(v=>{ const X=a.sx(v).toFixed(2);
    a.raw(`<line x1="${X}" y1="${a.y0}" x2="${X}" y2="${a.y0+5}" stroke="${C.axis}" stroke-width="1.2"/>`+
      `<text x="${X}" y="${(a.y0+19*L).toFixed(2)}" font-size="${13.5*L}" fill="${C.muted}" text-anchor="middle">${v}</text>`); });
  return a.svg();
}
/* A signal-space plane with one scale on both axes, so a circle is round. */
function plane(o){
  const pad={l:46,r:20,t:20,b:36}, k=(o.w-pad.l-pad.r)/(o.xr[1]-o.xr[0]);
  const hy=(o.h-pad.t-pad.b)/k/2, yc=o.yc||0;
  return ax(Object.assign({pad,xlabel:'\\psi_1',ylabel:'\\psi_2',xtarget:4,ytarget:4},o,{yr:[yc-hy,yc+hy]}));
}
const circle=(a,r)=>{ const pts=[]; for(let i=0;i<=160;i++){const u=2*Math.PI*i/160; pts.push([r*Math.cos(u),r*Math.sin(u)]);}
  a.poly(pts,{color:C.muted,width:1.1,dash:'4 5'}); };
const lab=(a,x,y,s,col,anchor)=>a.note(x,y,s,{tex:true,fs:13,color:col,anchor:anchor||'start'});
/* Points with labels placed outside the square they sit on. */
function points(a,pts){ pts.forEach(([x,y,l])=>{ a.point(x,y,{color:C.in,r:5.5});
  lab(a,x+(x>0?0.14:-0.14),y+(y>0?0.18:-0.38),l,C.in,x>0?'start':'end'); }); }

window.C3 = [

{t:'h1', num:'CHAPTER 3', text:'Geometric representation of signal waveforms'},
{t:'p', lead:true, text:'Chapter 2 wrote two opposite waveforms as two points on a line. This chapter writes any set of waveforms as a set of points. Energy becomes a squared length, and the energy of a difference becomes a squared distance. The receiver of Chapter 4 works on these points.'},

{t:'h2', num:'3.1', text:'Signals as vectors'},
{t:'p', text:'In Chapter 2 the two waveforms were opposites, so one shape $\\psi(t)$ carried both. Now take two waveforms on $[0,T]$ that take only the values $\\pm1$. The first, $s_0(t)$, is $+1$ on the first half and $-1$ on the second. The second, $s_1(t)$, is $+1$ on the outer quarters and $-1$ on the middle half.'},
{t:'p', text:'Neither waveform is a multiple of the other. No single function $\\psi(t)$ writes both as $s_m\\psi(t)$, so the one-number receiver of Chapter 2 does not apply. The receiver instead computes one number for each waveform.'},
{t:'eqbox', cap:'Two correlators', tex:'y_0=\\int_0^{T}x(t)\\,s_0(t)\\,dt,\\qquad y_1=\\int_0^{T}x(t)\\,s_1(t)\\,dt',
 after:'The pair $(y_0,y_1)$ is a point in a plane. The rest of this chapter describes that plane.'},
{t:'p', text:'Multiply the two waveforms and integrate. The product is $+1$ on two quarters of the interval and $-1$ on the other two, so the areas cancel.'},
{t:'eqbox', cap:'The product integrates to zero', tex:'\\int_0^{T}s_0(t)\\,s_1(t)\\,dt=\\frac{T}{2}-\\frac{T}{2}=0',
 after:'Two signals whose product integrates to zero are called <b>orthogonal</b>.'},
{t:'figrow', n:3, items:[
 {svg:()=>wave(W0,'s_0(t)',C.in,{xr:[-0.1,1.3],yr:[-1.5,1.5],xlabel:'t/T',xticksOverride:[],xt:[0,0.5,1],yticksOverride:[-1,0,1]}), cap:'$s_0(t)$'},
 {svg:()=>wave(W1,'s_1(t)',C.in,{xr:[-0.1,1.3],yr:[-1.5,1.5],xlabel:'t/T',xticksOverride:[],xt:[0,0.5,1],yticksOverride:[-1,0,1]}), cap:'$s_1(t)$'},
 {svg:()=>wave(t=>W0(t)*W1(t),'s_0(t)\\,s_1(t)',C.mid,{xr:[-0.1,1.3],yr:[-1.5,1.5],xlabel:'t/T',xticksOverride:[],xt:[0,0.5,1],yticksOverride:[-1,0,1]}),
  cap:'Their product: $+1$ on two quarters and $-1$ on two.'}
]},

{t:'p', text:'Vectors give the pattern to copy. A vector written against unit axes is the list of its coordinates, $\\mathbf{a}=(a_1,\\ldots,a_N)$. Its length and its angle to another vector come from that list.'},
{t:'eqbox', cap:'Inner product and length, for vectors and for signals', tex:[
  '\\langle\\mathbf{a},\\mathbf{b}\\rangle=\\sum_{k=1}^{N}a_kb_k,\\qquad \\|\\mathbf{a}\\|=\\sqrt{\\langle\\mathbf{a},\\mathbf{a}\\rangle}',
  '\\langle x,y\\rangle=\\int_{-\\infty}^{\\infty}x(t)\\,y(t)\\,dt,\\qquad \\|x\\|^{2}=\\int_{-\\infty}^{\\infty}x^{2}(t)\\,dt=E_x'],
 after:'For signals the sum over entries becomes an integral over time. The squared length of a signal is its energy.'},
{t:'p', text:'Axes for signals are functions with unit energy that are orthogonal in pairs. Such a set is called <b>orthonormal</b>.'},
{t:'eqbox', cap:'An orthonormal set', tex:'\\int_{-\\infty}^{\\infty}\\psi_j(t)\\,\\psi_k(t)\\,dt=\\begin{cases}1,&j=k\\\\0,&j\\ne k\\end{cases}',
 after:'The first case says each function has unit energy. The second says any two of them are orthogonal.'},
{t:'box', kind:'def', hd:'Orthogonal signals', html:'Pulses that never overlap are orthogonal. Where one pulse is nonzero, the other is zero. Therefore, their product is zero everywhere.'},
{t:'p', text:'A pulse $\\psi(t)=c$ on $[0,2]$ has energy $\\int_0^{2}c^{2}\\,dt=2c^{2}$. Unit energy needs $2c^{2}=1$, so $c=1/\\sqrt2=0.707$.'},

{t:'p', text:'With the axes fixed, a waveform is written against them as a vector is. One integral for each axis takes the waveform apart. This step is called <b>analysis</b>.'},
{t:'eqbox', cap:'Analysis and synthesis', tex:[
  's_{ij}=\\int_0^{T}s_i(t)\\,\\psi_j(t)\\,dt,\\qquad j=1,\\ldots,N',
  's_i(t)=\\sum_{j=1}^{N}s_{ij}\\,\\psi_j(t),\\qquad \\mathbf{s}_i=(s_{i1},\\ldots,s_{iN})'],
 after:'The second line, <b>synthesis</b>, builds the waveform back from its $N$ numbers. It is exact when every signal of the set is a combination of the $\\psi_j$. The list $\\mathbf{s}_i$ is the <b>signal vector</b>.'},
{t:'p', text:'For example, take $\\psi_1=1$ on $[0,1)$ and $\\psi_2=1$ on $[1,2)$. Let $s(t)=3$ on $[0,1)$ and $s(t)=-1$ on $[1,2)$. Each coordinate is one integral over the interval where its axis is nonzero.'},
{t:'eqbox', cap:'The coordinates of one waveform', tex:
  '\\begin{aligned}s_1&=\\int_0^{1}3\\cdot1\\,dt=3\\\\s_2&=\\int_1^{2}(-1)\\cdot1\\,dt=-1\\end{aligned}',
 after:'So $\\mathbf{s}=(3,-1)$, and $s(t)=3\\psi_1(t)-\\psi_2(t)$.'},
{t:'p', text:'The <b>analyzer</b> is a bank of $N$ correlators. Correlator $j$ multiplies the waveform by $\\psi_j(t)$ and integrates over $[0,T]$. Its output is the coordinate $s_{ij}$.'},
{t:'p', text:'The <b>synthesizer</b> does the reverse. It scales each $\\psi_j(t)$ by $s_{ij}$ and adds the results. So the transmitter can build every waveform of the set from $N$ basis functions.'},
{t:'box', kind:'ok', hd:'Number of correlators', html:'The analyzer needs one correlator for each basis function, not one for each waveform. A set of $M=8$ waveforms that spans $N=2$ dimensions needs $2$ correlators.'},

{t:'p', text:'The translation keeps inner products. The proof takes three moves. Write both signals in the basis. Move the integral inside both sums. Then use orthonormality: each cross term gives $0$ and each matching term gives $1$.'},
{t:'eqbox', cap:'Inner products are preserved', tex:
  '\\begin{aligned}\\int_{-\\infty}^{\\infty}x(t)\\,y(t)\\,dt&=\\int_{-\\infty}^{\\infty}\\Bigl(\\sum_{j=1}^{N}x_j\\psi_j(t)\\Bigr)\\Bigl(\\sum_{k=1}^{N}y_k\\psi_k(t)\\Bigr)dt\\\\&=\\sum_{j=1}^{N}\\sum_{k=1}^{N}x_jy_k\\int_{-\\infty}^{\\infty}\\psi_j(t)\\,\\psi_k(t)\\,dt\\\\&=\\sum_{k=1}^{N}x_ky_k=\\langle\\mathbf{x},\\mathbf{y}\\rangle\\end{aligned}',
 after:'An integral over two waveforms has become a sum over $N$ pairs of numbers.'},
{t:'p', text:'Check it on $x=2\\psi_1+\\psi_2$ and $y=\\psi_1-\\psi_2$, with the two unit pulses as basis. The product $x(t)\\,y(t)$ is $2$ on $[0,1)$ and $-1$ on $[1,2)$.'},
{t:'eqbox', cap:'The signed area and the coordinates agree', tex:
  '\\int_0^{2}x(t)\\,y(t)\\,dt=2-1=1,\\qquad x_1y_1+x_2y_2=2(1)+1(-1)=1'},
{t:'p', text:'Two special cases follow. Put $y=x$ to get the energy. Apply the result to the difference $s_i-s_k$, whose vector is $\\mathbf{s}_i-\\mathbf{s}_k$, to get a distance.'},
{t:'eqbox', cap:'Energy and distance', tex:[
  'E_i=\\int_0^{T}s_i^{2}(t)\\,dt=\\sum_{j=1}^{N}s_{ij}^{2}=\\|\\mathbf{s}_i\\|^{2}',
  'd_{ik}^{2}=\\|\\mathbf{s}_i-\\mathbf{s}_k\\|^{2}=\\int_0^{T}\\bigl(s_i(t)-s_k(t)\\bigr)^{2}dt'],
 after:'Energy is the squared distance from a point to the origin. The energy of a difference is the squared distance between two points.'},
{t:'p', text:'Noise moves the received point. Two points far apart are hard to confuse, so the distance $d_{ik}$ decides the error rate. Chapter 4 derives the rule.'},
{t:'p', text:'For example, $\\mathbf{s}_1=(1,1)$ and $\\mathbf{s}_2=(1,-1)$ differ by $(0,2)$. So $d_{12}=\\sqrt{0^{2}+2^{2}}=2$, and the energy of $s_1-s_2$ is $4$.'},

{t:'ex', hd:'Example 3.1 — a basis by inspection', rows:[
 ['Given','Four signals on $[0,2)$. Each is $+1$ or $-1$ on $[0,1)$ and $+1$ or $-1$ on $[1,2)$, giving all four sign pairs.'],
 ['Find','An orthonormal basis, the four signal vectors and the number of basis functions.'],
 ['Method','Every signal is constant on the same two intervals. So read the basis off those pieces, then check unit energy and orthogonality.'],
 ['Solution','Take $\\psi_1=1$ on $[0,1)$ and $\\psi_2=1$ on $[1,2)$. Each has energy $1$, and $\\int\\psi_1\\psi_2\\,dt=0$ because the pulses never overlap. Each coordinate is the height on that half times its width $1$. So $\\mathbf{s}_1=(1,1)$, $\\mathbf{s}_2=(1,-1)$, $\\mathbf{s}_3=(-1,1)$, $\\mathbf{s}_4=(-1,-1)$, and $N=2$.'],
 ['Check','From the vectors, each energy is $1^{2}+1^{2}=2$. From the waveforms, $\\int_0^{2}(\\pm1)^{2}\\,dt=2$ as well.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use a unit-energy function as an axis, not $s_1$ itself. $s_1$ has energy $2$, so every coordinate on it comes out a factor $\\sqrt2$ wrong.'},

{t:'h2', num:'3.2', text:'Constellations'},
{t:'p', text:'The <b>constellation diagram</b> draws the signal vectors in the space of their basis. It has one point for each waveform and one axis for each basis function.'},
{t:'p', text:'Three things are read off it. The distance from the origin to a point is $\\sqrt{E_i}$. The distance between two points is the root of the energy of their difference. The number of axes is the number of correlators the receiver needs.'},
{t:'fig', svg:()=>{
  const a=plane({w:420,h:320,xr:[-2.1,2.1],xticksOverride:[],yticksOverride:[]});
  circle(a,Math.SQRT2);
  a.poly([[0,0],[-1,1]],{color:C.mid,width:2.2});
  lab(a,-0.6,0.36,'\\sqrt2',C.mid,'end');
  a.poly([[1,1],[1,-1]],{color:C.mid,width:2.2});
  lab(a,0.9,0.45,'d=2',C.mid,'end');
  points(a,[[1,1,'\\mathbf{s}_1'],[1,-1,'\\mathbf{s}_2'],[-1,1,'\\mathbf{s}_3'],[-1,-1,'\\mathbf{s}_4']]);
  return a.svg();
}, cap:'The four signals of Example 3.1 as a constellation. Every point lies on the circle of radius $\\sqrt{E}=\\sqrt2$, and neighbours are $d=2$ apart.'},
{t:'p', text:'In this square the smallest distance is $d_{\\min}=2$, between neighbours such as $(1,1)$ and $(1,-1)$. The diagonal pairs are $2\\sqrt2=2.83$ apart.'},

{t:'p', text:'Three binary signal sets can now be compared by the distance between their two points. Each set has the same average energy per bit, $E_b$.'},
{t:'p', text:'<b>Antipodal</b> signals satisfy $s_2(t)=-s_1(t)$. They need one axis, and the points $\\pm\\sqrt{E_b}$ are $d=2\\sqrt{E_b}$ apart. Polar NRZ and BPSK are antipodal.'},
{t:'p', text:'<b>Orthogonal</b> signals satisfy $\\langle s_1,s_2\\rangle=0$. They need two axes, and the points $(\\sqrt{E_b},0)$ and $(0,\\sqrt{E_b})$ are $d=\\sqrt{2E_b}$ apart. PPM and FSK are orthogonal.'},
{t:'p', text:'<b>On-off</b> signals send $0$ or $s(t)$ with equal priors. The average energy is $E_b$, so $s(t)$ has energy $2E_b$. The points are $0$ and $\\sqrt{2E_b}$, again $d=\\sqrt{2E_b}$ apart.'},
{t:'figrow', n:3, items:[
 [[[1,0],[-1,0]],[0.15,0.55,'start'],'d=2\\sqrt{E_b}','Antipodal: one axis.'],
 [[[1,0],[0,1]],[0.62,0.62,'start'],'d=\\sqrt{2E_b}','Orthogonal: two axes.'],
 [[[Math.SQRT2,0],[0,0]],[0.15,0.45,'start'],'d=\\sqrt{2E_b}','On-off: one point at the origin.']
].map(([pts,[x,y,an],d,cap])=>({svg:()=>{
   const a=plane({w:230,h:190,xr:[-1.7,1.9],yc:0.4,xticksOverride:[],yticksOverride:[]});
   a.poly(pts,{color:C.mid,width:2.2});
   pts.forEach(p=>a.point(p[0],p[1],{color:C.in,r:5.5}));
   lab(a,x,y,d,C.mid,an); return a.svg();},
  cap:cap+' Drawn in units of $\\sqrt{E_b}$.'}))},
{t:'p', text:'Find the energy each set needs to reach the same distance $d$. Square the two distance formulas and set them equal.'},
{t:'eqbox', cap:'Energy for equal distance', tex:[
  '4E_b^{\\text{anti}}=d^{2}=2E_b^{\\text{orth}}',
  '\\frac{E_b^{\\text{orth}}}{E_b^{\\text{anti}}}=2=3.01\\ \\text{dB}'],
 after:'Orthogonal and on-off signalling need twice the energy of antipodal signalling for the same distance. This is the $3$ dB gap between the error probabilities $Q\\!\\left(\\sqrt{2E_b/N_0}\\right)$ and $Q\\!\\left(\\sqrt{E_b/N_0}\\right)$ of Chapter 2, where $Q$ is the Gaussian tail.'},

{t:'p', text:'A carrier gives two axes. A cosine and a sine at the same frequency $f_c$ are orthonormal over $[0,T]$ when each holds whole cycles there.'},
{t:'eqbox', cap:'The two carrier axes', tex:'\\psi_1(t)=\\sqrt{\\tfrac{2}{T}}\\cos(2\\pi f_ct),\\qquad \\psi_2(t)=\\sqrt{\\tfrac{2}{T}}\\sin(2\\pi f_ct),\\qquad 0\\le t\\le T',
 after:'$f_cT$ is a whole number, so each function holds whole cycles in $[0,T]$.'},
{t:'fig', svg:()=>{
  const a=ax({w:560,h:180,xr:[-0.03,1.08],yr:[-1.8,1.8],xlabel:'t/T',ylabel:'\\psi_1,\\;\\psi_2',xtarget:4,ytarget:3});
  const f=t=>t>=0&&t<=1;
  a.curve(t=>f(t)?Math.SQRT2*Math.cos(6*Math.PI*t):0,{color:C.h,width:2.2});
  a.curve(t=>f(t)?Math.SQRT2*Math.sin(6*Math.PI*t):0,{color:C.h,width:1.8,dash:'6 4'});
  return a.svg();
}, cap:'The two axes with $T=1$ and $f_cT=3$: $\\psi_1$ solid and $\\psi_2$ dashed. Each holds whole cycles in $[0,T]$.'},
{t:'p', text:'Check unit energy first. Use $2\\cos^{2}a=1+\\cos2a$, then integrate term by term.'},
{t:'eqbox', cap:'Unit energy', tex:
  '\\begin{aligned}\\int_0^{T}\\psi_1^{2}\\,dt&=\\frac{2}{T}\\int_0^{T}\\cos^{2}(2\\pi f_ct)\\,dt\\\\&=\\frac{1}{T}\\int_0^{T}\\bigl[1+\\cos(4\\pi f_ct)\\bigr]\\,dt\\\\&=1+\\frac{\\sin(4\\pi f_cT)}{4\\pi f_cT}=1\\end{aligned}',
 after:'The sine is zero because $4\\pi f_cT$ is a whole multiple of $2\\pi$. The same steps with $2\\sin^{2}a=1-\\cos2a$ give unit energy for $\\psi_2$.'},
{t:'p', text:'Then check orthogonality. Use $2\\cos a\\sin a=\\sin2a$.'},
{t:'eqbox', cap:'The cosine and the sine are orthogonal', tex:
  '\\begin{aligned}\\int_0^{T}\\psi_1\\psi_2\\,dt&=\\frac{2}{T}\\int_0^{T}\\cos(2\\pi f_ct)\\sin(2\\pi f_ct)\\,dt\\\\&=\\frac{1}{T}\\int_0^{T}\\sin(4\\pi f_ct)\\,dt\\\\&=\\frac{1-\\cos(4\\pi f_cT)}{4\\pi f_cT}=0\\end{aligned}',
 after:'The product holds $2f_cT$ whole cycles, and $\\cos(4\\pi f_cT)=1$.'},
{t:'p', text:'A carrier of energy $E$ and phase $\\theta$ is one point in this plane. Expand the cosine of a difference to find its coordinates.'},
{t:'eqbox', cap:'A carrier with phase $\\theta$', tex:
  '\\begin{aligned}s(t)&=\\sqrt{\\tfrac{2E}{T}}\\cos(2\\pi f_ct-\\theta)\\\\&=\\sqrt{\\tfrac{2E}{T}}\\bigl[\\cos\\theta\\cos(2\\pi f_ct)+\\sin\\theta\\sin(2\\pi f_ct)\\bigr]\\\\&=\\sqrt{E}\\cos\\theta\\,\\psi_1(t)+\\sqrt{E}\\sin\\theta\\,\\psi_2(t)\\end{aligned}',
 after:'The point is $(\\sqrt{E}\\cos\\theta,\\sqrt{E}\\sin\\theta)$, on the circle of radius $\\sqrt{E}$. At $\\theta=90^{\\circ}$ it is $(0,\\sqrt{E})$, because $\\cos(x-90^{\\circ})=\\sin x$.'},
{t:'box', kind:'def', hd:'Orthogonal carriers', html:'Two sinusoids are orthogonal over $T$ when each holds a whole number of cycles in $T$ and the numbers differ. Wi-Fi spaces its subcarriers $\\Delta f=312.5$ kHz apart. So each holds whole cycles in one symbol of $T=3.2\\ \\mu$s.'},

{t:'ex', hd:'Example 3.2 — four carrier waveforms', rows:[
 ['Given','For $0\\le t\\le T$ and whole $f_cT$: $s_{1,2}(t)=\\mp\\sqrt{2/T}\\cos(2\\pi f_ct)+\\sqrt{2/T}\\sin(2\\pi f_ct)$ and $s_{3,4}(t)=\\mp\\sqrt{2/T}\\cos(2\\pi f_ct)-\\sqrt{2/T}\\sin(2\\pi f_ct)$.'],
 ['Find','A basis, the four signal vectors, their energies and $d_{\\min}$.'],
 ['Method','Every waveform is already a sum of $\\psi_1$ and $\\psi_2$ above. So the basis is found by inspection, and the coefficients are the coordinates.'],
 ['Solution','Each waveform is $s_i(t)=s_{i1}\\psi_1(t)+s_{i2}\\psi_2(t)$ with $s_{ij}=\\pm1$. So $\\mathbf{s}_1=(-1,1)$, $\\mathbf{s}_2=(1,1)$, $\\mathbf{s}_3=(-1,-1)$ and $\\mathbf{s}_4=(1,-1)$. Each energy is $1+1=2$. Neighbours differ by $2$ in one coordinate, so $d_{\\min}=2$.'],
 ['Check','The four points form the square of Example 3.1. The waveforms differ, and the constellation is the same.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $\\pm1$ as the coordinate, not $\\pm\\sqrt{2/T}$. The factor $\\sqrt{2/T}$ belongs to the basis function $\\psi_j$, so it is already inside the axis.'},
{t:'p', text:'The pulse set of Example 3.1 and the carrier set of Example 3.2 share one constellation. Sets like these are called <b>geometrically equivalent</b>.'},
{t:'p', text:'Geometrically equivalent sets need the same receiver. They also have the same error probability in white Gaussian noise, because both follow from the points alone.'},
{t:'box', kind:'warn', hd:'Bandwidth', html:'The constellation does not fix the bandwidth. The pulse set occupies frequencies near $f=0$, and the carrier set occupies frequencies near $f_c$. Bandwidth follows from the waveform shapes.'},

{t:'p', text:'$M$ carriers of equal energy at equally spaced phases form <b>M-ary phase shift keying</b>, or M-PSK. Every point lies on one circle.'},
{t:'eqbox', cap:'The M-PSK signal set', tex:
  '\\begin{aligned}s_i(t)&=A\\cos\\!\\left(2\\pi f_ct-\\tfrac{2\\pi i}{M}\\right),\\quad i=0,\\ldots,M-1\\\\\\mathbf{s}_i&=\\sqrt{E}\\left(\\cos\\tfrac{2\\pi i}{M},\\ \\sin\\tfrac{2\\pi i}{M}\\right),\\quad E=\\tfrac{A^{2}T}{2}\\end{aligned}',
 after:'The second line is the carrier result above with $\\theta=2\\pi i/M$ and $A=\\sqrt{2E/T}$.'},
{t:'p', text:'Neighbouring points are $2\\pi/M$ apart in angle. Take the difference of $\\mathbf{s}_0$ and $\\mathbf{s}_1$, square its length, and use $1-\\cos2a=2\\sin^{2}a$.'},
{t:'eqbox', cap:'The distance between neighbours', tex:[
  '\\begin{aligned}d_{\\min}^{2}&=E\\Bigl[\\bigl(1-\\cos\\tfrac{2\\pi}{M}\\bigr)^{2}+\\sin^{2}\\tfrac{2\\pi}{M}\\Bigr]\\\\&=E\\Bigl[2-2\\cos\\tfrac{2\\pi}{M}\\Bigr]\\\\&=4E\\sin^{2}\\tfrac{\\pi}{M}\\end{aligned}',
  'd_{\\min}=2\\sqrt{E}\\,\\sin\\frac{\\pi}{M}'],
 after:'The middle step uses $\\cos^{2}a+\\sin^{2}a=1$. Each doubling of $M$ adds one bit a symbol and brings neighbours closer.'},
{t:'p', text:'For 8-PSK at $E=1$, $d_{\\min}=2\\sin(\\pi/8)=2(0.383)=0.765$. QPSK at $E=2$ gives $d_{\\min}=2\\sqrt2\\,\\sin(\\pi/4)=2\\sqrt2\\,(0.707)=2$, the square of Example 3.2.'},
{t:'p', text:'Square grids of points, called QAM, carry more bits a symbol. At average energy $1$, $d_{\\min}$ is $2$ for BPSK, $0.632$ for 16-QAM and $0.309$ for 64-QAM.'},
{t:'figrow', n:2, items:[
 {svg:()=>{const a=plane({w:330,h:260,xr:[-2,2],xticksOverride:[-1,1],yticksOverride:[-1,1]});
   circle(a,Math.SQRT2);
   points(a,[[-1,1,'\\mathbf{s}_1'],[1,1,'\\mathbf{s}_2'],[-1,-1,'\\mathbf{s}_3'],[1,-1,'\\mathbf{s}_4']]);
   return a.svg();},
  cap:'Example 3.2 as QPSK: four points on the circle of radius $\\sqrt2$, with $d_{\\min}=2$.'},
 {svg:()=>{const a=plane({w:330,h:260,xr:[-1.4,2.4],xticksOverride:[],yticksOverride:[]});
   circle(a,1);
   const c=Math.cos(Math.PI/4);
   a.poly([[1,0],[c,c]],{color:C.mid,width:2.2});
   for(let i=0;i<8;i++) a.point(Math.cos(i*Math.PI/4),Math.sin(i*Math.PI/4),{color:C.in,r:5});
   lab(a,1.1,0.5,'d_{\\min}=0.765',C.mid,'start');
   return a.svg();},
  cap:'8-PSK at $E=1$: eight points on the unit circle. Neighbours are $0.765$ apart.'}
]},

{t:'h2', num:'3.3', text:'The Gram–Schmidt procedure'},
{t:'p', text:'So far each basis was found by inspection. The <b>Gram–Schmidt procedure</b> finds one for any set of $M$ waveforms. It takes the signals in turn and keeps only what is new in each.'},
{t:'p', text:'Start with the first signal and scale it to unit energy.'},
{t:'eqbox', cap:'Step 1', tex:'E_1=\\int s_1^{2}(t)\\,dt,\\qquad \\psi_1(t)=\\frac{s_1(t)}{\\sqrt{E_1}}',
 after:'The first axis is the first signal scaled to unit energy. The coordinate of $s_1$ on it is $s_{11}=\\sqrt{E_1}$.'},
{t:'p', text:'For each later signal $s_k$, find its coordinates on the axes found so far. Subtract those parts. Then scale the nonzero remainder to unit energy.'},
{t:'eqbox', cap:'Step $k$', tex:[
  's_{ki}=\\int s_k(t)\\,\\psi_i(t)\\,dt,\\qquad g_k(t)=s_k(t)-\\sum_{i=1}^{k-1}s_{ki}\\,\\psi_i(t)',
  '\\psi_k(t)=\\frac{g_k(t)}{\\sqrt{E_{g_k}}},\\qquad E_{g_k}=\\int g_k^{2}(t)\\,dt'],
 after:'The remainder $g_k(t)$ is orthogonal to every earlier axis, so $\\psi_k$ is a new axis.'},
{t:'box', kind:'warn', hd:'Stop rule', html:'If $g_k(t)=0$, then $s_k$ is a combination of earlier signals and adds no axis. So $N\\le M$, with $N=M$ only when no signal is a combination of the others.'},
{t:'p', text:'The energy of a remainder follows from the energy result. With one earlier axis, $g_2$ is orthogonal to $\\psi_1$. So the energy of $s_2$ splits into two squared lengths.'},
{t:'eqbox', cap:'The energy of the remainder', tex:'E_2=s_{21}^{2}+E_{g_2}\\;\\Longrightarrow\\;E_{g_2}=E_2-s_{21}^{2}',
 after:'For example, $E_2=25$ and $s_{21}=3$ give $E_{g_2}=25-3^{2}=16$.'},

{t:'p', text:'Example 3.3 runs the procedure on three rectangular pulses. The third pulse is the first one followed by the second.'},
{t:'figrow', n:3, items:[
 {svg:()=>wave(S1,'s_1(t)',C.in), cap:'$s_1$'},
 {svg:()=>wave(S2,'s_2(t)',C.in), cap:'$s_2$'},
 {svg:()=>wave(S3,'s_3(t)',C.in), cap:'$s_3=s_1+s_2$'}
]},
{t:'ex', hd:'Example 3.3 — three pulses, two axes', rows:[
 ['Given','$s_1(t)=1$ on $[0,2]$, $s_2(t)=1$ on $[2,3]$ and $s_3(t)=1$ on $[0,3]$. Each is zero elsewhere.'],
 ['Find','An orthonormal basis, the three signal vectors and the constellation.'],
 ['Method','Gram–Schmidt needs no guess about the basis. Normalise the first signal. For each later signal, subtract its parts along the axes found so far and normalise the remainder.'],
 ['Step 1','$E_1=\\int_0^{2}1^{2}\\,dt=2$, so $\\psi_1(t)=1/\\sqrt{2}$ on $[0,2]$ and $s_{11}=\\sqrt{2}$.'],
 ['Step 2','$s_{21}=\\int s_2\\psi_1\\,dt=0$, because the two never overlap. So $g_2=s_2$, its energy is $1$, and $\\psi_2(t)=s_2(t)$.'],
 ['Step 3','$s_{31}=\\int_0^{2}1\\cdot\\tfrac{1}{\\sqrt2}\\,dt=\\sqrt{2}$ and $s_{32}=\\int_2^{3}1\\cdot1\\,dt=1$. Then $g_3=s_3-\\sqrt{2}\\,\\psi_1-\\psi_2=0$, so no third axis is added.'],
 ['Solution','$\\mathbf{s}_1=(\\sqrt{2},0)$, $\\mathbf{s}_2=(0,1)$ and $\\mathbf{s}_3=(\\sqrt{2},1)$, with $N=2$.'],
 ['Check','Energies from the vectors are $2$, $1$ and $3$. From the waveforms, height $1$ over lengths $2$, $1$ and $3$ gives the same values. Three waveforms need only two axes, because $s_3=s_1+s_2$.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $\\psi_1=0$ on $[2,3]$, not $\\psi_1=1/\\sqrt2$ there. The integral for $s_{31}$ then runs over $[0,2]$ only, and $s_{31}=\\sqrt2$.'},
{t:'p', text:'The constellation of Example 3.3 has two axes and three points.'},
{t:'fig', svg:()=>{
  const a=ax({w:420,h:260,xr:[-0.5,2.0],yr:[-0.5,1.7],xlabel:'\\psi_1',ylabel:'\\psi_2',
    pad:{l:50,r:22,t:24,b:38},xtarget:4,ytarget:4});
  [[Math.SQRT2,0,'\\mathbf{s}_1'],[0,1,'\\mathbf{s}_2'],[Math.SQRT2,1,'\\mathbf{s}_3']].forEach(([x,y,l])=>{
    a.poly([[x,0],[x,y]],{color:C.rule,width:1,dash:'3 4'});
    a.poly([[0,y],[x,y]],{color:C.rule,width:1,dash:'3 4'});
    a.point(x,y,{color:C.in,r:6});
    lab(a,x+0.08,y+0.12,l,C.in);
  });
  return a.svg();
}, cap:'Two axes carry three signals. The point furthest from the origin is $\\mathbf{s}_3$, whose energy is $3$.'},

{t:'p', text:'Example 3.4 needs three axes for four signals. Its pieces overlap, so no basis can be read off at once.'},
{t:'ex', hd:'Example 3.4 — four signals, three axes', rows:[
 ['Given','$s_1=1$ on $[0,2)$. $s_2=1$ on $[0,1)$ and $-1$ on $[1,2)$. $s_3=-1$ on $[0,1)$ and $1$ on $[1,3)$. $s_4=1$ on $[0,3)$. Each is zero elsewhere.'],
 ['Find','The basis, the four signal vectors and the number of dimensions $N$.'],
 ['Method','Run Gram–Schmidt in the order $s_1,s_2,s_3,s_4$. Each coordinate is a sum of piece heights times piece widths.'],
 ['Step 1','$E_1=\\int_0^{2}1^{2}\\,dt=2$, so $\\psi_1=s_1/\\sqrt2$.'],
 ['Step 2','$s_{21}=\\tfrac{1}{\\sqrt2}(1-1)=0$. So $g_2=s_2$, with energy $2$, and $\\psi_2=s_2/\\sqrt2$.'],
 ['Step 3','$s_{31}=\\tfrac{1}{\\sqrt2}(-1+1)=0$ and $s_{32}=\\tfrac{1}{\\sqrt2}(-1-1)=-\\sqrt2$. Then $g_3=s_3+\\sqrt2\\,\\psi_2=s_3+s_2$, which is $1$ on $[2,3)$ and zero elsewhere. Its energy is $1$, so $\\psi_3=g_3$.'],
 ['Step 4','$s_{41}=\\tfrac{1}{\\sqrt2}(1+1)=\\sqrt2$, $s_{42}=\\tfrac{1}{\\sqrt2}(1-1)=0$ and $s_{43}=\\int_2^{3}1\\,dt=1$. Then $g_4=s_4-\\sqrt2\\,\\psi_1-\\psi_3=0$, so $s_4$ adds no axis.'],
 ['Solution','$\\mathbf{s}_1=(\\sqrt2,0,0)$, $\\mathbf{s}_2=(0,\\sqrt2,0)$, $\\mathbf{s}_3=(0,-\\sqrt2,1)$ and $\\mathbf{s}_4=(\\sqrt2,0,1)$, with $N=3$.'],
 ['Check','Energies from the vectors are $2$, $2$, $3$ and $3$, equal to $\\int s_i^{2}\\,dt$. Also $\\mathbf{s}_1+\\mathbf{s}_2+\\mathbf{s}_3=\\mathbf{s}_4$, matching $s_4=s_1+s_2+s_3$.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Count one axis for each nonzero remainder, not one for each signal. Here $g_4=0$, so $N=3$, not $4$.'},
{t:'p', text:'The four vectors of Example 3.4 are drawn in three dimensions below, seen from an angle.'},
{t:'fig', svg:()=>{
  const az=Math.PI/6, el=22*Math.PI/180;
  const pr=(x,y,z)=>[x*Math.cos(az)-y*Math.sin(az), z*Math.cos(el)+(x*Math.sin(az)+y*Math.cos(az))*Math.sin(el)];
  const a=plane({w:420,h:270,xr:[-1.5,2.3],yc:0.52,xlabel:'',ylabel:'',grid:false,zeroAxes:false,arrows:false,
    xticksOverride:[],yticksOverride:[]});
  [[[0,0,0],[2,0,0],'\\psi_1',[2.22,0,0]],[[0,-1.9,0],[0,1.9,0],'\\psi_2',[0,2.2,0]],
   [[0,0,0],[0,0,1.55],'\\psi_3',[0,0,1.72]]].forEach(([p,q,n,l])=>{
    a.poly([pr(...p),pr(...q)],{color:C.muted,width:1.4});
    const L=pr(...l); lab(a,L[0],L[1]-0.06,n,C.ink,'middle'); });
  [[Math.SQRT2,0,0],[0,Math.SQRT2,0],[0,-Math.SQRT2,1],[Math.SQRT2,0,1]].forEach((s,k)=>{
    const Q=pr(...s);
    if(s[2]) a.poly([pr(s[0],s[1],0),Q],{color:C.rule,width:1,dash:'3 4'});
    a.point(Q[0],Q[1],{color:C.in,r:5.5});
    lab(a,Q[0]+0.12,Q[1]+0.14,'\\mathbf{s}_'+(k+1),C.in); });
  return a.svg();
}, cap:'Four signals need three axes. $\\mathbf{s}_4$ sits one unit above $\\mathbf{s}_1$, along $\\psi_3$.'},

{t:'p', text:'The basis is not unique. Taking the signals in another order in Gram–Schmidt gives another orthonormal basis of the same space. The new axes are the old ones turned or reflected.'},
{t:'p', text:'The coordinates change. The number of axes, the energies, the inner products and the distances do not, because each is an integral of the waveforms.'},
{t:'eqbox', cap:'Unchanged by a change of basis', tex:'N,\\qquad \\|\\mathbf{s}_i\\|^{2}=E_i,\\qquad \\langle\\mathbf{s}_i,\\mathbf{s}_k\\rangle,\\qquad \\|\\mathbf{s}_i-\\mathbf{s}_k\\|'},
{t:'p', text:'For example, turn the axes of Example 3.1 by $45^{\\circ}$. The new first axis is $\\psi_1\'=(\\psi_1+\\psi_2)/\\sqrt2$, and the new second axis is $\\psi_2\'=(\\psi_2-\\psi_1)/\\sqrt2$.'},
{t:'eqbox', cap:'The new coordinates of $\\mathbf{s}_1=(1,1)$', tex:[
  '\\langle\\mathbf{s}_1,\\psi_1\'\\rangle=\\frac{1+1}{\\sqrt2}=\\sqrt2',
  '\\langle\\mathbf{s}_1,\\psi_2\'\\rangle=\\frac{-1+1}{\\sqrt2}=0'],
 after:'All the length $\\sqrt2$ of $\\mathbf{s}_1$ now lies on $\\psi_1\'$. Its energy is still $2$.'},

{t:'h2', num:'3.4', text:'Summary'},
{t:'table', cap:'Summary of Chapter 3: the geometric representation of signal waveforms.', head:['Result','Statement','Anchor'], rows:[
 ['Orthonormal set','$\\int\\psi_j\\psi_k\\,dt=1$ if $j=k$, else $0$','PS CH8.1'],
 ['Analysis','$s_{ij}=\\int_0^{T}s_i\\psi_j\\,dt$, one correlator for each basis function','PS CH8.1'],
 ['Synthesis','$s_i(t)=\\sum_js_{ij}\\psi_j(t)$','PS CH8.1'],
 ['Inner products preserved','$\\int xy\\,dt=\\sum_kx_ky_k$','PS CH8.1'],
 ['Energy','$E_i=\\|\\mathbf{s}_i\\|^{2}$','PS CH8.1'],
 ['Distance','$d_{ik}^{2}=\\|\\mathbf{s}_i-\\mathbf{s}_k\\|^{2}=\\int(s_i-s_k)^{2}dt$','PS CH8.1'],
 ['Constellation','one point for each waveform, one axis for each basis function','PS CH8.1'],
 ['Binary sets','antipodal $d=2\\sqrt{E_b}$, orthogonal and on-off $d=\\sqrt{2E_b}$, a $3$ dB gap','PS CH8.2'],
 ['Carrier axes','$\\sqrt{2/T}\\cos(2\\pi f_ct)$ and $\\sqrt{2/T}\\sin(2\\pi f_ct)$, orthonormal for whole $f_cT$','PS CH8.6.1'],
 ['QPSK','$(\\pm1,\\pm1)$, energy $2$, $d_{\\min}=2$','PS CH8.6.1'],
 ['M-PSK','$d_{\\min}=2\\sqrt{E}\\sin(\\pi/M)$','PS CH8.6.1'],
 ['Geometric equivalence','same constellation, same receiver and error probability, bandwidth not fixed','PS CH8.1'],
 ['Gram–Schmidt','$g_k=s_k-\\sum_{i<k}s_{ki}\\psi_i$, and $\\psi_k=g_k/\\sqrt{E_{g_k}}$','PS CH8.1'],
 ['Dimension','$N\\le M$, and a zero remainder adds no axis','PS CH8.1'],
 ['Change of basis','$N$, energies and distances unchanged','PS CH8.1']
]},
{t:'p', text:'Every waveform set is now a set of points, with energy as squared length and the energy of a difference as squared distance. Chapter 4 builds the receiver on these points. It correlates to find the received point and picks the nearest signal point. Its error probability depends only on the distances between the points.'}

];
})();
