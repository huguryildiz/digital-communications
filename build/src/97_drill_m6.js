/* ==========================================================================
   Practice questions — Module 6.

   The exam analysis names Final Q4 for this material but records only which
   papers carried it, not what it asked. So the six shapes below come from the
   worked examples in the slides, exactly as they did for Modules 3, 4 and 5:
   an entropy, an extension, a code to measure, a Kraft test, and a Huffman
   code to build and then to judge.
   ========================================================================== */
(function(){

CONTENT.DRILLTYPES.M6 = [
  { k:'selfinfo', name:'The information in one symbol',
    asks:'A probability is given. Find the self-information, or find the probability that carries a stated number of bits.',
    method:['$I(s_k)=-\\log_2 p_k$. Going the other way, $p_k=2^{-I}$.',
            'A probability that is a power of two gives a whole number of bits, which is why $1/2$, $1/4$ and $1/8$ turn up in every exercise.',
            'For independent symbols the information adds, because the probabilities multiply and the logarithm turns a product into a sum.'],
    go:'m6-selfinfo' },

  { k:'entropy', name:'The entropy of a source',
    asks:'A set of probabilities is given. Find the entropy and compare it with its bounds.',
    method:['$H(S)=-\\sum_k p_k\\log_2 p_k$. Compute one term at a time and keep four decimals; the answers in this module are small and the rounding shows.',
            'Check $0\\le H(S)\\le\\log_2 K$ every time. A value above $\\log_2 K$ means a sign or a base was lost.',
            'Convert with $\\log_2 x=\\ln x/\\ln 2$ if the calculator has no base-two logarithm.'],
    go:'m6-entropy' },

  { k:'extension', name:'An extended source',
    asks:'A source is extended by $n$. Find the size of the new alphabet and its entropy.',
    method:['The $n$-th extension has $K^n$ symbols, one for each block of $n$.',
            '$H(S^n)=nH(S)$, and it holds because the source is memoryless — the block probabilities are products, and independent information adds.',
            'Per symbol nothing has changed: $H(S^n)/n$ is $H(S)$ again. What changes is how much of a whole bit gets wasted in rounding.'],
    go:'m6-extension' },

  { k:'code', name:'Measuring a code',
    asks:'A code is given with the probabilities. Find its average length and efficiency, and say whether it is a prefix code.',
    method:['$\\bar{L}=\\sum_k p_k l_k$, then $\\eta=H(S)/\\bar{L}$. The efficiency can never exceed one.',
            'For the prefix test, compare every codeword with every other: if any one is the start of another, it is not a prefix code.',
            'To decode a string with a prefix code, read bits until they match a codeword, emit it, and start again. No backtracking is ever needed.'],
    go:'m6-prefix' },

  { k:'kraft', name:'The Kraft inequality',
    asks:'A set of codeword lengths is given. Say whether a prefix code with those lengths exists.',
    method:['Compute $\\sum_k 2^{-l_k}$. At most one and such a code exists; above one and none does.',
            'Read it as a budget: a codeword of length $l$ spends $2^{-l}$ of the tree.',
            'Passing does not make a particular code a prefix code — it only says that some code with those lengths is one.'],
    go:'m6-kraft' },

  { k:'huffman', name:'Building and judging a Huffman code',
    asks:'A set of probabilities is given. Build the code, then find its average length, efficiency and variance.',
    method:['Merge the two least likely, label them $0$ and $1$, put the sum back in the list, and repeat until two are left.',
            'On a tie, place the merged symbol as high as possible. Both choices give the same $\\bar{L}$; only the high one gives the least variance.',
            'Finish with $\\bar{L}$, $\\eta=H(S)/\\bar{L}$ and $\\sigma^{2}=\\sum_k p_k(l_k-\\bar{L})^{2}$, and check $H(S)\\le\\bar{L}<H(S)+1$.'] },

  { k:'universal', name:'Parsing for a universal code',
    asks:'A stream or a list of parsed pieces is given. Encode them, or decode a received block.',
    method:['Each new piece is the shortest run not yet stored, so everything but its last bit is already in the dictionary. Find that entry: it is the pointer.',
            'A transmitted block is the pointer in binary followed by the one new bit. To decode, split the last bit off first — it is the innovation — and read the rest as a position.',
            'Check every piece by confirming its own start is already stored. If it is not, the parse was wrong.'],
    go:'m6-lz' },

  { k:'channel', name:'A channel and what it lets through',
    asks:'A channel matrix and an input distribution are given. Find the output distribution, the entropies and the mutual information.',
    method:['Check the matrix first: every row sums to one. Columns need not, and expecting them to is the usual first mistake.',
            'Joint is $p(x_j,y_k)=p(y_k\\mid x_j)p(x_j)$; the output distribution is the column sums of that.',
            '$H(Y\\mid X)=\\sum_j p(x_j)H(\\text{row }j)$, then $I(X;Y)=H(Y)-H(Y\\mid X)$. Going through $H(X\\mid Y)$ instead needs Bayes\' rule and is longer.'],
    go:'m6-mutual' },

  { k:'capacity', name:'Capacity, and what it permits',
    asks:'A channel is given, discrete or bandlimited. Find its capacity and say what rate it supports.',
    method:['For the binary symmetric channel $C=1-H(p)$, reached with equally likely inputs. For anything asymmetric, write $I(X;Y)$ as a function of the input distribution and maximise it.',
            'For a bandlimited channel $C=B\\log_2(1+P/N_0B)$ bits per second. Keep the units straight: bits per <em>use</em> for a discrete channel, bits per <em>second</em> for this one.',
            'Reliable communication needs $R_b<C$. Nothing else about the code enters the answer.'],
    go:'m6-capacity' }
];

CONTENT.DRILL = CONTENT.DRILL.concat([

/* ---- single-skill ---------------------------------------------------- */

{ id:'D6-01', module:'M6', type:'selfinfo', src:'CH10 s.4',
  stem:'A source emits a symbol of probability $1/4$ and, independently, a second of probability $1/32$.',
  parts:['Give the information each symbol carries.',
         'Give the information in the pair, two ways.'],
  sol:'<b>Given.</b> Two independent symbols with $p=1/4$ and $p=1/32$.<br>'
     +'<b>Find.</b> $I$ for each and for the pair.<br>'
     +'<b>Method.</b> $I(s_k)=-\\log_2 p_k$; for independent symbols the information adds.<br>'
     +'<b>Solution — (a).</b> $-\\log_2\\frac14=2$ bits and $-\\log_2\\frac{1}{32}=5$ bits.<br>'
     +'<b>Solution — (b).</b> Adding: $2+5=7$ bits. Or directly: the pair has probability $\\frac14\\times\\frac{1}{32}=\\frac{1}{128}$, and $-\\log_2\\frac{1}{128}=7$ bits.<br>'
     +'<b>Check.</b> The two routes agree, which is the third property of self-information doing its job. It is also the reason the measure has to be a logarithm: no other function turns a product of probabilities into a sum of anything.',
  err:'Multiplying the two informations instead of adding them. The probabilities multiply; their logarithms add.',
  teach:'Ask what probability carries exactly one bit. The answer $1/2$ says what a bit <em>is</em>: the information in one fair coin flip. Every other number in this module is measured against that.' },

{ id:'D6-02', module:'M6', type:'selfinfo', src:'CH10 s.4',
  stem:'A symbol carries $3$ bits of self-information.',
  parts:['Give its probability.',
         'Say what happens to the information if the probability is halved.'],
  sol:'<b>Given.</b> $I(s_k)=3$ bits.<br>'
     +'<b>Find.</b> $p_k$, and the effect of halving it.<br>'
     +'<b>Method.</b> Invert $I=-\\log_2 p$, which gives $p=2^{-I}$.<br>'
     +'<b>Solution — (a).</b> $p_k=2^{-3}=1/8$.<br>'
     +'<b>Solution — (b).</b> Halving to $1/16$ gives $-\\log_2\\frac{1}{16}=4$ bits: one more bit, not twice as many.<br>'
     +'<b>Check.</b> Every halving of the probability adds exactly one bit, because $\\log_2$ of a half is $-1$. That is the whole behaviour of the measure in one sentence.',
  err:'Reading "halved" as "the information doubles". The logarithm turns a factor into an addition, and this is exactly where that matters.',
  teach:'The rule that one halving costs one bit is worth memorising. It makes almost every estimate in this module doable without a calculator: a probability of $1/1000$ is about ten halvings from one, so about $10$ bits.' },

{ id:'D6-03', module:'M6', type:'entropy', src:'CH10 s.5',
  stem:'A discrete memoryless source has probabilities $0.5,\\;0.25,\\;0.125,\\;0.125$.',
  parts:['Give the entropy.',
         'Compare it with the maximum an alphabet of this size allows.'],
  sol:'<b>Given.</b> Four symbols with the probabilities listed.<br>'
     +'<b>Find.</b> $H(S)$ and the ceiling.<br>'
     +'<b>Method.</b> $H(S)=-\\sum p_k\\log_2 p_k$. Every probability here is a power of two, so every logarithm is a whole number.<br>'
     +'<b>Solution — (a).</b> $H(S)=0.5(1)+0.25(2)+0.125(3)+0.125(3)=0.5+0.5+0.375+0.375=1.75$ bits a symbol.<br>'
     +'<b>Solution — (b).</b> $\\log_2 4=2$ bits, so the source is $0.25$ bits below the ceiling.<br>'
     +'<b>Check.</b> The answer came out exact because the probabilities are dyadic. That is not an accident of this question — it is the condition under which a code reaches the entropy exactly, and D6-15 builds that code.',
  err:'Using $-\\log_2 0.5=0.5$. The logarithm of a half is $-1$, and the minus sign in front makes it $+1$.',
  teach:'Worth doing this one entirely on paper. Four terms, all whole-number logarithms, and the total is exact — it is the one entropy in the course that needs no calculator, and it is a useful reference point for the ones that do.' },

{ id:'D6-04', module:'M6', type:'entropy', src:'CH10 s.6',
  stem:'A source has probabilities $0.6,\\;0.3,\\;0.1$.',
  parts:['Give the entropy.',
         'Say how many bits a symbol would cost if the three symbols were simply numbered.'],
  sol:'<b>Given.</b> Three symbols with the probabilities listed.<br>'
     +'<b>Find.</b> $H(S)$, and the cost of plain numbering.<br>'
     +'<b>Method.</b> One sum, then compare with $\\lceil\\log_2 3\\rceil$.<br>'
     +'<b>Solution — (a).</b> $H(S)=-0.6\\log_2 0.6-0.3\\log_2 0.3-0.1\\log_2 0.1=0.4422+0.5211+0.3322=1.2955$ bits a symbol.<br>'
     +'<b>Solution — (b).</b> Three symbols need $2$ bits each if they are numbered $00$, $01$, $10$.<br>'
     +'<b>Check.</b> $1.2955$ is below $\\log_2 3=1.585$, as it must be for a source that is not uniform. Numbering costs $2$ bits, so it wastes $0.70$ bits a symbol — over half as much again as the source needs.',
  err:'Comparing the entropy against $2$ and calling that the ceiling. The ceiling is $\\log_2 K=1.585$; the $2$ is what a fixed-length code costs, which is a different thing.',
  teach:'Two numbers are being compared here and they are often confused. $\\log_2 K$ is the most a source of this size <em>could</em> carry. $\\lceil\\log_2 K\\rceil$ is what a fixed-length code <em>costs</em>. The gap between them is rounding, and the gap between $H(S)$ and $\\log_2 K$ is the source being uneven.' },

{ id:'D6-05', module:'M6', type:'entropy', src:'CH10 s.6',
  stem:'A binary source emits $0$ with probability $0.9$ and $1$ with probability $0.1$.',
  parts:['Give the entropy.',
         'Say what the entropy would be at $p=0.5$, and comment on the shape of the curve.'],
  sol:'<b>Given.</b> A binary source at $p=0.9$.<br>'
     +'<b>Find.</b> $H(S)$, and the comparison with a fair source.<br>'
     +'<b>Method.</b> Two terms.<br>'
     +'<b>Solution — (a).</b> $H(S)=-0.9\\log_2 0.9-0.1\\log_2 0.1=0.1368+0.3322=0.4690$ bits a symbol.<br>'
     +'<b>Solution — (b).</b> At $p=0.5$ it is exactly $1$ bit. So a $90\\!:\\!10$ source carries less than half what a fair one does.<br>'
     +'<b>Check.</b> The binary entropy curve is flat near the top and steep near the ends. At $p=0.6$ it is still $0.971$ — almost a full bit — while at $p=0.9$ it has fallen to $0.469$. A slightly unfair coin is nearly as informative as a fair one; a heavily unfair one is not.',
  err:'Assuming the entropy falls in proportion to how unfair the source is. It does not: the curve is flat at the top, and half the probability range costs almost nothing.',
  teach:'This is the number behind every compression demonstration. A file of $90\\%$ zeros holds $0.469$ bits a symbol, so it can in principle be squeezed to under half its size — and no further.' },

{ id:'D6-06', module:'M6', type:'entropy', src:'CH10 s.6',
  stem:'A source has eight symbols.',
  parts:['Give the largest entropy it can have, and the probabilities that achieve it.',
         'If the measured entropy is $2.5$ bits a symbol, give the efficiency of a fixed-length code that numbers the eight symbols.'],
  sol:'<b>Given.</b> $K=8$.<br>'
     +'<b>Find.</b> The maximum entropy, and the efficiency of plain numbering at $H(S)=2.5$.<br>'
     +'<b>Method.</b> The maximum is $\\log_2 K$, reached when all symbols are equally likely. A fixed-length code for eight symbols uses $3$ bits.<br>'
     +'<b>Solution — (a).</b> $\\log_2 8=3$ bits a symbol, at $p_k=1/8$ for every $k$.<br>'
     +'<b>Solution — (b).</b> $\\bar{L}=3$, so $\\eta=2.5/3=0.833$.<br>'
     +'<b>Check.</b> The efficiency is below one, as it must be, and the $0.5$ bits a symbol being wasted is exactly the gap between the measured entropy and the ceiling. A variable-length code would recover most of it.',
  err:'Giving the maximum entropy as $8$. The alphabet has eight symbols; the entropy is measured in bits, and eight equally likely symbols carry three.',
  teach:'The fixed-length code is worth keeping as a baseline for every question in this module. It always costs $\\lceil\\log_2 K\\rceil$ bits, it never needs the probabilities, and everything cleverer is measured against it.' },

{ id:'D6-07', module:'M6', type:'extension', src:'CH10 s.7',
  stem:'The source with probabilities $0.7,\\;0.2,\\;0.1$ is extended by three.',
  parts:['Give the number of symbols in $S^3$.',
         'Give the entropy of $S^3$.',
         'Give the entropy per original symbol.'],
  sol:'<b>Given.</b> $K=3$, $n=3$, and $H(S)=1.1568$ from the module.<br>'
     +'<b>Find.</b> $K^3$, $H(S^3)$, and $H(S^3)/3$.<br>'
     +'<b>Method.</b> $K^n$ symbols and $H(S^n)=nH(S)$, because the source is memoryless.<br>'
     +'<b>Solution — (a).</b> $3^3=27$ symbols, one for each block of three.<br>'
     +'<b>Solution — (b).</b> $H(S^3)=3\\times1.1568=3.4703$ bits a block.<br>'
     +'<b>Solution — (c).</b> $3.4703/3=1.1568$ bits a symbol — unchanged.<br>'
     +'<b>Check.</b> Part (c) had to come out unchanged. Grouping symbols does not create or destroy information; it only gives a coder a larger thing to round.',
  err:'Multiplying the alphabet size by $n$ instead of raising it to the power $n$. Three blocks of three symbols give $27$ combinations, not $9$.',
  teach:'The alphabet grows as $K^n$ while the benefit grows as $1/n$. Ask for $n=5$: $243$ symbols to save at most a fifth of a bit. That ratio is why nobody codes long blocks directly.' },

{ id:'D6-08', module:'M6', type:'extension', src:'CH10 s.7',
  stem:'A source has four equally likely symbols and is extended by two.',
  parts:['Give $H(S)$ and $H(S^2)$.',
         'Give the probability of each symbol of $S^2$, and verify the entropy directly.'],
  sol:'<b>Given.</b> $K=4$ with $p_k=0.25$, extended by two.<br>'
     +'<b>Find.</b> Both entropies, checked two ways.<br>'
     +'<b>Method.</b> Equally likely symbols give $H(S)=\\log_2 K$.<br>'
     +'<b>Solution — (a).</b> $H(S)=\\log_2 4=2$ bits, so $H(S^2)=2\\times2=4$ bits a block.<br>'
     +'<b>Solution — (b).</b> $S^2$ has $16$ symbols, each of probability $0.25\\times0.25=0.0625=1/16$. They are equally likely, so $H(S^2)=\\log_2 16=4$ bits. The two answers agree.<br>'
     +'<b>Check.</b> A uniform source extended stays uniform, so the shortcut and the direct calculation must agree. When they do not, the arithmetic in one of them is wrong.',
  err:'Expecting the extension to reduce the entropy per symbol. It cannot for a memoryless source. Only a source with memory gains from blocking, and this course does not study those.',
  teach:'A uniform source has nothing to compress: $H(S)=\\log_2 K$ already, and the fixed-length code is optimal. Blocking it is pure work for no gain, which makes it the useful case for checking that a method does no harm.' },

{ id:'D6-09', module:'M6', type:'code', src:'CH10 s.10',
  stem:'A source with probabilities $0.5,\\;0.25,\\;0.125,\\;0.125$ is coded as $0$, $10$, $110$, $111$.',
  parts:['Give the average codeword length.',
         'Give the efficiency.',
         'Say whether the code is a prefix code.'],
  sol:'<b>Given.</b> Four probabilities and four codewords.<br>'
     +'<b>Find.</b> $\\bar{L}$, $\\eta$, and the prefix test.<br>'
     +'<b>Method.</b> $\\bar{L}=\\sum p_kl_k$; $H(S)=1.75$ from D6-03.<br>'
     +'<b>Solution — (a).</b> Lengths are $1,2,3,3$, so $\\bar{L}=0.5(1)+0.25(2)+0.125(3)+0.125(3)=1.75$ bits a symbol.<br>'
     +'<b>Solution — (b).</b> $\\eta=1.75/1.75=1$ — perfect.<br>'
     +'<b>Solution — (c).</b> Yes. $0$ does not begin $10$, $110$ or $111$; $10$ does not begin the two three-bit words; and neither three-bit word begins the other.<br>'
     +'<b>Check.</b> Efficiency exactly one is only possible when every probability is a power of two, and here every one is. The ideal length $-\\log_2 p_k$ is $1,2,3,3$ — precisely the lengths used, with nothing rounded.',
  err:'Reporting an efficiency above one. That is impossible: $\\bar{L}$ can never be below $H(S)$, so the ratio can never exceed one. An answer above one means $H(S)$ or $\\bar{L}$ was computed wrongly.',
  teach:'This is the only kind of source on which a code is perfect. Ask what would happen if the probabilities were $0.5,0.3,0.1,0.1$ instead: the same code still works, but the efficiency drops, because the lengths no longer match the ideal ones.' },

{ id:'D6-10', module:'M6', type:'code', src:'CH10 s.12–14',
  stem:'A four-symbol source is coded as $s_1\\!:0$, $s_2\\!:10$, $s_3\\!:110$, $s_4\\!:111$.',
  parts:['Decode the string $01101110$.',
         'Say why no backtracking was needed.'],
  sol:'<b>Given.</b> A prefix code and an encoded string.<br>'
     +'<b>Find.</b> The symbols, and why the decoding is straightforward.<br>'
     +'<b>Method.</b> Read bits until they match a codeword, emit it, and start again.<br>'
     +'<b>Solution — (a).</b> $0\\to s_1$. Then $110\\to s_3$. Then $111\\to s_4$. Then $0\\to s_1$. The string reads $s_1s_3s_4s_1$.<br>'
     +'<b>Solution — (b).</b> No codeword is the beginning of another, so the moment the bits read so far match one, no longer codeword could also match. The decision is final as soon as it is made.<br>'
     +'<b>Check.</b> The lengths used were $1+3+3+1=8$ bits, which is the length of the given string. If they had not added up, a symbol was missed.',
  err:'Reading $011$ as $s_3$ because it looks close to $110$. Bits are read strictly left to right, and $0$ already matches $s_1$ before the next bit is even seen.',
  teach:'Ask the same question with Code III of the module — $0$, $01$, $011$, $0111$ — where after reading $011$ the decoder still cannot tell $s_3$ from the start of $s_4$. That waiting is exactly what the prefix property removes.' },

{ id:'D6-11', module:'M6', type:'kraft', src:'CH10 s.15–16',
  stem:'Three sets of codeword lengths are proposed for a four-symbol source: $\\{1,2,3,3\\}$, $\\{2,2,2,2\\}$ and $\\{1,2,2,3\\}$.',
  parts:['Apply the Kraft inequality to each.',
         'Say which admit a prefix code.'],
  sol:'<b>Given.</b> Three length sets.<br>'
     +'<b>Find.</b> $\\sum 2^{-l_k}$ for each.<br>'
     +'<b>Method.</b> One sum each.<br>'
     +'<b>Solution — (a).</b> $\\{1,2,3,3\\}$: $0.5+0.25+0.125+0.125=1$. $\\{2,2,2,2\\}$: $4\\times0.25=1$. $\\{1,2,2,3\\}$: $0.5+0.25+0.25+0.125=1.125$.<br>'
     +'<b>Solution — (b).</b> The first two, both at exactly $1$. The third exceeds one, so no prefix code has those lengths.<br>'
     +'<b>Check.</b> The first two use the tree completely: nothing is left over and no codeword could be made shorter. The third is asking for more tree than exists — the length-$1$ codeword alone takes half of it, and the two length-$2$ codewords take the other half, leaving nothing for the fourth.',
  err:'Computing $\\sum 2^{l_k}$ without the minus sign. The exponent is negative because a longer codeword claims a <em>smaller</em> share of the tree.',
  teach:'The picture makes the third case obvious without arithmetic: draw the tree, take one branch at depth one and both branches of the other at depth two, and there is nowhere left to put a fourth codeword.' },

{ id:'D6-12', module:'M6', type:'kraft', src:'CH10 s.15',
  stem:'A prefix code for five symbols must have $l_1=1$, $l_2=2$ and $l_3=3$.',
  parts:['Give the Kraft budget already spent.',
         'Give the shortest possible equal lengths for $l_4$ and $l_5$.'],
  sol:'<b>Given.</b> Three lengths fixed, two free and equal.<br>'
     +'<b>Find.</b> What remains, and the shortest lengths that fit.<br>'
     +'<b>Method.</b> Spend the budget, then divide what is left.<br>'
     +'<b>Solution — (a).</b> $2^{-1}+2^{-2}+2^{-3}=0.5+0.25+0.125=0.875$, so $0.125$ of the tree remains.<br>'
     +'<b>Solution — (b).</b> Two equal codewords must satisfy $2\\times2^{-l}\\le0.125$, so $2^{-l}\\le0.0625$ and $l\\ge4$. The shortest is $l_4=l_5=4$.<br>'
     +'<b>Check.</b> The total is then $0.875+2(0.0625)=1$ exactly, so the tree is used completely and neither codeword could be shortened. A code with these lengths is $0$, $10$, $110$, $1110$, $1111$.<br>',
  err:'Solving $2^{-l}\\le0.125$ and answering $l=3$. There are two codewords to place, so each may have only half the remaining budget.',
  teach:'This is how a codebook is designed backwards: fix the lengths the important symbols need, spend the budget, and see what is left for the rest. The inequality answers the question before any codeword is written down.' },

{ id:'D6-13', module:'M6', type:'code', src:'CH10 s.17',
  stem:'A source has entropy $H(S)=2.35$ bits a symbol. Three codes are claimed for it, with average lengths $2.20$, $2.35$ and $3.40$ bits.',
  parts:['Say which claims are possible.',
         'Say which of the possible ones a prefix code could have produced.'],
  sol:'<b>Given.</b> $H(S)=2.35$ and three claimed averages.<br>'
     +'<b>Find.</b> Which survive the two bounds.<br>'
     +'<b>Method.</b> Any lossless code obeys $\\bar{L}\\ge H(S)$; a prefix code also obeys $\\bar{L}<H(S)+1$.<br>'
     +'<b>Solution — (a).</b> $2.20$ is below the entropy, so it is impossible for any lossless code. $2.35$ and $3.40$ are both at least $2.35$, so both are possible.<br>'
     +'<b>Solution — (b).</b> The upper bound is $H(S)+1=3.35$. So $2.35$ could come from a prefix code; $3.40$ is above $3.35$ and could not — it is a legal code, just a wasteful one.<br>'
     +'<b>Check.</b> The two bounds do different jobs. The lower one is a law of nature: no code beats the entropy. The upper one is a promise about a construction: a prefix code always gets within a bit. A code can be worse than the promise without breaking any law.',
  err:'Treating $H(S)\\le\\bar{L}<H(S)+1$ as though a code must lie in that range. Only a code built well does. The band is what is achievable, not what is compulsory.',
  teach:'Worth asking what a code with $\\bar{L}=3.40$ looks like. It is one whose lengths ignore the probabilities — long codewords on common symbols. Nothing forbids it; Huffman simply never produces it.' },

{ id:'D6-14', module:'M6', type:'extension', src:'CH10 s.18',
  stem:'A coder must reach within $0.05$ bits a symbol of the entropy by coding blocks.',
  parts:['Give the smallest block length that guarantees it.',
         'Give the size of the codebook if the source has three symbols.'],
  sol:'<b>Given.</b> A target gap of $0.05$ bits a symbol.<br>'
     +'<b>Find.</b> The block length and what it costs.<br>'
     +'<b>Method.</b> The bound over the $n$-th extension is $H(S)\\le L_n/n<H(S)+1/n$, so the guaranteed gap is $1/n$.<br>'
     +'<b>Solution — (a).</b> $1/n\\le0.05$ gives $n\\ge20$, so blocks of twenty symbols.<br>'
     +'<b>Solution — (b).</b> $3^{20}=3.49\\times10^{9}$ symbols in the extended alphabet, each needing its own codeword.<br>'
     +'<b>Check.</b> The bound improves as $1/n$ while the work grows as $K^n$. Three and a half billion codewords to save a twentieth of a bit is not a trade anyone makes, and it is why practical compressors — Lempel-Ziv and the rest — do something entirely different.',
  err:'Reading $1/n$ as the actual gap rather than the guaranteed one. The real gap is usually far smaller; $1/n$ is only what can be promised without knowing the probabilities.',
  teach:'The two halves of this answer are the point. The theory says the entropy is reachable; the arithmetic says not this way. Both are true, and knowing the second is what separates the result from an algorithm.' },

{ id:'D6-15', module:'M6', type:'huffman', src:'CH10 s.19',
  stem:'Build a Huffman code for a source with probabilities $0.5,\\;0.25,\\;0.125,\\;0.125$.',
  parts:['Give the merges.',
         'Give the codeword lengths and the average length.',
         'Give the efficiency.'],
  sol:'<b>Given.</b> Four probabilities, already in decreasing order.<br>'
     +'<b>Find.</b> The code and how good it is.<br>'
     +'<b>Method.</b> Merge the two least likely, put the sum back, repeat.<br>'
     +'<b>Solution — (a).</b> $0.125+0.125=0.25$. Then the two smallest are $0.25$ and $0.25$, giving $0.5$. Then $0.5$ and $0.5$ finish it.<br>'
     +'<b>Solution — (b).</b> Lengths $1,2,3,3$; for instance $0$, $10$, $110$, $111$. $\\bar{L}=0.5(1)+0.25(2)+0.125(3)+0.125(3)=1.75$ bits.<br>'
     +'<b>Solution — (c).</b> $H(S)=1.75$ from D6-03, so $\\eta=1.75/1.75=1$.<br>'
     +'<b>Check.</b> Every ideal length $-\\log_2 p_k$ is a whole number here — $1,2,3,3$ — and Huffman found exactly those. Nothing was rounded, so nothing was wasted.',
  err:'Merging the two <em>most</em> likely symbols. The algorithm works from the bottom: the least likely pair goes deepest in the tree and gets the longest codewords.',
  teach:'This is the case where the theory closes completely: the bound says $\\bar{L}\\ge H(S)$, the source is dyadic so equality is possible, and Huffman reaches it. Every other source in this module leaves a gap.' },

{ id:'D6-16', module:'M6', type:'huffman', src:'CH10 s.19',
  stem:'Build a Huffman code for a source with probabilities $0.4,\\;0.3,\\;0.2,\\;0.1$.',
  parts:['Give the merges and the codeword lengths.',
         'Give the average length and the entropy.',
         'Give the efficiency.'],
  sol:'<b>Given.</b> Four probabilities in decreasing order.<br>'
     +'<b>Find.</b> The code, $\\bar{L}$, $H(S)$ and $\\eta$.<br>'
     +'<b>Method.</b> The algorithm, then the two sums.<br>'
     +'<b>Solution — (a).</b> $0.2+0.1=0.3$. The list is now $0.4,0.3,0.3$; the two smallest give $0.6$. Then $0.6$ and $0.4$ finish. Lengths $1,2,3,3$.<br>'
     +'<b>Solution — (b).</b> $\\bar{L}=0.4(1)+0.3(2)+0.2(3)+0.1(3)=0.4+0.6+0.6+0.3=1.9$ bits. $H(S)=-0.4\\log_2 0.4-0.3\\log_2 0.3-0.2\\log_2 0.2-0.1\\log_2 0.1=1.8464$ bits.<br>'
     +'<b>Solution — (c).</b> $\\eta=1.8464/1.9=0.9718$.<br>'
     +'<b>Check.</b> $1.8464\\le1.9<2.8464$, so the two-sided bound holds with room to spare. A fixed-length code would have cost $2$ bits, so Huffman saved a tenth of a bit a symbol — modest, because this source is not very uneven.',
  err:'Stopping after three merges and reading off lengths from an unfinished tree. The algorithm ends when one symbol is left, which for $K$ symbols is $K-1$ merges.',
  teach:'Compare with D6-15, which had the same lengths $1,2,3,3$ and reached $\\eta=1$. Same code shape, different probabilities, and the efficiency falls to $0.97$. It is the match between lengths and probabilities that matters, not the lengths alone.' },

{ id:'D6-17', module:'M6', type:'huffman', src:'CH10 s.22',
  stem:'Two Huffman codes for the same source both have $\\bar{L}=2.2$ bits. The first has lengths $2,2,2,3,3$ with probabilities $0.4,0.2,0.2,0.1,0.1$; the second has lengths $1,2,3,4,4$ for the same probabilities in the same order.',
  parts:['Give the variance of each.',
         'Say which is preferred and why.'],
  sol:'<b>Given.</b> Two optimal codes for one source.<br>'
     +'<b>Find.</b> $\\sigma^{2}$ for each.<br>'
     +'<b>Method.</b> $\\sigma^{2}=\\sum p_k(l_k-\\bar{L})^{2}$ with $\\bar{L}=2.2$ in both cases.<br>'
     +'<b>Solution — (a).</b> First: $0.4(0.04)+0.2(0.04)+0.2(0.04)+0.1(0.64)+0.1(0.64)=0.016+0.008+0.008+0.064+0.064=0.16$. Second: $0.4(1.44)+0.2(0.04)+0.2(0.64)+0.1(3.24)+0.1(3.24)=0.576+0.008+0.128+0.324+0.324=1.36$.<br>'
     +'<b>Solution — (b).</b> The first. Both cost the same on average, but its codeword lengths are close together, so the buffer between the encoder and a fixed-rate channel sees a steadier flow.<br>'
     +'<b>Check.</b> Both averages are $2.2$, which they must be: Huffman produces a minimum-length code and the minimum is unique even when the code is not.',
  err:'Recomputing $\\bar{L}$ for the second code and expecting a different answer. The two codes differ in how the lengths are distributed, never in their average.',
  teach:'The rule that produces the first code is one line: on a tie, place the merged symbol as high as possible in the list. Ask the reader to run the algorithm both ways on paper and watch the tie at $0.2$ decide everything.' },

/* ---- full-length ----------------------------------------------------- */

{ id:'D6-18', module:'M6', type:'huffman', src:'CH10 s.20–22',
  stem:'A discrete memoryless source has probabilities $0.4,\\;0.2,\\;0.2,\\;0.1,\\;0.1$.',
  parts:['Give the entropy.',
         'Build the minimum-variance Huffman code and give the lengths.',
         'Give the average length and the efficiency.',
         'Give the variance, and compare with a fixed-length code.'],
  sol:'<b>Given.</b> Five symbols with the probabilities listed.<br>'
     +'<b>Find.</b> $H(S)$, the code, $\\bar{L}$, $\\eta$, $\\sigma^{2}$.<br>'
     +'<b>Method.</b> Entropy first, then the algorithm with merged symbols placed high.<br>'
     +'<b>Solution — (a).</b> $H(S)=-0.4\\log_2 0.4-2(0.2\\log_2 0.2)-2(0.1\\log_2 0.1)=0.5288+0.9288+0.6644=2.1219$ bits.<br>'
     +'<b>Solution — (b).</b> $0.1+0.1=0.2$, placed above the two existing $0.2$s. Then those two $0.2$s merge to $0.4$, placed above the original $0.4$. Then $0.4$ and $0.2$ give $0.6$, and $0.6$ with $0.4$ finishes. Lengths $2,2,2,3,3$.<br>'
     +'<b>Solution — (c).</b> $\\bar{L}=0.4(2)+0.2(2)+0.2(2)+0.1(3)+0.1(3)=2.2$ bits, so $\\eta=2.1219/2.2=0.9645$.<br>'
     +'<b>Solution — (d).</b> $\\sigma^{2}=0.16$. A fixed-length code needs $\\lceil\\log_2 5\\rceil=3$ bits with zero variance, so Huffman saves $0.8$ bits a symbol at the cost of unequal lengths.<br>'
     +'<b>Check.</b> $2.1219\\le2.2<3.1219$: the bound holds. And $\\bar{L}$ exceeds $H(S)$ by $3.68\\%$, which is the rounding the module said would cost less than one bit.',
  err:'Placing the first merged $0.2$ below the existing ones. That is a legal Huffman code with the same $\\bar{L}=2.2$, but its variance is $1.36$ — and a question asking for the minimum-variance code wants the other one.',
  teach:'This one question exercises the whole module: entropy, the algorithm, the tie rule, the average, the efficiency, the variance and the bound. Worth working end to end on paper before any of the shorter questions are attempted a second time.' },

{ id:'D6-19', module:'M6', type:'huffman', src:'CH10 s.20',
  stem:'A source has six symbols with probabilities $0.3,\\;0.25,\\;0.2,\\;0.12,\\;0.08,\\;0.05$.',
  parts:['Give the entropy.',
         'Build a Huffman code and give the lengths.',
         'Give the average length, the efficiency and the variance.',
         'Compare with a fixed-length code.'],
  sol:'<b>Given.</b> Six probabilities in decreasing order.<br>'
     +'<b>Find.</b> The full set of numbers.<br>'
     +'<b>Method.</b> Five merges, then the three sums.<br>'
     +'<b>Solution — (a).</b> $H(S)=2.3601$ bits a symbol.<br>'
     +'<b>Solution — (b).</b> $0.08+0.05=0.13$; then $0.13+0.12=0.25$; then $0.2+0.25=0.45$; then $0.25+0.3=0.55$; then $0.45+0.55=1$. Lengths $2,2,2,3,4,4$.<br>'
     +'<b>Solution — (c).</b> $\\bar{L}=0.3(2)+0.25(2)+0.2(2)+0.12(3)+0.08(4)+0.05(4)=0.6+0.5+0.4+0.36+0.32+0.2=2.38$ bits. $\\eta=2.3601/2.38=0.9917$. $\\sigma^{2}=0.4956$.<br>'
     +'<b>Solution — (d).</b> A fixed-length code needs $\\lceil\\log_2 6\\rceil=3$ bits, so Huffman saves $0.62$ bits a symbol, or a fifth of the cost.<br>'
     +'<b>Check.</b> $\\eta=0.9917$ is high because these probabilities sit close to powers of two, so little rounding was needed. Compare D6-18 at $0.9645$: more even probabilities there, and more waste.',
  err:'Losing track of which entries are merged symbols after the third merge. Writing the list out fresh after every merge takes seconds and prevents it.',
  teach:'Ask for a prediction of the efficiency before computing it. The probabilities $0.3, 0.25, 0.2$ are all near $0.25$, and $0.12, 0.08, 0.05$ are near $0.125$ and $0.0625$ — so the ideal lengths are near whole numbers and the efficiency should be high. It is $0.99$.' },

{ id:'D6-20', module:'M6', type:'huffman', src:'CH10 s.18–20',
  stem:'A binary source emits $0$ with probability $0.8$ and $1$ with probability $0.2$.',
  parts:['Give the entropy.',
         'Give the average length and efficiency of a Huffman code on single symbols.',
         'Extend the source by two and give the average length per original symbol of a Huffman code on the pairs.',
         'Say what the extension bought.'],
  sol:'<b>Given.</b> A binary source at $0.8/0.2$.<br>'
     +'<b>Find.</b> The cost of coding it one symbol at a time, and two at a time.<br>'
     +'<b>Method.</b> Entropy, then Huffman on $S$, then Huffman on $S^2$.<br>'
     +'<b>Solution — (a).</b> $H(S)=-0.8\\log_2 0.8-0.2\\log_2 0.2=0.2575+0.4644=0.7219$ bits a symbol.<br>'
     +'<b>Solution — (b).</b> With two symbols there is only one code: $0$ and $1$, so $\\bar{L}=1$ bit and $\\eta=0.7219/1=0.7219$. Nearly $28\\%$ of every bit is wasted, and no code on single symbols can do better — a codeword cannot be shorter than one bit.<br>'
     +'<b>Solution — (c).</b> $S^2$ has probabilities $0.64,\\,0.16,\\,0.16,\\,0.04$. Huffman gives lengths $1,2,3,3$ and $L_2=0.64(1)+0.16(2)+0.16(3)+0.04(3)=1.56$ bits a pair, which is $0.78$ bits an original symbol.<br>'
     +'<b>Solution — (d).</b> The efficiency rose from $0.7219$ to $0.7219/0.78=0.9255$. Coding two at a time recovered most of the waste, and the reason is that the one-bit floor now covers two symbols instead of one.<br>'
     +'<b>Check.</b> $0.78$ is between $H(S)=0.7219$ and $H(S)+1/2=1.2219$, as the bound over the second extension requires.',
  err:'Comparing $L_2=1.56$ with $H(S)=0.7219$ directly. $L_2$ is bits a <em>pair</em>; it has to be divided by two before it can be compared with anything per symbol.',
  teach:'This is the clearest case in the module of why blocking matters. A very lopsided binary source wants to spend a fraction of a bit on its common symbol, and no single-symbol code can. Blocking is the only way to spend fractions of a bit, and D6-14 says how far that idea can be pushed.' },

{ id:'D6-21', module:'M6', type:'universal', src:'CH10 w.12',
  stem:'A Lempel–Ziv encoder begins with $0$ at position $1$ and $1$ at position $2$ in its dictionary. Parsing a stream produces, in order, the new pieces $00$, $01$, $011$ and $10$. Pointers are sent in three bits.',
  parts:['Give the dictionary position of each new piece.',
         'Give the pointer and the innovation bit for each.',
         'Write the four transmitted blocks.',
         'Decode the block $0111$ and say what position the result takes.'],
  sol:'<b>Given.</b> Four parsed pieces, a dictionary holding $0$ and $1$, and three-bit pointers.<br>'
     +'<b>Find.</b> The positions, the pointers, the blocks, and one decoded block.<br>'
     +'<b>Method.</b> A new piece is the shortest run not yet stored, so everything but its last bit is already in the dictionary. That earlier entry is the pointer; the last bit is the innovation.<br>'
     +'<b>Solution — (a).</b> Pieces are stored in the order they are parsed, after the two already held: $00$ takes position $3$, $01$ position $4$, $011$ position $5$, and $10$ position $6$.<br>'
     +'<b>Solution — (b).</b> $00$ starts with $0$, at position $1$, and its new bit is $0$. $01$ starts with $0$, position $1$, new bit $1$. $011$ starts with $01$, which is position $4$, new bit $1$. $10$ starts with $1$, position $2$, new bit $0$.<br>'
     +'<b>Solution — (c).</b> Writing each position in three bits and appending the innovation: $0010$, $0011$, $1001$, $0100$.<br>'
     +'<b>Solution — (d).</b> Split the last bit off first: the innovation is $1$. The remaining $011$ is $3$, and entry $3$ is $00$, so the piece is $001$. It is new, so it takes position $7$.<br>'
     +'<b>Check.</b> Every piece\'s own start must already be stored, and each one is: $0$ at $1$, $0$ at $1$, $01$ at $4$, $1$ at $2$. A parse that produces a piece whose start is missing is a wrong parse, and this is the check that catches it.',
  err:'Sending the whole piece and then the pointer as well. The pointer <em>replaces</em> everything but the last bit — that is the entire saving, and repeating the piece throws it away.',
  teach:'Ask what these four pieces cost: $16$ bits of blocks for $8$ bits of stream. The method is losing, and it goes on losing until the stored pieces grow long. That is the honest answer to "is this better than Huffman", and it is why the algorithm is used on files rather than on single symbols.' },

{ id:'D6-22', module:'M6', type:'channel', src:'CH10 w.13',
  stem:'A binary channel has $p(y_0\\mid x_0)=0.9$ and $p(y_0\\mid x_1)=0.2$. The transmitter sends $x_0$ with probability $0.6$.',
  parts:['Write the channel matrix and check it.',
         'Give the four joint probabilities.',
         'Give the output distribution.',
         'Give $H(Y\\mid X)$, and say whether it would change if the transmitter changed.'],
  sol:'<b>Given.</b> An asymmetric binary channel and an input distribution $0.6/0.4$.<br>'
     +'<b>Find.</b> The matrix, the joint and output distributions, and $H(Y\\mid X)$.<br>'
     +'<b>Method.</b> Each row of the matrix is the output distribution for one input, so each row is completed by subtraction from one.<br>'
     +'<b>Solution — (a).</b> $\\mathbf{P}=\\begin{bmatrix}0.9&0.1\\\\0.2&0.8\\end{bmatrix}$. Both rows sum to one, as every channel matrix must.<br>'
     +'<b>Solution — (b).</b> $p(x_0,y_0)=0.9(0.6)=0.54$, $p(x_0,y_1)=0.1(0.6)=0.06$, $p(x_1,y_0)=0.2(0.4)=0.08$, $p(x_1,y_1)=0.8(0.4)=0.32$.<br>'
     +'<b>Solution — (c).</b> $p(y_0)=0.54+0.08=0.62$ and $p(y_1)=0.06+0.32=0.38$.<br>'
     +'<b>Solution — (d).</b> $H(Y\\mid X)=0.6\\,H(0.1)+0.4\\,H(0.2)=0.6(0.4690)+0.4(0.7219)=0.5702$ bits. It <em>would</em> change: it is an average of the row entropies weighted by how often each input is sent.<br>'
     +'<b>Check.</b> The four joint probabilities add to $1.00$, and the output probabilities add to $1$. Part (d) is the one worth pausing on — for the binary <em>symmetric</em> channel the two rows have the same entropy, so the weights do not matter and $H(Y\\mid X)=H(p)$ whatever the transmitter does. That is a property of symmetry, not a general rule.',
  err:'Checking that the columns sum to one. They do not here — $0.9+0.2=1.1$ — and there is no reason they should. Only the rows are distributions.',
  teach:'Part (d) separates the two facts students merge. $H(Y\\mid X)$ is a property of the channel only when the channel is symmetric. The general statement is that it is an average over the input distribution, and this channel is asymmetric enough to show the difference.' },

{ id:'D6-23', module:'M6', type:'channel', src:'CH10 w.13',
  stem:'A binary symmetric channel has crossover probability $p=0.2$ and equally likely inputs.',
  parts:['Give $H(X)$ and $H(Y\\mid X)$.',
         'Give $H(Y)$.',
         'Give the mutual information.',
         'Say what fraction of each transmitted bit the channel destroys.'],
  sol:'<b>Given.</b> A BSC at $p=0.2$, inputs equally likely.<br>'
     +'<b>Find.</b> The three entropies, $I(X;Y)$, and the fraction lost.<br>'
     +'<b>Method.</b> Use $I(X;Y)=H(Y)-H(Y\\mid X)$; the other form would need Bayes\' rule first.<br>'
     +'<b>Solution — (a).</b> $H(X)=1$ bit. Whichever symbol is sent, the output distribution is $(0.8,0.2)$ in some order, so $H(Y\\mid X)=H(0.2)=-0.2\\log_2 0.2-0.8\\log_2 0.8=0.4644+0.2575=0.7219$ bits.<br>'
     +'<b>Solution — (b).</b> $p(y_0)=0.8(0.5)+0.2(0.5)=0.5$, so the output is equally likely and $H(Y)=1$ bit.<br>'
     +'<b>Solution — (c).</b> $I(X;Y)=1-0.7219=0.2781$ bits per channel use.<br>'
     +'<b>Solution — (d).</b> $0.7219$ of every bit offered, which is $72.2\\%$.<br>'
     +'<b>Check.</b> Because the inputs are equally likely and the channel is symmetric, this $I(X;Y)$ is also the capacity: $C=1-H(0.2)=0.2781$. A crossover of one in five — which sounds survivable — leaves barely a quarter of the channel, and that mismatch between how it sounds and what it costs is the point of the question.',
  err:'Reading a balanced output as evidence that the channel is working. The output of a BSC with equally likely inputs is balanced for every $p$, including $p=\\tfrac12$ where nothing at all gets through.',
  teach:'Worth asking before any arithmetic: "one bit in five is flipped, so what fraction survives?" Almost everyone guesses about four fifths. The answer is a little over a quarter, and the gap between the guess and the answer is what entropy is for.' },

{ id:'D6-24', module:'M6', type:'capacity', src:'CH10 w.14',
  stem:'A binary symmetric channel with crossover probability $0.05$ is used $10^{6}$ times a second.',
  parts:['Give the capacity in bits per channel use.',
         'Give it in bits per second.',
         'Say whether $800$ kbit/s can be sent with an arbitrarily small error probability.',
         'Give the largest crossover probability for which $800$ kbit/s would be possible.'],
  sol:'<b>Given.</b> A BSC at $p=0.05$, used $10^{6}$ times a second.<br>'
     +'<b>Find.</b> The capacity in both units, and what rate it permits.<br>'
     +'<b>Method.</b> $C=1-H(p)$ per use; multiply by the number of uses a second for a rate. The coding theorem then decides the question in part (c).<br>'
     +'<b>Solution — (a).</b> $H(0.05)=-0.05\\log_2 0.05-0.95\\log_2 0.95=0.2161+0.0703=0.2864$, so $C=0.7136$ bits per use.<br>'
     +'<b>Solution — (b).</b> $0.7136\\times10^{6}=713.6$ kbit/s.<br>'
     +'<b>Solution — (c).</b> No. $800>713.6$, so $R_b>C$ and the coding theorem says no scheme of any kind keeps the error probability small.<br>'
     +'<b>Solution — (d).</b> Reliable transmission needs $C\\ge0.8$, so $H(p)\\le0.2$, which gives $p\\le0.0311$.<br>'
     +'<b>Check.</b> The required crossover, $0.0311$, is not far below the one on offer, $0.05$ — yet one permits the rate and the other forbids it entirely. That is what a sharp limit looks like, and it is why part (c) has a one-word answer rather than a "nearly".',
  err:'Answering (c) with "yes, with a good enough code". Above capacity there is no good enough code. The theorem is not a statement about the codes known today.',
  teach:'Part (d) is worth doing by trial: evaluate $H(p)$ at $0.03$ and at $0.04$ and close in. Students who solve it that way notice how flat $H$ is near zero, which is the same flatness that makes the first few errors on a good channel almost free.' },

{ id:'D6-25', module:'M6', type:'capacity', src:'CH10 w.14',
  stem:'A coherent binary PSK link runs at $E_b/N_0=6$ dB. The receiver makes a hard decision on every bit and hands the result to a decoder.',
  parts:['Give the crossover probability of the binary symmetric channel the decoder sees.',
         'Give the capacity of that channel in bits per channel use.',
         'The link carries $1$ Mbit/s of channel bits. Give the largest information rate that can be sent reliably.',
         'Say what the hard decision has thrown away.'],
  sol:'<b>Given.</b> Coherent BPSK at $E_b/N_0=6$ dB, hard decisions, $10^{6}$ channel bits a second.<br>'
     +'<b>Find.</b> $p$, the capacity, the largest reliable information rate, and what the hard decision costs.<br>'
     +'<b>Method.</b> The error probability of coherent BPSK is the Module 5 result; feeding it into $C=1-H(p)$ joins the two halves of the course.<br>'
     +'<b>Solution — (a).</b> $E_b/N_0=10^{0.6}=3.981$, so $p=Q\\!\\left(\\sqrt{2E_b/N_0}\\right)=Q(2.822)=2.39\\times10^{-3}$.<br>'
     +'<b>Solution — (b).</b> $H(p)=0.0242$, so $C=0.9758$ bits per channel use.<br>'
     +'<b>Solution — (c).</b> $0.9758\\times10^{6}=976$ kbit/s. Anything below that is reachable with a long enough code; anything above it is not.<br>'
     +'<b>Solution — (d).</b> How confident each decision was. The demodulator produced a number; the hard decision reduced it to a sign, and a bit that was decided by a hair is passed on looking exactly like one decided comfortably. A decoder given the numbers instead does better, and this course does not measure by how much.<br>'
     +'<b>Check.</b> The capacity is close to one bit per use, which fits the error probability: about one bit in $420$ is wrong, so a code with a little over $2\\%$ of redundancy should be enough. It is the same statement read two ways.',
  err:'Reporting the capacity as $976$ kbit/s of <em>channel</em> bits. The channel bits are already $1$ Mbit/s; the $976$ kbit/s is the <em>information</em> carried inside them, and the difference is the redundancy the code spends.',
  teach:'This is the question that shows the two halves of the course are one system. Modules 2 to 5 produce a number, $P_e$. Module 6 consumes exactly that number and returns what the link can carry. Nothing about the waveform survives the join — only $p$ crosses it.' },

{ id:'D6-26', module:'M6', type:'capacity', src:'CH10 w.14',
  stem:'A channel has bandwidth $3.4$ kHz and a signal-to-noise ratio of $30$ dB.',
  parts:['Give its capacity.',
         'Give the capacity if the transmitted power is doubled, and the gain as a percentage.',
         'Give the capacity if the bandwidth is doubled instead, at the same noise density, and the gain as a percentage.',
         'Say which is the better buy, and why the two answers differ so much.'],
  sol:'<b>Given.</b> $B=3.4$ kHz and $P/N_0B=10^{3}=1000$.<br>'
     +'<b>Find.</b> The capacity, and what doubling each of power and bandwidth buys.<br>'
     +'<b>Method.</b> $C=B\\log_2(1+P/N_0B)$. Doubling the bandwidth at fixed noise density doubles the noise power in the band, so the ratio halves — that is the step the question is built around.<br>'
     +'<b>Solution — (a).</b> $C=3400\\log_2(1001)=3400(9.967)=33.9$ kbit/s.<br>'
     +'<b>Solution — (b).</b> The ratio becomes $2000$, so $C=3400\\log_2(2001)=3400(10.967)=37.3$ kbit/s — a gain of $10.0\\%$.<br>'
     +'<b>Solution — (c).</b> The bandwidth becomes $6800$ Hz and the noise power doubles with it, so the ratio falls to $500$: $C=6800\\log_2(501)=6800(8.969)=61.0$ kbit/s — a gain of $80.0\\%$.<br>'
     +'<b>Solution — (d).</b> Bandwidth, by a long way. Capacity is <b>linear</b> in bandwidth and only <b>logarithmic</b> in the ratio, so doubling the bandwidth nearly doubles the rate while doubling the power adds one bit per second per hertz at most — and much less than that when the ratio is already $1000$.<br>'
     +'<b>Check.</b> Doubling the power added $3400$ bits a second, which is one bit per second per hertz — exactly the extra $\\log_2 2$ the formula promises. The bandwidth answer is not the same shape at all: it added $27$ kbit/s. Reading those two numbers side by side is the whole content of the law.',
  err:'Doubling the bandwidth and leaving the signal-to-noise ratio at $1000$. The noise power in the band doubles with the band, so the ratio halves. Forgetting that turns an $80\\%$ gain into a $100\\%$ one and hides the trade the question is about.',
  teach:'This question is why bandwidth is regulated and power mostly is not. The scarce resource is the one that pays linearly. It also explains a system decision students meet everywhere: when a link runs out of rate, the first thing tried is more bandwidth, and more power is the fallback.' }

]);

window.DRILLMAP_M6 = [

{ id:'m6-drill-map', module:'M6', nav:'Module 6 · question types',
  title:'Module 6 — what a question looks like',
  objective:'Name the six source-side question shapes before the module is read.',
  keywords:'question types module 6 entropy extension code kraft huffman channel capacity taxonomy',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 6 · Question types'},
  {t:'title', text:'Six shapes for the source, and the method each one wants'},
  {t:'lede', text:'Questions on information theory come in nine shapes. The six here are about the source — how much information it makes and how few bits will carry it. The other three are about the channel it is sent over, and they are collected at the head of section 6.5, where that half of the module begins.'},
  {t:'drilltypes', module:'M6', to:6, style:'grid-template-columns:repeat(3,minmax(0,1fr));gap:26px 44px'}
]}

];

window.DRILL_M6 = [

{ id:'m6-drill', module:'M6', nav:'Module 6 · practice questions',
  title:'Module 6 — practice questions',
  objective:'Twenty-six open-ended questions with worked solutions.',
  keywords:'practice questions module 6 entropy self information extension prefix kraft huffman efficiency variance lempel ziv channel mutual information capacity shannon',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 6 · Practice D6-01 … D6-26'},
  {t:'title', text:'Practice questions'},
  {t:'small', html:'Work each question on paper before opening its solution. Every solution ends with a <b>Check</b> step. In this module the cheap checks are: the entropy never exceeds $\\log_2 K$, the efficiency never exceeds one, $H(S)\\le\\bar{L}<H(S)+1$ for a prefix code, the Kraft sum never exceeds one, every Huffman code for a given source has the same average length whatever the tie-breaking, every row of a channel matrix sums to one, and the mutual information never exceeds the capacity.'},
  {t:'rule', short:true},
  {t:'drill', module:'M6'}
]}

];
})();
