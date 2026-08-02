/* ==========================================================================
   Module 6 — An introduction to information theory.

   The order is the lecturer's: what a source is, how much information one
   symbol carries, the average of that over the alphabet, what the average
   costs to write down, and finally the algorithm that reaches the average.

   Every number in this module is small enough to check by hand, and the
   scenes are written so that the reader can. That is deliberate: this is the
   one module where the arithmetic is the argument.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;

const lg = x => Math.log(x)/Math.LN2;
const H = ps => -ps.filter(p=>p>0).reduce((s,p)=>s+p*lg(p), 0);

/* The binary entropy function, with an optional mark on it. */
function figHb(mark){
  const a = P.Axes({w:440,h:190,xr:[0,1],yr:[0,1.2],
    xlabel:'p', ylabel:'H(S)\\;\\text{bits}',
    pad:{l:56,r:22,t:22,b:44}, xtarget:5, ytarget:4});
  a.curve(p => (p<=0||p>=1) ? 0 : -(p*lg(p)+(1-p)*lg(1-p)), {color:C.in, width:2.2});
  a.point(0.5, 1, {color:C.err, r:4});
  a.note(0.5, 1.12, 'H=1\\ \\text{at}\\ p=\\tfrac12', {tex:true, fs:12, color:C.err, anchor:'middle'});
  if(mark !== undefined){
    const h = -(mark*lg(mark)+(1-mark)*lg(1-mark));
    a.vline(mark, {color:C.out, dash:'4 3'});
    a.point(mark, h, {color:C.out, r:4});
  }
  return a.svg();
}

/* A probability against the information one observation of it carries. The
   two curves cross, and where they cross is what entropy averages. */
function figSelf(){
  const a = P.Axes({w:420,h:250,xr:[0.02,1],yr:[0,5.4],
    xlabel:'p_k', ylabel:'\\text{bits}',
    pad:{l:56,r:22,t:22,b:44}, xtarget:5, ytarget:5});
  a.curve(p => -lg(p), {color:C.in, width:2.2});
  a.curve(p => -p*lg(p), {color:C.out, width:2.2});
  a.note(0.11, 4.4, 'I(s_k)=-\\log_2 p_k', {tex:true, fs:13, color:C.in});
  a.note(0.63, 1.02, 'p_k I(s_k)', {tex:true, fs:13, color:C.out});
  return a.svg();
}

/* A bar for each symbol: how likely it is, and how many bits it carries. */
function figBars(ps, labels){
  const n = ps.length;
  const top = Math.max(1.05, ...ps.map(p=>-lg(p)))*1.15;
  const a = P.Axes({w:440,h:190,xr:[0,n+0.75],yr:[-top*0.32,top],
    ylabel:'\\text{bits}', pad:{l:56,r:22,t:22,b:40},
    xticksOverride:[], zeroAxes:false,
    yticksOverride:[0,1,2,3,4,5,6,7].filter(v=>v<=top && (top<=4.5 || v%2===0))});
  ps.forEach((p,i)=>{
    a.rect(i+0.12, 0, i+0.48, -lg(p), {fill:C.dec.in, stroke:C.in});
    a.rect(i+0.52, 0, i+0.88, p*-lg(p), {fill:C.dec.out, stroke:C.out});
    if(labels[i]) a.note(i+0.5, -top*0.18, labels[i], {tex:true, fs:11, color:C.dim, anchor:'middle'});
  });
  a.hline(H(ps), {color:C.err, dash:'5 3'});
  a.note(n+0.72, H(ps)+top*0.07, 'H(S)', {tex:true, fs:12, color:C.err, anchor:'end'});
  return a.svg();
}

/* A binary code tree. `codes` is a list of bit strings; the tree is whatever
   they describe, so a code that is not a prefix code draws a symbol at an
   internal node and shows why it cannot be decoded on the fly. */
