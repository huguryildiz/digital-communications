/* Course notes — Chapter 6. */
(function(){
const P=PLOT, C=P.COL;
const ax=o=>P.Axes(Object.assign({w:700,h:200,pad:{l:50,r:20,t:18,b:34},xtarget:6,ytarget:3},o));
const lg=x=>Math.log(x)/Math.LN2;
const H=ps=>-ps.filter(p=>p>0).reduce((s,p)=>s+p*lg(p),0);
const hbin=p=>(p<=0||p>=1)?0:-(p*lg(p)+(1-p)*lg(1-p));
const lab=(a,x,y,s,col,anchor)=>a.note(x,y,s,{tex:true,fs:12,color:col||C.ink,anchor:anchor||'start'});

/* Colour, as in the slides: cyan a source symbol or the entropy it carries,
   amber the channel, violet a codeword or a quantity being built, green what
   gets through (mutual information, capacity), red what is lost or impossible.
   Every figure is computed from the definitions in the text, so a change to
   the text that a figure contradicts shows up as a figure that has moved. */

/* The binary entropy function, with the point p = 0.11 of the text. */
function hbfig(){
  const a=ax({w:420,h:240,xr:[0,1],yr:[0,1.2],xlabel:'p',ylabel:'H_b(p)\\;(\\text{bits})',
    pad:{l:58,r:20,t:20,b:40},xtarget:5,ytarget:4});
  a.curve(hbin,{color:C.in,width:2.2});
  a.point(0.5,1,{color:C.in,r:4});
  a.point(0.11,hbin(0.11),{color:C.in,r:4});
  lab(a,0.5,1.1,'H_b=1',C.in,'middle');
  lab(a,0.15,0.46,'H_b(0.11)=0.500',C.in);
  return a.svg();
}

/* A bar for each symbol: what it carries, and that weighted by how often. */
function bars(ps,labels){
  const n=ps.length, top=Math.max(1.05,...ps.map(p=>-lg(p)))*1.16;
  const a=ax({w:420,h:240,xr:[0,n+0.9],yr:[-top*0.28,top],ylabel:'\\text{bits}',
    pad:{l:54,r:20,t:20,b:32},xticksOverride:[],zeroAxes:false,
    yticksOverride:[0,1,2,3].filter(v=>v<=top)});
  ps.forEach((p,i)=>{
    a.rect(i+0.12,0,i+0.48,-lg(p),{fill:C.dec.in,stroke:C.in});
    a.rect(i+0.52,0,i+0.88,p*-lg(p),{fill:C.dec.mid,stroke:C.mid});
    lab(a,i+0.5,-top*0.16,labels[i],C.ink,'middle');
  });
  a.hline(H(ps),{color:C.ink,dash:'5 3'});
  lab(a,n+0.85,H(ps)+top*0.05,'H(S)=1.157',C.ink,'end');
  return a.svg();
}

/* A binary code tree: leaves evenly spaced, each parent at the mean of its
   children. A leaf is a codeword (violet) and carries its symbol. */
function tree(codes,labels,opts){
  opts=opts||{};
  const depth=Math.max(...codes.map(c=>c.length));
  const nodes=new Set(['']);
  codes.forEach(c=>{ for(let i=1;i<=c.length;i++) nodes.add(c.slice(0,i)); });
  const kids=n=>Array.from(nodes).filter(m=>m.length===n.length+1&&m.slice(0,-1)===n);
  const order=Array.from(nodes).sort((a,b)=>b.length-a.length||(a<b?-1:1));
  const row={}; let k=0;
  order.filter(n=>kids(n).length===0).sort().forEach(n=>{ row[n]=k++; });
  order.forEach(n=>{ const c=kids(n); if(c.length) row[n]=c.reduce((s,m)=>s+row[m],0)/c.length; });
  const span=Math.max(1,k-1);
  const a=ax({w:opts.w||420,h:opts.h||150,xr:[-0.35,depth+0.95],yr:[-0.5,span+0.5],
    pad:{l:14,r:14,t:14,b:14},xticksOverride:[],yticksOverride:[],
    grid:false,zeroAxes:false,arrows:false});
  const Y=n=>span-row[n];
  Array.from(nodes).forEach(n=>{
    if(n==='') return;
    const par=n.slice(0,-1);
    a.poly([[par.length,Y(par)],[n.length,Y(n)]],{color:C.muted,width:1.3});
    a.note((par.length+n.length)/2,(Y(par)+Y(n))/2+(Y(n)>=Y(par)?1:-1.6)*(span+1)*0.07,n.slice(-1),
      {tex:true,fs:11,color:C.muted,anchor:'middle'});
  });
  Array.from(nodes).forEach(n=>{
    const leaf=codes.indexOf(n);
    a.point(n.length,Y(n),{color:leaf>=0?C.mid:C.muted,r:leaf>=0?5:2.6});
    if(leaf>=0&&kids(n).length) lab(a,n.length,Y(n)-(span+1)*0.16,labels[leaf],C.in,'middle');
    else if(leaf>=0) lab(a,n.length+0.14,Y(n),labels[leaf],C.in);
  });
  return a.svg();
}

/* Capacity of the binary symmetric channel against its crossover. */
function capfig(){
  const a=ax({w:420,h:240,xr:[0,1],yr:[0,1.14],xlabel:'p',ylabel:'C\\;(\\text{bits per use})',
    pad:{l:58,r:20,t:20,b:40},xtarget:5,ytarget:4});
  a.curve(p=>1-hbin(p),{color:C.out,width:2.2});
  a.point(0.5,0,{color:C.err,r:4});
  a.point(0.1,1-hbin(0.1),{color:C.out,r:4});
  lab(a,0.14,0.6,'C=0.531',C.out);
  lab(a,0.5,0.08,'C=0',C.err,'middle');
  return a.svg();
}

/* Mutual information of the Z-channel against its input distribution. */
function zfig(){
  const I=q=>hbin((1-q)/2)-(1-q);
  const a=ax({w:420,h:240,xr:[0,1],yr:[0,0.42],xlabel:'q=P(X=0)',
    ylabel:'I(X;Y)\\;(\\text{bits})',pad:{l:58,r:20,t:20,b:40},xtarget:5,ytarget:4});
  a.curve(I,{color:C.out,width:2.2});
  a.vline(0.6,{color:C.out,dash:'4 3'});
  a.point(0.6,I(0.6),{color:C.out,r:4});
  a.point(0.5,I(0.5),{color:C.muted,r:3.5});
  lab(a,0.63,0.37,'q^{*}=0.6,\\ C=0.3219',C.out);
  lab(a,0.5,0.24,'0.3113',C.muted,'middle');
  return a.svg();
}

/* The least energy a bit for each spectral efficiency, and the floor it never
   crosses. Drawn from the closed form (2^r - 1)/r, so no solver is involved. */
function shannonfig(){
  const a=ax({w:700,h:280,xr:[-5,16],yr:[0,6.4],
    xlabel:'E_b/N_0\\;(\\text{dB})',ylabel:'r=R_b/W\\;(\\text{b/s/Hz})',
    pad:{l:66,r:22,t:22,b:44},xtarget:6,ytarget:6,zeroAxes:false});
  const pts=[];
  for(let r=0.004;r<=6.4;r+=0.004){
    const db=10*Math.log10((Math.pow(2,r)-1)/r);
    if(db>=-5&&db<=16) pts.push([db,r]);
  }
  const lim=10*Math.log10(Math.LN2);
  a.area(()=>6.4,-5,lim,{color:C.dec.err});
  a.poly(pts,{color:C.out,width:2.2});
  a.vline(lim,{color:C.err,width:2});
  a.point(10*Math.log10(1.5),2,{color:C.out,r:4});
  a.point(9.59,1,{color:C.in,r:4.5});
  lab(a,-4.8,5.8,'\\text{impossible}',C.err);
  lab(a,-1.75,3.0,'-1.59\\ \\text{dB}',C.err,'end');
  lab(a,2.4,1.55,'r=2:\\ 1.76\\ \\text{dB}',C.out);
  lab(a,9.9,1.2,'\\text{BPSK},\\ P_b=10^{-5}',C.in);
  return a.svg();
}

/* Water-filling over six subchannels at P = 1: noise is the floor, power is
   poured up to one level. */
function waterfig(){
  const N=[0.1,0.2,0.4,0.8,1.6,3.2], mu=1.7/3;
  const a=ax({w:560,h:240,xr:[-0.3,6.3],yr:[-0.55,3.5],ylabel:'\\text{noise, power}',
    pad:{l:58,r:20,t:20,b:24},xticksOverride:[],yticksOverride:[0,1,2,3],zeroAxes:false});
  N.forEach((n,i)=>{
    a.rect(i+0.1,0,i+0.9,n,{fill:C.noiseSoft,stroke:C.noise,width:1.2});
    if(mu>n) a.rect(i+0.1,n,i+0.9,mu,{fill:C.dec.in,stroke:C.in,width:1.5});
    lab(a,i+0.5,-0.4,'N_'+(i+1),C.muted,'middle');
  });
  a.hline(mu,{color:C.ink,dash:'6 4'});
  lab(a,0.12,0.78,'\\mu=0.567',C.ink);
  return a.svg();
}

window.C6 = [

{t:'h1', num:'CHAPTER 6', text:'An introduction to information theory'},
{t:'p', lead:true, text:'Two numbers set what any code can do. A source has an entropy, the fewest bits a symbol that any lossless code can reach. A channel has a capacity, the most bits a use that any code can carry reliably. The first half of this chapter measures the entropy and builds codes that reach it. The second half measures the capacity and shows how codes approach it.'},

{t:'h2', num:'6.1', text:'Information and entropy'},
{t:'p', text:'A <b>discrete memoryless source</b> emits one symbol at a time from an alphabet $s_1,\\ldots,s_K$. Symbol $s_k$ appears with probability $p_k$, independently of the symbols before it. A likely symbol tells the receiver little when it arrives. A rare one tells it a lot.'},
{t:'p', text:'The <b>self-information</b> of a symbol turns this into a number. It is minus the logarithm of the probability.'},
{t:'eqbox', cap:'Self-information', tex:'I(s_k)=\\log_2\\frac{1}{p_k}=-\\log_2p_k\\quad\\text{bits}',
 after:'Base $2$ gives bits, and base $e$ gives nats. This chapter uses base $2$ throughout. A symbol of probability $1/8$ carries $-\\log_2\\tfrac18=\\log_28=3$ bits. Each halving of the probability adds one bit.'},
{t:'box', kind:'note', hd:'Three properties', html:'$I(s_k)\\ge0$, and $I(s_k)=0$ when $p_k=1$. A certain symbol tells nothing.<br>Rarer symbols carry more: $I(s_k)>I(s_j)$ when $p_k<p_j$.<br>Independent symbols add. Their probabilities multiply, and the logarithm turns the product into a sum: $I(s_js_k)=I(s_j)+I(s_k)$.'},
{t:'box', kind:'err', hd:'Common error', html:'Write $-\\log_2p_k$, not $\\log_2p_k$. The logarithm of a probability is negative, and information is not.'},
{t:'p', text:'A bit has a plain reading as one yes/no question. A question whose two answers are equally likely halves the candidates. One such answer gives one bit.'},
{t:'eqbox', cap:'Equally likely cases', tex:'K=2^{m}\\ \\text{cases}\\;\\Longrightarrow\\;m=\\log_2K\\ \\text{questions}',
 after:'Eight equally likely cards take $\\log_28=3$ questions: the answers cut $8$ to $4$, $4$ to $2$ and $2$ to $1$. Sixteen outcomes take $\\log_216=4$ questions.'},
{t:'p', text:'A skewed source is searched faster on average by asking about the likely symbol first. Take four symbols with probabilities $\\tfrac12,\\tfrac14,\\tfrac18,\\tfrac18$. The first question asks for $s_1$. The second asks for $s_2$, and the third separates $s_3$ from $s_4$.'},
{t:'eqbox', cap:'Average number of questions', tex:'\\bar{L}=\\tfrac12(1)+\\tfrac14(2)+\\tfrac18(3)+\\tfrac18(3)=0.5+0.5+0.375+0.375=1.75',
 after:'Symbol $s_k$ is found after $-\\log_2p_k$ questions. So the average number of questions is the average self-information of the source, which is its entropy.'},
{t:'p', text:'The <b>entropy</b> of a source is the average self-information of its symbols. Each symbol\'s information is weighted by how often the symbol occurs.'},
{t:'eqbox', cap:'Entropy', tex:'H(S)=\\sum_{k=1}^{K}p_kI(s_k)=-\\sum_{k=1}^{K}p_k\\log_2p_k\\quad\\text{bits a symbol}',
 after:'A symbol with $p_k=0$ adds nothing, since $p\\log_2p\\to0$ as $p\\to0$.'},
{t:'p', text:'For the source $0.7,0.2,0.1$, write out the three terms and add them.'},
{t:'eqbox', cap:'Entropy of a three-symbol source', tex:'\\begin{aligned}H(S)&=-0.7\\log_20.7-0.2\\log_20.2-0.1\\log_20.1\\\\&=0.3602+0.4644+0.3322\\\\&=1.1568\\ \\text{bits}\\end{aligned}',
 after:'The rarest symbol carries the most bits, $-\\log_20.1=3.32$. It adds the least to the average, because it seldom occurs.'},
{t:'p', text:'The entropy lies between two bounds.'},
{t:'eqbox', cap:'Entropy bounds', tex:'0\\le H(S)\\le\\log_2K',
 after:'The lower bound holds when one symbol has probability $1$ and nothing is in doubt. The upper bound holds when all $K$ symbols are equally likely. With $p_k=1/K$ the sum is $\\sum_k\\tfrac1K\\log_2K=\\log_2K$. Three equal symbols give $\\log_23=1.585$ bits, more than the $1.157$ of the skewed source.'},
{t:'p', text:'A source of two symbols with probabilities $p$ and $1-p$ has the <b>binary entropy function</b>.'},
{t:'eqbox', cap:'Binary entropy', tex:'H_b(p)=-p\\log_2p-(1-p)\\log_2(1-p)',
 after:'It is symmetric about $p=\\tfrac12$, where $H_b=1$ bit. It is $0$ only at $p=0$ and $p=1$.'},
{t:'p', text:'The top of the curve is flat. At $p=0.11$ the two terms are $-0.11\\log_20.11=0.350$ and $-0.89\\log_20.89=0.150$. So $H_b(0.11)=0.500$ bit, and a strongly skewed coin still carries half a bit a toss.'},
{t:'figrow', items:[
 {svg:()=>bars([0.7,0.2,0.1],['s_1\\;(0.7)','s_2\\;(0.2)','s_3\\;(0.1)']), cap:'Entropy of the source $0.7,0.2,0.1$. For each symbol, the left bar is $I(s_k)$ and the right bar is $p_kI(s_k)$. The right bars add to $H(S)=1.157$.'},
 {svg:()=>hbfig(), cap:'The binary entropy function. It is $1$ bit at $p=\\tfrac12$ and still $0.500$ bit at $p=0.11$.'}
]},
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
{t:'p', text:'A coder can also take the symbols in blocks of $n$. Each block is one symbol of a new source, the <b>$n$-th extension</b> $S^n$, whose alphabet has $K^n$ symbols.'},
{t:'p', text:'The entropy of a block follows from the additive property. Write the entropy of a pair, split the logarithm of the product, and sum out the other symbol.'},
{t:'eqbox', cap:'Entropy of a pair', tex:'\\begin{aligned}H(S^2)&=-\\sum_{i,j}p_ip_j\\log_2(p_ip_j)\\\\&=-\\sum_{i,j}p_ip_j\\bigl(\\log_2p_i+\\log_2p_j\\bigr)\\\\&=-\\sum_ip_i\\log_2p_i\\sum_jp_j-\\sum_jp_j\\log_2p_j\\sum_ip_i\\\\&=H(S)+H(S)\\end{aligned}',
 after:'Each inner sum of probabilities is $1$. Repeating the step for $n$ symbols gives the general rule.'},
{t:'eqbox', cap:'Extension', tex:'H(S^{n})=n\\,H(S)',
 after:'For $0.7,0.2,0.1$ the nine pair probabilities are $0.49,0.14,0.07,0.14,0.04,0.02,0.07,0.02,0.01$. Summed the long way they give $H(S^2)=2.3136=2\\times1.1568$ bits. Triples give $H(S^3)=3\\times1.1568=3.470$ bits.'},
{t:'box', kind:'warn', hd:'Memory', html:'The rule needs a memoryless source. With memory, as in English where $q$ is followed by $u$, a block carries less than $nH(S)$. Text compressors rely on that surplus.'},

{t:'h2', num:'6.2', text:'The limits of compression'},
{t:'p', text:'A <b>source encoder</b> maps each symbol $s_k$ to a string of bits, its <b>codeword</b>, of length $l_k$. Common symbols should get short codewords and rare symbols long ones.'},
{t:'eqbox', cap:'Average length and efficiency', tex:'\\bar{L}=\\sum_{k=1}^{K}p_kl_k,\\qquad\\eta=\\frac{H(S)}{\\bar{L}}\\le1',
 after:'The code for $\\tfrac12,\\tfrac14,\\tfrac18,\\tfrac18$ with lengths $1,2,3,3$ has $\\bar{L}=1.75$. That equals $H$, so $\\eta=1$. Each length equals the information of its symbol.'},
{t:'box', kind:'note', hd:'Source coding theorem', html:'Every uniquely decodable code has $\\bar{L}\\ge H(S)$. The entropy is the fewest bits a symbol that a lossless code can reach.'},
{t:'p', text:'English shows how far a simple code can sit from this limit. With its memory, English carries about $1.3$ bits a letter. A letter-by-letter code needs $4.22$ bits, so $\\eta=1.3/4.22=0.31$.'},
{t:'p', text:'Long sequences show where the limit comes from. Take $n$ bits from a binary source with $P(1)=p$. A long sequence has about $np$ ones and $n(1-p)$ zeros.'},
{t:'p', text:'The probability of such a sequence follows from these counts. Take its logarithm and divide by $-n$.'},
{t:'eqbox', cap:'Probability of a typical sequence', tex:'\\begin{aligned}P(\\mathbf{x})&=p^{np}(1-p)^{n(1-p)}\\\\-\\tfrac1n\\log_2P(\\mathbf{x})&=-p\\log_2p-(1-p)\\log_2(1-p)=H\\\\P(\\mathbf{x})&=2^{-nH}\\end{aligned}',
 after:'All such sequences have nearly the same probability, $2^{-nH}$. They are the <b>typical sequences</b>.'},
{t:'p', text:'A sequence counts as typical when its value of $-\\tfrac1n\\log_2P$ lies within $\\epsilon$ of $H$. For large $n$ the typical sequences hold almost all the probability. Their probabilities then add to about one, so there are about $2^{nH}$ of them.'},
{t:'eqbox', cap:'The typical set', tex:'P(\\mathbf{x})\\approx2^{-nH},\\qquad|A|\\approx2^{nH}\\ \\text{of}\\ 2^{n}\\ \\text{sequences}',
 after:'With $p=0.2$, $H=0.722$. At $n=100$ there are about $2^{100\\times0.722}=2^{72.2}$ typical sequences, a tiny fraction of the $2^{100}$.'},
{t:'p', text:'Ten bits show the count in full. Take $p=0.2$ and $\\epsilon=0.1$, so the band runs from $0.622$ to $0.822$. A sequence on the edge of the band counts as typical.'},
{t:'eqbox', cap:'The typical sequences of ten bits', tex:['k=2:\\quad-\\tfrac{1}{10}\\log_2\\bigl(0.2^{2}\\,0.8^{8}\\bigr)=0.722', 'k=1:\\ 0.522,\\qquad k=3:\\ 0.922'],
 after:'Here $k$ is the number of ones. Only the sequences with two ones fall inside the band. There are $\\binom{10}{2}=45$ of them, each of probability $0.2^{2}\\,0.8^{8}=0.00671$. Together they hold $45\\times0.00671=0.3020$ of the probability. An index of $6$ bits names them, since $2^{6}=64\\ge45$.'},
{t:'table', cap:'Probability held by the typical set, for $p=0.2$ and $\\epsilon=0.1$.', head:['$n$','$P(\\text{typical})$'], rows:[
 ['$10$','$0.3020$'],
 ['$100$','$0.8321$'],
 ['$1000$','$0.9999$']
]},
{t:'p', text:'A code can name each typical sequence by its index and give up on the rare rest. About $nH$ bits name a typical sequence, which is $H$ bits a symbol. The chance of meeting a rare sequence falls to zero as $n$ grows.'},
{t:'eqbox', cap:'Source coding theorem as a rate', tex:'R>H:\\ P_{\\text{error}}\\to0,\\qquad R<H:\\ P_{\\text{error}}\\not\\to0',
 after:'A code of $R$ bits a symbol can be made reliable when $R$ exceeds $H$, and never when $R$ falls below it. A source with $H=0.5$ bit a symbol, in blocks of $n=1000$, needs about $nH=500$ bits a block.'},
{t:'box', kind:'warn', hd:'Uniform source', html:'At $p=\\tfrac12$, $H=1$ and every one of the $2^{n}$ sequences is typical. There is nothing to compress.'},
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
{t:'figrow', items:[
 {svg:()=>tree(['0','10','110','111'],['s_1','s_2','s_3','s_4']),
  cap:'Code II as a tree. Every codeword is a leaf, so no path to one codeword passes through another.'},
 {svg:()=>tree(['0','01','011','0111'],['s_1','s_2','s_3','s_4']),
  cap:'Code III as a tree. Each codeword lies on the path to the next, so the decoder must wait for the following bit.'}
]},
{t:'p', text:'Codeword lengths can be tested before the codewords are chosen. A codeword of length $l$ owns the fraction $2^{-l}$ of all long bit strings, the ones that start with it. In a prefix code these fractions do not overlap, so they add to at most one.'},
{t:'eqbox', cap:'Kraft inequality', tex:'\\sum_{k=1}^{K}2^{-l_k}\\le1',
 after:'A prefix code with lengths $l_k$ exists exactly when the sum is at most one.'},
{t:'eqbox', cap:'Kraft sums of the three codes', tex:'\\begin{aligned}\\text{I}:&\\ \\tfrac12+\\tfrac12+\\tfrac14+\\tfrac14=1.5\\\\\\text{II}:&\\ \\tfrac12+\\tfrac14+\\tfrac18+\\tfrac18=1\\\\\\text{III}:&\\ \\tfrac12+\\tfrac14+\\tfrac18+\\tfrac1{16}=0.9375\\end{aligned}',
 after:'Code I fails, so no prefix code has its lengths. Code II uses the whole interval. Lengths $1,2,2,3$ give $1.125>1$ and allow no prefix code either.'},
{t:'box', kind:'warn', hd:'Lengths, not codewords', html:'Code III passes the test and is still not a prefix code. The inequality tests lengths only. The lengths $1,2,3,4$ of Code III allow the prefix code $\\mathtt{0},\\mathtt{10},\\mathtt{110},\\mathtt{1110}$.'},
{t:'p', text:'The ideal length of a codeword is $-\\log_2p_k$, the information of its symbol. It is rarely a whole number, so round it up.'},
{t:'eqbox', cap:'Rounded lengths', tex:['l_k=\\lceil-\\log_2p_k\\rceil\\;\\Longrightarrow\\;-\\log_2p_k\\le l_k<-\\log_2p_k+1', '2^{-l_k}\\le p_k\\;\\Longrightarrow\\;\\sum_k2^{-l_k}\\le\\sum_kp_k=1'],
 after:'The second line shows that the rounded lengths pass the Kraft test. So a prefix code with these lengths exists.'},
{t:'p', text:'Multiply the first line by $p_k$ and sum over $k$. The left side becomes $H(S)$, and the middle becomes $\\bar{L}$.'},
{t:'eqbox', cap:'Source-coding bound', tex:'H(S)\\le\\bar{L}<H(S)+1',
 after:'The rounding costs less than one bit a symbol. If every $p_k=2^{-l_k}$, the source is <b>dyadic</b>. Then no length is rounded, and $\\bar{L}=H(S)$.'},
{t:'p', text:'The lost bit can be spread over a block. Apply the bound to the extension $S^n$, whose entropy is $nH(S)$, and divide by $n$.'},
{t:'eqbox', cap:'Blocks of $n$ symbols', tex:'nH(S)\\le L_n<nH(S)+1\\;\\Longrightarrow\\;H(S)\\le\\frac{L_n}{n}<H(S)+\\frac1n',
 after:'Blocks of $n=10$ symbols sit at most $1/10=0.1$ bit a symbol above $H$. The price is the codebook, which grows as $K^n$. For three symbols that is $3^{10}=59\\,049$ words.'},
{t:'p', text:'Lossless coding cannot go below $H$. When some error is allowed, fewer bits suffice. The <b>rate–distortion function</b> gives the fewest bits a sample for a mean-square error $D$.'},
{t:'p', text:'For a Gaussian source of variance $\\sigma^2$ the function has a closed form.'},
{t:'eqbox', cap:'Gaussian source', tex:'D(R)=\\sigma^{2}\\,2^{-2R}\\quad\\Longleftrightarrow\\quad R(D)=\\tfrac12\\log_2\\frac{\\sigma^{2}}{D}',
 after:'One more bit multiplies $D$ by $2^{-2}=\\tfrac14$. In decibels that is $10\\log_{10}4=6.02$ dB a bit, the same rule as the quantizers of Chapter 1.'},
{t:'box', kind:'warn', hd:'Quantizers', html:'The Lloyd–Max quantizer of Chapter 1 codes one sample at a time. It sits $1.62$ dB above $D(R)$ at $1$ bit and $2.74$ dB above it at $2$ bits. Coding blocks of samples closes the gap.'},

{t:'h2', num:'6.3', text:'Huffman and Lempel–Ziv coding'},
{t:'p', text:'The source-coding bound says a good prefix code exists. Huffman coding builds the best one: no prefix code for single symbols has a smaller average length.'},
{t:'box', kind:'note', hd:'Huffman algorithm', html:'<b>1.</b> Sort the probabilities in decreasing order.<br><b>2.</b> Merge the two smallest into one entry whose probability is their sum. Label the pair $0$ and $1$, and sort again.<br><b>3.</b> Repeat until one entry is left. Read each codeword from the last merge back to its symbol.'},
{t:'ex', hd:'Example 6.2 — a Huffman code', rows:[
 ['Given','A source with probabilities $0.4,0.2,0.2,0.1,0.1$ for $s_1,\\ldots,s_5$.'],
 ['Find','A Huffman code, its average length and its efficiency.'],
 ['Method','Huffman coding gives the least average length of any prefix code for single symbols. Merge the two smallest entries until one is left. Place a merged entry above any entry it ties with.'],
 ['Solution','The merges are $0.1+0.1=0.2$, then $0.2+0.2=0.4$, then $0.4+0.2=0.6$, then $0.6+0.4=1$. Reading back gives $\\mathtt{00},\\mathtt{10},\\mathtt{11},\\mathtt{010},\\mathtt{011}$. The average length is $\\bar{L}=0.4(2)+0.2(2)+0.2(2)+0.1(3)+0.1(3)=2.2$ bits.'],
 ['Check','$H(S)=2.1219$ bits, so $\\eta=2.1219/2.2=0.9645$. The bound holds: $2.1219\\le2.2<3.1219$. A fixed-length code would need $\\lceil\\log_25\\rceil=3$ bits.']
]},
{t:'p', text:'A merged entry often ties with other entries of the same probability. It may be placed above them or below them. Both choices give a Huffman code with the same average length.'},
{t:'eqbox', cap:'Two Huffman codes for $0.4,0.2,0.2,0.1,0.1$', tex:['\\text{high: }l_k=2,2,2,3,3,\\qquad\\bar{L}=2.2', '\\text{low: }l_k=1,2,3,4,4,\\qquad\\bar{L}=0.4+0.4+0.6+0.4+0.4=2.2'],
 after:'Placed high, the codewords are $\\mathtt{00},\\mathtt{10},\\mathtt{11},\\mathtt{010},\\mathtt{011}$. Placed low, they are $\\mathtt{1},\\mathtt{01},\\mathtt{000},\\mathtt{0010},\\mathtt{0011}$.'},
{t:'p', text:'The two codes differ in how far the lengths spread around $\\bar{L}$. The <b>variance</b> of the codeword length measures that spread.'},
{t:'eqbox', cap:'Variance of the codeword length', tex:['\\sigma^{2}=\\sum_kp_k\\bigl(l_k-\\bar{L}\\bigr)^{2}', '\\begin{aligned}\\sigma^2_{\\text{high}}&=0.8(0.2)^{2}+0.2(0.8)^{2}=0.032+0.128=0.16\\\\\\sigma^2_{\\text{low}}&=0.4(1.2)^{2}+0.2(0.2)^{2}+0.2(0.8)^{2}+0.2(1.8)^{2}\\\\&=0.576+0.008+0.128+0.648=1.36\\end{aligned}'],
 after:'Placing the merged entry high gives the least variance. Lengths near $\\bar{L}$ keep the bit rate steady, so a transmitter buffer fills and empties less.'},
{t:'figrow', items:[
 {svg:()=>tree(['00','10','11','010','011'],['s_1','s_2','s_3','s_4','s_5'],{w:440,h:170}),
  cap:'The Huffman code with ties placed high. Lengths $2,2,2,3,3$ and variance $0.16$.'},
 {svg:()=>tree(['1','01','000','0010','0011'],['s_1','s_2','s_3','s_4','s_5'],{w:440,h:170}),
  cap:'The Huffman code with ties placed low. Lengths $1,2,3,4,4$ and variance $1.36$.'}
]},
{t:'p', text:'Huffman coding of the single symbols $0.7,0.2,0.1$ gives the codewords $\\mathtt{0},\\mathtt{10},\\mathtt{11}$. Their average length is $0.7(1)+0.2(2)+0.1(2)=1.3$ bits, against $H=1.1568$.'},
{t:'p', text:'Coding blocks spreads the rounding loss. Build a Huffman code for the $K^n$ blocks of $n$ symbols, and divide its average length by $n$.'},
{t:'table', cap:'Huffman codes for single symbols, pairs and triples of $0.7,0.2,0.1$, against $H=1.1568$.', head:['$n$','Blocks','$\\bar{L}_n/n$ (bits a symbol)','Bound $H+1/n$','Efficiency $\\eta$'], rows:[
 ['$1$','$3$','$1.3$','$2.1568$','$0.8898$'],
 ['$2$','$9$','$1.165$','$1.6568$','$0.9929$'],
 ['$3$','$27$','$1.1753$','$1.4901$','$0.9842$']
]},
{t:'p', text:'Pairs cost $\\bar{L}_2=2.33$ bits a pair, or $2.33/2=1.165$ bits a symbol. Triples cost $1.1753$ bits a symbol, a little more than pairs.'},
{t:'box', kind:'err', hd:'Common error', html:'Expect the bound $H+1/n$ to fall with $n$, not the cost of every block code. Triples give $1.1753$ bits a symbol, worse than the $1.165$ of pairs.'},
{t:'p', text:'<b>Arithmetic coding</b> codes a whole message at once. It starts with the interval $[0,1)$. Each symbol keeps the part of the current interval that its probability owns.'},
{t:'ex', hd:'Example 6.3 — arithmetic coding', rows:[
 ['Given','The message $s_1s_1s_2$ from a source with $P(s_1)=0.7$, $P(s_2)=0.2$ and $P(s_3)=0.1$. The symbols own the first $70\\%$, the next $20\\%$ and the last $10\\%$ of each interval.'],
 ['Find','The final interval and a binary tag that names it.'],
 ['Method','Each symbol scales the interval by its probability, so the final width is the probability of the message. About $-\\log_2w$ bits name an interval of width $w$.'],
 ['Solution','The first $s_1$ keeps $[0,0.7)$, and the second keeps $[0,0.49)$. Then $s_2$ keeps the part from $70\\%$ to $90\\%$ of that, $[0.343,0.441)$. The width is $w=0.7\\times0.7\\times0.2=0.098$. The tag has $l=\\lceil-\\log_2w\\rceil+1=\\lceil3.35\\rceil+1=5$ bits, and it is $0.\\mathtt{01100}_2=0.375$.'],
 ['Check','Every binary fraction that starts with $0.\\mathtt{01100}$ lies in $[0.375,0.40625)$. That stretch sits inside $[0.343,0.441)$, so the tag names the message whatever bits follow. The extra bit in $l$ is paid once a message.']
]},
{t:'p', text:'Huffman and arithmetic coding need the probabilities before they start. <b>Lempel–Ziv coding</b> needs none. It is a <b>universal</b> code: it learns the frequent strings from the stream itself.'},
{t:'box', kind:'note', hd:'Lempel–Ziv parsing', html:'Read the stream from the left. Cut off the shortest string that is not yet in the dictionary, and add it as a new entry. Each new phrase is an earlier phrase plus one new bit. Send it as the pair (pointer to the earlier phrase, new bit). The decoder builds the same dictionary from the pairs, so the dictionary is never sent.'},
{t:'ex', hd:'Example 6.4 — Lempel–Ziv parsing', rows:[
 ['Given','The $18$-bit stream $\\mathtt{000101110010100101}$. The dictionary starts with the empty phrase as entry $0$.'],
 ['Find','The phrases, the pair sent for each, and the number of bits sent.'],
 ['Method','Cut off the shortest new string each time. Phrase $i$ can point to any of the $i$ entries $0$ to $i-1$, so its pointer needs $\\lceil\\log_2i\\rceil$ bits. One more bit carries the new bit.'],
 ['Solution','The phrases are $\\mathtt{0},\\mathtt{00},\\mathtt{1},\\mathtt{01},\\mathtt{11},\\mathtt{001},\\mathtt{010},\\mathtt{0101}$, listed with their pairs in the table below. Phrase $7$, $\\mathtt{010}$, is phrase $4$ plus a $\\mathtt{0}$, so it is sent as $(4,\\mathtt{0})$. The costs add to $1+2+3+3+4+4+4+4=25$ bits.'],
 ['Check','The phrase lengths add to $1+2+1+2+2+3+3+4=18$, the whole stream. With a fixed $3$-bit pointer each phrase costs $4$ bits, and eight phrases take $32$ bits.']
]},
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
{t:'box', kind:'warn', hd:'Short streams', html:'On a short stream Lempel–Ziv costs more than it saves: $25$ bits for $18$. The dictionary must be built before it pays back.'},
{t:'p', text:'On a long stream the phrases grow long, and each pointer stands for many source bits. For $c$ phrases the cost is a sum over the phrases.'},
{t:'eqbox', cap:'Cost of $c$ phrases', tex:'L=\\sum_{i=1}^{c}\\bigl(\\lceil\\log_2i\\rceil+1\\bigr)\\ \\text{bits}',
 after:'Take a binary source with $P(1)=0.1$, so $H_b(0.1)=0.469$ bit a symbol. One stream costs $0.689$ bits a source bit after $10^{3}$ bits, $0.625$ after $10^{4}$ and $0.557$ after $10^{6}$.'},
{t:'box', kind:'warn', hd:'Slow approach', html:'The cost falls toward $H$ only as the phrases grow long, and it never falls below $H$. Any code for single binary symbols costs $1$ bit a symbol here.'},

{t:'h2', num:'6.4', text:'Channels and mutual information'},
{t:'p', text:'The second half of the chapter turns from the source to the channel. A <b>discrete memoryless channel</b> takes an input symbol $x_j$ and returns an output symbol $y_k$ with probability $p(y_k\\mid x_j)$. Memoryless means each use ignores the others.'},
{t:'p', text:'The transition probabilities form the <b>channel matrix</b>, with one row for each input.'},
{t:'eqbox', cap:'Channel matrix', tex:'\\mathbf{P}=\\begin{bmatrix}p(y_0\\mid x_0)&p(y_1\\mid x_0)\\\\p(y_0\\mid x_1)&p(y_1\\mid x_1)\\end{bmatrix}=\\begin{bmatrix}0.8&0.2\\\\0.3&0.7\\end{bmatrix}',
 after:'Row $j$ is the output distribution of input $x_j$, so it sums to one: $0.8+0.2=0.3+0.7=1$. The columns need not sum to one. Here they give $1.1$ and $0.9$.'},
{t:'p', text:'The channel fixes $p(y\\mid x)$. The transmitter chooses the <b>input distribution</b> $p(x)$. Together they give the joint and the output distributions.'},
{t:'eqbox', cap:'Joint and output distributions', tex:['p(x_j,y_k)=p(y_k\\mid x_j)\\,p(x_j)', 'p(y_k)=\\sum_jp(y_k\\mid x_j)\\,p(x_j)'],
 after:'The output probability adds the joint probabilities of every path that ends at $y_k$.'},
{t:'p', text:'With $p(x_0)=0.75$, the output $y_0$ can come from either input. Add the two paths.'},
{t:'eqbox', cap:'Output distribution for $p(x_0)=0.75$', tex:'\\begin{aligned}p(y_0)&=0.8\\times0.75+0.3\\times0.25\\\\&=0.6+0.075=0.675\\\\p(y_1)&=1-0.675=0.325\\end{aligned}'},
{t:'p', text:'The <b>binary symmetric channel</b> (BSC) has two inputs and two outputs. Each bit arrives flipped with probability $p$, the <b>crossover probability</b>, and intact with probability $1-p$.'},
{t:'eqbox', cap:'Binary symmetric channel', tex:'\\mathbf{P}=\\begin{bmatrix}1-p&p\\\\p&1-p\\end{bmatrix}'},
{t:'p', text:'The matched-filter receiver of Chapter 4, deciding each BPSK bit of Chapter 5, hands on a BSC. Its crossover is the BPSK bit error. Here $Q(x)=\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$ is the Gaussian tail.'},
{t:'eqbox', cap:'BSC from hard-decision BPSK', tex:['p=Q\\Bigl(\\sqrt{2E_b/N_0}\\Bigr)', '\\begin{aligned}4\\ \\text{dB}&\\to10^{0.4}=2.512\\\\p&=Q\\bigl(\\sqrt{2\\times2.512}\\bigr)=Q(2.241)=0.0125\\end{aligned}']},
{t:'box', kind:'warn', hd:'Hard decisions', html:'Deciding each bit throws away how sure the receiver was. The Gaussian channel of Section 6.6 keeps that information.'},
{t:'p', text:'The <b>joint entropy</b> of two variables is the entropy of the pair, treated as one symbol.'},
{t:'eqbox', cap:'Joint entropy', tex:'H(X,Y)=-\\sum_{j,k}p(x_j,y_k)\\log_2p(x_j,y_k)'},
{t:'p', text:'The uncertainty about $Y$ left once $X$ is known is the conditional entropy $H(Y\\mid X)=-\\sum_{j,k}p(x_j,y_k)\\log_2p(y_k\\mid x_j)$. The joint probability splits as $p(x,y)=p(x)\\,p(y\\mid x)$. Its logarithm is a sum, and averaging each term gives the <b>chain rule</b>.'},
{t:'eqbox', cap:'Chain rule', tex:['\\begin{aligned}H(X,Y)&=-\\sum_{j,k}p(x_j,y_k)\\bigl[\\log_2p(x_j)+\\log_2p(y_k\\mid x_j)\\bigr]\\\\&=H(X)+H(Y\\mid X)\\end{aligned}', 'H(X,Y)=H(X)+H(Y\\mid X)=H(Y)+H(X\\mid Y)'],
 after:'Learn $X$ first, then what is left of $Y$. The second form follows the same way with the roles of $X$ and $Y$ swapped.'},
{t:'p', text:'Take the joint pmf $p(x_0,y_0)=p(x_1,y_1)=0.4$ and $p(x_0,y_1)=p(x_1,y_0)=0.1$.'},
{t:'eqbox', cap:'Chain rule for one pmf', tex:['H(X,Y)=-2(0.4)\\log_20.4-2(0.1)\\log_20.1=1.7219', 'H(X)=1,\\qquad H(Y\\mid X)=H_b(0.2)=0.7219'],
 after:'Each input has probability $0.5$, so $H(X)=1$. Given either input, $Y$ agrees with probability $0.4/0.5=0.8$, so $H(Y\\mid X)=H_b(0.2)$. The two parts add to $1.7219$, as the chain rule says.'},
{t:'p', text:'The receiver sees $Y$ and wants $X$. The <b>conditional entropy</b> $H(X\\mid Y)$ is the uncertainty about the input left after the output is seen, averaged over the outputs.'},
{t:'eqbox', cap:'Conditional entropy', tex:'H(X\\mid Y)=\\sum_kp(y_k)\\,H(X\\mid Y=y_k)'},
{t:'p', text:'Return to the channel $0.8/0.2$, $0.3/0.7$ with $p(x_0)=0.75$. Bayes\' rule gives the input probabilities after each output.'},
{t:'eqbox', cap:'After each output', tex:['P(x_0\\mid y_0)=\\frac{0.8\\times0.75}{0.675}=0.889,\\qquad H_b(0.889)=0.503', 'P(x_0\\mid y_1)=\\frac{0.2\\times0.75}{0.325}=0.462,\\qquad H_b(0.462)=0.996', 'H(X\\mid Y)=0.675(0.503)+0.325(0.996)=0.663'],
 after:'Before the output, $H(X)=H_b(0.75)=0.811$ bit. Output $y_0$ removes much of the doubt. Output $y_1$ leaves the input almost a coin toss.'},
{t:'box', kind:'err', hd:'Common error', html:'Keep $H(X\\mid Y)$ apart from $H(Y\\mid X)$. Here $H(Y\\mid X)=0.75H_b(0.2)+0.25H_b(0.3)=0.762$, but $H(X\\mid Y)=0.663$.'},
{t:'p', text:'<b>Mutual information</b> is the uncertainty about the input that the output removes. It is the uncertainty before the output, less the uncertainty after it.'},
{t:'eqbox', cap:'Mutual information', tex:'I(X;Y)=H(X)-H(X\\mid Y)',
 after:'For the channel above, $I(X;Y)=0.811-0.663=0.148$ bit a use.'},
{t:'p', text:'In a BSC with equally likely inputs, either output leaves the input wrong with probability $p$. So $H(X\\mid Y)=H_b(p)$, and $H(X)=1$.'},
{t:'eqbox', cap:'BSC with equal inputs', tex:'I(X;Y)=1-H_b(p)',
 after:'At $p=0$ the full bit gets through. At $p=\\tfrac12$ the output is a coin toss and $I=0$. At $p=0.1$, $I=1-0.469=0.531$ bit a use.'},
{t:'p', text:'Mutual information is symmetric. The chain rule gives $H(X\\mid Y)=H(X,Y)-H(Y)$ and $H(Y\\mid X)=H(X,Y)-H(X)$. Substitute either one into the definition.'},
{t:'eqbox', cap:'Symmetry and the joint entropy', tex:['I(X;Y)=H(X)-H(X\\mid Y)=H(Y)-H(Y\\mid X)=I(Y;X)', 'I(X;Y)=H(X)+H(Y)-H(X,Y)\\ge0'],
 after:'Adding $H(X)$ and $H(Y)$ counts the shared part twice, so the joint entropy is subtracted once.'},
{t:'p', text:'The channel above shows the symmetry in numbers. The outputs $0.675,0.325$ give $H(Y)=0.910$. Then $H(Y)-H(Y\\mid X)=0.910-0.762=0.148$, the same value as from the input side.'},
{t:'p', text:'A BSC with $p=0.25$ and equal inputs has $H(X)=H(Y)=1$ and $H(X,Y)=1.811$. So $I(X;Y)=1+1-1.811=0.189$ bit.'},
{t:'box', kind:'ok', hd:'Never negative', html:'Seeing $Y$ never adds to the uncertainty about $X$ on average: $H(X\\mid Y)\\le H(X)$. Equality holds when $X$ and $Y$ are independent, and then $I(X;Y)=0$.'},

{t:'h2', num:'6.5', text:'Channel capacity'},
{t:'p', text:'Mutual information depends on the channel and on the input distribution. The channel is fixed, and the transmitter picks the input distribution. The best choice gives the <b>capacity</b>.'},
{t:'eqbox', cap:'Channel capacity', tex:'C=\\max_{p(x)}I(X;Y)\\quad\\text{bits per use}',
 after:'The maximum removes the input distribution, so $C$ is a property of the channel alone. Its unit is bits a use of the channel. Multiplied by the uses a second, it becomes a rate.'},
{t:'p', text:'The BSC is symmetric in its two inputs. So $I(X;Y)$ is symmetric about $q=P(X=0)=\\tfrac12$, and its peak sits there.'},
{t:'eqbox', cap:'Capacity of the BSC', tex:['\\begin{aligned}I(X;Y)&=H(Y)-H(Y\\mid X)\\\\&=H(Y)-H_b(p)\\\\&\\le1-H_b(p)\\end{aligned}', 'C=1-H_b(p)'],
 after:'Whatever the input, each output is wrong with probability $p$, so $H(Y\\mid X)=H_b(p)$. A binary output has $H(Y)\\le1$. Equality holds when equal inputs give equal outputs.'},
{t:'fig', svg:()=>capfig(),
 cap:'Capacity of the binary symmetric channel against its crossover $p$. It is $0$ at $p=\\tfrac12$ and $0.531$ at $p=0.1$.'},
{t:'p', text:'The capacity is $0$ at $p=\\tfrac12$, where the output ignores the input. At $p=1$ every bit flips, the receiver flips it back, and $C=1$. At $p=0.11$, $H_b=0.500$ and $C=0.500$ bit a use.'},
{t:'p', text:'The <b>binary erasure channel</b> (BEC) never flips a bit. Each bit arrives intact with probability $1-\\epsilon$, or as a flagged erasure $e$ with probability $\\epsilon$.'},
{t:'p', text:'An intact bit leaves no doubt about the input. An erasure leaves the input as uncertain as before. So $H(X\\mid Y)=\\epsilon H(X)$, and the mutual information follows.'},
{t:'eqbox', cap:'Capacity of the BEC', tex:['I(X;Y)=H(X)-\\epsilon H(X)=(1-\\epsilon)H(X)', 'C=1-\\epsilon'],
 after:'Equal inputs give $H(X)=1$ and reach the capacity. At $\\epsilon=0.1$ the BEC carries $0.9$ bit a use, and a BSC with $p=0.1$ carries $0.531$.'},
{t:'box', kind:'warn', hd:'Flagged against hidden', html:'The BSC hides its errors among good bits, so it loses $H_b(\\epsilon)$ bits a use. That is more than $\\epsilon$ for $\\epsilon<\\tfrac12$.'},
{t:'ex', hd:'Example 6.5 — the Z-channel', rows:[
 ['Given','A $0$ is always received as $0$. A $1$ is received as $0$ or $1$ with probability $\\tfrac12$ each. Let $q=P(X=0)$.'],
 ['Find','The capacity $C$ and the input distribution that reaches it.'],
 ['Method','The channel is not symmetric, so equal inputs need not be best. Write $I(X;Y)=H(Y)-H(Y\\mid X)$ as a function of $q$, and set its derivative to zero.'],
 ['Solution','Only $X=1$ leaves the output uncertain, with $H_b(\\tfrac12)=1$ bit, so $H(Y\\mid X)=1-q$. The output is $1$ with probability $(1-q)/2$, so $I(q)=H_b\\bigl(\\tfrac{1-q}{2}\\bigr)-(1-q)$. The derivative of $H_b(x)$ is $\\log_2\\frac{1-x}{x}$, and $x=\\tfrac{1-q}{2}$ has $\\mathrm{d}x/\\mathrm{d}q=-\\tfrac12$. So $\\mathrm{d}I/\\mathrm{d}q=1-\\tfrac12\\log_2\\frac{1+q}{1-q}$. Setting it to zero gives $\\frac{1+q}{1-q}=4$, so $q^{*}=0.6$. Then $x=0.2$ and $C=H_b(0.2)-0.4=0.7219-0.4=0.3219$ bit a use.'],
 ['Check','Write $H_b(0.2)=0.2\\log_25+0.8\\log_2\\tfrac54=\\log_25-1.6$. Then $C=\\log_25-2=\\log_2\\tfrac54=0.3219$, the same value. The best input sends the reliable $0$ three times in five.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use the maximum over $q$, not equal inputs. At $q=\\tfrac12$, $I=H_b(0.25)-0.5=0.3113$, below $C$. On an asymmetric channel the best input is not uniform.'},
{t:'fig', svg:()=>zfig(),
 cap:'Mutual information of the Z-channel against $q=P(X=0)$. The peak is at $q^{*}=0.6$, and equal inputs give $0.3113$.'},
{t:'ex', hd:'Example 6.6 — a symmetric three-output channel', rows:[
 ['Given','Three inputs and three outputs. Each row of the channel matrix is a shift of $0.6,0.2,0.2$, so each column is too.'],
 ['Find','The capacity, and the input distribution that reaches it.'],
 ['Method','Every row has the same entropy, so $H(Y\\mid X)=H(0.6,0.2,0.2)$ for any input. Inputs of $\\tfrac13$ each make the outputs equal, because every column holds $0.6,0.2,0.2$. Then $H(Y)=\\log_23$, its largest value, and $C=\\log_2K-H(\\text{row})$.'],
 ['Solution','$H(0.6,0.2,0.2)=0.442+0.464+0.464=1.371$ bits. So $C=\\log_23-1.371=1.585-1.371=0.2140$ bit a use.'],
 ['Check','One bit needs at least $1/0.214=4.67$ uses of this channel. The uniform input reaches $C$, as the symmetry of the rows requires.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $\\log_23-H(\\text{row})$, not $\\log_23$, for the capacity. The value $\\log_23=1.585$ is the most any three-output channel carries.'},
{t:'p', text:'Capacity also counts the messages a channel keeps apart. Take a channel with four inputs, where each input reaches two of four outputs with probability $\\tfrac12$ each. Every output can then come from two inputs.'},
{t:'p', text:'Use only $x_0$ and $x_2$, whose outputs do not overlap. The receiver never confuses them, so the channel carries one bit a use with no errors.'},
{t:'p', text:'Long blocks do the same for a BSC. A word of $n$ bits almost surely lands among about $2^{nH_b(p)}$ likely outputs, its cloud. Codewords whose clouds do not overlap can be told apart.'},
{t:'eqbox', cap:'Counting codewords', tex:'M\\approx\\frac{2^{n}}{2^{nH_b(p)}}=2^{n(1-H_b(p))}=2^{nC}',
 after:'There are $2^{n}$ output words in all. So about $2^{nC}$ codewords fit, which is $C$ bits a use. At $n=100$ and $p=0.11$, $C=0.5$ and about $2^{50}$ codewords fit.'},
{t:'p', text:'The simplest channel code sends each bit $n$ times, with $n$ odd, and decides by majority. It is a <b>repetition code</b> of rate $R=1/n$. The vote fails when more than half the copies flip.'},
{t:'eqbox', cap:'Error of a repetition code', tex:'P_e=\\sum_{k>n/2}\\binom{n}{k}p^{k}(1-p)^{n-k}'},
{t:'p', text:'On a BSC with $p=0.1$, one copy fails with $P_e=0.1$. Three and five copies need two and three flips to fail.'},
{t:'eqbox', cap:'Repetition on a BSC with $p=0.1$', tex:'\\begin{aligned}n=3:\\quad P_e&=3p^{2}(1-p)+p^{3}\\\\&=0.027+0.001=0.028\\\\n=5:\\quad P_e&=10p^{3}(1-p)^{2}+5p^{4}(1-p)+p^{5}\\\\&=0.0081+0.00045+0.00001=0.00856\\end{aligned}',
 after:'At $n=15$, $P_e=3.36\\times10^{-5}$, but the rate has fallen to $1/15$.'},
{t:'box', kind:'warn', hd:'Rate falls too', html:'Repetition drives the error to zero only as the rate $1/n$ goes to zero. The channel coding theorem promises far better: any rate below $C=0.531$.'},
{t:'p', text:'The <b>channel coding theorem</b> states which rates can be made reliable. Here $R$ is in bits a channel use.'},
{t:'eqbox', cap:'Channel coding theorem', tex:'R<C:\\ P_e\\to0\\ \\text{is possible},\\qquad R>C:\\ \\text{it is not}',
 after:'For $R<C$, codes exist with rate $R$ and error as small as asked. They need long blocks, and the theorem does not build them. For $R>C$, no code of any length is reliable.'},
{t:'p', text:'A code of rate $R=0.5$ over a BSC needs $1-H_b(p)>0.5$. That holds for $p<0.11$, where $H_b=0.5$. The repetition codes sit far below the limit, because their rate falls with their error.'},
{t:'p', text:'Real codes add structure. A single <b>parity bit</b> makes the number of ones in a word even. One error makes it odd, so the error is detected, but its position is not known.'},
{t:'p', text:'The <b>$(7,4)$ Hamming code</b> sends four data bits and three parity bits, a rate of $4/7$. Its $16$ codewords differ pairwise in at least $d_{\\min}=3$ places.'},
{t:'eqbox', cap:'Errors corrected', tex:'t=\\Bigl\\lfloor\\frac{d_{\\min}-1}{2}\\Bigr\\rfloor=\\Bigl\\lfloor\\frac{3-1}{2}\\Bigr\\rfloor=1',
 after:'A word with one error is still nearer its own codeword than any other. So one error can be corrected.'},
{t:'p', text:'The bits sit at positions $1$ to $7$. Check $s_1$ covers the positions with a $1$ in the units place of their binary index: $1,3,5,7$. Check $s_2$ covers $2,3,6,7$, and check $s_4$ covers $4,5,6,7$.'},
{t:'ex', hd:'Example 6.7 — correcting one error', rows:[
 ['Given','The codeword $\\mathtt{0110011}$ of the $(7,4)$ Hamming code is sent. Bit $5$ flips, so $\\mathtt{0110111}$ is received.'],
 ['Find','The syndrome and the corrected word.'],
 ['Method','Recompute each parity check on the received bits $r_1,\\ldots,r_7$. The checks that fail form the <b>syndrome</b> $s_4s_2s_1$, a binary number that names the flipped position.'],
 ['Solution','$s_1=r_1\\oplus r_3\\oplus r_5\\oplus r_7=0\\oplus1\\oplus1\\oplus1=1$. $s_2=r_2\\oplus r_3\\oplus r_6\\oplus r_7=1\\oplus1\\oplus1\\oplus1=0$. $s_4=r_4\\oplus r_5\\oplus r_6\\oplus r_7=0\\oplus1\\oplus1\\oplus1=1$. So $s_4s_2s_1=101$, which is $5$ in binary. Flipping bit $5$ back gives $\\mathtt{0110011}$.'],
 ['Check','The sent word passes all three checks: $0\\oplus1\\oplus0\\oplus1=0$, $1\\oplus1\\oplus1\\oplus1=0$ and $0\\oplus0\\oplus1\\oplus1=0$. Its data bits, at positions $3,5,6,7$, are $\\mathtt{1011}$.']
]},
{t:'p', text:'A source and a channel can now be joined. Compress the source to $H(U)$ bits a symbol, then code those bits for the channel. Both steps can be made reliable when a channel use carries more than the entropy of the symbol it sends.'},
{t:'eqbox', cap:'Source over a channel', tex:'H(U)<C\\quad\\text{bits per channel use}',
 after:'With $R_s$ symbols a second and $R_c$ channel uses a second, compare $H(U)R_s$ with $CR_c$.'},
{t:'p', text:'Take a binary source that emits a $1$ with probability $0.1$, sent over a BSC once a symbol.'},
{t:'eqbox', cap:'A binary source over a BSC', tex:'H_b(0.1)=0.469<1-H_b(\\epsilon)\\iff\\epsilon<0.1206\\ \\text{or}\\ \\epsilon>0.8794',
 after:'At $\\epsilon=0.2$, $C=1-H_b(0.2)=0.278<0.469$, so the link cannot be made reliable.'},

{t:'h2', num:'6.6', text:'The Gaussian channel'},
{t:'p', text:'The Gaussian channel adds noise to a real-valued input. The input power is limited to $P$, and the noise $Z$ is Gaussian with power $P_N$.'},
{t:'eqbox', cap:'Gaussian channel', tex:'Y=X+Z,\\qquad Z\\sim\\mathcal{N}(0,P_N),\\qquad\\mathrm{E}[X^{2}]\\le P'},
{t:'p', text:'Count the codewords that fit, as for the BSC. Over $n$ uses, a received word lies near its codeword, inside a ball of radius $\\sqrt{nP_N}$. All received words lie inside a ball of radius $\\sqrt{n(P+P_N)}$. Divide the two volumes.'},
{t:'eqbox', cap:'Sphere count', tex:['M\\approx\\frac{\\bigl(\\sqrt{n(P+P_N)}\\bigr)^{n}}{\\bigl(\\sqrt{nP_N}\\bigr)^{n}}=\\Bigl(1+\\frac{P}{P_N}\\Bigr)^{n/2}', 'C=\\frac1n\\log_2M=\\tfrac12\\log_2\\Bigl(1+\\frac{P}{P_N}\\Bigr)\\quad\\text{bits per use}'],
 after:'The volume of a ball in $n$ dimensions grows as its radius to the power $n$, and the constant cancels. At $P/P_N=15$, $C=\\tfrac12\\log_216=2$ bits a use.'},
{t:'p', text:'A channel of band $W$ carries $2W$ independent samples a second, as in Chapter 1. Each sample is one use of the Gaussian channel. The noise has two-sided density $N_0/2$, so its power in the band is $2W\\cdot N_0/2=N_0W$.'},
{t:'eqbox', cap:'Capacity of the bandlimited channel', tex:'\\begin{aligned}C&=2W\\cdot\\tfrac12\\log_2\\Bigl(1+\\frac{P}{N_0W}\\Bigr)\\\\&=W\\log_2(1+\\text{SNR})\\quad\\text{b/s}\\end{aligned}',
 after:'Here $\\text{SNR}=P/N_0W$ is a ratio, not a value in decibels. A band of $W=1$ MHz at $\\text{SNR}=15$ gives $C=10^{6}\\log_216=4$ Mb/s.'},
{t:'p', text:'At high SNR, $\\log_2(1+\\text{SNR})\\approx\\log_2\\text{SNR}$. So each doubling of the SNR, or $3$ dB, adds one bit a second per hertz.'},
{t:'ex', hd:'Example 6.8 — a telephone line', rows:[
 ['Given','A telephone line passes $300$ Hz to $3.4$ kHz at an SNR of $30$ dB.'],
 ['Find','The capacity $C$.'],
 ['Method','The band is $W=3400-300=3100$ Hz. The formula $C=W\\log_2(1+\\text{SNR})$ takes the SNR as a ratio, so convert it first: $\\text{SNR}=10^{30/10}=1000$.'],
 ['Solution','$C=3100\\log_2(1001)=3100\\times9.967=30.9$ kb/s.'],
 ['Check','At $30$ dB, $\\log_21001$ is close to $10$, so each hertz carries about $10$ bits a second. Then $3.1$ kHz carries about $31$ kb/s.']
]},
{t:'box', kind:'err', hd:'Common error', html:'Use $\\text{SNR}=1000$, not $30$, inside the logarithm. With $30$ the answer comes out as $3100\\log_2(31)=15.4$ kb/s.'},
{t:'p', text:'A wider band lets more samples through, but it spreads the same power thinner. The SNR $P/N_0W$ falls as $W$ grows, and the two effects nearly cancel.'},
{t:'p', text:'For small $x$, $\\ln(1+x)\\approx x$, so $\\log_2(1+x)\\approx x/\\ln2$. Put $x=P/N_0W$ and let $W$ grow.'},
{t:'eqbox', cap:'Infinite band', tex:'\\begin{aligned}\\lim_{W\\to\\infty}W\\log_2\\Bigl(1+\\frac{P}{N_0W}\\Bigr)&=\\lim_{W\\to\\infty}W\\cdot\\frac{P}{N_0W\\ln2}\\\\&=\\frac{P}{N_0\\ln2}=1.4427\\,\\frac{P}{N_0}\\end{aligned}',
 after:'At a fixed power, capacity levels off however wide the band. At a fixed band it keeps growing with power, but only as the logarithm of the power.'},
{t:'p', text:'The <b>spectral efficiency</b> $r=R_b/W$ is the bit rate carried by each hertz of band. The power is energy a bit times bits a second, $P=E_bR_b$. Put both into $R_b<C$.'},
{t:'eqbox', cap:'Least $E_b/N_0$ for a spectral efficiency', tex:'\\begin{aligned}R_b&<W\\log_2\\Bigl(1+\\frac{E_bR_b}{N_0W}\\Bigr)\\\\r&<\\log_2\\Bigl(1+r\\,\\frac{E_b}{N_0}\\Bigr)\\\\\\frac{E_b}{N_0}&>\\frac{2^{r}-1}{r}\\end{aligned}',
 after:'Divide the first line by $W$ to get the second. Raise $2$ to the power of each side and solve for $E_b/N_0$ to get the third. At $r=2$, $E_b/N_0>(2^{2}-1)/2=1.5$, which is $10\\log_{10}1.5=1.76$ dB.'},
{t:'p', text:'The curve splits the plane into two regions. Above $r=1$ the band is scarce, and a link is <b>bandwidth-limited</b>. Below it power is scarce, and a link is <b>power-limited</b>. No link works to the left of the curve.'},
{t:'fig', svg:()=>shannonfig(),
 cap:'The least $E_b/N_0$ for each spectral efficiency $r=R_b/W$. Every reliable link sits to the right of the curve, and no code works left of $-1.59$ dB. Uncoded BPSK at $P_b=10^{-5}$ sits at $9.59$ dB and $r=1$.',
 short:'The least $E_b/N_0$ for each spectral efficiency.'},
{t:'box', kind:'warn', hd:'The gap', html:'Each uncoded scheme of Chapter 5 sits several decibels right of the curve. Channel coding exists to close that gap.'},
{t:'p', text:'Let the spectral efficiency fall to zero, which spends band freely. The bound then falls toward a floor. For small $r$, $2^{r}=e^{r\\ln2}\\approx1+r\\ln2$.'},
{t:'eqbox', cap:'Shannon limit', tex:'\\begin{aligned}\\frac{E_b}{N_0}&>\\lim_{r\\to0}\\frac{2^{r}-1}{r}=\\lim_{r\\to0}\\frac{r\\ln2}{r}\\\\&=\\ln2=0.693=-1.59\\ \\text{dB}\\end{aligned}',
 after:'No code works below $-1.59$ dB, at any bandwidth. Chapter 5 met the same floor for orthogonal signals as $M$ grows.'},
{t:'p', text:'Uncoded BPSK needs $9.59$ dB for $P_b=10^{-5}$. Its gap to the limit is $9.59-(-1.59)=11.18$ dB. Modern codes come within a fraction of a decibel of the limit.'},
{t:'p', text:'Some channels split into parallel subchannels with different noise, such as the tones of a DSL line. A total power $P$ must be shared among them.'},
{t:'eqbox', cap:'Parallel Gaussian channels', tex:'C=\\sum_i\\tfrac12\\log_2\\Bigl(1+\\frac{P_i}{N_i}\\Bigr),\\qquad\\sum_iP_i=P'},
{t:'p', text:'The best share fills every used subchannel to the same level $\\mu$, like water poured over an uneven floor. A subchannel whose noise lies above $\\mu$ gets nothing.'},
{t:'eqbox', cap:'Water-filling', tex:'P_i=\\max(0,\\ \\mu-N_i)'},
{t:'ex', hd:'Example 6.9 — water-filling over six subchannels', rows:[
 ['Given','Six subchannels with noise $0.1,0.2,0.4,0.8,1.6,3.2$ and a total power $P=1$.'],
 ['Find','The water level $\\mu$, the subchannels used and the capacity.'],
 ['Method','Guess how many subchannels are used, and solve $\\sum_i(\\mu-N_i)=P$ for $\\mu$. The guess is right when $\\mu$ lies below the noise of the first unused subchannel.'],
 ['Solution','With three subchannels, $3\\mu-(0.1+0.2+0.4)=1$, so $\\mu=1.7/3=0.567$. That is below $0.8$, so three are used, with $P_i=0.467,0.367,0.167$. Each used subchannel has $1+P_i/N_i=\\mu/N_i$. So $C=\\tfrac12\\log_25.667+\\tfrac12\\log_22.833+\\tfrac12\\log_21.417=1.251+0.751+0.251=2.254$ bits.'],
 ['Check','Equal shares of $1/6$ each give only $1.641$ bits. At $P=8$ the level rises to $\\mu=(8+3.1)/5=2.22$. That is below $3.2$, so five of the six subchannels are used.']
]},
{t:'fig', svg:()=>waterfig(),
 cap:'Water-filling at $P=1$. The noise of each subchannel is the floor (grey), and the power (cyan) fills three of them up to $\\mu=0.567$.'},

{t:'h2', num:'6.7', text:'Summary'},
{t:'p', text:'The chapter runs from a source to a channel. One example follows a source through a Huffman code and a BPSK link.'},
{t:'ex', hd:'Example 6.10 — from a source to a channel', rows:[
 ['Given','The source $0.4,0.2,0.2,0.1,0.1$ emits $1000$ symbols a second. It is coded with the Huffman code of Example 6.2. The bits are sent by BPSK at $3000$ bits a second and $4$ dB, decided bit by bit.'],
 ['Find','Whether the link can be made reliable.'],
 ['Method','Compare the information rate $HR_s$ of the source with the rate $CR_c$ that the channel can carry reliably.'],
 ['Solution','The source has $H=2.122$ bits a symbol, so $HR_s=2122$ b/s. The Huffman code spends $\\bar{L}=2.2$, so $2200$ b/s leave the encoder. BPSK at $4$ dB is a BSC with $p=0.0125$ and $C=1-H_b(0.0125)=0.903$ bit a use. So $CR_c=0.903\\times3000=2709$ b/s, above $2122$ b/s.'],
 ['Check','A channel code of rate $2200/3000=0.733<C$ exists that makes the link reliable. At $R_c=2000$ uses a second, $CR_c=0.903\\times2000=1806<2122$ b/s, and no code can.']
]},
{t:'table', cap:'Summary of Chapter 6: an introduction to information theory.', head:['Result','Statement'], rows:[
 ['Self-information','$I(s_k)=-\\log_2p_k$ bits'],
 ['Entropy','$H(S)=-\\sum_kp_k\\log_2p_k$, with $0\\le H(S)\\le\\log_2K$'],
 ['Extension','$H(S^n)=nH(S)$ for a memoryless source'],
 ['Typical sequences','About $2^{nH}$ sequences of probability near $2^{-nH}$ hold almost all the probability'],
 ['Kraft inequality','A prefix code with lengths $l_k$ exists exactly when $\\sum_k2^{-l_k}\\le1$'],
 ['Source-coding bound','$H\\le\\bar{L}<H+1$, and $H\\le L_n/n<H+1/n$ for blocks'],
 ['Rate–distortion','$D(R)=\\sigma^{2}2^{-2R}$ for a Gaussian source'],
 ['Huffman code','Merge the two smallest entries until one is left'],
 ['Lempel–Ziv code','A pointer and one new bit a phrase, with no knowledge of the source'],
 ['Binary symmetric channel','Crossover $p=Q\\bigl(\\sqrt{2E_b/N_0}\\bigr)$ for hard-decision BPSK'],
 ['Mutual information','$I(X;Y)=H(X)-H(X\\mid Y)=H(X)+H(Y)-H(X,Y)\\ge0$'],
 ['Capacity','$C=\\max_{p(x)}I(X;Y)$: $1-H_b(p)$ for the BSC, $1-\\epsilon$ for the BEC'],
 ['Channel coding theorem','Rates $R<C$ can be made reliable, and rates $R>C$ cannot'],
 ['Source over a channel','Reliable when $H(U)<C$ bits per channel use'],
 ['Gaussian channel','$C=\\tfrac12\\log_2(1+P/P_N)$ bits per use'],
 ['Bandlimited channel','$C=W\\log_2(1+P/N_0W)$ b/s, tending to $1.4427\\,P/N_0$ as $W\\to\\infty$'],
 ['Shannon limit','$E_b/N_0>(2^{r}-1)/r$, and $E_b/N_0>\\ln2=-1.59$ dB at any $r$'],
 ['Water-filling','$P_i=\\max(0,\\mu-N_i)$ over parallel channels']
]},
{t:'p', text:'A source is compressed to its entropy, and the bits are coded for the channel at a rate below its capacity. Chapter 7 builds those channel codes.'}

];
})();
