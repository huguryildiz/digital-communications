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
    /* `opts.bare` drops the edge-bit labels — a card miniature has no room
       for them and needs only the shape. */
    if(!opts.bare) a.note((par.length+n.length)/2, (Y(par)+Y(n))/2 + span*0.055,
      n.slice(-1), {fs:11, color:C.dim, anchor:'middle'});
  });
  Array.from(nodes).forEach(n=>{
    const leaf = codes.indexOf(n);
    /* `opts.hot` names one codeword to draw in the intermediate colour — the
       piece a step-driven scene has just added. */
    const hot = leaf>=0 && opts.hot === n;
    a.point(n.length, Y(n), {color: leaf>=0 ? (hot ? C.mid : C.ink) : C.grid, r: leaf>=0 ? (hot ? 6 : 5) : 2.6});
    if(leaf >= 0) a.note(n.length + 0.14, Y(n), labels[leaf], {tex:true, fs:12, color: hot ? C.mid : C.ink});
  });
  return a.svg();
}

const HUFF = [0.4, 0.2, 0.2, 0.1, 0.1];
const HLAB = ['s_1','s_2','s_3','s_4','s_5'];

/* ---- summary-card miniatures ----
   Each recalls the key figure of its section, stripped to the shape alone. */
function mini(w,h,xr,yr){ return P.Axes({w:w,h:h,xr:xr,yr:yr,pad:{l:10,r:10,t:8,b:8},
  xticksOverride:[], yticksOverride:[], grid:false, zeroAxes:false, arrows:false}); }
function miniEntropy(){
  const a = mini(300,80,[-0.06,1.06],[0,1.18]);
  a.curve(p=>(p<=0||p>=1)?0:-p*Math.log2(p)-(1-p)*Math.log2(1-p),{color:C.in,width:2});
  return a.svg();
}
function miniLengths(){
  const a = mini(300,80,[0,6],[0,3.6]);
  [2,2,2,3,3].forEach((l,k)=>a.rect(k+0.62,0,k+1.38,l,{fill:C.dec.mid}));
  a.hline(2.1219,{color:C.err,dash:'4 3'});
  return a.svg();
}
function miniKraftTree(){ return figTree(['00','01','10','110'],['','','',''],{w:300,h:80,bare:true}); }
function miniHuffTree(){ return figTree(['00','10','11','010','011'],['','','','',''],{w:300,h:80,bare:true}); }
function miniChannelX(){
  const a = mini(300,80,[0,3],[-0.2,1.2]);
  a.poly([[0.4,1],[2.6,1]],{color:C.out,width:2});
  a.poly([[0.4,0],[2.6,0]],{color:C.out,width:2});
  a.poly([[0.4,1],[2.6,0]],{color:C.err,width:1.6,dash:'4 3'});
  a.poly([[0.4,0],[2.6,1]],{color:C.err,width:1.6,dash:'4 3'});
  [[0.4,0],[0.4,1]].forEach(p=>a.point(p[0],p[1],{color:C.in,r:4.5}));
  [[2.6,0],[2.6,1]].forEach(p=>a.point(p[0],p[1],{color:C.mid,r:4.5}));
  return a.svg();
}
function miniShannon(){
  const a = mini(300,80,[0,8],[0,3.4]);
  a.curve(x=>Math.log2(1+x),{color:C.out,width:2});
  return a.svg();
}

/* ---- the channel half of the chapter ------------------------------------
   Everything below is computed from a channel matrix `Pyx`, whose row j is the
   distribution of the output when input j is sent. Nothing is tabulated: the
   entropies, the mutual information and the capacity all come from that matrix
   and an input distribution, by the definitions the scenes state. */

const hb = p => (p<=0||p>=1) ? 0 : -(p*lg(p)+(1-p)*lg(1-p));

/* Output distribution, then the three entropies and their combination. */
function chan(Pyx, px){
  const nO = Pyx[0].length;
  const py = new Array(nO).fill(0);
  Pyx.forEach((row,j)=>row.forEach((v,k)=>{ py[k] += px[j]*v; }));
  const HY  = H(py);
  const HYX = Pyx.reduce((s,row,j)=>s + px[j]*H(row), 0);
  return { py, HX:H(px), HY, HYX, I:HY-HYX };
}

/* The capacity of a binary-input channel, by searching the one free number in
   the input distribution. A golden-section search would be shorter; a sweep is
   used because it also gives the curve the figures draw. */
function capBinary(Pyx, n){
  n = n || 2000;
  let best = {q:0, I:0};
  for(let i=0;i<=n;i++){
    const q = i/n;
    const I = chan(Pyx, [q, 1-q]).I;
    if(I > best.I) best = {q, I};
  }
  return best;
}

const BSC = p => [[1-p, p],[p, 1-p]];
const ZCH = [[1, 0],[0.5, 0.5]];

/* Inputs on the left, outputs on the right, one line for every transition the
   matrix allows. A transition of probability zero is not drawn, which is what
   makes the Z-channel look like the letter it is named after. */
function figChannel(Pyx, labIn, labOut, opts){
  opts = opts || {};
  const nI = Pyx.length, nO = Pyx[0].length;
  const span = Math.max(nI, nO) - 1;
  const a = P.Axes({w:opts.w||420, h:opts.h||210, xr:[-0.30,1.30], yr:[-0.42,span+0.42],
    pad:{l:14,r:14,t:14,b:14}, xticksOverride:[], yticksOverride:[],
    grid:false, zeroAxes:false, arrows:false});
  const yI = j => span - j, yO = k => span - k;
  Pyx.forEach((row,j)=>row.forEach((v,k)=>{
    if(v <= 0) return;
    const kept = (j === k);
    a.poly([[0.08,yI(j)],[0.92,yO(k)]],
      {color: kept ? C.out : C.err, width: kept ? 2.0 : 1.6, dash: kept ? null : '5 3'});
    if(opts.labels !== false)
      a.note(0.5, (yI(j)+yO(k))/2 + (j===k ? 0.10 : (j<k ? -0.13 : 0.13)),
        opts.tex ? opts.tex[j][k] : String(v),
        {tex:!!opts.tex, fs:12, color: kept ? C.out : C.err, anchor:'middle'});
  }));
  labIn.forEach((s,j)=>{ a.point(0.08,yI(j),{color:C.in,r:5});
    a.note(-0.02, yI(j), s, {tex:true, fs:13, color:C.in, anchor:'end'}); });
  labOut.forEach((s,k)=>{ a.point(0.92,yO(k),{color:C.mid,r:5});
    a.note(1.02, yO(k), s, {tex:true, fs:13, color:C.mid}); });
  return a.svg();
}

/* One bar of total width H(X,Y), cut into the three pieces the definitions
   name. This is the picture that makes I(X;Y)=H(X)-H(X|Y) obvious. */
function figInfoBar(HXY, HXgY, I, HYgX){
  const a = P.Axes({w:460,h:250,xr:[-0.06,HXY+0.06],yr:[-1.05,1.75],
    pad:{l:16,r:16,t:16,b:16}, xticksOverride:[], yticksOverride:[],
    grid:false, zeroAxes:false, arrows:false});
  /* A segment too narrow to hold its own name is labelled above the bar
     instead. The noisier the channel, the narrower the shared piece gets, so
     this is the ordinary case and not an exception. */
  const seg = (x0,x1,fill,stroke,txt)=>{
    a.rect(x0, 0, x1, 0.5, {fill, stroke});
    const narrow = (x1-x0) < HXY*0.20;
    a.note((x0+x1)/2, narrow ? 0.74 : 0.25, txt,
      {tex:true, fs:12, color:stroke, anchor:'middle'});
  };
  seg(0, HXgY, C.dec.in, C.in, 'H(X|Y)');
  seg(HXgY, HXgY+I, C.dec.h, C.h, 'I(X;Y)');
  seg(HXgY+I, HXY, C.dec.mid, C.mid, 'H(Y|X)');
  a.poly([[0,1.14],[HXgY+I,1.14]], {color:C.in, width:2.2});
  a.note((HXgY+I)/2, 1.40, 'H(X)', {tex:true, fs:13, color:C.in, anchor:'middle'});
  a.poly([[HXgY,-0.30],[HXY,-0.30]], {color:C.mid, width:2.2});
  a.note((HXgY+HXY)/2, -0.56, 'H(Y)', {tex:true, fs:13, color:C.mid, anchor:'middle'});
  a.note(HXY/2, -0.92, 'H(X,Y)', {tex:true, fs:12, color:C.muted, anchor:'middle'});
  return a.svg();
}