function figTree(codes, labels, opts){
  opts = opts || {};
  const depth = Math.max(...codes.map(c=>c.length));

  /* Every node the codewords pass through, and the root. */
  const nodes = new Set(['']);
  codes.forEach(c=>{ for(let i=1;i<=c.length;i++) nodes.add(c.slice(0,i)); });

  /* Leaves get one row each, evenly spaced, and a parent sits at the mean of
     its children. Placing a node at its binary position instead would put the
     deepest siblings a pixel apart, which is how the first version of this
     figure came out. */
  const kids = n => Array.from(nodes).filter(m => m.length === n.length+1 && m.slice(0,-1) === n);
  const order = Array.from(nodes).sort((a,b)=>b.length-a.length || (a<b?-1:1));
  const leaves = order.filter(n => kids(n).length === 0);
  const row = {};
  leaves.forEach((n,i)=>{ row[n] = i; });
  order.forEach(n=>{
    const k = kids(n);
    if(k.length) row[n] = k.reduce((s,m)=>s+row[m],0)/k.length;
  });
  const span = Math.max(1, leaves.length-1);

  const a = P.Axes({w:opts.w||360, h:opts.h||250, xr:[-0.35,depth+0.95], yr:[-0.5,span+0.5],
    pad:{l:14,r:14,t:14,b:14}, xticksOverride:[], yticksOverride:[],
    grid:false, zeroAxes:false, arrows:false});
  const Y = n => span - row[n];

  Array.from(nodes).forEach(n=>{
    if(n === '') return;
    const par = n.slice(0,-1);
    a.poly([[par.length, Y(par)],[n.length, Y(n)]], {color:C.grid, width:1.4});
    a.note((par.length+n.length)/2, (Y(par)+Y(n))/2 + span*0.055,
      n.slice(-1), {fs:11, color:C.dim, anchor:'middle'});
  });
  Array.from(nodes).forEach(n=>{
    const leaf = codes.indexOf(n);
    a.point(n.length, Y(n), {color: leaf>=0 ? C.ink : C.grid, r: leaf>=0 ? 5 : 2.6});
    if(leaf >= 0) a.note(n.length + 0.14, Y(n), labels[leaf], {tex:true, fs:12, color:C.ink});
  });
  return a.svg();
}

const HUFF = [0.4, 0.2, 0.2, 0.1, 0.1];
const HLAB = ['s_1','s_2','s_3','s_4','s_5'];

window.SCENES_M6 = [

/* ---------------------------------------------------------------- 6.0 ---- */
{ id:'m6-open', module:'M6', nav:'Opening', title:'How much is a message worth?',
  objective:'Frame the two questions information theory answers for this course.',
  keywords:'information theory source entropy compression limit opening',
  src:'CH10 s.2–3', steps:1, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'How much is a message worth?'},
  {t:'lede', text:'Everything so far has been about getting bits across a channel. This module steps back and asks where the bits came from, and how few of them a message really needs.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>A source produces symbols — letters, samples, pixels. Some are common and some are rare. It is obvious that a message of rare symbols is more surprising than one of common symbols, and it turns out that this can be measured, in bits, and that the measurement is exactly the number of bits the message needs.</p>'},
    {t:'note', kind:'def', head:'What a discrete memoryless source is', html:'A source that emits one of $K$ symbols each time, with fixed probabilities $p_1,\\ldots,p_K$, and where each symbol is chosen independently of the ones before it. <b>Discrete</b> because the alphabet is finite, <b>memoryless</b> because the past does not matter. It is the simplest model that is still worth anything, and it is the only one this course uses.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'The two questions', html:'<b>1.</b> How much information does a source produce, on average, per symbol? The answer is its <em>entropy</em>. <b>2.</b> How few bits can encode it without losing anything? The answer is the same number. That coincidence is the source-coding theorem, and it is what makes this module short.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figSelf(),
      caption:'A rare symbol carries many bits and a common one carries few. The lower curve is the first weighted by how often it happens — and the area under that weighting, summed over the alphabet, is the entropy.'},
    {t:'small', html:'The two curves already say why the answer is an average and not a maximum: a symbol so rare that it carries twenty bits contributes almost nothing, because it almost never arrives.'}
  ]}
]},

/* ---------------------------------------------------------------- 6.1 ---- */
{ id:'m6-selfinfo', module:'M6', nav:'Self-information', title:'The information in one symbol',
  objective:'Define self-information and give its three properties.',
  keywords:'self information logarithm bits nats hartleys properties independent',
  src:'CH10 s.4', steps:2, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'The information in one symbol'},
  {t:'cols', ratio:'c-7-5', vcenter:true, left:[
    {t:'body', html:'<p>How much do you learn when a symbol arrives? If it was certain, nothing. If it was almost impossible, a great deal. So the measure has to fall as the probability rises, and it has to reach zero at probability one.</p>'},
    {t:'eq', key:true, label:'self-information',
      tex:'I(s_k)=\\log_a\\frac{1}{p_k}=-\\log_a p_k'},
    {t:'small', html:'The base sets the unit: $a=2$ gives <b>bits</b>, $a=e$ gives <b>nats</b>, $a=10$ gives <b>Hartleys</b>. This course uses base two everywhere, so every answer is in bits.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Three properties, and where each comes from', html:'<b>$I(s_k)\\ge0$</b> — a probability is at most one, so its logarithm is at most zero. Information is never negative.<br><b>$I(s_k)\\ge I(s_j)$ when $p_k\\le p_j$</b> — rarer means more informative. The measure decreases as the probability increases.<br><b>$I(s_ks_j)=I(s_k)+I(s_j)$ for independent symbols</b> — the probabilities multiply and the logarithm turns the product into a sum. This is the property that forces a logarithm and rules out every other shape of function.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'wex', head:'A quick one', rows:[
        ['Given','A fair coin, then a symbol of probability $1/8$.'],
        ['Find','The information each carries.'],
        ['Solution','$-\\log_2\\tfrac12=1$ bit; $-\\log_2\\tfrac18=3$ bits.'],
        ['Read it','Three coin flips have eight equally likely outcomes, so naming one of them is worth three flips. The formula agrees with counting, which is the point of choosing base two.']
      ]}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figSelf(),
      caption:'Self-information against probability. It is infinite at $p\\to0$ and zero at $p=1$, and it is the only shape that turns independent events into a sum.'},
    {t:'note', kind:'warn', head:'A common slip', html:'The logarithm of a probability is negative, so the minus sign in front is not decoration. Dropping it gives negative information, which nothing in this module can mean.'}
  ]}
]},

