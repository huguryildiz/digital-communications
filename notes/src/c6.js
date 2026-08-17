/* Course notes — Chapter 6. */
(function(){
const P=PLOT, C=P.COL;
const ax=o=>P.Axes(Object.assign({w:700,h:200,pad:{l:50,r:20,t:18,b:34},xtarget:6,ytarget:3},o));
const lg=x=>Math.log(x)/Math.LN2;
const H=ps=>-ps.filter(p=>p>0).reduce((s,p)=>s+p*lg(p),0);

/* The binary entropy function. */
function hb(){
  const a=ax({w:420,h:240,xr:[0,1],yr:[0,1.18],xlabel:'p',ylabel:'H(S)\\;\\text{bits}',
    pad:{l:54,r:20,t:20,b:40},xtarget:5,ytarget:4});
  a.curve(p=>(p<=0||p>=1)?0:-(p*lg(p)+(1-p)*lg(1-p)),{color:C.in,width:2.1});
  a.point(0.5,1,{color:C.err,r:4});
  a.note(0.5,1.10,'H=1',{tex:true,fs:12,color:C.err,anchor:'middle'});
  return a.svg();
}

/* A bar for each symbol: what it carries, and that weighted by how often. */
function bars(ps,labels){
  const n=ps.length, top=Math.max(1.05,...ps.map(p=>-lg(p)))*1.16;
  const a=ax({w:420,h:220,xr:[0,n+0.7],yr:[-top*0.28,top],ylabel:'\\text{bits}',
    pad:{l:54,r:20,t:20,b:32},xticksOverride:[],zeroAxes:false,
    yticksOverride:[0,1,2,3,4,5,6].filter(v=>v<=top&&(top<=4.5||v%2===0))});
  ps.forEach((p,i)=>{
    a.rect(i+0.12,0,i+0.48,-lg(p),{fill:C.dec.in,stroke:C.in});
    a.rect(i+0.52,0,i+0.88,p*-lg(p),{fill:C.dec.out,stroke:C.out});
    if(labels[i]) a.note(i+0.5,-top*0.16,labels[i],{tex:true,fs:11,color:C.dim,anchor:'middle'});
  });
  a.hline(H(ps),{color:C.err,dash:'5 3'});
  a.note(n+0.66,H(ps)+top*0.06,'H(S)',{tex:true,fs:12,color:C.err,anchor:'end'});
  return a.svg();
}

/* A binary code tree: leaves evenly spaced, each parent at the mean of its
   children. Placing nodes at their binary position instead puts the deepest
   siblings a pixel apart. */
function tree(codes,labels,opts){
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
  const a=ax({w:opts.w||420,h:opts.h||150,xr:[-0.35,depth+0.95],yr:[-0.5,span+0.5],
    pad:{l:14,r:14,t:14,b:14},xticksOverride:[],yticksOverride:[],
    grid:false,zeroAxes:false,arrows:false});
  const Y=n=>span-row[n];
  Array.from(nodes).forEach(n=>{
    if(n==='') return;
    const par=n.slice(0,-1);
    a.poly([[par.length,Y(par)],[n.length,Y(n)]],{color:C.grid,width:1.4});
    a.note((par.length+n.length)/2,(Y(par)+Y(n))/2+span*0.055,n.slice(-1),
      {fs:11,color:C.dim,anchor:'middle'});
  });
  Array.from(nodes).forEach(n=>{
    const leaf=codes.indexOf(n);
    a.point(n.length,Y(n),{color:leaf>=0?C.ink:C.grid,r:leaf>=0?5:2.6});
    if(leaf>=0) a.note(n.length+0.14,Y(n),labels[leaf],{tex:true,fs:12,color:C.ink});
  });
  return a.svg();
}

/* ---- the channel half ----------------------------------------------------
   The three figures below are computed from the definitions in the text, not
   from tabulated points, so a change to the text that the figure contradicts
   shows up as a figure that has moved. */
const hbin=p=>(p<=0||p>=1)?0:-(p*lg(p)+(1-p)*lg(1-p));

/* Capacity of the binary symmetric channel against its crossover. */
function capfig(){
  const a=ax({w:420,h:230,xr:[0,1],yr:[0,1.14],xlabel:'p',ylabel:'C\\;\\text{bits per use}',
    pad:{l:58,r:20,t:20,b:40},xtarget:5,ytarget:4});
  a.curve(p=>1-hbin(p),{color:C.in,width:2.2});
  a.point(0.5,0,{color:C.err,r:4});
  a.point(0.1,1-hbin(0.1),{color:C.out,r:4});
  a.note(0.14,0.62,'C=0.531',{tex:true,fs:11,color:C.out});
  return a.svg();
}

/* Mutual information of the Z-channel against its input distribution. */
function zfig(){
  const I=q=>{
    const py=[q+0.5*(1-q), 0.5*(1-q)];
    return H(py)-(1-q);
  };
  const a=ax({w:420,h:230,xr:[0,1],yr:[0,0.40],xlabel:'q=P(X=0)',
    ylabel:'I(X;Y)\\;\\text{bits}',pad:{l:58,r:20,t:20,b:40},xtarget:5,ytarget:4});
  a.curve(I,{color:C.h,width:2.2});
  a.vline(0.6,{color:C.err,dash:'4 3'});
  a.point(0.6,I(0.6),{color:C.err,r:4});
  a.note(0.63,0.10,'q^{*}=0.6',{tex:true,fs:11,color:C.err});
  return a.svg();
}

/* Bandwidth efficiency against energy per bit, and the floor it never crosses.
   Drawn from the closed form for the ratio each efficiency needs, so no solver
   is involved and the asymptote is exact. */
function shannonfig(){
  const a=ax({w:700,h:280,xr:[-4,16],yr:[0,6.4],
    xlabel:'E_b/N_0\\;(\\mathrm{dB})',ylabel:'C/B\\;(\\mathrm{bit/s/Hz})',
    pad:{l:66,r:22,t:22,b:44},xtarget:6,ytarget:6});
  const pts=[];
  for(let e=0.004;e<=6.4;e+=0.004){
    const db=10*Math.log10((Math.pow(2,e)-1)/e);
    if(db>=-4&&db<=16) pts.push([db,e]);
  }
  a.area(()=>6.4,-4,10*Math.log10(Math.LN2),{fill:C.dec.err});
  a.poly(pts,{color:C.in,width:2.2});
  a.vline(10*Math.log10(Math.LN2),{color:C.err,width:2});
  a.note(1.0,5.8,'-1.59\\ \\mathrm{dB}\\;\\text{: no system to the left}',{tex:true,fs:11,color:C.err});
  return a.svg();
}

window.C6 = [

{t:'h1', num:'CHAPTER 6', text:'An introduction to information theory'},
{t:'p', lead:true, text:'Every chapter so far has taken the bits as given and worked on getting them across a channel. This one asks where they came from and how few of them a message really needs. The answer is one number, computed from the source alone, and it is both a measure of how much information the source produces and a limit on how few bits will carry it.'},

{t:'h2', num:'6.1', text:'The information in one symbol'},
{t:'p', text:'A <b>discrete memoryless source</b> emits one of $K$ symbols each time, with fixed probabilities $p_1,\\ldots,p_K$, chosen independently of what came before. How much is learnt when one arrives? If it was certain, nothing. If it was almost impossible, a great deal.'},
{t:'eqbox', cap:'Self-information', tex:[
 'I(s_k)=\\log_a\\frac{1}{p_k}=-\\log_a p_k'],
 after:'The base sets the unit: $a=2$ gives <b>bits</b>, $a=e$ gives <b>nats</b>, $a=10$ gives <b>Hartleys</b>. This course uses base two throughout.'},
{t:'box', kind:'def', hd:'Three properties, and what forces the logarithm', html:'<b>$I(s_k)\\ge0$</b>, because a probability is at most one and its logarithm at most zero.<br><b>$I(s_k)\\ge I(s_j)$ when $p_k\\le p_j$</b>: rarer means more informative.<br><b>$I(s_ks_j)=I(s_k)+I(s_j)$ for independent symbols</b>, because their probabilities multiply and the logarithm turns a product into a sum. That third property is the one that rules out every function except a logarithm.'},
{t:'box', kind:'ok', hd:'One halving is one bit', html:'$-\\log_2\\frac12=1$, so every halving of a probability adds exactly one bit. A symbol of probability $1/1000$ is about ten halvings away from certainty, so it carries about $10$ bits. Most estimates in this chapter can be done that way, without a calculator.'},

{t:'h2', num:'6.2', text:'Entropy'},
{t:'p', text:'Self-information describes one symbol. Average it over the alphabet, weighting each symbol by how often it happens, and the result describes the source.'},
{t:'eqbox', cap:'Entropy', tex:[
 'H(S)=E\\bigl[I(s_k)\\bigr]=-\\sum_{k=1}^{K}p_k\\log_2 p_k\\quad\\text{bits a symbol}',
 '0\\le H(S)\\le\\log_2 K'],
 after:'Zero when one symbol has probability one — nothing is ever in doubt. At the top, $\\log_2 K$, when all $K$ are equally likely: putting $p_k=1/K$ into the sum gives $\\sum\\frac1K\\log_2 K=\\log_2 K$.'},
{t:'figrow', items:[
 {svg:()=>hb(), cap:'The entropy of a binary source. One bit at $p=\\tfrac12$, nothing at either end, and flat near the top — a slightly unfair coin is almost as informative as a fair one.'},
 {svg:()=>bars([0.7,0.2,0.1],['s_1','s_2','s_3']), cap:'The standard example. The left bar of each pair is what the symbol carries; the right bar is that weighted by how often it happens. The three right bars add to $H(S)$.'}
]},
{t:'ex', hd:'Example 6.1 — the entropy of a three-symbol source', rows:[
 ['Given','$S=\\{s_1,s_2,s_3\\}$ with probabilities $0.7,\\;0.2,\\;0.1$.'],
 ['Find','The entropy.'],
 ['Solution','$H(S)=-0.7\\log_2 0.7-0.2\\log_2 0.2-0.1\\log_2 0.1=0.3602+0.4644+0.3322=1.1568$ bits a symbol.'],
 ['Check','$\\log_2 3=1.585$, and $1.1568$ is below it, as it must be for a source that is not uniform. Numbering the three symbols would cost $2$ bits each, so plain numbering wastes almost $0.85$ bits every symbol. Recovering that is the whole of source coding.']
]},
{t:'p', text:'Two numbers get confused here and should not be. $\\log_2 K$ is the most a source of this size <em>could</em> carry. $\\lceil\\log_2 K\\rceil$ is what a fixed-length code <em>costs</em>. The first gap is the source being uneven; the second is rounding.'},

{t:'h2', num:'6.3', text:'Extended sources'},
{t:'p', text:'Nothing forces a coder to work one symbol at a time. Group them in $n$s and treat each block as one symbol of a new alphabet. That is the <b>$n$-th extension</b>, written $S^n$, and it has $K^n$ symbols.'},
{t:'eqbox', cap:'Extension', tex:['H(S^{n})=n\\,H(S)'],
 after:'The source is memoryless, so the symbols in a block are independent and their information adds. This is the third property of self-information, applied $n$ times.'},
{t:'ex', hd:'Example 6.2 — the same source, two at a time', rows:[
 ['Given','The source of Example 6.1, extended by two.'],
 ['Find','$H(S^2)$.'],
 ['Method','$S^2$ has $3^2=9$ symbols with probabilities $0.49, 0.14, 0.07, 0.14, 0.04, 0.02, 0.07, 0.02, 0.01$.'],
 ['Solution','Summing $-p\\log_2 p$ over all nine gives $2.3136$ bits a block.'],
 ['Check','$2\\times1.1568=2.3136$. The long way and the short way agree, and per symbol nothing has changed — $2.3136$ over two symbols is $1.1568$ each. What changes is how much of a whole bit gets wasted in rounding, and section 6.6 turns that into a bound.']
]},
{t:'box', kind:'warn', hd:'Only because it is memoryless', html:'If the source had memory — as English does, where $q$ is followed by $u$ — the block probabilities would not be products, and $H(S^n)$ would be <em>less</em> than $nH(S)$. That difference is exactly the redundancy real compressors live on, and it is outside this course.'},

{t:'h2', num:'6.4', text:'What a code costs'},
{t:'p', text:'A source encoder turns each symbol into a string of bits, its <b>codeword</b>. The codewords need not all be the same length, and the good idea of this chapter is that they should not be: short ones for common symbols, long ones for rare.'},
{t:'eqbox', cap:'Average length and efficiency', tex:[
 '\\bar{L}=\\sum_{k=1}^{K}p_k\\,l_k,\\qquad \\eta=\\frac{L_{\\min}}{\\bar{L}}=\\frac{H(S)}{\\bar{L}}\\le 1'],
 after:'The <b>source-coding theorem</b> says $\\bar{L}\\ge H(S)$ for any code from which the symbols can be recovered exactly. So $L_{\\min}=H(S)$: the entropy is not merely a measure of information, it is a limit on how few bits will carry it.'},
{t:'box', kind:'def', hd:'Source coding is not channel coding', html:'Source coding removes bits the message does not need. Channel coding adds bits back so that errors can be found and fixed. They pull in opposite directions, they are done in that order, and this course covers only the first.'},
{t:'p', text:'Written English gives a concrete case. Its entropy is estimated at about $1.3$ bits a letter, while a typical letter-by-letter variable-length code reaches $\\bar{L}=4.22$, so $\\eta=0.31$. Morse code is the same idea by hand: one dot for $e$, four symbols for $z$.'},

{t:'h2', num:'6.5', text:'Codes that can be read back'},
{t:'p', text:'Short codewords are worth nothing if the receiver cannot tell where one ends. Two conditions matter, and they are not the same condition. A code is <b>uniquely decodable</b> if every string of bits it can produce comes from exactly one string of symbols. It is a <b>prefix code</b> if no codeword is the beginning of any other — which is stronger, and which lets the decoder name a symbol the moment its last bit arrives. A prefix code is also called <b>instantaneous</b>.'},
{t:'table', head:['Symbol','Code I','Code II','Code III'], rows:[
 ['$s_1$','0','0','0'],
 ['$s_2$','1','10','01'],
 ['$s_3$','00','110','011'],
 ['$s_4$','11','111','0111']
]},
{t:'p', text:'Code I is not a prefix code and is not uniquely decodable either: the string $00$ is both $s_3$ and $s_1s_1$. Code II is a prefix code. Code III is not a prefix code, since $0$ begins all three of the others.'},
{t:'box', kind:'warn', hd:'Code III is the interesting one', html:'It <em>can</em> be read back: every codeword begins with the only $0$ and is then named by how many $1$s follow, so any concatenation parses one way. What it cannot do is decode on the fly — after reading $011$ the decoder still does not know whether it has $s_3$ or the start of $s_4$, and it must wait for the next $0$. Uniquely decodable, but not instantaneous. The distinction is the whole point of the example.'},
{t:'figrow', items:[
 {svg:()=>tree(['0','10','110','111'],['s_1','s_2','s_3','s_4']),
  cap:'<b>Code II.</b> Every symbol is at a leaf, so no path to one passes through another. That is what the prefix property looks like.'},
 {svg:()=>tree(['0','01','011','0111'],['s_1','s_2','s_3','s_4']),
  cap:'<b>Code III.</b> Every symbol sits on one path, each hanging off the node before it. Nothing is at a leaf but the last, and that is why the decoder must wait.'}
]},

{t:'h2', num:'6.6', text:'The Kraft inequality, and how close a code can get'},
{t:'p', text:'Before choosing any codewords, ask whether the <em>lengths</em> can work. Think of the whole tree as one unit: a codeword of length $l$ claims a branch and everything below it, a fraction $2^{-l}$ of the tree, and the claims cannot add to more than the tree there is.'},
{t:'eqbox', cap:'Kraft inequality', tex:['\\sum_{k=1}^{K}2^{-l_k}\\le 1'],
 after:'For the three codes above: $1.5$, $1$ and $0.9375$. Code I fails, so no prefix code has its lengths. Code II uses the tree exactly. Code III passes with a sixteenth to spare — and is still not a prefix code, because the inequality says a prefix code with those <em>lengths</em> exists, not that these particular codewords are one. It is <b>necessary but not sufficient</b>.'},
{t:'eqbox', cap:'How close a prefix code gets', tex:[
 'H(S)\\le\\bar{L}< H(S)+1',
 'H(S)\\le\\frac{L_n}{n}< H(S)+\\frac{1}{n}\\quad\\Longrightarrow\\quad \\lim_{n\\to\\infty}\\frac{L_n}{n}=H(S)'],
 after:'The ideal length for symbol $k$ is $-\\log_2 p_k$, almost never a whole number, so each length is rounded up and the rounding costs under one bit. Applying the same bound to the $n$-th extension spreads that one bit over $n$ symbols.'},
{t:'box', kind:'ok', hd:'When the bound is tight', html:'If every probability is a power of two — a <b>dyadic</b> distribution, $p_k=2^{-l_k}$ — nothing needs rounding. Then $\\bar{L}=\\sum l_k2^{-l_k}$ and $H(S)=-\\sum 2^{-l_k}\\log_2 2^{-l_k}=\\sum l_k2^{-l_k}$: the same sum. So $\\bar{L}=H(S)$ exactly and the code is perfect.'},
{t:'box', kind:'warn', hd:'What blocking costs', html:'The bound improves as $1/n$ and the alphabet grows as $K^n$. Reaching within $0.05$ bits a symbol needs $n=20$, and for a three-symbol source that is $3^{20}=3.5\\times10^{9}$ codewords. The theory says the entropy is reachable; the arithmetic says not this way, and both are true.'},

{t:'h2', num:'6.7', text:'Huffman coding'},
{t:'p', text:'The bound says a good code exists. Huffman coding builds one, and it builds the best one: no prefix code on single symbols has a smaller average length.'},
{t:'box', kind:'def', hd:'The algorithm', html:'<b>1.</b> List the symbols in order of decreasing probability.<br><b>2.</b> Take the two least likely, label one $0$ and the other $1$, and merge them into one symbol whose probability is their sum. Re-sort.<br><b>3.</b> Repeat until two symbols remain, and label those $0$ and $1$.<br>Each codeword is the labels along the path back to its symbol.'},
{t:'ex', hd:'Example 6.3 — the standard five-symbol source', rows:[
 ['Given','$p=0.4,\\;0.2,\\;0.2,\\;0.1,\\;0.1$.'],
 ['Merging','$0.1+0.1=0.2$; then the two smallest are $0.2$ and $0.2$, giving $0.4$; then $0.2$ and $0.4$ give $0.6$; then $0.4$ and $0.6$ finish it.'],
 ['Solution','Lengths $2,2,2,3,3$, so $\\bar{L}=0.4(2)+0.2(2)+0.2(2)+0.1(3)+0.1(3)=2.2$ bits a symbol.'],
 ['Efficiency','$H(S)=2.1219$ bits, so $\\eta=2.1219/2.2=0.9645$ — the code spends $3.68\\%$ more than the source strictly needs.'],
 ['Check','$2.1219\\le2.2<3.1219$: the two-sided bound holds. A fixed-length code would have cost $\\lceil\\log_2 5\\rceil=3$ bits, so Huffman saved $0.8$ bits a symbol.']
]},
{t:'p', text:'Two choices in the algorithm are free: which of a merged pair gets $0$, and where a merged symbol goes when it ties with one already in the list. Different choices give different codes with the <em>same</em> average length — they must, because the minimum is unique even when the code is not. What separates them is how far the lengths spread about that average.'},
{t:'eqbox', cap:'Variance of the codeword length', tex:[
 '\\sigma^{2}=\\sum_{k=1}^{K}p_k\\bigl(l_k-\\bar{L}\\bigr)^{2}'],
 after:'For the example: placing the merged symbol high gives lengths $2,2,2,3,3$ and $\\sigma^{2}=0.16$; placing it low gives $1,2,3,4,4$, the same $\\bar{L}=2.2$, and $\\sigma^{2}=1.36$.'},
{t:'figrow', items:[
 {svg:()=>tree(['00','10','11','010','011'],['s_1','s_2','s_3','s_4','s_5'],{w:440,h:160}),
  cap:'<b>Merged symbol placed high.</b> Lengths $2,2,2,3,3$, average $2.2$, variance $0.16$. The tree is nearly balanced.'},
 {svg:()=>tree(['0','10','110','1110','1111'],['s_1','s_2','s_3','s_4','s_5'],{w:440,h:160}),
  cap:'<b>Merged symbol placed low.</b> Lengths $1,2,3,4,4$, the same average $2.2$, variance $1.36$. The tree is a ladder.'}
]},
{t:'box', kind:'ok', hd:'Why the smaller variance is wanted', html:'The encoder produces bits at a varying rate and the channel takes them at a fixed one, so a buffer sits between them. A code with wildly different lengths makes that buffer fill and empty unpredictably; a code with steady lengths does not. Both cost $2.2$ bits on average, and only one is comfortable to build. <b>The rule:</b> on a tie, move the merged symbol as high as possible in the list.'},

{t:'h2', num:'6.8', text:'Lempel–Ziv coding'},
{t:'p', text:'Huffman coding has one practical weakness, and it is not its length. It needs the probabilities <em>before</em> it can build the tree, and for a stream arriving over a wire nobody knows them in advance. A <b>universal</b> code is one that reaches the entropy without being told the source, and the Lempel–Ziv algorithm is the one in use everywhere.'},
{t:'box', kind:'def', hd:'The algorithm', html:'Read the stream once. Each time, take the <b>shortest run of bits not seen before</b> and store it in a dictionary. Because it is the shortest new one, everything but its last bit is already stored — so it is sent as a <b>pointer</b> to that earlier entry followed by the one new bit, the <b>innovation</b>. The decoder builds the same dictionary from the same blocks in the same order, so the dictionary is never transmitted.'},
{t:'ex', hd:'Example 6.4 — parsing and sending a stream', rows:[
 ['Given','The stream $0\\;1\\;00\\;011\\;1\\ldots$, with $0$ and $1$ held in the dictionary at positions $1$ and $2$.'],
 ['Method','Parse left to right into pieces not seen before, then send each piece as (position of its start, new bit).'],
 ['Solution','$00$ takes position $3$: its start $0$ is at position $1$ and its new bit is $0$, so with four-bit blocks it goes as $001\\,0$. Next $011$ takes position $4$: its start $01$ is at position $4$… so it is sent as $100\\,1$.'],
 ['Decoding','Receive $1101$. The last bit is the innovation, $1$. The first three, $110$, are $6$ in binary, so the piece is entry $6$ followed by $1$ — and entry $6$ is already in the decoder\'s own dictionary.'],
 ['Check','Seven pieces at four bits each cost $28$ bits where the raw stream was $18$. The method <em>loses</em> on a short stream, and that is not a fault: the dictionary has to be paid for before it can pay back. In practice the block is $12$ bits, giving $2^{12}=4096$ entries, and a long file compresses to roughly two thirds of its size.']
]},
{t:'box', kind:'ok', hd:'Optimal against universal', html:'Huffman is optimal but not universal: no prefix code on single symbols beats it, and it cannot start until the probabilities are known. Lempel–Ziv is universal but reaches the limit only in the long run. That trade is the whole difference between them, and it is why the second is what compresses an archive.'},

{t:'h2', num:'6.9', text:'The discrete memoryless channel'},
{t:'p', text:'The chapter so far has been about the source alone. The rest is about what a channel does to it, and the first job is to write a channel down in a form that can be calculated with. A <b>discrete memoryless channel</b> takes one symbol from a finite input alphabet and produces one from a finite output alphabet. <b>Discrete</b> because both alphabets are finite; <b>memoryless</b> because the output depends only on the input sent at that moment.'},
{t:'eqbox', cap:'The channel, and what the transmitter adds', tex:[
 'p(y_k\\mid x_j)=P\\bigl(Y=y_k\\mid X=x_j\\bigr),\\qquad\\sum_{k=0}^{K-1}p(y_k\\mid x_j)=1\\ \\ \\text{for every }j',
 'p(x_j,y_k)=p(y_k\\mid x_j)\\,p(x_j),\\qquad p(y_k)=\\sum_{j=0}^{J-1}p(y_k\\mid x_j)\\,p(x_j)'],
 after:'The transition probabilities collected into a matrix, one row per input, are the <b>channel matrix</b>. Every <em>row</em> sums to one, because something must come out when a symbol goes in; the columns do not, and expecting them to is the usual first mistake. The <b>input distribution</b> $p(x_j)$ is not part of the channel — it belongs to the transmitter, and it is chosen.'},
{t:'box', kind:'def', hd:'The binary symmetric channel', html:'Two inputs, two outputs, and one number: the probability $p$ that a bit is flipped, called the <b>crossover probability</b>. Its matrix is $\\begin{bmatrix}1-p&p\\\\ p&1-p\\end{bmatrix}$. It is not an abstraction invented for this chapter — the binary receiver of chapter 2, seen from outside, <em>is</em> a binary symmetric channel with $p=Q\\!\\left(\\sqrt{2E_b/N_0}\\right)$. With equally likely inputs the output is equally likely whatever $p$ is, even at $p=\\tfrac12$ where the channel is destroying everything, so a balanced output is no evidence that anything survived.'},

{t:'h2', num:'6.10', text:'Mutual information'},
{t:'p', text:'Before anything arrives, the uncertainty about the input is $H(X)$. Then one output symbol arrives, and it rarely settles the question but it does change the odds. What remains is an entropy like any other, averaged over which output actually came.'},
{t:'eqbox', cap:'Conditional entropy, and the information that got through', tex:[
 'H(X\\mid Y)=\\sum_{k}H(X\\mid Y=y_k)\\,p(y_k)=-\\sum_{k}\\sum_{j}p(x_j,y_k)\\log_2 p(x_j\\mid y_k)',
 'I(X;Y)=H(X)-H(X\\mid Y)=H(Y)-H(Y\\mid X)',
 'H(X,Y)=H(X)+H(Y)-I(X;Y)'],
 after:'Read the middle line in words: <b>how much doubt the arrival removed</b>, in bits, per use of the channel. The second form is the one used, because $H(Y\\mid X)$ comes straight off the channel matrix while $H(X\\mid Y)$ needs Bayes\' rule first.'},
{t:'box', kind:'def', hd:'Three properties', html:'<b>Symmetry.</b> $I(X;Y)=I(Y;X)$. Bayes\' rule gives $p(x_j\\mid y_k)/p(x_j)=p(y_k\\mid x_j)/p(y_k)$, and substituting turns one sum into the other. What the output says about the input equals what the input says about the output — which is why the quantity is called <em>mutual</em>.<br><b>Non-negativity.</b> $I(X;Y)\\ge0$, with equality exactly when $X$ and $Y$ are independent. An observation never leaves you knowing less than before.<br><b>Joint entropy.</b> Adding $H(X)$ and $H(Y)$ counts the shared part twice, so it is subtracted once. That is the whole content of the third line.'},
{t:'ex', hd:'Example 6.5 — the binary symmetric channel at $p=0.1$', rows:[
 ['Given','A BSC with $p=0.1$ and equally likely inputs.'],
 ['Find','$H(X)$, $H(Y\\mid X)$, $H(Y)$ and $I(X;Y)$.'],
 ['Method','$H(Y\\mid X)$ comes off the matrix: whichever symbol goes in, the output distribution is $(0.9,0.1)$ in some order. $H(Y)$ needs the output distribution first.'],
 ['Solution','$H(X)=1$ bit. $H(Y\\mid X)=H(0.1)=-0.1\\log_2 0.1-0.9\\log_2 0.9=0.4690$ bits. The output is equally likely, so $H(Y)=1$ bit, and $I(X;Y)=1-0.4690=0.5310$ bits per use.'],
 ['Check','One bit was offered and just over half a bit arrived. The missing $0.4690$ bits were not delayed or corrupted — they were destroyed, and no receiver however clever recovers them. The joint entropy is $1+1-0.5310=1.4690$ bits, and at $p=0.25$ the shared part falls to $0.1887$ while the total rises to $1.8113$: a noisier channel does not destroy uncertainty, it moves it out of the shared part.']
]},
{t:'box', kind:'warn', hd:'The two conditional entropies are not the same thing', html:'$H(Y\\mid X)$ is the uncertainty about the <em>output</em> given the input, and for the BSC it is $H(p)$ whatever the transmitter does — a property of the channel alone. $H(X\\mid Y)$ is the uncertainty about the <em>input</em> given the output, and it depends on the input distribution too. $I(X;Y)=I(Y;X)$ is a statement about one number; it does not make the two ends interchangeable.'},

{t:'h2', num:'6.11', text:'Channel capacity'},
{t:'p', text:'Mutual information measures one transmitter on one channel; change how often each symbol is sent and the number moves. The channel is fixed and the input distribution is the engineer\'s to choose, so take the best choice. What comes out then depends on the channel matrix alone, because the one free thing has been optimised away: <b>capacity is a property of the channel, and mutual information is not.</b>'},
{t:'eqbox', cap:'Capacity, and the capacity of the BSC', tex:[
 'C=\\max_{\\{p(x_j)\\}}I(X;Y)\\quad\\text{bits per channel use}',
 'C_{\\text{BSC}}=1-H(p),\\qquad H(p)=-p\\log_2 p-(1-p)\\log_2(1-p)'],
 after:'For the BSC, $H(Y\\mid X)=H(p)$ whatever the transmitter does, and $H(Y)\\le1$ bit with equality when the output is equally likely — which equally likely inputs deliver. So the maximum sits at $p(x_0)=\\tfrac12$ and the two pieces subtract. The unit is bits per <em>use</em> of the channel, not bits per second; multiply by the number of uses a second to reach a rate.'},
{t:'figrow', items:[
 {svg:()=>capfig(), cap:'The capacity of the binary symmetric channel. Worth a full bit at both ends — at $p=1$ every bit is flipped, which the receiver simply undoes — and zero at $p=\\tfrac12$, the <b>useless channel</b>, where the output is independent of the input.'},
 {svg:()=>zfig(), cap:'The Z-channel of Example 6.6. Its mutual information peaks at $q=0.6$, not at a half, which is what an asymmetric channel does: the transmitter should favour the symbol that survives.'}
]},
{t:'p', text:'The curve is flat near $p=0$: a channel with one error in a thousand has capacity $0.9886$ bits, so the first errors cost almost nothing. It then falls away steeply — at $p=0.11$ the capacity is already $0.500$. Halving the error probability of an already-good channel buys very little, and the effort belongs where the curve is steep.'},
{t:'ex', hd:'Example 6.6 — the capacity of the Z-channel', rows:[
 ['Given','A $0$ always arrives as a $0$; a $1$ arrives correctly half the time and as a $0$ otherwise. Write $P(X=0)=q$.'],
 ['Find','The capacity, and the input distribution that achieves it.'],
 ['Method','Nothing is symmetric, so the equally likely input is no longer the right guess. Form $I(X;Y)$ as a function of $q$ and maximise it.'],
 ['Solution','$P(Y=0)=q+\\tfrac12(1-q)=\\tfrac12(1+q)$, and $H(Y\\mid X)=q(0)+(1-q)(1)=1-q$ because a transmitted $0$ leaves nothing in doubt. Subtracting gives $I(X;Y)=q-\\tfrac12(1+q)\\log_2(1+q)-\\tfrac12(1-q)\\log_2(1-q)$. Setting the derivative to zero collapses the logarithmic terms to $\\tfrac12\\log_2\\frac{1-q}{1+q}=-1$, so $\\frac{1-q}{1+q}=\\frac14$ and $q^{*}=0.6$.'],
 ['Check','$C=0.3219$ bits per channel use, and $0.3219=\\log_2\\tfrac54$ exactly — a check on the arithmetic that costs nothing. The optimum is not the balanced input: the transmitter should send the reliable symbol three times in five. A transmitter that guesses $q=0.5$ still gets $0.3113$ bits, losing about $3\\%$.']
]},
{t:'box', kind:'ok', hd:'The channel coding theorem', html:'If the transmission rate satisfies $R_b<C$, there is a coding scheme whose probability of error is as small as required. If $R_b>C$, there is not — no scheme, however long or however clever. <b>An error-free data rate can never exceed the capacity.</b> The theorem says a code exists; it does not say what the code is, how long its blocks must be, or what the decoder costs. Finding codes that come close and can also be decoded took the fifty years after it was proved.'},

{t:'h2', num:'6.12', text:'The bandlimited channel'},
{t:'p', text:'Everything above counted symbols. A real channel is given instead as a bandwidth in hertz, an average transmitted power and a noise density. Its capacity is one of the most quoted results in engineering.'},
{t:'eqbox', cap:'The information capacity law', tex:[
 'C=B\\log_2\\!\\left(1+\\frac{P}{N_0B}\\right)\\quad\\text{bits per second}',
 '\\frac{C}{B}=\\log_2\\!\\left(1+\\frac{E_b}{N_0}\\frac{C}{B}\\right)\\quad\\Longrightarrow\\quad\\frac{E_b}{N_0}=\\frac{2^{C/B}-1}{C/B}'],
 after:'$B$ is the bandwidth, $P$ the average transmitted power and $N_0B$ the noise power in the band. Writing $P=E_bC$ — power is energy per bit times bits per second — and dividing by $B$ gives the second line, in which $C/B$ is the <b>bandwidth efficiency</b> in bits per second per hertz.'},
{t:'box', kind:'def', hd:'Read the two knobs', html:'$C$ grows <b>linearly</b> with bandwidth and only <b>logarithmically</b> with power. Doubling the bandwidth at fixed noise density roughly doubles the rate; doubling the power adds one bit per second per hertz at best and much less when the ratio is already large. Bandwidth is the better buy, and it is the one that is scarce and regulated. At $C/B=1$ the requirement is $E_b/N_0=1$, which is $0$ dB; at $C/B=2$ it is $1.5$, which is $1.76$ dB.'},
{t:'eqbox', cap:'The Shannon limit', tex:[
 '\\lim_{x\\to0}\\frac{2^{x}-1}{x}=\\ln 2,\\qquad \\frac{E_b}{N_0}\\bigg|_{\\min}=\\ln 2=0.693=-1.59\\ \\mathrm{dB}'],
 after:'Spend bandwidth freely — let $C/B\\to0$ — and the energy per bit a system needs falls, but not to nothing. No system of any kind communicates reliably below $-1.59$ dB: not a better code, not a better modulation, not a better receiver.'},
{t:'fig', svg:()=>shannonfig(),
 cap:'Bandwidth efficiency against energy per bit. Every working system sits below the curve and to the right of the line; the region to the left of $-1.59$ dB has never been occupied and never will be. Climbing from one bit per hertz to six costs about $14$ dB, and the climb steepens the whole way.'},
{t:'box', kind:'warn', hd:'A floor that is approached and never touched', html:'Reaching the limit needs infinite bandwidth, and the rate per hertz goes to zero on the way. Coherent binary PSK needs about $9.6$ dB for an error probability of $10^{-5}$, so it sits some $11$ dB above the floor. Closing that gap is what channel coding was invented for; this course stops at the uncoded schemes, which is where the gap is widest and easiest to see.'},

{t:'h2', num:'6.13', text:'Summary'},
{t:'table', head:['Result','Statement','Anchor'], rows:[
 ['Self-information','$I(s_k)=-\\log_2 p_k$','PS CH12.1.1'],
 ['Entropy','$H(S)=-\\sum_k p_k\\log_2 p_k$','PS CH12.1.1'],
 ['Bounds','$0\\le H(S)\\le\\log_2 K$','PS CH12.1.1'],
 ['Extension','$H(S^n)=nH(S)$','PS CH12.1.1'],
 ['Average length','$\\bar{L}=\\sum_k p_kl_k$, $\\eta=H(S)/\\bar{L}$','PS CH12.2'],
 ['Source-coding theorem','$\\bar{L}\\ge H(S)$, so $L_{\\min}=H(S)$','PS CH12.2'],
 ['Kraft','$\\sum_k2^{-l_k}\\le1$: necessary, not sufficient','PS CH12.3'],
 ['Prefix bound','$H(S)\\le\\bar{L}<H(S)+1$','PS CH12.2'],
 ['Huffman','optimal, not unique; high placement gives least variance','PS CH12.3.1']
]},
{t:'p', text:'Chapter 1 turned a waveform into bits. Chapters 2 to 5 got those bits across a channel and counted the errors. This chapter asked how few bits there needed to be in the first place, and answered with one number that the source itself decides. Everything between the two is engineering; the entropy is not.'}

];
})();
