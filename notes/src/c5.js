/* Course notes — Chapter 5. */
(function(){
const P=PLOT, C=P.COL;
const ax=o=>P.Axes(Object.assign({w:700,h:200,pad:{l:50,r:20,t:18,b:34},xtarget:6,ytarget:3},o));
/* Q(x) through erfc, with a fractional error below 1.2e-7, so a curve on a
   logarithmic axis keeps its shape. */
function erfc(x){ const z=Math.abs(x), t=1/(1+0.5*z);
  const r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+
    t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277)))))))));
  return x>=0?r:2-r; }
const Q=x=>0.5*erfc(x/Math.SQRT2);
const dB=d=>Math.pow(10,d/10);
const lab=(a,x,y,s,col,anchor)=>a.note(x,y,s,{tex:true,fs:13,color:col||C.ink,anchor:anchor||'start'});
/* A log-axis value that stops at the lower edge of the axis. */
const lg=(v,lo)=>{ const y=Math.log10(Math.max(1e-14,v)); return y<lo-0.02?NaN:y; };
const logAx=o=>ax(Object.assign({yr:[-7,-0.0001],ytickfmt:P.decade,yticksOverride:P.decades(-7,-1),zeroAxes:false},o));

/* A constellation with the region belonging to each point, shaded by the
   nearest-point rule of Chapter 4. */
function con(pts,opts){
  opts=opts||{};
  const lim=opts.lim||1.9, n=opts.n||72, w=opts.w||300, h=opts.h||230;
  const ylim=lim*(h-54)/(w-62);
  const a=ax({w,h,xr:[-lim,lim],yr:[-ylim,ylim],xlabel:opts.labels?'':'\\psi_1',ylabel:opts.labels?'':'\\psi_2',pad:{l:44,r:18,t:20,b:34},
    xticksOverride:[],yticksOverride:[]});
  const REG=[C.dec.in,C.dec.out,C.dec.mid,C.dec.h,C.dec.err];
  const sx=2*lim/n, sy=2*ylim/n;
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){
    const x=-lim+(i+0.5)*sx, y=-ylim+(j+0.5)*sy;
    let best=0,bd=Infinity;
    pts.forEach((p,k)=>{const d=(x-p[0])**2+(y-p[1])**2; if(d<bd){bd=d;best=k;}});
    a.rect(x-sx/2,y-sy/2,x+sx/2,y+sy/2,{fill:REG[best%REG.length]});
  }
  pts.forEach((p,k)=>{ a.point(p[0],p[1],{color:C.in,r:opts.r||4.5});
    if(opts.labels) lab(a,p[0]*1.28,p[1]*1.28-0.06,'\\mathtt{'+opts.labels[k]+'}',C.in,p[0]>0.1?'start':p[0]<-0.1?'end':'middle'); });
  return a.svg();
}
const PSK=M=>Array.from({length:M},(_,k)=>[Math.cos(2*Math.PI*k/M),Math.sin(2*Math.PI*k/M)]);
const GRID=L=>{ const v=Array.from({length:L},(_,i)=>2*i+1-L), o=[]; v.forEach(x=>v.forEach(y=>o.push([x,y]))); return o; };