/* ---------------------------------------------------------------- 6.2 ---- */
{ id:'m6-entropy', module:'M6', nav:'Entropy', title:'Entropy: the average over the alphabet',
  objective:'Define entropy, give its bounds, and work the standard example.',
  keywords:'entropy average bits per symbol bounds maximum uniform binary entropy function',
  src:'CH10 s.5–6', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'Entropy: the average over the alphabet'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Self-information describes one symbol. Average it over the alphabet, weighting each symbol by how often it happens, and the result describes the source.</p>'},
    {t:'eq', key:true, label:'entropy',
      tex:'H(S)=E\\bigl[I(s_k)\\bigr]=\\sum_{k=1}^{K}p_k\\,I(s_k)=-\\sum_{k=1}^{K}p_k\\log_2 p_k'},
    {t:'small', html:'The unit is <b>bits a symbol</b>. Read it as the uncertainty before a symbol arrives, or equivalently as what is learnt once it has.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'bounds', tex:'0\\le H(S)\\le \\log_2 K'},
      {t:'note', kind:'ok', head:'Both ends are easy to see', html:'<b>Zero</b> when one symbol has probability one: nothing is ever in doubt, so nothing is ever learnt. <b>$\\log_2 K$</b> when all $K$ symbols are equally likely: putting $p_k=1/K$ into the sum gives $\\sum\\frac1K\\log_2 K=\\log_2 K$. Between them, the more even the probabilities, the higher the entropy.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'wex', head:'The standard example', rows:[
        ['Given','A memoryless source with alphabet $\\{s_1,s_2,s_3\\}$ and probabilities $0.7,\\;0.2,\\;0.1$.'],
        ['Find','The entropy.'],
        ['Solution','$H(S)=-0.7\\log_2 0.7-0.2\\log_2 0.2-0.1\\log_2 0.1=1.1568$ bits a symbol.'],
        ['Read it','Three symbols would need $2$ bits each if they were simply numbered. The source needs only $1.1568$, so numbering them wastes almost $0.85$ bits every symbol. Getting that back is the whole of source coding.']
      ]}
    ]},
    {t:'reveal', at:3, items:[
      {t:'small', html:'Check the bound: $\\log_2 3=1.585$, and $1.1568$ is below it. Equal probabilities would have reached $1.585$; these are lopsided, so they do not.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figHb(),
      caption:'The entropy of a binary source against $p$. One bit at $p=\\tfrac12$, nothing at either end, and the curve is flat near the top — which is why a slightly unfair coin is almost as good as a fair one.'},
    {t:'fig', frame:true, svg:()=>figBars([0.7,0.2,0.1],['s_1','s_2','s_3']),
      caption:'The example, symbol by symbol. The left bar of each pair is what the symbol carries; the right bar is that weighted by how often it happens. The three right bars add to $H(S)$, marked by the dashed line.'}
  ]}
]},