window.SCENES_M6 = [

/* ---------------------------------------------------------------- 6.0 ---- */
{ id:'m6-open', module:'M6', nav:'Opening', title:'Information in a message',
  objective:'Frame the two questions information theory answers for this course.',
  keywords:'information theory source entropy compression limit opening',
  src:'CH10 s.2–3', steps:1, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'Information in a message'},
  {t:'lede', text:'Everything so far has been about getting bits across a channel. This module steps back and asks where the bits came from, and how few of them a message really needs.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>A source produces symbols such as letters, samples, or pixels. Some symbols occur often, while others are rare. A rare symbol gives more new information when it occurs. Information theory measures this amount in bits and relates its average to the best possible lossless compression rate.</p>'},
    {t:'note', kind:'def', head:'Discrete memoryless source', html:'A discrete memoryless source emits one of $K$ symbols at each step. The probabilities $p_1,\\ldots,p_K$ are fixed, and successive symbols are independent. <b>Discrete</b> means that the alphabet is finite. <b>Memoryless</b> means that earlier symbols do not change the next-symbol probabilities.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'The two questions', html:'<b>1.</b> How much information does a source produce on average per symbol? Its <em>entropy</em> measures this amount. <b>2.</b> What average rate can a lossless code approach? For long blocks, the source-coding theorem shows that this rate can approach the entropy but cannot fall below it.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figSelf(),
      caption:'A rare symbol carries many bits and a common one carries few. The lower curve is the first weighted by how often it happens — and the area under that weighting, summed over the alphabet, is the entropy.'},
    {t:'small', html:'The two curves already say why the answer is an average and not a maximum. A symbol so rare that it carries twenty bits contributes almost nothing, because it almost never arrives.'}
  ]}
]},

/* ---------------------------------------------------------------- 6.1 ---- */
{ id:'m6-selfinfo', module:'M6', nav:'Self-information', title:'Self-information',
  objective:'Define self-information and give its three properties.',
  keywords:'self information logarithm bits nats hartleys properties independent',
  src:'CH10 s.4', steps:2, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'Self-information'},
  {t:'lede', text:'The information in one symbol.'},
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
{ id:'m6-entropy', module:'M6', nav:'Entropy', title:'Entropy',
  objective:'Define entropy, give its bounds, and work the standard example.',
  keywords:'entropy average bits per symbol bounds maximum uniform binary entropy function',
  src:'CH10 s.5–6', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'Entropy'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Self-information describes one symbol. Average it over the alphabet, weighting each symbol by how often it happens, and the result describes the source.</p>'},
    {t:'eq', key:true, label:'entropy',
      tex:'H(S)=E\\bigl[I(s_k)\\bigr]=\\sum_{k=1}^{K}p_k\\,I(s_k)=-\\sum_{k=1}^{K}p_k\\log_2 p_k'},
    {t:'small', html:'The unit is <b>bits a symbol</b>. Read it as the uncertainty before a symbol arrives, or equivalently as what is learnt once it has.'},
    {t:'reveal', at:1, items:[
      {t:'eq', label:'bounds', tex:'0\\le H(S)\\le \\log_2 K'},
      {t:'note', kind:'ok', head:'Interpret the two limits', html:'The entropy is <b>zero</b> when one symbol has probability one because the next symbol is known. It is $\\log_2 K$ when all $K$ symbols are equally likely. Substitution of $p_k=1/K$ gives $\\sum\\frac1K\\log_2 K=\\log_2 K$. More even probabilities give higher entropy.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'wex', head:'The standard example', rows:[
        ['Given','A memoryless source with alphabet $\\{s_1,s_2,s_3\\}$ and probabilities $0.7,\\;0.2,\\;0.1$.'],
        ['Find','The entropy.'],
        ['Solution','$H(S)=-0.7\\log_2 0.7-0.2\\log_2 0.2-0.1\\log_2 0.1=1.1568$ bits a symbol.'],
        ['Read it','A fixed-length binary label needs $2$ bits for each of three symbols. The entropy is $1.1568$ bits per symbol. Thus, suitable block codes can approach a rate that is almost $0.85$ bits per symbol lower.']
      ]}
    ]},
    {t:'reveal', at:3, items:[
      {t:'small', html:'Check the bound: $\\log_2 3=1.585$, and $1.1568$ is less than this value. Equal probabilities give $1.585$. The unequal probabilities in this example give lower entropy.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figHb(),
      caption:'Entropy of a binary source against $p$. The entropy is one bit at $p=\\tfrac12$ and zero at both ends. A small change near $p=\\tfrac12$ causes little entropy loss.'},
    {t:'fig', frame:true, svg:()=>figBars([0.7,0.2,0.1],['s_1','s_2','s_3']),
      caption:'Entropy contributions for each symbol. The left bar is the self-information. The right bar is the self-information weighted by the symbol probability. The weighted bars sum to $H(S)$.'}
  ]}
]},

/* ---------------------------------------------------------------- 6.3 ---- */
{ id:'m6-extension', module:'M6', nav:'Extended sources', title:'Extended sources',
  objective:'Show that the n-th extension has n times the entropy.',
  keywords:'extension extended source blocks n times entropy independent',
  src:'CH10 s.7', steps:2, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'Extended sources'},
  {t:'lede', text:'Taking symbols in blocks.'},
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
      {t:'note', kind:'ok', head:'Block-coding advantage', html:'The entropy remains $1.1568$ bits per symbol. However, codeword lengths must be integers. Coding a block spreads the rounding cost over several symbols. Section $6.7$ gives the resulting bound.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figBars(
      [0.49,0.14,0.07,0.14,0.04,0.02,0.07,0.02,0.01], []),
      caption:'The nine symbols of $S^2$, in the order $s_1s_1,\\,s_1s_2,\\,s_1s_3,\\,s_2s_1,\\ldots$ The dashed line is $H(S^2)=2.3136$ bits a block, exactly twice the line in the last scene.'},
    {t:'note', kind:'warn', head:'Only because it is memoryless', html:'If the source had memory — as English does, where $q$ is followed by $u$ — the block probabilities would not be products. The entropy of the extension would then be <em>less</em> than $nH(S)$. That is precisely the redundancy real compressors live on.'}
  ]}
]},

/* ---------------------------------------------------------------- 6.L1 --- */
{ id:'m6-lab-i', module:'M6', nav:'Laboratory I', title:'Laboratory I · Entropy of a source',
  objective:'Let the reader move the probabilities and watch the entropy respond.',
  keywords:'laboratory entropy probabilities uniform bounds interactive',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'Laboratory I · Entropy of a source'},
  {t:'body', html:'Move the probabilities of a four-symbol source and watch three things at once. The display shows the information each symbol carries, the entropy, and how far it sits below its own ceiling of $\\log_2 K$.'},
  {t:'lab', id:'I'}
]},

