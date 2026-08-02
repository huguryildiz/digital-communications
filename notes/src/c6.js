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

{t:'h2', num:'6.8', text:'Summary'},
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