/* ---------------------------------------------------------------- 6.3 ---- */
{ id:'m6-extension', module:'M6', nav:'Extended sources', title:'Taking symbols in blocks',
  objective:'Show that the n-th extension has n times the entropy.',
  keywords:'extension extended source blocks n times entropy independent',
  src:'CH10 s.7', steps:2, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'Taking symbols in blocks'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Nothing forces a coder to handle one symbol at a time. Group them in $n$s and treat each block as one symbol of a new, larger alphabet. That alphabet is the <b>$n$-th extension</b>, written $S^n$, and it has $K^n$ symbols.</p>'},
    {t:'eq', key:true, label:'extension', tex:'H(S^{n})=n\\,H(S)'},
    {t:'small', html:'The source is memoryless, so the symbols in a block are independent, and independent information adds. That is the third property of self-information, applied $n$ times.'},
    {t:'reveal', at:1, items:[
      {t:'wex', head:'The same source, taken two at a time', rows:[
        ['Given','The source $0.7,\\;0.2,\\;0.1$ from the last scene, extended by two.'],
        ['Find','The entropy of $S^2$.'],
        ['Method','$S^2$ has $3^2=9$ symbols, and each has the product of two probabilities: $0.49, 0.14, 0.07, 0.14, 0.04, 0.02, 0.07, 0.02, 0.01$.'],
        ['Solution','Summing $-p\\log_2 p$ over all nine gives $2.3136$ bits a block.'],
        ['Check','$2\\times1.1568=2.3136$. The long way and the short way agree, which is what $H(S^n)=nH(S)$ promises.']
      ]}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Why bother', html:'Per symbol nothing changed — $2.3136$ over two symbols is still $1.1568$ each. What changes is what a coder can do with it. A code has to use a whole number of bits for each thing it codes, and that rounding costs less when it is spread over a block than over a single symbol. Scene $6.7$ turns that into a bound.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figBars(
      [0.49,0.14,0.07,0.14,0.04,0.02,0.07,0.02,0.01], []),
      caption:'The nine symbols of $S^2$, in the order $s_1s_1,\\,s_1s_2,\\,s_1s_3,\\,s_2s_1,\\ldots$ The dashed line is $H(S^2)=2.3136$ bits a block, exactly twice the line in the last scene.'},
    {t:'note', kind:'warn', head:'Only because it is memoryless', html:'If the source had memory — as English does, where $q$ is followed by $u$ — the block probabilities would not be products and the entropy of the extension would be <em>less</em> than $nH(S)$. That is precisely the redundancy real compressors live on.'}
  ]}
]},

/* ---------------------------------------------------------------- 6.L1 --- */
{ id:'m6-lab-i', module:'M6', nav:'Laboratory I', title:'Laboratory I · Entropy of a source',
  objective:'Let the reader move the probabilities and watch the entropy respond.',
  keywords:'laboratory entropy probabilities uniform bounds interactive',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'Laboratory I · Entropy of a source'},
  {t:'body', html:'Move the probabilities of a four-symbol source and watch three things at once: the information each symbol carries, the entropy, and how far it sits below its own ceiling of $\\log_2 K$.'},
  {t:'lab', id:'I'}
]},

/* ---------------------------------------------------------------- 6.4 ---- */
{ id:'m6-coding', module:'M6', nav:'Source coding', title:'What a code costs',
  objective:'Define average codeword length and coding efficiency.',
  keywords:'source coding encoder average codeword length efficiency variable length',
  src:'CH10 s.8–11', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'What a code costs'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>A source encoder turns each symbol into a string of bits, called its <b>codeword</b>. There is no need for every codeword to be the same length, and the good idea of this module is that they should not be: give the common symbols short codewords and the rare ones long ones.</p>'},
    {t:'eq', key:true, label:'average length',
      tex:'\\bar{L}=\\sum_{k=1}^{K}p_k\\,l_k\\quad\\text{bits a symbol}'},
    {t:'small', html:'$l_k$ is the length of the codeword for symbol $k$. $\\bar{L}$ is what the code actually costs, averaged over a long message.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'The source-coding theorem', html:'For any code from which the symbols can be recovered exactly, $\\bar{L}\\ge H(S)$. So the smallest average length any code can have is $L_{\\min}=H(S)$ — the entropy is not merely a measure of information, it is a limit on how few bits will carry it.'},
      {t:'eq', label:'efficiency', tex:'\\eta=\\frac{L_{\\min}}{\\bar{L}}=\\frac{H(S)}{\\bar{L}}\\le 1'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'small', html:'Efficiency is a fraction of the best possible, so it can never exceed one. A code at $\\eta=0.96$ is spending four per cent more bits than the source needs.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'Two kinds of coding, not to be confused', html:'<b>Source coding</b> removes bits the message does not need. <b>Channel coding</b> adds bits back so that errors can be found and fixed. They pull in opposite directions and they are done in that order, and this course only covers the first.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>P.blocks({w:560,h:150,items:[
      {t:'box',x:20,y:44,w:110,h:62,label:'DMS'},
      {t:'arrow',x1:130,y1:75,x2:210,y2:75},
      {t:'box',x:200,y:44,w:170,h:62,label:'Source encoder',fs:14},
      {t:'arrow',x1:370,y1:75,x2:440,y2:75},
      {t:'box',x:440,y:44,w:100,h:62,label:'Channel'},
      {t:'text',x:170,y:60,label:'s_k',tex:true,fs:15},
      {t:'text',x:405,y:60,label:'b_k',tex:true,fs:15},
      {t:'text',x:285,y:130,label:'variable-length codewords',fs:12}
    ]}),
      caption:'Where the encoder sits. It sees symbols and emits bits, and it is chosen knowing the probabilities of the source.'},
    {t:'wex', head:'A famous example', rows:[
      ['Given','Written English, whose entropy is estimated at about $1.3$ bits a letter.'],
      ['Observe','A typical variable-length code for it reaches $\\bar{L}=4.22$ bits a letter.'],
      ['Read it','$\\eta=1.3/4.22=0.31$ — the letter frequencies alone leave most of the redundancy on the table, because English also has memory that a letter-by-letter code cannot see. Morse code is the same idea by hand: one dot for $e$, four symbols for $z$.']
    ]}
  ]}
]},