/* ---------------------------------------------------------------- 6.4 ---- */
{ id:'m6-coding', module:'M6', nav:'Source coding', title:'Code length',
  objective:'Define average codeword length and coding efficiency.',
  keywords:'source coding encoder average codeword length efficiency variable length',
  src:'CH10 s.8–11', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'Code length'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>A source encoder turns each symbol into a string of bits, called its <b>codeword</b>. There is no need for every codeword to be the same length, and the good idea of this module is that they should not be. Give the common symbols short codewords, and the rare ones long ones.</p>'},
    {t:'eq', key:true, label:'average length',
      tex:'\\bar{L}=\\sum_{k=1}^{K}p_k\\,l_k\\quad\\text{bits a symbol}'},
    {t:'small', html:'$l_k$ is the length of the codeword for symbol $k$. $\\bar{L}$ is what the code actually costs, averaged over a long message.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'The source-coding theorem', html:'For any uniquely decodable binary code, $\\bar{L}\\ge H(S)$. Thus, entropy is a lower bound on the average number of bits per symbol. A one-symbol code does not always reach this bound. Codes for longer blocks can approach it.'},
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
{ id:'m6-prefix', module:'M6', nav:'Prefix codes', title:'Prefix codes',
  objective:'Define uniquely decodable and prefix codes and separate the two.',
  keywords:'uniquely decodable prefix code instantaneous tree decoding ambiguity',
  src:'CH10 s.12–14', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'Prefix codes'},
  {t:'lede', text:'Codes that can be read back.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Short codewords are worth nothing if the receiver cannot tell where one ends and the next begins. Two conditions matter, and they are not the same condition.</p>'},
    {t:'wex', rows:[
      ['Uniquely decodable','Every string of bits the code can produce comes from exactly one string of symbols. Without this the code is unusable.'],
      ['Prefix code','No codeword begins any other. Stronger, and it buys something: the decoder can name a symbol the moment its last bit arrives. Also called <b>instantaneous</b>.']
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
      {t:'small', html:'<b>Code I</b> is not a prefix code, since $0$ begins $00$. It is not uniquely decodable either: the string $00$ is both $s_3$ and $s_1s_1$. <b>Code II</b> is a prefix code. <b>Code III</b> is not a prefix code, since $0$ begins all three of the others.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'warn', head:'Code III', html:'Code III is uniquely decodable because each codeword starts with $0$ and then contains only $1$s. However, it is not instantaneous. After $011$, the decoder must wait for the next bit to distinguish $s_3$ from the start of $s_4$.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figTree(['0','10','110','111'],['s_1','s_2','s_3','s_4'],{w:430,h:130}),
      caption:'<b>Code II drawn as a tree.</b> Every symbol sits at a leaf, so no path to one passes through another. That is what the prefix property looks like.'},
    {t:'fig', frame:true, svg:()=>figTree(['0','01','011','0111'],['s_1','s_2','s_3','s_4'],{w:430,h:130}),
      caption:'<b>Code III drawn as a tree.</b> Every symbol sits on one path, each one hanging off the node before it. Nothing is at a leaf except the last, and that is exactly why the decoder has to wait.'}
  ]}
]},

/* ---------------------------------------------------------------- 6.6 ---- */
{ id:'m6-kraft', module:'M6', nav:'The Kraft inequality', title:'The Kraft inequality',
  objective:'State the Kraft inequality and show it is necessary but not sufficient.',
  keywords:'kraft inequality codeword lengths necessary sufficient prefix budget',
  src:'CH10 s.15–16', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'The Kraft inequality'},
  {t:'lede', text:'Which sets of lengths are possible.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Before choosing any codewords, ask whether the <em>lengths</em> can work at all. Short codewords use up the tree quickly, and there is only so much tree.</p>'},
    {t:'eq', key:true, label:'Kraft', tex:'\\sum_{k=1}^{K}2^{-l_k}\\le 1'},
    {t:'note', kind:'def', head:'Tree budget', html:'Treat the complete binary tree as one unit. A codeword of length $l$ uses a fraction $2^{-l}$ of the tree. The fractions cannot sum to more than one. Lengths $1$ and $4$ use one half and one sixteenth.'},
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
      {t:'small', html:'The inequality can reject an invalid length set. It cannot prove that a given code is a prefix code. Inspect the codewords or draw the tree to establish that property.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figTree(['0','10','110','1110'],['s_1','s_2','s_3','s_4'],{w:430,h:135}),
      caption:'A prefix code with Code III\'s lengths $1,2,3,4$, which the Kraft inequality promised must exist. Every symbol is at a leaf, and one branch is left unused — the $0.0625$ of the budget that was never spent.'},
    {t:'small', html:'A Kraft sum of one uses the complete tree. Such a code is <b>complete</b>. No codeword can be shortened without breaking the prefix property. A sum below one leaves unused tree capacity.'}
  ]}
]},

/* ---------------------------------------------------------------- 6.7 ---- */
{ id:'m6-bound', module:'M6', nav:'How close to the entropy', title:'Source-coding bound',
  objective:'State H ≤ L̄ < H+1 and show blocking closes the gap.',
  keywords:'bound entropy plus one dyadic extension converges rounding block coding',
  src:'CH10 s.17–18', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'Source-coding bound'},
  {t:'lede', text:'The bound, and how to beat the rounding.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>The source-coding theorem says no code beats $H(S)$. The complementary result says a prefix code always gets within one bit of it.</p>'},
    {t:'eq', key:true, label:'the two-sided bound', tex:'H(S)\\le\\bar{L}< H(S)+1'},
    {t:'note', kind:'def', head:'Rounding cost', html:'The ideal length $-\\log_2 p_k$ is usually not an integer. A codeword must contain an integer number of bits. The choice $l_k=\\lceil-\\log_2 p_k\\rceil$ adds less than one bit. Averaging gives the $+1$ bound.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Dyadic probabilities', html:'If each probability has the form $p_k=2^{-l_k}$, the distribution is <b>dyadic</b>. No length requires rounding. Then $\\bar{L}$ and $H(S)$ equal the same sum, so $\\bar{L}=H(S)$.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'body', html:'<p>When the probabilities are not dyadic, code blocks instead of symbols. Apply the bound to the $n$-th extension, where the entropy is $nH(S)$:</p>'},
      {t:'eq', tex:'nH(S)\\le L_n< nH(S)+1\\quad\\Longrightarrow\\quad H(S)\\le\\frac{L_n}{n}< H(S)+\\frac{1}{n}'},
      {t:'eq', key:true, tex:'\\lim_{n\\to\\infty}\\frac{L_n}{n}=H(S)'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'small', html:'A block of $n$ symbols spreads one extra bit over the block. The cost is at most $1/n$ bits per symbol. For $n=10$, the cost is at most $0.1$ bit per symbol.'}
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
      caption:'Bounds on $L_n/n$ for the source probabilities $0.7,0.2,0.1$. For $n=1$, the upper gap is one bit. For $n=10$, it is $0.1$ bit. The entropy lower bound is constant.'},
    {t:'small', html:'<b>What it costs:</b> the $n$-th extension has $K^n$ symbols, so a block of ten from a three-symbol source needs a codebook of $59\\,049$ entries. The bound improves as $1/n$ and the work grows as $K^n$, which is why real compressors do something cleverer than this.'}
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
        ['Merging','First merge $0.1+0.1=0.2$. Then merge $0.2+0.2=0.4$, $0.2+0.4=0.6$, and $0.4+0.6=1$.'],
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
      {t:'note', kind:'ok', head:'Coding gap', html:'The code uses $3.68\\%$ more bits than the entropy. No other single-symbol prefix code has a smaller average length. Block coding can reduce the remaining gap to at most $1/n$ bits per symbol.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figTree(['00','10','11','010','011'],HLAB,{w:470,h:150}),
      caption:'Huffman code tree. The two most likely symbols have length two. The two least likely symbols have length three. Every symbol is a leaf, so the code is a prefix code.'},
    {t:'fig', frame:true, svg:()=>figBars(HUFF, HLAB),
      caption:'Entropy and code length for each symbol. The dashed line is $H(S)=2.1219$. The average code length is $2.2$ bits per symbol.'}
  ]}
]},

/* ---------------------------------------------------------------- 6.9 ---- */
{ id:'m6-huffman-var', module:'M6', nav:'Ties and variance', title:'Ties and variance',
  objective:'Show Huffman is not unique and that variance separates the choices.',
  keywords:'huffman not unique ties variance codeword length minimum variance buffer',
  src:'CH10 s.21–22', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'Ties and variance'},
  {t:'lede', text:'The same length, a different code.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Two Huffman choices are arbitrary. Either symbol in a merged pair can receive $0$. A merged symbol can also occupy either position during a probability tie. These choices give different codes with the same average length.</p>'},
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
      {t:'note', kind:'ok', head:'Minimum length variance', html:'Variable codeword lengths cause a buffer to fill and empty at changing rates. Smaller length variance reduces these changes. During a probability tie, place the merged symbol as high as possible. This rule gives the minimum-variance Huffman code.'}
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
  {t:'body', html:'Set the probabilities, then step through the merges one at a time. The tree, the codewords, the average length, the efficiency and the variance are all recomputed as the algorithm runs. The tie-breaking rule can be switched to see the two codes of the last scene appear.'},
  {t:'lab', id:'J'}
]},