window.C5 = [

{t:'h1', num:'CHAPTER 5', text:'Digital modulation methods'},
{t:'p', lead:true, text:'A carrier has an amplitude, a phase and a frequency. Keying one of them, or two at once, puts bits on the carrier. Each scheme of this chapter is a set of points, and the receiver of Chapter 4 decides among them. What changes from scheme to scheme is where the points sit, how many bits each carries, and how much band the carrier needs.'},

{t:'h2', num:'5.1', text:'Putting bits on a carrier'},
{t:'p', text:'A baseband signal $s(t)$ has its spectrum near $f=0$. Multiplying it by a carrier $\\cos(2\\pi f_ct)$ moves that spectrum to $\\pm f_c$.'},
{t:'eqbox', cap:'Modulation shifts the spectrum', tex:[
  'u(t)=s(t)\\cos(2\\pi f_ct)\\;\\Longrightarrow\\;U(f)=\\tfrac12S(f-f_c)+\\tfrac12S(f+f_c)',
  '\\int s^{2}(t)\\cos^{2}(2\\pi f_ct)\\,dt=\\tfrac12\\int s^{2}(t)\\,dt+\\tfrac12\\int s^{2}(t)\\cos(4\\pi f_ct)\\,dt\\approx\\tfrac12E_s'],
 after:'Each copy keeps the shape of $S(f)$ at half the height. The second integral nearly vanishes when $f_c\\gg W$, so the carrier halves the energy.'},
{t:'p', text:'A baseband band $W$ becomes a passband from $f_c-W$ to $f_c+W$. For example, $W=5$ kHz on a $40$ kHz carrier occupies $35$ to $45$ kHz, a band of $2W=10$ kHz.'},
{t:'p', text:'Two baseband numbers can share one carrier frequency. The IQ modulator puts $I$ on the cosine and $Q$ on the sine.'},
{t:'eqbox', cap:'The IQ modulator', tex:[
  's(t)=I\\cos(2\\pi f_ct)-Q\\sin(2\\pi f_ct)=A\\cos(2\\pi f_ct+\\theta)',
  'A=\\sqrt{I^{2}+Q^{2}},\\qquad \\theta=\\operatorname{atan2}(Q,I)'],
 after:'Over many carrier cycles the cosine and the sine are orthogonal. A correlator on the cosine sees $I$ alone, and one on the sine sees $Q$ alone. The point $(I,Q)=(-1,+1)$ gives $\\theta=135^{\\circ}$.'},
{t:'p', text:'Three binary schemes follow from keying one quantity. Binary phase-shift keying (BPSK) sends the carrier or its negative. Binary frequency-shift keying (BFSK) sends one of two tones. Binary amplitude-shift keying (BASK), also called on-off keying, sends the carrier or nothing.'},
{t:'eqbox', cap:'The three binary schemes', tex:[
  '\\text{BPSK: }s_{1,0}(t)=\\pm\\sqrt{\\tfrac{2E_b}{T_b}}\\cos(2\\pi f_ct),\\qquad d_{\\min}=2\\sqrt{E_b}',
  '\\text{BFSK: }s_i(t)=\\sqrt{\\tfrac{2E_b}{T_b}}\\cos(2\\pi f_it),\\qquad d_{\\min}=\\sqrt{2E_b}',
  '\\text{BASK: }s_1(t)=\\sqrt{\\tfrac{2E}{T_b}}\\cos(2\\pi f_ct),\\ s_0(t)=0,\\qquad d=\\sqrt E=\\sqrt{2E_b}'],
 after:'BPSK has two antipodal points. BFSK has two orthogonal points. BASK has a point at the origin and one at $\\sqrt E$, with average energy $E_b=E/2$.'},
{t:'p', text:'The two BFSK tones are orthogonal only for certain spacings $\\Delta f=f_1-f_0$. Their correlation over one bit, when $f_0\\gg1/T_b$, is a sinc.'},
{t:'eqbox', cap:'Correlation of two tones', tex:'\\rho=\\frac{1}{E_b}\\int_0^{T_b}s_0(t)\\,s_1(t)\\,dt\\approx\\frac{\\sin(2\\pi\\Delta fT_b)}{2\\pi\\Delta fT_b}',
 after:'$\\rho=0$ first at $\\Delta f=1/(2T_b)$, the least spacing for coherent BFSK. The lowest value, $\\rho=-0.217$, falls at $\\Delta f=0.715/T_b$.'},
{t:'fig', svg:()=>{ const a=ax({w:560,h:190,xr:[0,2.05],yr:[-0.35,1.1],xlabel:'\\Delta f\\,T_b',ylabel:'\\rho',xticksOverride:[0.5,1,1.5,2],yticksOverride:[0.5,1]});
  a.curve(x=>x<1e-9?1:Math.sin(2*Math.PI*x)/(2*Math.PI*x),{color:C.mid,width:2.2});
  a.point(0.5,0,{color:C.mid,r:4.5}); a.point(0.715,-0.217,{color:C.mid,r:4.5});
  lab(a,0.76,-0.28,'-0.217',C.mid); return a.svg(); },
 cap:'The correlation of two BFSK tones against their spacing. The first zero is at $\\Delta f=1/(2T_b)$.'},
{t:'p', text:'Each scheme gives a binary error probability through Chapter 4, $Q\\bigl(\\sqrt{d^{2}/2N_0}\\bigr)$. Here $Q(x)=\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$ is the Gaussian tail.'},
{t:'eqbox', cap:'Binary error probabilities', tex:'\\text{BPSK: }P_b=Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right),\\qquad \\text{BFSK, BASK: }P_b=Q\\!\\left(\\sqrt{\\frac{E_b}{N_0}}\\right)',
 after:'Half the squared distance costs a factor $2$ in energy, or $3$ dB. At $P_b=10^{-5}$ BPSK needs $9.6$ dB and BFSK or BASK $12.6$ dB.'},
{t:'fig', svg:()=>{ const a=logAx({w:560,h:220,xr:[0,15],xlabel:'E_b/N_0\\;(\\text{dB})',ylabel:'P_b',xticksOverride:[0,3,6,9,12]});
  a.curve(d=>lg(Q(Math.sqrt(dB(d))),-7),{color:C.err,width:2.2,dash:'7 5'});
  a.curve(d=>lg(Q(Math.sqrt(2*dB(d))),-7),{color:C.err,width:2.4});
  lab(a,7.6,-5.6,'\\text{BPSK}',C.err,'end'); lab(a,11.2,-2.6,'\\text{BFSK, BASK}',C.err,'start'); return a.svg(); },
 cap:'Bit error of BPSK (solid) and of BFSK and BASK (dashed). The curves are $3$ dB apart.'},
{t:'ex', hd:'Example 5.1 — a binary link', rows:[
 ['Given','A link receives $P=4\\times10^{-15}$ W at $R_b=100$ kb/s, with $N_0=4\\times10^{-21}$ W/Hz.'],
 ['Find','The bit error of BPSK and of BFSK.'],
 ['Method','The energy a bit is power times bit time, $E_b=P/R_b=4\\times10^{-20}$ J. So $E_b/N_0=10$, or $10$ dB.'],
 ['Solution','BPSK: $P_b=Q(\\sqrt{20})=3.87\\times10^{-6}$. BFSK: $P_b=Q(\\sqrt{10})=7.83\\times10^{-4}$.'],
 ['Check','BFSK needs twice the energy for the same distance. It would match BPSK at $8\\times10^{-15}$ W.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $E_b=P/R_b$, not $P$, over $N_0$. The ratio $P/N_0=10^{6}$ Hz is not a signal-to-noise ratio.'},

{t:'h2', num:'5.2', text:'Phase-shift keying'},
{t:'p', text:'M-ary PSK puts $M$ points on a circle of radius $\\sqrt{E_s}$. Each symbol carries $k=\\log_2M$ bits, and $E_s=kE_b$.'},
{t:'eqbox', cap:'M-PSK and its neighbour distance', tex:[
  's_m(t)=\\sqrt{\\tfrac{2E_s}{T}}\\cos\\!\\left(2\\pi f_ct+\\tfrac{2\\pi m}{M}\\right),\\qquad m=0,\\ldots,M-1',
  'd_{\\min}^{2}=E_s+E_s-2E_s\\cos\\tfrac{2\\pi}{M}=4E_s\\sin^{2}\\tfrac{\\pi}{M}'],
 after:'The cosine rule on two neighbours, then $1-\\cos2x=2\\sin^{2}x$. At $M=2$ this is BPSK. QPSK with $E_s=2$ has $d_{\\min}=2$.'},
{t:'figrow', n:3, items:[
 {svg:()=>con(PSK(4).map(p=>[1.2*(p[0]-p[1])/Math.SQRT2,1.2*(p[0]+p[1])/Math.SQRT2]),{lim:1.9,labels:['00','01','11','10']}), cap:'QPSK with Gray labels.'},
 {svg:()=>con(PSK(8).map(p=>[p[0]*1.2,p[1]*1.2]),{lim:1.9,labels:['000','001','011','010','110','111','101','100']}), cap:'8-PSK with Gray labels.'},
 {svg:()=>con(PSK(16).map(p=>[p[0]*1.2,p[1]*1.2]),{lim:1.9,r:3.5}), cap:'16-PSK: the wedges narrow.'}
]},
{t:'p', text:'QPSK is two BPSK signals, one on the cosine and one on the sine. The carriers are orthogonal, so each bit sees its own BPSK link.'},
{t:'eqbox', cap:'QPSK', tex:'P_b=Q\\!\\left(\\sqrt{\\frac{2E_b}{N_0}}\\right),\\qquad P_e=1-(1-P_b)^{2}\\approx2P_b',
 after:'QPSK carries twice the bits of BPSK in the same band, at the same bit error.'},
{t:'p', text:'The receiver uses two correlators, $y_1$ on $\\psi_1=\\sqrt{2/T}\\cos(2\\pi f_ct)$ and $y_2$ on $\\psi_2=-\\sqrt{2/T}\\sin(2\\pi f_ct)$. All points have equal energy, so the nearest point is the one with the nearest phase to $\\theta=\\operatorname{atan2}(y_2,y_1)$. An 8-PSK receiver that measures $50^{\\circ}$ picks $45^{\\circ}$.'},
{t:'p', text:'Each point has two neighbours at $d_{\\min}$. The nearest-neighbour form of Chapter 4 gives the symbol error.'},
{t:'eqbox', cap:'M-PSK symbol error', tex:[
  'P_e\\approx2Q\\!\\left(\\sqrt{\\frac{2E_s}{N_0}}\\,\\sin\\frac{\\pi}{M}\\right)',
  '\\frac{E_{s,8}}{E_{s,4}}=\\frac{\\sin^{2}(\\pi/4)}{\\sin^{2}(\\pi/8)}=3.41\\;(5.33\\text{ dB})'],
 after:'Going from QPSK to 8-PSK at the same $d_{\\min}$ costs $5.33$ dB of symbol energy. Per bit that is $5.33-10\\log_{10}1.5=3.57$ dB. For large $M$ the cost tends to $6$ dB a doubling.'},
{t:'fig', svg:()=>{ const a=logAx({w:560,h:230,xr:[0,26],xlabel:'E_b/N_0\\;(\\text{dB})',ylabel:'P_e',xticksOverride:[0,5,10,15,20]});
  const pe=(M,g)=>M===2?Q(Math.sqrt(2*g)):2*Q(Math.sqrt(2*Math.log2(M)*g)*Math.sin(Math.PI/M));
  [[2,null],[4,'2 4'],[8,'7 5'],[16,'12 5 3 5'],[32,'3 3']].forEach(([M,da])=>a.curve(d=>lg(pe(M,dB(d)),-7),{color:C.err,width:2,dash:da}));
  lab(a,8.3,-6.5,'M=2,4',C.err,'end'); lab(a,13.6,-6.5,'8',C.err,'end'); lab(a,18.6,-6.5,'16',C.err,'end'); lab(a,23.6,-6.5,'32',C.err,'end');
  return a.svg(); },
 cap:'Symbol error of M-PSK from the nearest-neighbour form, exact for $M=2$.'},
{t:'p', text:'A symbol error nearly always lands on a neighbour. Gray labels make neighbours differ in one bit, $g=i\\oplus\\lfloor i/2\\rfloor$. Then one symbol error costs one bit of $k$.'},
{t:'eqbox', cap:'Bits from symbols, with Gray labels', tex:'P_b\\approx\\frac{P_e}{\\log_2M}',
 after:'Natural binary labels put $\\mathtt{011}$ beside $\\mathtt{100}$, and that symbol error costs three bits. With Gray labels, 8-PSK at $P_e=3\\times10^{-3}$ gives $P_b\\approx10^{-3}$.'},
{t:'ex', hd:'Example 5.2 — 8-PSK', rows:[
 ['Given','8-PSK with Gray labels at $E_b/N_0=10$ dB.'],
 ['Find','The symbol error $P_e$ and the bit error $P_b$.'],
 ['Method','$10$ dB is a ratio of $10$, and each symbol carries $3$ bits, so $E_s/N_0=30$. The argument of $Q$ is $\\sqrt{2(30)}\\,\\sin(\\pi/8)=2.96$.'],
 ['Solution','$P_e\\approx2Q(2.96)=2(1.52\\times10^{-3})=3.0\\times10^{-3}$ and $P_b\\approx P_e/3=1.0\\times10^{-3}$.'],
 ['Check','Each of the two neighbours contributes one $Q$ term. The sent point sits inside a wedge of $\\pm22.5^{\\circ}$.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $E_s=3E_b$, not $E_b$, inside $Q$. With $E_b$ the argument is $1.71$ and $P_e$ comes out as $0.087$.'},
{t:'p', text:'A receiver whose carrier phase is off by $\\varphi$ sees every point turned by $\\varphi$. M-PSK looks the same after a turn of $2\\pi/M$, so a receiver can lock to any of $M$ phases. At $\\varphi=90^{\\circ}$ QPSK looks perfect, yet every decision is a neighbour.'},
{t:'p', text:'Differential encoding puts each bit in the change of phase. The receiver compares each symbol with the one before, and a constant phase error cancels.'},
{t:'eqbox', cap:'Differential PSK', tex:[
  '\\theta_n=\\theta_{n-1}+\\pi b_n\\pmod{2\\pi},\\qquad \\hat b_n=1\\ \\text{when}\\ \\mathbf y_n\\cdot\\mathbf y_{n-1}<0',
  'P_b=\\tfrac12e^{-E_b/N_0}'],
 after:'The bits $1\\,0\\,1\\,1$ from $\\theta_0=0$ end at $\\theta_4=\\pi$. At $10^{-5}$ binary DPSK needs $10.34$ dB against $9.59$ dB for BPSK, a price of $0.75$ dB. At $10$ dB, $P_b=\\tfrac12e^{-10}=2.27\\times10^{-5}$.'},
{t:'box', kind:'warn', hd:'Errors in pairs', html:'One badly received symbol spoils two comparisons, with the symbol before and the one after. For $M\\ge4$, differential detection costs about $3$ dB over coherent PSK.'},

{t:'h2', num:'5.3', text:'Amplitude and quadrature'},
{t:'p', text:'M-ary amplitude-shift keying (M-ASK), also called PAM, puts $M$ equally spaced amplitudes on one axis. Neighbours are $d$ apart.'},
{t:'eqbox', cap:'M-ASK', tex:[
  's_m=(2m-1-M)\\,\\frac d2,\\qquad m=1,\\ldots,M',
  'E_s=\\frac{d^{2}}{4M}\\sum_{m=1}^{M}(2m-1-M)^{2}=\\frac{(M^{2}-1)\\,d^{2}}{12}',
  'P_e=\\frac{2(M-1)}{M}\\,Q\\!\\left(\\sqrt{\\frac{6E_s}{(M^{2}-1)N_0}}\\right)'],
 after:'The odd squares sum to $M(M^{2}-1)/3$. Inner points have two neighbours and the end points one. Each doubling of $M$ costs about $6$ dB.'},
{t:'fig', svg:()=>con([[-1.5,0],[-0.5,0],[0.5,0],[1.5,0]],{lim:2,w:560,h:130}),
 cap:'4-ASK on one axis. The two end regions run off to infinity.'},
{t:'ex', hd:'Example 5.3 — four-level ASK', rows:[
 ['Given','4-ASK with levels $\\pm A$, $\\pm3A$ at $E_s/N_0=25$.'],
 ['Find','The symbol error $P_e$.'],
 ['Method','$E_s=A^{2}(9+1+1+9)/4=5A^{2}$ and $d_{\\min}=2A$, so $d_{\\min}^{2}/2N_0=2E_s/5N_0=10$. The end points have $1$ neighbour and the inner points $2$, so $\\bar N_{\\min}=1.5$.'],
 ['Solution','$P_e\\approx1.5\\,Q(\\sqrt{10})=1.5(7.83\\times10^{-4})=1.17\\times10^{-3}$.'],
 ['Check','The M-ASK formula with $M=4$ gives the same: $\\tfrac{2(3)}{4}=1.5$ and $\\tfrac{6(25)}{15}=10$.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $\\bar N_{\\min}=1.5$, not $2$. The two end points have one neighbour each.'},
{t:'p', text:'Quadrature amplitude modulation (QAM) runs one ASK signal on the cosine and another on the sine. Square M-QAM is two $\\sqrt M$-level ASK axes at right angles.'},
{t:'eqbox', cap:'Square QAM', tex:[
  's(t)=I\\cos(2\\pi f_ct)-Q\\sin(2\\pi f_ct),\\qquad I,\\,Q\\in\\left\\{\\pm\\tfrac d2,\\pm\\tfrac{3d}{2},\\ldots\\right\\}',
  'E_s=2\\cdot\\frac{\\bigl((\\sqrt M)^{2}-1\\bigr)d^{2}}{12}=\\frac{(M-1)\\,d^{2}}{6}',
  'P_e\\approx4\\left(1-\\frac1{\\sqrt M}\\right)Q\\!\\left(\\sqrt{\\frac{3E_s}{(M-1)N_0}}\\right)'],
 after:'16-QAM with $d=2$ has $E_s=10$. Its $4$ corners have $2$ neighbours, its $8$ edge points $3$, and its $4$ inner points $4$. The average is $48/16=3$.'},
{t:'p', text:'A symbol is right only when both axes are right. That gives the exact symbol error of square QAM.'},
{t:'eqbox', cap:'Exact square QAM', tex:'P_e=1-\\bigl(1-P_{\\sqrt M}\\bigr)^{2},\\qquad P_{\\sqrt M}=2\\left(1-\\tfrac{1}{\\sqrt M}\\right)Q\\!\\left(\\sqrt{\\tfrac{3E_s}{(M-1)N_0}}\\right)',
 after:'Expanding gives $2P_{\\sqrt M}-P_{\\sqrt M}^{2}$, and the nearest-neighbour form keeps only $2P_{\\sqrt M}$. At a fixed $d_{\\min}$, $E_s$ grows as $M-1$, about $3$ dB for each extra bit.'},
{t:'figrow', n:2, items:[
 {svg:()=>con(GRID(4).map(p=>[p[0]*0.42,p[1]*0.42]),{lim:1.9,w:330,h:250,r:4}), cap:'16-QAM and its decision regions. The boundaries sit halfway between levels.'},
 {svg:()=>{ const a=logAx({w:330,h:250,xr:[0,24],xlabel:'E_b/N_0\\;(\\text{dB})',ylabel:'P_e',xticksOverride:[0,10,20],pad:{l:46,r:18,t:20,b:34}});
   const pq=(M,g)=>{ const p=2*(1-1/Math.sqrt(M))*Q(Math.sqrt(3*Math.log2(M)*g/(M-1))); return 1-(1-p)*(1-p); };
   [4,16,64].forEach(M=>a.curve(d=>lg(pq(M,dB(d)),-7),{color:C.err,width:2}));
   lab(a,8.5,-6.5,'4',C.err,'end'); lab(a,13,-6.5,'16',C.err,'end'); lab(a,17.6,-6.5,'64',C.err,'end');
   return a.svg(); }, cap:'Exact symbol error of square QAM for $M=4$, $16$ and $64$.'}
]},
{t:'ex', hd:'Example 5.4 — 16-QAM', rows:[
 ['Given','16-QAM with $d_{\\min}=2$ and $E_s/N_0=80$, about $19$ dB.'],
 ['Find','The energy $E_s$, the symbol error and the bit error with Gray labels.'],
 ['Method','$E_s=(M-1)d^{2}/6=15(4)/6=10$. Then $d_{\\min}^{2}/2N_0=3E_s/15N_0=E_s/5N_0=16$, and $\\bar N_{\\min}=3$.'],
 ['Solution','$P_e\\approx3\\,Q(4)=9.5\\times10^{-5}$ and $P_b\\approx P_e/4=2.4\\times10^{-5}$.'],
 ['Check','The grid $\\pm1$, $\\pm3$ on both axes gives $E_s=10$ directly. The boundaries are the lines at $0$ and $\\pm2$.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $\\bar N_{\\min}=3$, not $4$. Only the four inner points have four neighbours.'},
{t:'p', text:'A square grid is not the only way to place eight or sixteen points. Four eight-point sets with $d_{\\min}=2$ have average energies $6$, $6.83$, $6$ and $4.73$. The best of them puts four points on an inner square and four on the axes at $1+\\sqrt3$. It saves $10\\log_{10}(6/4.73)=1.03$ dB over the $2\\times4$ rectangle.'},
{t:'p', text:'At the same average energy, QAM spreads its points over the plane and PSK keeps them on a circle. The ratio of their squared distances measures the gain of QAM.'},
{t:'eqbox', cap:'QAM against PSK', tex:'R_M=\\frac{d_{\\text{QAM}}^{2}}{d_{\\text{PSK}}^{2}}=\\frac{6E_s/(M-1)}{4E_s\\sin^{2}(\\pi/M)}=\\frac{3}{2(M-1)\\sin^{2}(\\pi/M)}',
 after:'The gain is $1.65$, $4.20$, $7.02$ and $9.95$ dB at $M=8$, $16$, $32$ and $64$. At $M=4$ the two sets coincide.'},

{t:'h2', num:'5.4', text:'Frequency-shift keying and orthogonal signals'},
{t:'p', text:'M-ary FSK sends one of $M$ tones spaced so that all are orthogonal. Each tone is one axis of an $M$-dimensional space, with its point at $\\sqrt{E_s}$ on that axis.'},
{t:'eqbox', cap:'M-FSK and orthogonal signals', tex:[
  's_m(t)=\\sqrt{\\tfrac{2E_s}{T}}\\cos\\bigl(2\\pi(f_c+m\\,\\Delta f)\\,t\\bigr),\\qquad \\Delta f=\\frac{1}{2T}',
  '\\|\\mathbf s_i-\\mathbf s_j\\|^{2}=2E_s,\\qquad P_e\\le(M-1)\\,Q\\!\\left(\\sqrt{\\frac{E_s}{N_0}}\\right)'],
 after:'Every point is a neighbour of every other, so 8-FSK has $7$ neighbours at one distance. Adding tones adds bits without bringing the points closer.'},
{t:'p', text:'A wrong symbol is any of the other $M-1$ with equal chance. Each bit of the label is then wrong in $2^{k-1}$ of them.'},
{t:'eqbox', cap:'Bit error of orthogonal signals', tex:'P_b=\\frac{2^{k-1}}{2^{k}-1}\\,P_e',
 after:'At $P_b=10^{-5}$, $M=2$ needs $12.6$ dB and $M=64$ about $6.1$ dB. Each doubling of $M$ lowers the energy per bit needed.'},
{t:'box', kind:'warn', hd:'A floor', html:'The gain has a limit. As $M$ grows, $P_b\\to0$ only when $E_b/N_0>\\ln2$, or $-1.6$ dB. Chapter 6 shows why no scheme can do better.'},
{t:'p', text:'A noncoherent receiver does not know the carrier phase. For each tone it uses a cosine and a sine correlator and keeps the envelope, which does not depend on the phase.'},
{t:'eqbox', cap:'Noncoherent BFSK', tex:[
  '\\ell_i=\\sqrt{y_{c,i}^{2}+y_{s,i}^{2}},\\qquad \\Delta f=\\frac1T',
  'P_b=\\tfrac12e^{-E_b/2N_0}'],
 after:'The tones must stay orthogonal for every phase, which takes twice the coherent spacing. At $10^{-5}$ noncoherent BFSK needs $13.4$ dB against $12.6$ dB coherent. That is twice the energy of binary DPSK.'},
{t:'fig', svg:()=>{ const a=logAx({w:560,h:220,xr:[0,16],xlabel:'E_b/N_0\\;(\\text{dB})',ylabel:'P_b',xticksOverride:[0,4,8,12]});
  a.curve(d=>lg(Q(Math.sqrt(2*dB(d))),-7),{color:C.err,width:2.3});
  a.curve(d=>lg(0.5*Math.exp(-dB(d)),-7),{color:C.err,width:2,dash:'3 3'});
  a.curve(d=>lg(Q(Math.sqrt(dB(d))),-7),{color:C.err,width:2,dash:'7 5'});
  a.curve(d=>lg(0.5*Math.exp(-dB(d)/2),-7),{color:C.err,width:2,dash:'12 5 3 5'});
  return a.svg(); },
 cap:'From left: coherent BPSK (solid), binary DPSK, coherent BFSK and noncoherent BFSK.'},

{t:'h2', num:'5.5', text:'Bandwidth and the choice of scheme'},
{t:'p', text:'With a rectangular pulse, the spectrum of PSK or QAM is a $\\operatorname{sinc}^{2}$ of width set by the symbol time $T=kT_b$. At a fixed bit rate, more bits a symbol give a narrower spectrum.'},
{t:'eqbox', cap:'Spectrum and band of each family', tex:[
  'S(f)\\propto T\\operatorname{sinc}^{2}(fT),\\qquad \\text{main lobe }\\frac{2}{T}=\\frac{2R_b}{k}',
  '\\text{PAM (SSB): }W=\\frac{R_b}{2\\log_2M},\\quad\\text{PSK, QAM: }W=\\frac{R_b}{\\log_2M},\\quad\\text{orthogonal: }W=\\frac{MR_b}{2\\log_2M}'],
 after:'Here $\\operatorname{sinc}x=\\sin(\\pi x)/(\\pi x)$. The QPSK main lobe is half as wide as that of BPSK. 16-QAM at $10$ Mb/s needs about $10/4=2.5$ MHz. Orthogonal signals need $M$ dimensions a symbol, so their band grows with $M$.'},
{t:'p', text:'QPSK can swing through the origin when both $I$ and $Q$ change sign. Offset QPSK delays $Q$ by $T_b$, so only one axis changes at a time and the envelope stays above $1/\\sqrt2$. Minimum-shift keying (MSK) turns the phase by $\\pm\\pi/2$ each bit at a steady rate. It is BFSK at $\\Delta f=1/(2T_b)$ with a continuous phase, and its envelope is constant.'},
{t:'fig', svg:()=>{ const a=logAx({w:560,h:210,xr:[0,2],yr:[-4,-0.0001],yticksOverride:[-4,-3,-2,-1],xlabel:'fT_b',ylabel:'S(f)/S(0)',xticksOverride:[0.5,0.75,1,1.5,2]});
  const s=x=>Math.abs(x)<1e-9?1:Math.sin(Math.PI*x)/(Math.PI*x);
  a.curve(x=>lg(s(2*x)*s(2*x),-4),{color:C.in,width:2,dash:'7 5',n:1200});
  a.curve(x=>{ const d=1-16*x*x; const v=Math.abs(d)<1e-6?Math.pow(Math.PI/4,2):Math.pow(Math.cos(2*Math.PI*x)/d,2); return lg(v,-4); },{color:C.in,width:2.3,n:1200});
  return a.svg(); },
 cap:'Spectra of offset QPSK (dashed) and MSK (solid). The MSK main lobe reaches $0.75/T_b$ against $0.5/T_b$, and its side lobes fall faster.'},
{t:'p', text:'A scheme is chosen by what the link is short of. The bandwidth efficiency $r=R_b/W$ places each family on a plane against the $E_b/N_0$ it needs.'},
{t:'table', cap:'Each family on the bandwidth–power plane at $M=16$ and $P_e=10^{-5}$.', head:['Family','$E_b/N_0$ at $P_e=10^{-5}$, $M=16$','$r=R_b/W$','Region'], rows:[
 ['PAM (SSB)','$23.1$ dB','$8$','bandwidth-limited'],
 ['PSK','$18.1$ dB','$4$','bandwidth-limited'],
 ['QAM','$14.0$ dB','$4$','bandwidth-limited'],
 ['Orthogonal (FSK)','$7.7$ dB','$0.5$','power-limited']
]},
{t:'p', text:'PAM, PSK and QAM have $r>1$ and pay energy for each extra bit, QAM the least. Orthogonal signals have $r<1$ and pay in band. No scheme can sit left of the curve $E_b/N_0=(2^{r}-1)/r$, which Chapter 6 derives.'},
{t:'p', text:'Adaptive modulation uses this trade in real time. The receiver measures $E_s/N_0$, and the transmitter picks the largest set whose bit error meets the target.'},
{t:'table', cap:'The signal-to-noise ratio each set of an adaptive link needs for $P_b=10^{-5}$.', head:['Set','Bits a symbol','$E_s/N_0$ for $P_b=10^{-5}$'], rows:[
 ['BPSK','$1$','$9.6$ dB'],
 ['QPSK','$2$','$12.6$ dB'],
 ['16-QAM','$4$','$19.5$ dB'],
 ['64-QAM','$6$','$25.6$ dB'],
 ['256-QAM','$8$','$31.5$ dB']
]},
{t:'p', text:'At $E_s/N_0=22$ dB the link chooses 16-QAM. Each step of two bits costs about $6$ dB.'},

{t:'h3', text:'The link budget'},
{t:'p', text:'The error rate of a scheme is set by $E_b/N_0$. A link budget turns that ratio into watts, antennas and kilometres. It works in decibels, so products become sums.'},
{t:'p', text:'A power in dBm is in decibels above $1$ mW, $P_{\\text{dBm}}=10\\log_{10}(P/1\\ \\text{mW})$. A gain or a loss in dB adds to a power in dBm. Two powers in dBm are never added.'},
{t:'p', text:'Every receiver hears thermal noise. At the reference temperature $T_0=290$ K its density is $kT_0$, where $k$ is Boltzmann\'s constant. The receiver adds noise of its own, counted by the noise figure $F\\ge1$.'},
{t:'eqbox', cap:'Thermal noise and the noise figure', tex:[
  'N_0=kT_0F,\\qquad kT_0=(1.38\\times10^{-23})(290)=4.00\\times10^{-21}\\ \\text{W/Hz}',
  '10\\log_{10}\\frac{4.00\\times10^{-21}\\ \\text{W/Hz}}{10^{-3}\\ \\text{W}}=-174\\ \\text{dBm/Hz},\\qquad \\text{NF}=10\\log_{10}F'],
 after:'A receiver that adds no noise has $F=1$, or $\\text{NF}=0$ dB. A typical radio receiver has $\\text{NF}$ between $3$ and $8$ dB.'},
{t:'p', text:'Here $kT_0F$ is the one-sided density $N_0$. This course writes white noise with the two-sided PSD $N_0/2$, which is $3$ dB lower, $-177$ dBm/Hz with $F=1$. It covers negative as well as positive frequencies, so a band of width $B$ collects $N_0B$ either way.'},
{t:'eqbox', cap:'Noise power in a band', tex:[
  'N=N_0B=kT_0FB',
  'N_{\\text{dBm}}=-174+\\text{NF}+10\\log_{10}B'],
 after:'For $B=10$ MHz, $10\\log_{10}10^{7}=70$. With $\\text{NF}=5$ dB the noise floor is $N=-174+5+70=-99$ dBm. Ten times the band raises it by $10$ dB.'},
{t:'p', text:'The sensitivity $P_{\\min}$ is the least received power that meets the target error. The energy a bit is the received power times the bit time, $E_b=P_r/R_b$. So $E_b/N_0=P_r/(R_bN_0)$, and solving for $P_r$ at the required ratio gives the sensitivity.'},
{t:'eqbox', cap:'Receiver sensitivity', tex:[
  'P_{\\min}=\\Big(\\frac{E_b}{N_0}\\Big)_{\\text{req}}R_bN_0=\\Big(\\frac{E_b}{N_0}\\Big)_{\\text{req}}R_bkT_0F',
  'P_{\\min,\\text{dBm}}=-174+\\text{NF}+10\\log_{10}R_b+\\Big(\\frac{E_b}{N_0}\\Big)_{\\text{req,dB}}'],
 after:'The band does not appear. QPSK at $10$ Mb/s needs $E_b/N_0=9.6$ dB for $P_b=10^{-5}$, so with $\\text{NF}=5$ dB it needs $-174+5+70+9.6=-89.4$ dBm.'},
{t:'p', text:'The received power comes from the transmit power, the two antennas and the path. In free space the Friis formula gives it. The antenna gains $G_t$ and $G_r$ are measured against an antenna that radiates equally in every direction, and $\\lambda=c/f_c$ is the wavelength.'},
{t:'eqbox', cap:'The Friis formula', tex:[
  'P_r=P_tG_tG_r\\Big(\\frac{\\lambda}{4\\pi d}\\Big)^{2}',
  'P_{r,\\text{dBm}}=P_{t,\\text{dBm}}+G_{t,\\text{dBi}}+G_{r,\\text{dBi}}-L_p,\\qquad L_p=20\\log_{10}\\frac{4\\pi d}{\\lambda}'],
 after:'The loss $L_p$ grows with $d^{2}$, so each doubling of $d$ costs $20\\log_{10}2=6$ dB. At $2.4$ GHz, $\\lambda=0.125$ m and $L_p=20\\log_{10}(4\\pi\\cdot1000/0.125)=100.0$ dB at $1$ km.'},
{t:'p', text:'The link margin is $P_r-P_{\\min}$. It is kept for fading, walls, rain and ageing, which the free-space model leaves out. The range of a link is the largest $d$ at which the margin is still met.'},
{t:'p', text:'Take $P_t=20$ dBm and two $10$ dBi antennas at $2.4$ GHz. At $1$ km, $P_r=20+10+10-100.0=-60.0$ dBm, which is $29.4$ dB above the QPSK sensitivity of $-89.4$ dBm. Keeping a $10$ dB margin allows $L_p=119.4$ dB, a range of $9.3$ km.'},
{t:'fig', svg:()=>{ const top=44, lam=3e8/5.8e9, pr=x=>top-20*Math.log10(4*Math.PI*Math.pow(10,x)/lam);
  const a=ax({w:560,h:240,xr:[2,4],yr:[-92,-40],xlabel:'d\\;(\\text{km})',ylabel:'P_r\\;(\\text{dBm})',
    xticksOverride:[2,2+Math.log10(2),2+Math.log10(5),3,3+Math.log10(2),3+Math.log10(5),4],
    xtickfmt:x=>{ const d=Math.pow(10,x-3); return d<1?d.toFixed(1):String(Math.round(d)); },
    yticksOverride:[-90,-80,-70,-60,-50,-40],zeroAxes:false});
  [['\\text{QPSK}',-81.4],['16\\text{-QAM}',-74.6]].forEach(([n,pm],i)=>{ const th=pm+15, x=(top-th-20*Math.log10(4*Math.PI/lam))/20;
    a.hline(th,{color:C.ink,dash:'6 4',width:1.2}); a.poly([[x,-92],[x,th]],{color:C.muted,width:1,dash:'3 4'});
    a.point(x,th,{color:C.out,r:4.5}); lab(a,3.97,th+1.8,n,C.ink,'end');
    lab(a,i?x-0.03:x+0.03,-88,'d='+Math.pow(10,x-3).toFixed(2)+'\\text{ km}',C.out,i?'end':'start'); });
  a.curve(pr,{color:C.out,width:2.3});
  lab(a,3.97,-46,'P_r(d)',C.out,'end'); return a.svg(); },
 cap:'Received power against distance for Example 5.5, with each sensitivity plus the $15$ dB margin. The crossings give the ranges.', short:'The link budget of Example 5.5 against distance.'},
{t:'ex', hd:'Example 5.5 — a link budget', rows:[
 ['Given','A $5.8$ GHz link has a band $B=25$ MHz with roll-off $\\alpha=0.25$. It has $P_t=20$ dBm, $G_t=G_r=12$ dBi, $\\text{NF}=7$ dB and needs a $15$ dB margin. For $P_b=10^{-5}$, QPSK needs $E_b/N_0=9.6$ dB and 16-QAM $13.4$ dB.'],
 ['Find','The bit rate, the sensitivity and the range of each scheme.'],
 ['Method','The band fixes the symbol rate $R_s=B/(1+\\alpha)$. The sensitivity follows from $R_b$ and $\\text{NF}$. The allowed loss is $L_p=P_t+G_t+G_r-P_{\\min}-\\text{margin}$, and inverting $L_p=20\\log_{10}(4\\pi d/\\lambda)$ gives $d=(\\lambda/4\\pi)\\,10^{L_p/20}$.'],
 ['Solution','$R_s=25/1.25=20$ Msym/s, so QPSK carries $40$ Mb/s and 16-QAM $80$ Mb/s. Then $10\\log_{10}(40\\times10^{6})=76.0$ and $10\\log_{10}(80\\times10^{6})=79.0$. QPSK: $P_{\\min}=-174+7+76.0+9.6=-81.4$ dBm and $L_p=20+24+81.4-15=110.4$ dB. 16-QAM: $P_{\\min}=-174+7+79.0+13.4=-74.6$ dBm and $L_p=20+24+74.6-15=103.6$ dB. With $\\lambda=3\\times10^{8}/5.8\\times10^{9}=0.0517$ m, $\\lambda/4\\pi=4.12\\times10^{-3}$ m. So QPSK reaches $d=4.12\\times10^{-3}\\cdot10^{110.4/20}=1.36$ km and 16-QAM $d=4.12\\times10^{-3}\\cdot10^{103.6/20}=0.62$ km.'],
 ['Check','The two sensitivities differ by $-74.6-(-81.4)=6.8$ dB: $3.8$ dB of $E_b/N_0$ and $3.0$ dB of bit rate. A loss $6.8$ dB smaller is a range $10^{6.8/20}=2.19$ times longer, and $1.36/0.62=2.19$.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $20\\log_{10}$, not $10\\log_{10}$, to turn a loss into range. A loss $6.8$ dB smaller is a factor $2.2$ in range, not $4.8$, because $L_p$ grows with $d^{2}$.'},

{t:'h2', num:'5.6', text:'Summary'},
{t:'table', cap:'Summary of Chapter 5: digital modulation methods.', head:['Scheme','${d_{\\min}^{2}}$','${\\bar N_{\\min}}$','Error probability','Anchor'], rows:[
 ['BPSK, QPSK','${4E_b}$','${1}$','${P_b=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)}$','PS CH8.6.1, 8.6.3'],
 ['BFSK, BASK','${2E_b}$','${1}$','${P_b=Q\\bigl(\\sqrt{E_b/N_0}\\bigr)}$','PS CH8.3.3, 9.5'],
 ['Binary DPSK','none','none','${P_b=\\tfrac12e^{-E_b/N_0}}$','PS CH8.6.5'],
 ['M-PSK','${4E_s\\sin^{2}(\\pi/M)}$','${2}$','${P_e\\approx2Q\\bigl(\\sqrt{2E_s/N_0}\\sin(\\pi/M)\\bigr)}$','PS CH8.6.3'],
 ['M-ASK','${12E_s/(M^{2}-1)}$','${2(M-1)/M}$','${\\tfrac{2(M-1)}{M}Q\\bigl(\\sqrt{6E_s/((M^{2}-1)N_0)}\\bigr)}$','PS CH8.5.3'],
 ['Square M-QAM','${6E_s/(M-1)}$','${4(1-1/\\sqrt M)}$','${4(1-\\tfrac1{\\sqrt M})Q\\bigl(\\sqrt{3E_s/((M-1)N_0)}\\bigr)}$','PS CH8.7.3'],
 ['M orthogonal','${2E_s}$','${M-1}$','${P_e\\le(M-1)Q\\bigl(\\sqrt{E_s/N_0}\\bigr)}$','PS CH9.1.2'],
 ['Noncoherent BFSK','none','none','${P_b=\\tfrac12e^{-E_b/2N_0}}$','PS CH9.5.3']
]},
{t:'p', text:'Every scheme of this chapter is a set of points read by the receiver of Chapter 4. Its error rate follows from $d_{\\min}$ and $\\bar N_{\\min}$ at the chosen energy, and its band from the bits a symbol. Chapter 6 asks how many bits a second any scheme can carry in a given band and power.'}

];
})();