/* ---------------------------------------------------------------- 6.5 ---- */
{ id:'m6-prefix', module:'M6', nav:'Prefix codes', title:'Codes that can be read back',
  objective:'Define uniquely decodable and prefix codes and separate the two.',
  keywords:'uniquely decodable prefix code instantaneous tree decoding ambiguity',
  src:'CH10 s.12–14', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'Codes that can be read back'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Short codewords are worth nothing if the receiver cannot tell where one ends and the next begins. Two conditions matter, and they are not the same condition.</p>'},
    {t:'grid', cols:2, gap:'16px', items:[
      [{t:'note', kind:'def', head:'Uniquely decodable', html:'Every string of bits the code can produce comes from exactly one string of symbols. Without this the code is unusable.'}],
      [{t:'note', kind:'def', head:'Prefix code', html:'No codeword begins any other. Stronger, and it buys something: the decoder can name a symbol the moment its last bit arrives. Also called <b>instantaneous</b>.'}]
    ]},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>Compare three codes for a four-symbol source.</p>'},
      {t:'grid', cols:3, gap:'18px', items:[
        [{t:'card', head:'Code I', items:[
          {t:'small', html:'$s_1\\!:0\\quad s_2\\!:1$<br>$s_3\\!:00\\quad s_4\\!:11$'}]}],
        [{t:'card', head:'Code II', items:[
          {t:'small', html:'$s_1\\!:0\\quad s_2\\!:10$<br>$s_3\\!:110\\quad s_4\\!:111$'}]}],
        [{t:'card', head:'Code III', items:[
          {t:'small', html:'$s_1\\!:0\\quad s_2\\!:01$<br>$s_3\\!:011\\quad s_4\\!:0111$'}]}]
      ]}
    ]},
    {t:'reveal', at:2, items:[
      {t:'small', html:'<b>Code I</b> is not a prefix code — $0$ begins $00$ — and it is not uniquely decodable either: the string $00$ is both $s_3$ and $s_1s_1$. <b>Code II</b> is a prefix code. <b>Code III</b> is not a prefix code, since $0$ begins all three of the others.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'warn', head:'Code III is the interesting one', html:'It <em>can</em> be read back: every codeword starts with the only $0$ and is then named by how many $1$s follow, so a long string parses one way and one way only. What it cannot do is decode on the fly — after reading $011$ the decoder still does not know whether it has $s_3$ or the start of $s_4$, and it has to wait for the next $0$. Uniquely decodable, but not instantaneous.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figTree(['0','10','110','111'],['s_1','s_2','s_3','s_4'],{w:430,h:130}),
      caption:'<b>Code II drawn as a tree.</b> Every symbol sits at a leaf, so no path to one passes through another. That is what the prefix property looks like.'},
    {t:'fig', frame:true, svg:()=>figTree(['0','01','011','0111'],['s_1','s_2','s_3','s_4'],{w:430,h:130}),
      caption:'<b>Code III drawn as a tree.</b> Every symbol sits on one path, each one hanging off the node before it. Nothing is at a leaf except the last, and that is exactly why the decoder has to wait.'}
  ]}
]},