/* ---------------------------------------------------------------- 6.5 ----
   From here to the end of the module the material is the lecturer's own and
   has no slide behind it, so `src` names the teaching week rather than a slide
   number. The scheme changes because the source does, not because the record
   was relaxed. */
{ id:'m6-lz', module:'M6', nav:'Lempel–Ziv coding', title:'Lempel–Ziv coding',
  objective:'Show how a code reaches the entropy without being told the probabilities.',
  keywords:'lempel ziv universal coding parsing dictionary pointer innovation compression zip',
  src:'CH10 w.12', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Universal coding'},
  {t:'title', text:'Lempel–Ziv coding'},
  {t:'lede', text:'A code that learns the source.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Huffman coding needs the probabilities <em>before</em> it can build the tree. For a file arriving over a wire nobody knows them in advance, and measuring them means reading everything twice.</p>'},
    {t:'note', kind:'def', head:'Lempel–Ziv parsing', html:'Read the stream once. Store the <b>shortest bit sequence that has not appeared before</b>. Its prefix is already in the dictionary. Encode the new sequence as a <b>pointer</b> to that prefix plus one new <b>innovation</b> bit. The decoder builds the same dictionary.'},
    {t:'reveal', at:1, items:[
      {t:'wex', head:'Parsing a stream', rows:[
        ['Stream','$0\\;1\\;00\\;011\\;1\\ldots$, parsed left to right into pieces not seen before.'],
        ['Positions','$0$ and $1$ are held from the start, at positions $1$ and $2$. Then $00$ takes position $3$, $011$ position $4$, and so on.'],
        ['Sending $00$','Its first bit is the entry at position $1$, and its new bit is $0$. Send the position in binary, then the bit: $001\\,0$.'],
        ['Sending $011$','Its start $01$ is at position $4$ and its new bit is $1$, so the block is $100\\,1$.']
      ]},
      {t:'small', html:'With a fixed block of four bits, seven pieces cost $28$ bits where the raw stream was $18$. The method <em>loses</em> on a short stream: the dictionary has to be paid for before it can pay back.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'small', html:'For the block $1101$, the last bit is the innovation $1$. The first three bits, $110$, give pointer $6$. The decoder appends $1$ to dictionary entry $6$. Both sides already have the same dictionary.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const st = APP.state.step || 0;
      const pieces = ['0','1','00','011'].slice(0, st>=2 ? 4 : st>=1 ? 3 : 2);
      const hot = st===1 ? '00' : st===2 ? '011' : null;
      return figTree(pieces, ['1','2','3','4'].slice(0, pieces.length), {w:440,h:170,hot});
    }, caption:'Dictionary tree during parsing. Each new entry extends an existing entry by one bit. Therefore, one pointer and one innovation bit identify the new entry.'},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Universal coding', html:'Longer streams produce longer dictionary entries, so each fixed-size code block represents more source bits. A <b>universal</b> code approaches the entropy without prior source probabilities. Huffman coding is optimal for known single-symbol probabilities. Lempel–Ziv is universal for long streams.'}
    ]}
  ]}
]},

/* ---------------------------------------------------------------- 6.6 ---- */
{ id:'m6-dmc', module:'M6', nav:'The discrete channel', title:'The discrete memoryless channel',
  objective:'Define the discrete memoryless channel and its matrix.',
  keywords:'discrete memoryless channel transition probabilities channel matrix joint marginal',
  src:'CH10 w.13', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · The discrete memoryless channel'},
  {t:'title', text:'The discrete memoryless channel'},
  {t:'lede', text:'The module so far has been about the source alone. The rest is about what a channel does to it. The first job is to say what a channel <em>is</em>, in a form that can be calculated with.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>A <b>discrete memoryless channel</b> takes one symbol from a finite input alphabet and produces one from a finite output alphabet. It is described by one number for each pair:</p>'},
    {t:'eq', key:true, label:'transition probability', tex:'p(y_k\\mid x_j)=P\\bigl(Y=y_k\\mid X=x_j\\bigr)'},
    {t:'note', kind:'def', head:'Discrete and memoryless', html:'<b>Discrete</b> means that both alphabets are finite. <b>Memoryless</b> means that the current output depends only on the current input. The transition-probability table then describes the complete channel.'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>Collect the numbers into the <b>channel matrix</b>, one row per input:</p>'},
      {t:'eq', tex:'\\mathbf{P}=\\begin{bmatrix}p(y_0\\mid x_0)&\\cdots&p(y_{K-1}\\mid x_0)\\\\ \\vdots&&\\vdots\\\\ p(y_0\\mid x_{J-1})&\\cdots&p(y_{K-1}\\mid x_{J-1})\\end{bmatrix}'},
      {t:'eq', key:true, tex:'\\sum_{k=0}^{K-1}p(y_k\\mid x_j)=1\\quad\\text{for every }j'},
      {t:'small', html:'Every <em>row</em> sums to one, because something must come out when a symbol goes in. The columns do not, and expecting them to is the usual first mistake.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'The matrix is not enough on its own', html:'It says what the channel does to each symbol. It does not say what comes out, because that depends on how often each symbol is sent. That is the transmitter\'s business, not the channel\'s. The next scene adds it.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figChannel([[0.8,0.2],[0.3,0.7]],['x_0','x_1'],['y_0','y_1'],
      {tex:[['0.8','0.2'],['0.3','0.7']]}),
      caption:'A two-input, two-output channel. Solid lines preserve the symbol, and dashed lines change it. The probabilities from each input sum to one. Probabilities that arrive at one output need not sum to one.'},
    {t:'small', html:'This channel is not symmetric: an $x_0$ survives four times in five, an $x_1$ only seven times in ten. Nothing so far forbids that, and section 6.6.3 takes the symmetric case because it is the one that can be worked through by hand.'}
  ]}
]},

{ id:'m6-inputdist', module:'M6', nav:'What comes out', title:'The input distribution',
  objective:'Combine the channel matrix with an input distribution to get the joint and output distributions.',
  keywords:'input distribution a priori joint pmf marginal output distribution transmitter choice',
  src:'CH10 w.13', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · The discrete memoryless channel'},
  {t:'title', text:'The input distribution'},
  {t:'lede', text:'The transmitter has a say too.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Add one more list of numbers: how often the transmitter sends each input symbol. These are the <b>a priori probabilities</b>, and they are chosen, not given.</p>'},
    {t:'eq', tex:'p(x_j)=P(X=x_j),\\qquad j=0,1,\\ldots,J-1'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>The chance of a particular input arriving as a particular output is then the chance of sending it times the chance of that transition:</p>'},
      {t:'eq', key:true, label:'joint distribution', tex:'p(x_j,y_k)=p(y_k\\mid x_j)\\,p(x_j)'},
      {t:'body', html:'<p>and an output symbol can be reached from any input, so add over all of them:</p>'},
      {t:'eq', key:true, label:'output distribution', tex:'p(y_k)=\\sum_{j=0}^{J-1}p(y_k\\mid x_j)\\,p(x_j)'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'wex', head:'The channel of the last scene, sent $x_0$ three times in four', rows:[
        ['Given','$p(x_0)=0.75$, $p(x_1)=0.25$, with the matrix $\\begin{bmatrix}0.8&0.2\\\\0.3&0.7\\end{bmatrix}$.'],
        ['Joint','$p(x_0,y_0)=0.8(0.75)=0.60$ and $p(x_1,y_0)=0.3(0.25)=0.075$.'],
        ['Output','$p(y_0)=0.60+0.075=0.675$, so $p(y_1)=0.325$.'],
        ['Reading it','The four joint probabilities add to one, which is the arithmetic check worth doing every time.']
      ]}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'Two things, kept apart', html:'The matrix belongs to the <b>channel</b> and the engineer cannot change it. The input distribution belongs to the <b>transmitter</b> and the engineer chooses it. Everything from here to the end of the module is about what the second can buy against a fixed first. That split is the reason capacity, when it arrives, is defined as a maximum.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const q = 0.75, Pyx = [[0.8,0.2],[0.3,0.7]];
      const joint = [[Pyx[0][0]*q, Pyx[0][1]*q],[Pyx[1][0]*(1-q), Pyx[1][1]*(1-q)]];
      const a = P.Axes({w:440,h:250,xr:[0,2.5],yr:[-0.5,2.15],
        pad:{l:16,r:16,t:16,b:16}, xticksOverride:[], yticksOverride:[],
        grid:false, zeroAxes:false, arrows:false});
      /* each joint probability as a block whose width is what it is worth */
      let x = 0;
      joint.forEach((row,j)=>row.forEach((v,k)=>{
        const w = v*2.5;
        a.rect(x, j===k ? 1.0 : 0.1, x+w, j===k ? 1.7 : 0.8,
          {fill: j===k ? C.dec.out : C.dec.err, stroke: j===k ? C.out : C.err});
        a.note(x+w/2, j===k ? 1.35 : 0.45, v.toFixed(3),
          {fs:12, color: j===k ? C.out : C.err, anchor:'middle'});
        x += w;
      }));
      a.note(1.25, 1.95, '\\text{kept}', {tex:true, fs:12, color:C.out, anchor:'middle'});
      a.note(1.25, -0.30, '\\text{changed}', {tex:true, fs:12, color:C.err, anchor:'middle'});
      return a.svg();
    },
      caption:'The four joint probabilities of the worked example, drawn to width. Together they fill the line exactly, because every use of the channel produces exactly one of the four outcomes. The upper pair are the uses that kept the symbol, the lower pair the uses that changed it.'}
  ]}
]},

