/* Course notes — Chapter 5. */
(function(){
const P=PLOT, C=P.COL;
const ax=o=>P.Axes(Object.assign({w:700,h:200,pad:{l:50,r:20,t:18,b:34},xtarget:6,ytarget:3},o));
function Q(x){ const t=1/(1+0.2316419*Math.abs(x));
  const d=0.3989422804014327*Math.exp(-x*x/2);
  const p=d*t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
  return x>=0?p:1-p; }

/* A constellation with the region belonging to each point, shaded by the
   nearest-point rule of chapter 4. Nothing here knows which family it is
   drawing: the points come in, the regions follow. */
function con(pts,opts){
  opts=opts||{};
  const lim=opts.lim||1.9, n=opts.n||72;
  const a=ax({w:opts.w||300,h:opts.h||230,xr:[-lim,lim],yr:[-lim,lim],
    xlabel:'\\psi_1',ylabel:'\\psi_2',pad:{l:44,r:18,t:20,b:34},xtarget:3,ytarget:3});
  const REG=[C.dec.in,C.dec.out,C.dec.mid,C.dec.h,C.dec.err];
  const step=2*lim/n;
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){
    const x=-lim+(i+0.5)*step, y=-lim+(j+0.5)*step;
    let best=0,bd=Infinity;
    pts.forEach((p,k)=>{const d=(x-p[0])**2+(y-p[1])**2; if(d<bd){bd=d;best=k;}});
    a.rect(x-step/2,y-step/2,x+step/2,y+step/2,{fill:REG[best%REG.length]});
  }
  pts.forEach(p=>a.point(p[0],p[1],{color:C.ink,r:opts.r||5}));
  return a.svg();
}
const PSK=M=>Array.from({length:M},(_,k)=>[Math.cos(2*Math.PI*k/M),-Math.sin(2*Math.PI*k/M)]);
const PAM=M=>Array.from({length:M},(_,k)=>[(2*k-(M-1))/(M-1)*1.4,0]);
const QAM16=[].concat(...[-3,-1,1,3].map(x=>[-3,-1,1,3].map(y=>[x/3.35,y/3.35])));

/* The three binary waveforms for the bit pattern 1 0 1 0. */
function carrier(kind){
  const a=ax({w:430,h:150,xr:[0,4],yr:[-1.35,1.35],xlabel:'t/T_b',
    pad:{l:44,r:18,t:16,b:32},ytarget:1,xtarget:4});
  const bits=[1,0,1,0];
  a.curve(t=>{
    const b=bits[Math.min(3,Math.floor(t))];
    if(kind==='bask') return b?Math.cos(2*Math.PI*4*t):0;
    if(kind==='bpsk') return (b?1:-1)*Math.cos(2*Math.PI*4*t);
    return Math.cos(2*Math.PI*(b?4.5:3.5)*t);
  },{color:C.in,width:1.6,n:1400});
  [1,2,3].forEach(x=>a.vline(x,{color:C.grid,dash:'3 3'}));
  bits.forEach((b,i)=>a.note(i+0.5,1.16,String(b),{fs:12,color:C.dim,anchor:'middle'}));
  return a.svg();
}

window.C5 = [

{t:'h1', num:'CHAPTER 5', text:'Digital modulation methods'},
{t:'p', lead:true, text:'A baseband pulse cannot be sent over a radio channel, so the bits have to ride on a carrier. There are only three things about a sine wave that can be changed: its amplitude, its phase and its frequency. Every scheme in this chapter changes one of them, or two at once. Chapter 4 already gave the receiver and the error probability; all that is left is to place the points and measure the distance between them.'},

{t:'h2', num:'5.1', text:'The three binary schemes'},
{t:'p', text:'Take one bit at a time and two waveforms. Amplitude-shift keying sends the carrier for a one and nothing for a zero. Phase-shift keying sends the carrier either way and flips its sign. Frequency-shift keying sends one of two frequencies.'},
{t:'figrow', n:3, items:[
 {svg:()=>carrier('bask'), cap:'Amplitude-shift keying: the carrier is switched on and off.'},
 {svg:()=>carrier('bpsk'), cap:'Phase-shift keying: the carrier is always on and its sign flips.'},
 {svg:()=>carrier('bfsk'), cap:'Frequency-shift keying: one frequency for a one, another for a zero.'}
]},
{t:'p', text:'To compare them, put each on the axes of chapter 3 and measure. BPSK needs one basis function and its two points are $\\pm\\sqrt{E_b}$ on it. BFSK needs two, because the two frequencies are orthogonal, and its points sit one on each axis. BASK needs one, and its points are $0$ and $\\sqrt{2E_b}$ once the average over equally likely bits is taken.'},
{t:'eqbox', cap:'The three distances and the three error probabilities', tex:[
 '\\text{BPSK: } d_{\\min}^{2}=4E_b,\\qquad P_b=Q\\!\\left(\\sqrt{\\tfrac{2E_b}{N_0}}\\right)',
 '\\text{BFSK and BASK: } d_{\\min}^{2}=2E_b,\\qquad P_b=Q\\!\\left(\\sqrt{\\tfrac{E_b}{N_0}}\\right)'],
 after:'The two answers differ by a factor of two inside the square root, which is $3.01$ dB. That gap does not depend on the noise level and cannot be closed by spending more power — it is a fact about where the points are.'},
{t:'box', kind:'ok', hd:'Where the three decibels come from', html:'Antipodal points are $2\\sqrt{E_b}$ apart. Orthogonal points are $\\sqrt{2E_b}$ apart, which is smaller by $\\sqrt2$. Squaring that $\\sqrt2$ gives the factor of two in the $Q$ argument, and $10\\log_{10}2=3.01$ dB. Every appearance of three decibels in this chapter traces back to one $\\sqrt2$ in a picture.'},
{t:'box', kind:'warn', hd:'BASK and BFSK reach the same answer by different routes', html:'BASK keeps its points on one line but half its symbols cost nothing, so the average energy is half the peak. BFSK keeps the full energy in every symbol but separates the points by a right angle instead of a straight line. Both end at $d^{2}=2E_b$. The mathematics does not prefer either; the transmitter does, and BASK asks it to switch between zero power and full power.'},

{t:'h2', num:'5.2', text:'M-ary phase-shift keying'},
{t:'p', text:'Sending one bit at a time wastes the two dimensions a carrier offers. Use both, keep the energy fixed, and the constellation becomes $M$ points spaced evenly around a circle of radius $\\sqrt{E_s}$. Each symbol now carries $\\log_2 M$ bits.'},
{t:'figrow', items:[
 {svg:()=>con(PSK(4),{lim:1.7}), cap:'$M=4$, two bits a symbol. The four regions are the four quadrants.'},
 {svg:()=>con(PSK(8),{lim:1.7,r:4.5}), cap:'$M=8$, three bits. The regions are wedges, and they are narrowing.'}
]},
{t:'p', text:'Two neighbouring points subtend an angle $2\\pi/M$ at the centre. Dropping a perpendicular from the centre onto the line joining them cuts that angle in half and gives the distance directly.'},
{t:'eqbox', cap:'M-PSK', tex:[
 'd_{\\min}=2\\sqrt{E_s}\\,\\sin\\!\\left(\\frac{\\pi}{M}\\right),\\qquad N_{\\min}=2',
 'P_e\\approx 2\\,Q\\!\\left(\\sqrt{\\frac{2E_s}{N_0}}\\,\\sin\\frac{\\pi}{M}\\right)'],
 after:'$N_{\\min}=2$ for every $M$ above two, because a point on a circle has one neighbour clockwise and one anticlockwise. At $M=2$ the formula gives $d_{\\min}=2\\sqrt{E_s}$, which is BPSK — a general result that reproduces the case already known.'},

{t:'ex', hd:'Example 5.1 — what the step from four points to eight costs', rows:[
 ['Given','QPSK and $8$-PSK, at whatever energy each needs to reach the same symbol error probability.'],
 ['Find','The extra energy $8$-PSK needs, per symbol and per bit.'],
 ['Method','A fixed error probability means a fixed $Q$ argument, so $(E_s/N_0)\\sin^{2}(\\pi/M)$ must be held constant. Take the ratio.'],
 ['Solution','$\\dfrac{\\sin^{2}(\\pi/4)}{\\sin^{2}(\\pi/8)}=\\dfrac{0.5}{0.1464}=3.414$, which is $5.33$ dB per symbol. $8$-PSK carries three bits where QPSK carries two, so per bit the figure is $3.414\\times\\frac{2}{3}=2.276$, or $3.57$ dB.'],
 ['Check','Both numbers are positive, as they must be: at the same radius, eight points are closer together than four. The per-bit figure is the smaller of the two, because the extra bit pays part of its own way.']
]},

{t:'h2', num:'5.3', text:'M-ary amplitude-shift keying'},
{t:'p', text:'Change the amplitude among $M$ levels instead. One basis function carries them all, so the constellation is $M$ points on a line at $\\pm A,\\pm3A,\\ldots,\\pm(M-1)A$, and neighbouring points are $2A$ apart.'},
{t:'figrow', items:[
 {svg:()=>con(PAM(4),{lim:1.9,w:340,h:150}), cap:'$M=4$ on one axis. The two end regions run off to infinity.'},
 {svg:()=>con(PAM(8),{lim:1.9,w:340,h:150,r:4}), cap:'$M=8$: the same line, twice as crowded.'}
]},
{t:'eqbox', cap:'M-PAM', tex:[
 'E_{s,\\text{avg}}=\\frac{A^{2}(M^{2}-1)}{3}\\quad\\Longrightarrow\\quad d_{\\min}^{2}=\\frac{12E_{s,\\text{avg}}}{M^{2}-1}',
 'N_{\\min}=\\frac{2(M-1)}{M},\\qquad P_e\\approx N_{\\min}\\,Q\\!\\left(\\sqrt{\\frac{d_{\\min}^{2}}{2N_0}}\\right)'],
 after:'The $M^{2}$ in the denominator is the trouble: doubling $M$ divides the squared distance by roughly four, which is about $6$ dB, and it does so at every doubling.'},
{t:'box', kind:'def', hd:'Why $N_{\\min}$ is not a whole number', html:'The two points at the ends of the line have one neighbour each; the $M-2$ points between them have two. Averaging over all $M$ equally likely symbols gives $2(M-1)/M$ — $1.5$ at $M=4$, $1.75$ at $M=8$. It is an average over points that differ in how exposed they are, and getting a whole number means the end points were counted as though they had neighbours on both sides.'},

{t:'h2', num:'5.4', text:'Quadrature amplitude modulation'},
{t:'p', text:'Run one amplitude-modulated signal on the cosine and an independent one on the sine. The result is two $\\sqrt{M}$-level constellations at right angles, so $M$ points on a square grid — the lecture material states this as $M$-QAM being two-dimensional $M$-ASK.'},
{t:'figrow', items:[
 {svg:()=>con([[0.9,0.9],[-0.9,0.9],[-0.9,-0.9],[0.9,-0.9]],{lim:1.7}),
  cap:'$4$-QAM: two levels a side. These are the four points of QPSK — at $M=4$ the two schemes are the same scheme.'},
 {svg:()=>con(QAM16,{lim:1.6,r:4,n:80}),
  cap:'$16$-QAM: four levels a side, four bits a symbol. The corners have two neighbours, the edges three, the four in the middle four.'}
]},
{t:'eqbox', cap:'Square M-QAM', tex:[
 'E_{s,\\text{avg}}=\\frac{(M-1)d^{2}}{6}\\quad\\Longrightarrow\\quad d_{\\min}^{2}=\\frac{6E_{s,\\text{avg}}}{M-1}',
 'N_{\\min}=\\frac{4(2)+8(3)+4(4)}{16}=3\\quad\\text{for }16\\text{-QAM}'],
 after:'Compare the denominators: $M-1$ for QAM against $M^{2}-1$ for PAM. Spreading the same number of points over two dimensions instead of one turns a square into a linear factor, and that is the whole of the difference.'},

{t:'ex', hd:'Example 5.2 — sixteen points on a grid against sixteen on a line', rows:[
 ['Given','$16$-QAM and $16$-PAM at the same average symbol energy. Both carry four bits a symbol.'],
 ['Find','The advantage of QAM in decibels.'],
 ['Method','One formula each, then the ratio of the squared distances.'],
 ['Solution','QAM: $d_{\\min}^{2}=6E_s/15=0.400E_s$. PAM: $d_{\\min}^{2}=12E_s/255=0.0471E_s$. The ratio is $8.5$, and $10\\log_{10}8.5=9.29$ dB.'],
 ['Check','Same number of bits, same average power, and the only difference is where the points were put. Nine decibels is an enormous return for using a second dimension that was there all along, and it is the reason QAM is what modern systems use.']
]},

{t:'h2', num:'5.5', text:'M-ary frequency-shift keying'},
{t:'p', text:'Use $M$ frequencies, chosen so that the waveforms are orthogonal. Orthogonal signals need one basis function each, so the constellation lives in $M$ dimensions with one point on each axis at distance $\\sqrt{E_s}$ from the origin.'},
{t:'eqbox', cap:'M-FSK', tex:[
 'd_{jk}=\\sqrt{2E_s}\\ \\text{ for every pair},\\qquad N_{\\min}=M-1',
 'P_e\\approx (M-1)\\,Q\\!\\left(\\sqrt{\\frac{E_s}{N_0}}\\right)'],
 after:'The distance does not depend on $M$ at all. Adding waveforms costs nothing in distance — but each new waveform needs its own frequency slot, so the price is paid in bandwidth instead.'},
{t:'box', kind:'ok', hd:'The trade, stated plainly', html:'PSK and QAM hold the bandwidth fixed as $M$ grows and pay in energy, because the points crowd together. FSK holds the distance fixed and pays in bandwidth. A deep-space link, with bandwidth to spare and no power, chooses FSK; a mobile phone, with the opposite problem, chooses QAM. Neither is better in the abstract — it depends entirely on which resource is scarce.'},

{t:'fig', svg:()=>{
  const a=ax({w:640,h:320,xr:[0,20],yr:[-6,0.3],
    xlabel:'E_b/N_0\\;(\\mathrm{dB})',ylabel:'\\log_{10}P_e',
    pad:{l:58,r:24,t:22,b:40},xtarget:5,ytarget:6});
  const L=v=>Math.log10(Math.max(1e-12,v));
  [[2,C.in],[4,C.out],[8,C.h],[16,C.err]].forEach(([M,col])=>{
    a.curve(d=>L(2*Q(Math.sqrt(2*Math.log2(M)*Math.pow(10,d/10))*Math.sin(Math.PI/M))),
      {color:col,width:2});
  });
  return a.svg();
 },
 cap:'Symbol error probability against energy per bit for four sizes of PSK: $M=2,4,8,16$ from left to right. $M=2$ and $M=4$ lie almost on top of each other, which is why QPSK is everywhere — it carries twice the bits of BPSK for the same energy per bit.'},

{t:'h2', num:'5.6', text:'Summary'},
{t:'table', head:['Scheme','$d_{\\min}^{2}$','$N_{\\min}$','Anchor'], rows:[
 ['BPSK','$4E_b$','$1$','PS CH8.6.1'],
 ['BFSK, BASK','$2E_b$','$1$','PS CH9.5'],
 ['$M$-PSK','$4E_s\\sin^{2}(\\pi/M)$','$2$','PS CH8.6.3'],
 ['$M$-PAM','$12E_s/(M^{2}-1)$','$2(M-1)/M$','PS CH8.5.3'],
 ['$M$-QAM','$6E_s/(M-1)$','$3$ at $M=16$','PS CH8.7.1'],
 ['$M$-FSK','$2E_s$','$M-1$','PS CH9.5']
]},
{t:'p', text:'Every row was obtained the same way: write the waveforms down, find the basis functions they need, place the points, measure the shortest distance, count how many pairs sit at it. The error probability then comes from chapter 4 without any further thought about waveforms. Convert once with $E_s=(\\log_2 M)E_b$ when a question is stated per bit, and never convert twice.'},
{t:'p', text:'What none of this says is how many bits a channel can carry at all. Every scheme here trades energy against bandwidth, and it is reasonable to ask whether there is a limit to the trade. Chapter 6 answers that, and the answer does not depend on which modulation is used.'}

];
})();