/* ---------------------------------------------------------------- 6.6 ---- */
{ id:'m6-kraft', module:'M6', nav:'The Kraft inequality', title:'Which sets of lengths are possible',
  objective:'State the Kraft inequality and show it is necessary but not sufficient.',
  keywords:'kraft inequality codeword lengths necessary sufficient prefix budget',
  src:'CH10 s.15–16', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'Which sets of lengths are possible'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Before choosing any codewords, ask whether the <em>lengths</em> can work at all. Short codewords use up the tree quickly, and there is only so much tree.</p>'},
    {t:'eq', key:true, label:'Kraft', tex:'\\sum_{k=1}^{K}2^{-l_k}\\le 1'},
    {t:'note', kind:'def', head:'Read it as a budget', html:'Think of the whole tree as one unit. A codeword of length $l$ claims a branch and everything below it, which is a fraction $2^{-l}$ of the tree. The claims cannot add to more than the tree there is. A codeword of length $1$ costs half of everything; a codeword of length $4$ costs a sixteenth.'},
    {t:'reveal', at:1, items:[
      {t:'wex', head:'The three codes, tested', rows:[
        ['Code I','lengths $1,1,2,2$: $\\;2^{-1}+2^{-1}+2^{-2}+2^{-2}=1.5>1$. Fails, so no prefix code has these lengths.'],
        ['Code II','lengths $1,2,3,3$: $\\;2^{-1}+2^{-2}+2^{-3}+2^{-3}=1$. Passes, exactly — the tree is used up with nothing spare.'],
        ['Code III','lengths $1,2,3,4$: $\\;2^{-1}+2^{-2}+2^{-3}+2^{-4}=0.9375$. Passes, with a sixteenth of the tree left over.']
      ]}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Necessary, not sufficient', html:'Code III passes the test and is still not a prefix code. That is not a contradiction: the inequality says a prefix code with those <em>lengths</em> exists, not that the particular codewords chosen are one. Lengths $1,2,3,4$ do admit a prefix code — take $0$, $10$, $110$, $1110$ — but Code III did not use it.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'small', html:'So the inequality is a filter, not a proof. It rules out length sets quickly; it never certifies a code. To certify one, look at the codewords, or draw the tree.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figTree(['0','10','110','1110'],['s_1','s_2','s_3','s_4'],{w:430,h:135}),
      caption:'A prefix code with Code III\'s lengths $1,2,3,4$, which the Kraft inequality promised must exist. Every symbol is at a leaf, and one branch is left unused — the $0.0625$ of the budget that was never spent.'},
    {t:'note', kind:'ok', head:'When the sum is exactly one', html:'The tree is completely used and the code is <b>complete</b>: no length can be shortened without breaking the prefix property. Code II is like this. A sum below one always means some codeword is longer than it needs to be.'}
  ]}
]},

/* ---------------------------------------------------------------- 6.7 ---- */
{ id:'m6-bound', module:'M6', nav:'How close to the entropy', title:'The bound, and how to beat the rounding',
  objective:'State H ≤ L̄ < H+1 and show blocking closes the gap.',
  keywords:'bound entropy plus one dyadic extension converges rounding block coding',
  src:'CH10 s.17–18', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'The bound, and how to beat the rounding'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>The source-coding theorem says no code beats $H(S)$. The complementary result says a prefix code always gets within one bit of it.</p>'},
    {t:'eq', key:true, label:'the two-sided bound', tex:'H(S)\\le\\bar{L}< H(S)+1'},
    {t:'note', kind:'def', head:'Where the extra bit comes from', html:'The ideal length for symbol $k$ is $-\\log_2 p_k$, which is almost never a whole number. A codeword has to be a whole number of bits, so each length is rounded up, and rounding up costs less than one bit per symbol. That is the whole of the $+1$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'When the bound is tight', html:'If every probability is a power of two — $p_k=2^{-l_k}$, called a <b>dyadic</b> distribution — nothing needs rounding. Then $\\bar{L}=\\sum p_k l_k=\\sum l_k 2^{-l_k}$ and $H(S)=-\\sum 2^{-l_k}\\log_2 2^{-l_k}=\\sum l_k 2^{-l_k}$: the same sum. So $\\bar{L}=H(S)$ exactly, and the code is perfect.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'body', html:'<p>When the probabilities are not dyadic, code blocks instead of symbols. Apply the bound to the $n$-th extension, where the entropy is $nH(S)$:</p>'},
      {t:'eq', tex:'nH(S)\\le L_n< nH(S)+1\\quad\\Longrightarrow\\quad H(S)\\le\\frac{L_n}{n}< H(S)+\\frac{1}{n}'},
      {t:'eq', key:true, tex:'\\lim_{n\\to\\infty}\\frac{L_n}{n}=H(S)'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'small', html:'One wasted bit spread over $n$ symbols is $1/n$ bits each. Take blocks of ten and the waste is at most a tenth of a bit a symbol; take a hundred and it is a hundredth. The entropy is reached in the limit, and reached closely long before it.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const h = H([0.7,0.2,0.1]);
      const a = P.Axes({w:460,h:280,xr:[0.6,10.4],yr:[h-0.3,h+1.15],
        xlabel:'n\\;\\text{(symbols a block)}', ylabel:'\\text{bits a symbol}',
        pad:{l:62,r:22,t:24,b:46}, xtarget:5, ytarget:5});
      a.hline(h, {color:C.err, width:2});
      a.curve(n => h + 1/n, {color:C.out, width:2.1});
      for(let n=1;n<=10;n++) a.point(n, h + 1/n, {color:C.out, r:3});
      a.note(2.4, h-0.15, 'H(S)', {tex:true, fs:13, color:C.err});
      a.note(3.4, h+0.52, 'H(S)+1/n', {tex:true, fs:13, color:C.out});
      return a.svg();
    },
      caption:'The ceiling on $L_n/n$ against the block length, for the source $0.7,0.2,0.1$. At $n=1$ a code may waste a whole bit; at $n=10$ it may waste a tenth. The floor, in red, never moves.'},
    {t:'note', kind:'warn', head:'What it costs', html:'The $n$-th extension has $K^n$ symbols, so a block of ten from a three-symbol source needs a codebook of $59\\,049$ entries. The bound improves as $1/n$ and the work grows as $K^n$, which is why real compressors do something cleverer than this.'}
  ]}
]},