{ id:'m6-bsc', module:'M6', nav:'The binary symmetric channel', title:'The binary symmetric channel',
  objective:'Work the output distribution of the BSC and name its crossover probability.',
  keywords:'binary symmetric channel crossover probability bsc output distribution matrix',
  src:'CH10 w.13', steps:2, blocks:[
  {t:'eyebrow', text:'Module 6 · The discrete memoryless channel'},
  {t:'title', text:'The binary symmetric channel'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>One channel is used more than all the others put together. It has two inputs, two outputs, and one number: the probability $p$ that a bit is flipped, called the <b>crossover probability</b>.</p>'},
    {t:'eq', key:true, label:'the BSC matrix', tex:'\\mathbf{P}=\\begin{bmatrix}1-p&p\\\\ p&1-p\\end{bmatrix}'},
    {t:'note', kind:'def', head:'Receiver model', html:'An antipodal binary receiver in white Gaussian noise has crossover probability $p=Q\\!\\left(\\sqrt{2E_b/N_0}\\right)$. This probability is equal for transmitted symbols $0$ and $1$. Therefore, the receiver forms a binary symmetric channel.'},
    {t:'reveal', at:1, items:[
      {t:'wex', head:'Output probabilities for equal inputs', rows:[
        ['Given','$p(x_0)=p(x_1)=\\tfrac12$.'],
        ['Output','$p(y_0)=(1-p)\\tfrac12+p\\tfrac12=\\tfrac12$, and $p(y_1)=\\tfrac12$ likewise.'],
        ['Reading it','The output is equally likely whatever $p$ is — even at $p=\\tfrac12$, where the channel is destroying everything. A balanced output is no evidence that anything survived.']
      ]}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'The value that looks harmless and is not', html:'At $p=\\tfrac12$ the output is independent of the input: the receiver may as well toss a coin. At $p=1$ every bit is flipped, which sounds worse and is not — invert the output and the channel is perfect. The channel is at its worst in the middle, not at the end, and the next scenes measure exactly that.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figChannel(BSC(0.15),['x_0','x_1'],['y_0','y_1'],
      {tex:[['1-p','p'],['p','1-p']]}),
      caption:'The binary symmetric channel. One number describes it, and the two ways of being wrong are equally likely — which is what "symmetric" names.'},
    {t:'small', html:'<b>It joins this course to the last four modules.</b> Modules 2 to 5 computed $P_e$ for one scheme after another. Every one of those numbers is a crossover probability, so every one of those systems can be handed to this chapter as a channel matrix.'}
  ]}
]},

/* ---------------------------------------------------------------- 6.7 ---- */
{ id:'m6-condent', module:'M6', nav:'Conditional entropy', title:'Conditional entropy',
  objective:'Define conditional entropy as the uncertainty remaining after the output is seen.',
  keywords:'conditional entropy uncertainty remaining channel output equivocation average',
  src:'CH10 w.13', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Mutual information'},
  {t:'title', text:'Conditional entropy'},
  {t:'lede', text:'What is left in doubt.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Before anything arrives, the receiver\'s uncertainty about the input is $H(X)$. Then one output symbol arrives. It rarely settles the question, but it changes the odds. The uncertainty that remains is an entropy like any other — computed from the probabilities that now apply:</p>'},
    {t:'eq', tex:'H(X\\mid Y=y_k)=-\\sum_{j=0}^{J-1}p(x_j\\mid y_k)\\log_2 p(x_j\\mid y_k)'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>That is one number for each output symbol, and which one applies is itself uncertain. Average over the outputs:</p>'},
      {t:'eq', key:true, label:'conditional entropy', tex:'H(X\\mid Y)=\\sum_{k=0}^{K-1}H(X\\mid Y=y_k)\\,p(y_k)=-\\sum_{k}\\sum_{j}p(x_j,y_k)\\log_2 p(x_j\\mid y_k)'},
      {t:'small', html:'Read it in words: <b>the uncertainty still remaining about what was sent, after what arrived has been looked at.</b>'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'The two extremes fix the meaning', html:'On a perfect channel the output names the input, so nothing is left in doubt and $H(X\\mid Y)=0$. On a useless channel the output says nothing, the conditional probabilities are the original ones, and $H(X\\mid Y)=H(X)$ — the arrival changed nothing. Every real channel sits between the two.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'warn', head:'Not the same as $H(Y\\mid X)$', html:'$H(Y\\mid X)$ is the uncertainty about the <em>output</em> given the input, and it is a property of the channel alone. For the BSC it is $H(p)$, whatever the transmitter does. $H(X\\mid Y)$ is the uncertainty about the <em>input</em> given the output, and it depends on the input distribution too. The two are equal only when the alphabets are balanced, and swapping them is the mistake this section is built to prevent.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figHb(0.1),
      caption:'For the binary symmetric channel, $H(Y\\mid X)=H(p)$: the uncertainty the channel itself adds. At $p=0.1$ it is $0.469$ bits, marked here. It is zero at both ends and worst in the middle, exactly as the last scene warned.'},
    {t:'small', html:'The curve is the binary entropy function again, met in section 6.2 as the entropy of a two-symbol source. It is the same function doing a second job: there it measured a source, here it measures the noise a channel adds.'}
  ]}
]},

{ id:'m6-mutual', module:'M6', nav:'Mutual information', title:'Mutual information',
  objective:'Define mutual information as the uncertainty the output removes.',
  keywords:'mutual information definition uncertainty resolved channel bits per use',
  src:'CH10 w.13', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Mutual information'},
  {t:'title', text:'Mutual information'},
  {t:'lede', text:'What actually got through.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Two numbers are now in hand: the uncertainty before, and the uncertainty after. The information the channel delivered is the difference — what the observation removed.</p>'},
    {t:'eq', key:true, label:'mutual information', tex:'I(X;Y)=H(X)-H(X\\mid Y)'},
    {t:'note', kind:'def', head:'Say it in words before using it', html:'$H(X)$ is how much was in doubt. $H(X\\mid Y)$ is how much is still in doubt. Their difference is <b>how much doubt the arrival removed</b>, in bits, per use of the channel. It is not a property of the channel by itself: change what the transmitter sends and the number changes.'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>The same quantity can be read from the other end, and the two readings are equal:</p>'},
      {t:'eq', key:true, tex:'I(X;Y)=H(Y)-H(Y\\mid X)=I(Y;X)'},
      {t:'small', html:'The second form is often easier to use. The channel matrix gives $H(Y\\mid X)$ directly, while $H(X\\mid Y)$ first requires Bayes\' rule.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'wex', head:'The BSC at $p=0.1$ with equally likely inputs', rows:[
        ['$H(X)$','$1$ bit — the transmitter sends a fair bit.'],
        ['$H(Y\\mid X)$','$H(0.1)=0.469$ bits, obtained directly from the channel matrix.'],
        ['$H(Y)$','$1$ bit, from the last scene\'s output distribution.'],
        ['$I(X;Y)$','$1-0.469=0.531$ bits per use of the channel.']
      ]}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'Interpretation', html:'The input entropy is one bit. The output resolves $0.531$ bits on average. The conditional entropy $0.469$ bits remains after the output is observed. Additional information is required to remove this uncertainty.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const r = chan(BSC(0.1), [0.5,0.5]);
      return figInfoBar(r.HX + r.HYX, r.HX - r.I, r.I, r.HYX);
    },
      caption:'Information diagram for a BSC with $p=0.1$. The full width is $H(X,Y)=1.469$ bits. The overlap is $I(X;Y)$. The two outer parts are the conditional entropies.'}
  ]}
]},

{ id:'m6-mutual-props', module:'M6', nav:'Its three properties', title:'Properties of mutual information',
  objective:'Give the properties of mutual information and the joint-entropy relation.',
  keywords:'mutual information properties symmetry non-negative joint entropy bayes rule',
  src:'CH10 w.13', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Mutual information'},
  {t:'title', text:'Properties of mutual information'},
  {t:'lede', text:'Symmetric, never negative, and joint.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Written as one sum over both alphabets, mutual information is</p>'},
    {t:'eq', tex:'I(X;Y)=\\sum_{j}\\sum_{k}p(x_j,y_k)\\log_2\\frac{p(x_j\\mid y_k)}{p(x_j)}'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'1 · It is symmetric', html:'Bayes\' rule says $p(x_j\\mid y_k)\\,p(y_k)=p(y_k\\mid x_j)\\,p(x_j)$, so $\\dfrac{p(x_j\\mid y_k)}{p(x_j)}=\\dfrac{p(y_k\\mid x_j)}{p(y_k)}$. Putting the right-hand form into the sum turns it into the expression for $I(Y;X)$ — the same number. <b>What the output tells you about the input equals what the input tells you about the output.</b> It is not obvious, and it is why the quantity is called <em>mutual</em>.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'2 · It is never negative', html:'$I(X;Y)\\ge0$, with equality exactly when $X$ and $Y$ are independent. In words: an observation can never leave you knowing <em>less</em> than before. A channel can deliver nothing, and the useless channel does, but no channel delivers a negative amount.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'body', html:'<p>The third property ties the pieces together. The <b>joint entropy</b> is the uncertainty about the pair:</p>'},
      {t:'eq', key:true, label:'joint entropy', tex:'H(X,Y)=H(X)+H(Y)-I(X;Y)'},
      {t:'small', html:'Adding $H(X)$ and $H(Y)$ counts the shared part twice, so it is subtracted once. That is the whole content of the formula, and the bar figure is the picture of it.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const r = chan(BSC(0.25), [0.5,0.5]);
      return figInfoBar(r.HX + r.HYX, r.HX - r.I, r.I, r.HYX);
    },
      caption:'The same diagram for $p=0.25$. The shared information decreases to $0.189$ bits. The conditional entropies and joint entropy increase.'},
    {t:'small', html:'Mutual information is symmetric: $I(X;Y)=I(Y;X)$. Conditional entropy is not generally symmetric, so $H(X\\mid Y)$ and $H(Y\\mid X)$ can differ.'}
  ]}
]},

/* ---------------------------------------------------------------- 6.8 ---- */
{ id:'m6-capacity', module:'M6', nav:'Channel capacity', title:'Channel capacity',
  objective:'Define capacity as the maximum of mutual information over input distributions.',
  keywords:'channel capacity definition maximum mutual information input distribution bits per use',
  src:'CH10 w.13', steps:2, blocks:[
  {t:'eyebrow', text:'Module 6 · Channel capacity'},
  {t:'title', text:'Channel capacity'},
  {t:'lede', text:'The best the channel can do.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Mutual information depends on the channel and the input distribution. The channel is fixed, but the transmitter can change its symbol probabilities. Capacity uses the input distribution that gives the largest mutual information:</p>'},
    {t:'eq', key:true, label:'channel capacity', tex:'C=\\max_{\\{p(x_j)\\}}I(X;Y)\\quad\\text{bits per channel use}'},
    {t:'note', kind:'def', head:'Capacity maximization', html:'Maximize over all nonnegative input probabilities that sum to one. After this maximization, the result depends only on the channel matrix. Thus, <b>capacity is a channel property</b>, while mutual information also depends on the transmitter.'},
    {t:'reveal', at:1, items:[
      {t:'small', html:'A poor input distribution can waste channel capability. For example, one frequent symbol can leave most of the input alphabet unused. Capacity measures the best input distribution.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'"Per channel use", and what that costs', html:'The unit is bits per use of the channel, not bits per second. To reach bits per second, multiply by how many times a second the channel is used. Reporting a capacity without saying which unit it is in is the most common way of being out by a factor nobody notices.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a = P.Axes({w:470,h:290,xr:[0,1],yr:[0,0.62],
        xlabel:'p(x_0)', ylabel:'I(X;Y)\\;\\text{bits}',
        pad:{l:60,r:24,t:24,b:46}, xtarget:5, ytarget:5});
      a.curve(q => chan(BSC(0.1), [q,1-q]).I, {color:C.in, width:2.2});
      a.curve(q => chan(ZCH,      [q,1-q]).I, {color:C.h,  width:2.2});
      const bz = capBinary(ZCH);
      a.point(0.5, chan(BSC(0.1),[0.5,0.5]).I, {color:C.err, r:4.5});
      a.point(bz.q, bz.I, {color:C.err, r:4.5});
      a.note(0.5, 0.575, '\\text{BSC},\\;p=0.1', {tex:true, fs:12, color:C.in, anchor:'middle'});
      a.note(0.22, 0.10, '\\text{Z-channel}', {tex:true, fs:12, color:C.h});
      return a.svg();
    },
      caption:'Mutual information against the input probability for two channels. Each peak gives the channel capacity. The symmetric channel peaks at $p(x_0)=\\tfrac12$. The Z-channel peak occurs at a different probability.'}
  ]}
]},

{ id:'m6-bsc-cap', module:'M6', nav:'Capacity of the BSC', title:'Capacity of the binary symmetric channel',
  objective:'Derive C = 1 - H(p) and read off its two extremes.',
  keywords:'bsc capacity one minus binary entropy useless channel crossover derivation',
  src:'CH10 w.13', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Channel capacity'},
  {t:'title', text:'Capacity of the binary symmetric channel'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Take $I(X;Y)=H(Y)-H(Y\\mid X)$ and work on the two pieces separately.</p>'},
    {t:'body', html:'<p>The second term does not depend on the input probabilities. For either input symbol, the conditional output distribution is $(1-p,\\,p)$ in some order. Therefore,</p>'},
    {t:'eq', tex:'H(Y\\mid X)=H(p)=-p\\log_2 p-(1-p)\\log_2(1-p)'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>The first piece is an entropy of a two-symbol distribution, so $H(Y)\\le1$ bit, with equality when the output is equally likely. Section 6.6.2 showed that equally likely <em>inputs</em> give exactly that. So the maximum is reached at $p(x_0)=\\tfrac12$ and</p>'},
      {t:'eq', key:true, label:'capacity of the BSC', tex:'C=1-H(p)\\quad\\text{bits per channel use}'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'wex', head:'Reading the answer', rows:[
        ['$p=0$ or $p=1$','$H(p)=0$, so $C=1$: one bit per use. At $p=1$, every bit is flipped. The receiver recovers the input by inverting each output bit.'],
        ['$p=\\tfrac12$','$H(p)=1$, so $C=0$. Nothing whatever can be sent. This is the <b>useless channel</b>.'],
        ['$p=0.1$','$H(0.1)=0.469$, so $C=0.531$ bits per use — the number the last section computed, now known to be the best available.'],
        ['$p=0.11$','$C=0.500$: a crossover of about one bit in nine already halves the channel.']
      ]}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'warn', head:'Capacity curve', html:'The curve is flat near $p=0$. A crossover probability of $0.001$ gives capacity $0.9886$. Capacity then decreases rapidly and reaches zero at $p=0.5$. Improving an already small crossover probability gives little capacity gain.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a = P.Axes({w:470,h:300,xr:[0,1],yr:[0,1.12],
        xlabel:'p', ylabel:'C\\;\\text{bits per use}',
        pad:{l:62,r:24,t:24,b:46}, xtarget:5, ytarget:5});
      a.curve(p => 1-hb(p), {color:C.in, width:2.3});
      a.point(0.5, 0, {color:C.err, r:4.5});
      a.point(0.1, 1-hb(0.1), {color:C.out, r:4.5});
      a.note(0.5, 0.10, '\\text{useless at}\\;p=\\tfrac12', {tex:true, fs:12, color:C.err, anchor:'middle'});
      a.note(0.13, 0.60, 'C=0.531', {tex:true, fs:12, color:C.out});
      return a.svg();
    },
      caption:'The capacity of the binary symmetric channel against its crossover probability. Symmetric about $p=\\tfrac12$, where it touches zero, and worth a full bit at both ends.'}
  ]}
]},