/* ---------------------------------------------------------------- 6.8 ---- */
{ id:'m6-huffman', module:'M6', nav:'Huffman coding', title:'Huffman coding',
  objective:'Give the algorithm and work the standard five-symbol example.',
  keywords:'huffman coding algorithm merge optimal prefix code average length efficiency',
  src:'CH10 s.19–20', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'Huffman coding'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>The bound says a good code exists. Huffman coding builds one, and it builds the best one: no prefix code has a smaller average length.</p>'},
    {t:'note', kind:'def', head:'The algorithm', html:'<b>1.</b> List the symbols in order of decreasing probability.<br><b>2.</b> Take the two least likely, label one $0$ and the other $1$, and merge them into one symbol whose probability is their sum. Re-sort.<br><b>3.</b> Repeat until two symbols are left, and label those $0$ and $1$.<br>Each symbol\'s codeword is the labels along the path back to it, read from the last merge to the first.'},
    {t:'reveal', at:1, items:[
      {t:'wex', head:'The standard example', rows:[
        ['Given','$p=0.4,\\;0.2,\\;0.2,\\;0.1,\\;0.1$.'],
        ['Merging','$0.1+0.1=0.2$; then the two smallest are $0.2$ and $0.2$, giving $0.4$; then $0.2$ and $0.4$ give $0.6$; then $0.4$ and $0.6$ finish it.'],
        ['Lengths','$2,\\;2,\\;2,\\;3,\\;3$.'],
        ['Average','$\\bar{L}=0.4(2)+0.2(2)+0.2(2)+0.1(3)+0.1(3)=2.2$ bits a symbol.']
      ]}
    ]},
    {t:'reveal', at:2, items:[
      {t:'body', html:'<p>Compare that with the entropy of the same source:</p>'},
      {t:'eq', tex:'H(S)=-0.4\\log_2 0.4-2(0.2\\log_2 0.2)-2(0.1\\log_2 0.1)=2.1219\\ \\text{bits}'},
      {t:'eq', key:true, tex:'\\eta=\\frac{H(S)}{\\bar{L}}=\\frac{2.1219}{2.2}=0.9645'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'What that number says', html:'The code spends $3.68\\%$ more bits than the source strictly needs, and no other prefix code on single symbols does better. To close the remaining gap the coder would have to work on blocks, as the last scene described — and the bound already said the gain available is at most $1/n$.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figTree(['00','10','11','010','011'],HLAB,{w:470,h:150}),
      caption:'The Huffman code as a tree. The two most likely symbols sit two levels down, the two least likely three levels down, and every symbol is at a leaf — it is a prefix code by construction.'},
    {t:'fig', frame:true, svg:()=>figBars(HUFF, HLAB),
      caption:'The same source by symbol. The dashed line is $H(S)=2.1219$; the code averages $2.2$, which is the line plus the rounding.'}
  ]}
]},