/* ---------------------------------------------------------------- 6.L3 --- */
{ id:'m6-lab-k', module:'M6', nav:'Laboratory K', title:'Laboratory K · Channel capacity',
  objective:'Watch the mutual information move with the input distribution and find its maximum.',
  keywords:'laboratory channel capacity mutual information input distribution crossover z-channel',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 6 · Channel capacity'},
  {t:'title', text:'Laboratory K · Channel capacity'},
  {t:'body', html:'Choose a channel, set how noisy it is, and then move the input distribution by hand. The channel matrix, the three entropies and the mutual information are recomputed from the definitions each time. The capacity is found by searching the input distribution, so the peak on the curve and the number in the readout cannot disagree.'},
  {t:'lab', id:'K'}
]},

{ id:'m6-ex-zchannel', module:'M6', nav:'Worked example: the Z-channel', title:'Worked example: the Z-channel',
  objective:'Find the capacity of the Z-channel and the input distribution that achieves it.',
  keywords:'z channel capacity worked example asymmetric optimum input distribution derivative',
  src:'CH10 w.13', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Channel capacity'},
  {t:'title', text:'Worked example: the Z-channel'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>A $0$ always arrives as a $0$. A $1$ arrives correctly half the time and as a $0$ the other half. Nothing is symmetric here, so the equally likely input is no longer the right guess — it has to be found.</p>'},
    {t:'wex', head:'Setting it up', rows:[
      ['Given','$\\mathbf{P}=\\begin{bmatrix}1&0\\\\ \\tfrac12&\\tfrac12\\end{bmatrix}$, with $P(X=0)=q$ and $P(X=1)=1-q$.'],
      ['Output','$P(Y=0)=q+\\tfrac12(1-q)=\\tfrac12(1+q)$, so $P(Y=1)=\\tfrac12(1-q)$.'],
      ['Channel term','$H(Y\\mid X)=q\\,H(1,0)+(1-q)H(\\tfrac12,\\tfrac12)=1-q$, since a transmitted $0$ leaves nothing in doubt.']
    ]},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>Subtracting the two gives the mutual information as a function of the one free number:</p>'},
      {t:'eq', key:true, tex:'I(X;Y)=q-\\tfrac12(1+q)\\log_2(1+q)-\\tfrac12(1-q)\\log_2(1-q)'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'body', html:'<p>Set the derivative to zero. The two logarithmic terms collapse and what is left is</p>'},
      {t:'eq', tex:'\\tfrac12\\log_2\\frac{1-q}{1+q}=-1\\quad\\Longrightarrow\\quad\\frac{1-q}{1+q}=\\frac14\\quad\\Longrightarrow\\quad q^{*}=0.6'},
      {t:'eq', key:true, tex:'C=I(X;Y)\\big|_{q=0.6}=0.3219\\ \\text{bits per channel use}'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'Two things worth keeping', html:'<b>The optimum is not the balanced input.</b> The transmitter should send the reliable symbol $0$ three times in five, because the unreliable one earns less. <b>And the answer is exact:</b> $0.3219=\\log_2\\tfrac54$, which is a check on the arithmetic that costs nothing.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figChannel(ZCH,['0','1'],['0','1'],
      {w:400, h:160, tex:[['1',''],['\\tfrac12','\\tfrac12']]}),
      caption:'The Z-channel is named for the shape of its possible transitions. Its asymmetry comes from the missing arrow: a $0$ can never be received as a $1$.'},
    {t:'fig', frame:true, svg:()=>{
      const a = P.Axes({w:440,h:196,xr:[0,1],yr:[0,0.40],
        xlabel:'q=P(X=0)', ylabel:'I(X;Y)\\;\\text{bits}',
        pad:{l:62,r:24,t:22,b:46}, xtarget:5, ytarget:4});
      a.curve(q => chan(ZCH,[q,1-q]).I, {color:C.h, width:2.3});
      a.vline(0.6, {color:C.err, dash:'4 3'});
      a.point(0.6, chan(ZCH,[0.6,0.4]).I, {color:C.err, r:4.5});
      a.note(0.62, 0.345, 'q^{*}=0.6', {tex:true, fs:12, color:C.err});
      return a.svg();
    },
      caption:'Mutual information against the input probability. The maximum occurs at $0.6$, not at $0.5$. At $0.5$, the mutual information is $0.3113$ bits. This value is about three percent below capacity.'}
  ]}
]},

{ id:'m6-coding-thm', module:'M6', nav:'The channel coding theorem', title:'The channel coding theorem',
  objective:'State the channel coding theorem and say what it does and does not offer.',
  keywords:'channel coding theorem transmission rate reliable communication converse shannon',
  src:'CH10 w.14', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · Channel capacity'},
  {t:'title', text:'The channel coding theorem'},
  {t:'lede', text:'What capacity promises.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Capacity was defined as a maximum of a quantity measured in bits. It would be a curiosity if that were all. The theorem that makes it matter says the number is an <em>operational</em> limit. It is exactly the rate at which the channel can be used reliably.</p>'},
    {t:'note', kind:'def', head:'The channel coding theorem', html:'If the transmission rate satisfies $R_b<C$, there is a coding scheme whose probability of error is as small as required. If $R_b>C$, there is not — no coding scheme, however long or however clever, keeps the error probability down.'},
    {t:'reveal', at:1, items:[
      {t:'eq', key:true, label:'the condition', tex:'R_b<C'},
      {t:'small', html:'No coding method can provide a reliable data rate above capacity. This limit applies to every possible channel code.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Theorem limit', html:'The theorem proves that a suitable code exists. It does not specify the code, block length, or decoding cost. Practical codes must approach capacity while keeping encoding and decoding feasible.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'small', html:'The source-coding theorem requires at least $H(S)$ bits per source symbol. The channel-coding theorem permits reliable transmission below $C$. A system is possible when the compressed source rate is less than the channel capacity.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a = P.Axes({w:470,h:290,xr:[0,1],yr:[0,1.12],
        xlabel:'p', ylabel:'\\text{bits per use}',
        pad:{l:62,r:24,t:24,b:46}, xtarget:5, ytarget:5});
      a.area(p => 1-hb(p), 0, 1, {fill:C.dec.out});
      a.curve(p => 1-hb(p), {color:C.out, width:2.3});
      a.hline(0.5, {color:C.in, dash:'5 3'});
      a.note(0.5, 0.30, '\\text{reliable}', {tex:true, fs:13, color:C.out, anchor:'middle'});
      a.note(0.5, 0.86, '\\text{impossible}', {tex:true, fs:13, color:C.err, anchor:'middle'});
      a.note(0.63, 0.57, 'R_b=0.5', {tex:true, fs:12, color:C.in});
      return a.svg();
    },
      caption:'The capacity curve separates possible and impossible rates. At $R_b=0.5$, reliable transmission requires a crossover probability below approximately $0.11$. No code can give reliable transmission above this boundary.'}
  ]}
]},

/* ---------------------------------------------------------------- 6.9 ---- */
{ id:'m6-shannon', module:'M6', nav:'The bandlimited channel', title:'The capacity of the bandlimited channel',
  objective:'State the information capacity law and read the trade it describes.',
  keywords:'information capacity law shannon hartley bandwidth signal to noise continuous channel',
  src:'CH10 w.14', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · The bandlimited channel'},
  {t:'title', text:'The capacity of the bandlimited channel'},
  {t:'lede', text:'Bandwidth, power, and the rate they buy.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Everything so far counted symbols. A real channel is not given as a matrix. It is given as a bandwidth in hertz, a transmitted power in watts, and a noise density. The capacity of that channel is one of the most quoted results in engineering.</p>'},
    {t:'eq', key:true, label:'information capacity law', tex:'C=B\\log_2\\!\\left(1+\\frac{P}{N_0B}\\right)\\quad\\text{bits per second}'},
    {t:'note', kind:'def', head:'Channel parameters', html:'$B$ is the bandwidth in hertz. $P$ is the average transmitted power. The two-sided noise density is $N_0/2$, so the in-band noise power is $N_0B$. The received signal-to-noise ratio is $P/(N_0B)$.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Read the two knobs', html:'$C$ grows <b>linearly</b> with bandwidth and only <b>logarithmically</b> with power. Doubling the bandwidth at fixed noise density roughly doubles the rate. Doubling the power adds one bit per second per hertz at best, and much less when the ratio is already large. Bandwidth is the better buy, and it is the one that is regulated and scarce.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'body', html:'<p>Write $P=E_bC$ — the power is the energy per bit times the bits per second — and divide by $B$:</p>'},
      {t:'eq', key:true, tex:'\\frac{C}{B}=\\log_2\\!\\left(1+\\frac{E_b}{N_0}\\frac{C}{B}\\right)\\quad\\Longrightarrow\\quad\\frac{E_b}{N_0}=\\frac{2^{C/B}-1}{C/B}'},
      {t:'small', html:'The left-hand quantity $C/B$ is the <b>bandwidth efficiency</b>, in bits per second per hertz. The relation says what energy per bit each efficiency costs, and it is the curve every modulation scheme is plotted against.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'wex', head:'Two points on that curve', rows:[
        ['$C/B=1$','$E_b/N_0=(2-1)/1=1$, which is $0$ dB. One bit per second per hertz needs unit energy per bit.'],
        ['$C/B=2$','$E_b/N_0=(4-1)/2=1.5$, which is $1.76$ dB. The second bit per hertz costs less than $2$ dB — and the tenth costs far more.']
      ]}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a = P.Axes({w:470,h:300,xr:[0,20],yr:[0,6.4],
        xlabel:'E_b/N_0\\;(\\mathrm{dB})', ylabel:'C/B\\;(\\mathrm{bit/s/Hz})',
        pad:{l:66,r:24,t:24,b:46}, xtarget:5, ytarget:6});
      /* the curve is drawn from the relation in the other direction: for each
         efficiency the required ratio is closed-form, so no solver is needed */
      const pts = [];
      for(let e=0.02;e<=6.4;e+=0.02){
        const db = 10*Math.log10((Math.pow(2,e)-1)/e);
        if(db >= 0 && db <= 20) pts.push([db, e]);
      }
      a.poly(pts, {color:C.in, width:2.3});
      a.point(0, 1, {color:C.out, r:4.5});
      a.point(10*Math.log10(1.5), 2, {color:C.out, r:4.5});
      a.note(1.1, 0.72, '0\\ \\mathrm{dB},\\;1\\ \\mathrm{bit/s/Hz}', {tex:true, fs:11, color:C.out});
      return a.svg();
    },
      caption:'Required energy per bit against bandwidth efficiency. Reliable systems must lie below the capacity boundary. Increasing efficiency from one to six bits per second per hertz costs approximately $14$ dB.'}
  ]}
]},

{ id:'m6-limit', module:'M6', nav:'The Shannon limit', title:'The Shannon limit',
  objective:'Derive the -1.6 dB limit and say what it does and does not forbid.',
  keywords:'shannon limit minus 1.6 dB infinite bandwidth energy per bit floor natural logarithm',
  src:'CH10 w.14', steps:3, blocks:[
  {t:'eyebrow', text:'Module 6 · The bandlimited channel'},
  {t:'title', text:'The Shannon limit'},
  {t:'lede', text:'The floor beneath every system.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>The last relation says the energy per bit a system needs falls as its bandwidth efficiency falls. Spend bandwidth freely and the cost per bit drops. The question is whether it drops to nothing.</p>'},
    {t:'body', html:'<p>Let $C/B\\to0$ — unlimited bandwidth for a fixed rate — and take the limit:</p>'},
    {t:'eq', tex:'\\lim_{x\\to0}\\frac{2^{x}-1}{x}=\\ln 2=0.693'},
    {t:'reveal', at:1, items:[
      {t:'eq', key:true, label:'the Shannon limit', tex:'\\frac{E_b}{N_0}\\bigg|_{\\min}=\\ln 2=0.693=-1.59\\ \\mathrm{dB}'},
      {t:'note', kind:'ok', head:'Energy limit', html:'Reliable communication requires $E_b/N_0\\ge -1.59$ dB. No code, modulation method, or receiver can operate reliably below this limit. The uncoded methods in Module 5 require more energy.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Bandwidth at the limit', html:'The limit is approached only as bandwidth tends to infinity. The bandwidth efficiency then tends to zero. Operation near the energy limit therefore requires a large bandwidth.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'small', html:'Coherent binary PSK needs approximately $9.6$ dB for an error probability of $10^{-5}$. This value is about $11$ dB above the limit. Channel coding can reduce this gap. The modulation methods in this course are uncoded.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a = P.Axes({w:470,h:300,xr:[-4,16],yr:[0,6.4],
        xlabel:'E_b/N_0\\;(\\mathrm{dB})', ylabel:'C/B\\;(\\mathrm{bit/s/Hz})',
        pad:{l:66,r:24,t:24,b:46}, xtarget:5, ytarget:6});
      const pts = [];
      for(let e=0.004;e<=6.4;e+=0.004){
        const db = 10*Math.log10((Math.pow(2,e)-1)/e);
        if(db >= -4 && db <= 16) pts.push([db, e]);
      }
      a.area(()=>6.4, -4, 10*Math.log10(Math.log(2)), {fill:C.dec.err});
      a.poly(pts, {color:C.in, width:2.3});
      a.vline(10*Math.log10(Math.log(2)), {color:C.err, width:2});
      return a.svg();
    },
      caption:'The capacity boundary approaches $-1.59$ dB as bandwidth increases. It never crosses this value. The shaded region to the left is impossible for reliable communication.'}
  ]}
]},

/* ---------------------------------------------------------------- 6.10 --- */
{ id:'m6-synth', module:'M6', nav:'Summary', title:'Module 6 summary',
  objective:'Collect the definitions, the bounds, the algorithms and the two limits.',
  keywords:'summary module 6 entropy source coding kraft huffman efficiency capacity mutual information shannon',
  src:'CH10 s.4–22, w.12–14', steps:1, blocks:[
  {t:'eyebrow', text:'Module 6 · An introduction to information theory'},
  {t:'title', text:'Module 6 summary'},
  {t:'grid', cols:3, gap:'24px', items:[
    [{t:'card', head:'Source information', items:[
      {t:'fig', svg:miniEntropy},
      {t:'eq', plain:true, tex:'H(S)=-\\sum_k p_k\\log_2 p_k'},
      {t:'small', html:'Bounded by $0\\le H(S)\\le\\log_2 K$, largest when the symbols are equally likely.'}
    ]}],
    [{t:'card', head:'Average code length', items:[
      {t:'fig', svg:miniLengths},
      {t:'eq', plain:true, tex:'\\bar{L}=\\sum_k p_k l_k,\\qquad \\eta=\\frac{H(S)}{\\bar{L}}\\le 1'},
      {t:'small', html:'No code has average length below $H(S)$. A prefix code can remain within one bit. Block coding reduces this gap to at most $1/n$ bits per symbol.'}
    ]}],
    [{t:'card', head:'Decodable codes', items:[
      {t:'fig', svg:miniKraftTree},
      {t:'eq', plain:true, tex:'\\sum_k 2^{-l_k}\\le 1'},
      {t:'small', html:'Necessary for a prefix code, never sufficient. Prefix, or instantaneous, is what is used.'}
    ]}],
    [{t:'card', head:'Code construction', items:[
      {t:'fig', svg:miniHuffTree},
      {t:'eq', plain:true, tex:'\\sigma^{2}=\\sum_k p_k(l_k-\\bar{L})^{2}'},
      {t:'small', html:'Huffman coding repeatedly merges the two least likely symbols. During a tie, place the merged symbol high. Lempel–Ziv approaches the same limit without known probabilities.'}
    ]}],
    [{t:'card', head:'Channel information', items:[
      {t:'fig', svg:miniChannelX},
      {t:'eq', plain:true, tex:'I(X;Y)=H(X)-H(X\\mid Y)=H(Y)-H(Y\\mid X)'},
      {t:'small', html:'Mutual information is symmetric and nonnegative. The channel matrix and input distribution determine its value.'}
    ]}],
    [{t:'card', head:'The two limits', items:[
      {t:'fig', svg:miniShannon},
      {t:'eq', plain:true, tex:'C=\\max_{\\{p(x_j)\\}}I(X;Y),\\qquad C=B\\log_2\\!\\left(1+\\frac{P}{N_0B}\\right)'},
      {t:'small', html:'Reliable communication is possible exactly when $R_b<C$, and no system works below $E_b/N_0=-1.59$ dB.'}
    ]}]
  ]},
  {t:'reveal', at:1, items:[
    {t:'note', kind:'ok', head:'Course result', html:'Module 1 converts a waveform into bits. Modules 2 to 5 transmit those bits and calculate errors. Module 6 gives the source limit $H(S)$ and channel limit $C$. Reliable transmission is possible when the compressed source rate is less than $C$.'}
  ]}
]}

];
})();