/* ---------------------------------------------------------------- 6.9 ---- */
{ id:'m6-huffman-var', module:'M6', nav:'Ties and variance', title:'The same length, a different code',
  objective:'Show Huffman is not unique and that variance separates the choices.',
  keywords:'huffman not unique ties variance codeword length minimum variance buffer',
  src:'CH10 s.21–22', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'The same length, a different code'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Two choices in the algorithm are free. Which of the merged pair gets $0$ is arbitrary. And when a merged symbol ties with one already in the list, either may be placed first. Different choices give different codes.</p>'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>Placing the merged symbol <em>below</em> the tie in the same example gives lengths $1,2,3,4,4$ instead of $2,2,2,3,3$:</p>'},
      {t:'eq', tex:'\\bar{L}_2=0.4(1)+0.2(2)+0.2(3)+0.1(4)+0.1(4)=2.2\\ \\text{bits a symbol}'},
      {t:'small', html:'The same $2.2$. Both codes are optimal, and they must be — Huffman produces a minimum-length code, and there is only one minimum.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'body', html:'<p>What separates them is how much the lengths vary about that average.</p>'},
      {t:'eq', key:true, label:'variance', tex:'\\sigma^{2}=\\sum_{k=1}^{K}p_k\\bigl(l_k-\\bar{L}\\bigr)^{2}'},
      {t:'eq', tex:'\\sigma_1^{2}=0.16\\qquad\\text{against}\\qquad\\sigma_2^{2}=1.36'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'Why the smaller variance is wanted, and how to get it', html:'The encoder produces bits at a varying rate and the channel takes them at a fixed one, so a buffer sits between them. A code with wildly different lengths makes that buffer fill and empty unpredictably; a code with steady lengths does not. Both cost $2.2$ bits on average, and only one is comfortable to build. <b>The rule:</b> on a tie, move the merged symbol as high as possible in the list, and the result is the minimum-variance Huffman code.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figTree(['00','10','11','010','011'],HLAB,{w:470,h:150}),
      caption:'<b>Merged symbol placed high.</b> Lengths $2,2,2,3,3$, average $2.2$, variance $0.16$. The tree is nearly balanced.'},
    {t:'fig', frame:true, svg:()=>figTree(['0','10','110','1110','1111'],HLAB,{w:470,h:150}),
      caption:'<b>Merged symbol placed low.</b> Lengths $1,2,3,4,4$, the same average $2.2$, variance $1.36$. The tree is a ladder, and the longest codeword is four times the shortest.'}
  ]}
]},

/* ---------------------------------------------------------------- 6.L2 --- */
{ id:'m6-lab-j', module:'M6', nav:'Laboratory J', title:'Laboratory J · Building a Huffman code',
  objective:'Run the algorithm one merge at a time and read off what it costs.',
  keywords:'laboratory huffman build merge step tree average length efficiency variance',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'Laboratory J · Building a Huffman code'},
  {t:'body', html:'Set the probabilities, then step through the merges one at a time. The tree, the codewords, the average length, the efficiency and the variance are all recomputed as the algorithm runs, and the tie-breaking rule can be switched to see the two codes of the last scene appear.'},
  {t:'lab', id:'J'}
]},

/* ---------------------------------------------------------------- 6.10 --- */
{ id:'m6-synth', module:'M6', nav:'Summary', title:'Module 6 in one page',
  objective:'Collect the definitions, the bounds and the algorithm.',
  keywords:'summary module 6 entropy source coding kraft huffman efficiency',
  src:'CH10 s.4–22', steps:1, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'Module 6 in one page'},
  {t:'grid', cols:2, gap:'26px', items:[
    [{t:'card', head:'How much information there is', items:[
      {t:'eq', plain:true, tex:'I(s_k)=-\\log_2 p_k,\\qquad H(S)=-\\sum_k p_k\\log_2 p_k'},
      {t:'body', html:'<p>Bounded by $0\\le H(S)\\le\\log_2 K$, largest when the symbols are equally likely. Blocks of $n$ carry $nH(S)$ because the source is memoryless.</p>'}
    ]}],
    [{t:'card', head:'What it costs to write down', items:[
      {t:'eq', plain:true, tex:'\\bar{L}=\\sum_k p_k l_k,\\qquad \\eta=\\frac{H(S)}{\\bar{L}}\\le 1'},
      {t:'body', html:'<p>No code beats $H(S)$; a prefix code always reaches within one bit of it; blocking cuts that bit to $1/n$.</p>'}
    ]}],
    [{t:'card', head:'Which codes can be read back', items:[
      {t:'eq', plain:true, tex:'\\sum_k 2^{-l_k}\\le 1'},
      {t:'body', html:'<p>Necessary for a prefix code, never sufficient. Uniquely decodable is the weaker requirement; prefix, or instantaneous, is the stronger one and is what is used.</p>'}
    ]}],
    [{t:'card', head:'How to build the best one', items:[
      {t:'body', html:'<p>Huffman: merge the two least likely, label $0$ and $1$, repeat. Optimal in average length, not unique, and placing merged symbols high gives the least variance.</p>'},
      {t:'eq', plain:true, tex:'\\sigma^{2}=\\sum_k p_k(l_k-\\bar{L})^{2}'}
    ]}]
  ]},
  {t:'reveal', at:1, items:[
    {t:'note', kind:'ok', head:'What the course adds up to', html:'Module 1 turned a waveform into bits. Modules 2 to 5 got those bits across a channel and counted the errors. Module 6 asks how few bits there needed to be in the first place, and answers with a single number that the source itself decides. Every stage between the two is engineering; the entropy is not.'}
  ]}
]}

];
})();
