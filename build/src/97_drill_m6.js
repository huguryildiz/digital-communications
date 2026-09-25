/* ==========================================================================
   Practice questions — Module 6.

   Thirty questions. Twenty-four are in the form of the final examination's
   source-coding question: a source derived from one or two others by a
   mapping, then its entropy, a binary Huffman code and the efficiency of that
   code. The close variants change the range, the mapping and the input pmfs
   so that the alphabets run from four to eight symbols and the trees differ.
   The last eight keep the examination format and add one twist each: a
   fixed-length comparison, two tie-breaking rules, a second-order extension,
   the entropy of the function against its input, a Kraft test, rounded-up
   lengths, and a reversed question.

   Six questions take the channel side. Each has the shape of a textbook
   problem already in examination form and keeps the id of the source-coding
   question it replaced, the closest duplicate of one that stays: three of
   the remainder questions, two products and one sum. D6-01 sets soft against
   hard decisions for a coded QPSK link. D6-06 is a repetition code over a
   BSC against its capacity. D6-07 tests a claimed link against the Shannon
   limit. D6-10 is a (7,4) Hamming code given by its parity-check matrix, with
   its syndrome table and its error probabilities on a BSC. D6-14 measures how
   far uncoded constellations sit from the Shannon limit. D6-22 places coded
   constellations in one band. They use the capacity of the BSC and of the
   bandlimited channel, with the bandwidth written W as on the slides, and
   any modulation error formula or Q and H_b value they need is given in the
   statement.

   Every solution works with numerators over a common denominator, so ties are
   exact. The Huffman lists place a merged sum as high as possible among equal
   values, and the upper entry of a merge takes 0. The codewords and the merge
   order drawn in each solution figure are the ones the solution text states.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;
const fr = (n,D) => '\\tfrac{'+n+'}{'+D+'}';

/* The pmf of a derived source. One stem a symbol with a round head, as a
   sequence of probabilities is drawn, in the order of the
   symbols and one unit apart, each tip labelled with its probability over the
   common denominator, so the vertical axis needs no numbers. The positions
   are 1..K rather than the symbol values: the alphabet is a set of labels, and
   a zero among them would otherwise sit under the vertical axis. */
function figPmf(o){
  const K = o.v.length, top = Math.max(...o.n)/o.D;
  const sm = o.name.toLowerCase(), xs = o.v.map((_,i)=>i+1);
  const a = P.Axes({w:720, h:230, xr:[0.3, K+0.7], yr:[0, top*1.36],
    xlabel:sm, ylabel:'P('+o.name+'='+sm+')', pad:{l:24,r:30,t:24,b:44},
    xticksOverride:xs, xtickfmt:(v=>String(o.v[Math.round(v)-1])), yticksOverride:[], grid:false});
  xs.forEach((x,i)=>{ const p = o.n[i]/o.D;
    a.poly([[x,0],[x,p]], {color:C.in, width:2});
    a.point(x, p, {color:C.in, r:4.5}); });
  xs.forEach((x,i)=>a.note(x, o.n[i]/o.D + top*0.13, fr(o.n[i],o.D),
    {tex:true, fs:14, color:C.in, anchor:'middle'}));
  return a.svg();
}

/* A pmf given in the question with its constant still unknown. The stems are
   drawn to their relative sizes and labelled in terms of c. */
function figGiven(o){
  const K = o.v.length, top = Math.max(...o.h);
  const sm = o.name.toLowerCase(), xs = o.v.map((_,i)=>i+1);
  const a = P.Axes({w:720, h:200, xr:[0.3, K+0.7], yr:[0, top*1.36],
    xlabel:sm, ylabel:'p_'+o.name+'('+sm+')', pad:{l:24,r:26,t:24,b:44},
    xticksOverride:xs, xtickfmt:(v=>String(o.v[Math.round(v)-1])), yticksOverride:[], grid:false});
  xs.forEach((x,i)=>{ a.poly([[x,0],[x,o.h[i]]], {color:C.in, width:2});
    a.point(x, o.h[i], {color:C.in, r:4.5}); });
  xs.forEach((x,i)=>a.note(x, o.h[i] + top*0.13, o.lab[i],
    {tex:true, fs:14, color:C.in, anchor:'middle'}));
  return a.svg();
}

/* The Huffman tree with its merge order, beside the code table.
   Leaves sit in one column, in the order of their codewords, so no branch
   crosses another. Merge k sits in column k: the two entries it joins run
   right to that column, the upper one labelled 0 and the lower 1, and the
   node carries the probability of the sum. Reading a leaf's labels from the
   root back gives its codeword, which the table repeats. */
function figHuff(o){
  const K = o.n.length, W = 720, rh = 30, top = o.head ? 66 : 46, H = top + K*rh + 10;
  const a = P.Axes({w:W, h:H, xr:[0,W], yr:[0,H], pad:{l:0,r:0,t:0,b:0},
    xticksOverride:[], yticksOverride:[], grid:false, zeroAxes:false, arrows:false});
  const up = y => H - y;
  const rows = o.codes.map((c,i)=>i).sort((i,j)=> o.codes[i] < o.codes[j] ? -1 : 1);
  const X0 = 270, X1 = W - 44, step = (X1 - X0)/Math.max(1, K-1);
  const X = {}, Y = {}, pr = {};
  rows.forEach((i,r)=>{ const c = o.codes[i]; X[c] = X0; Y[c] = top + r*rh + rh/2; pr[c] = o.n[i]; });
  o.order.forEach((p,k)=>{ X[p] = X0 + (k+1)*step; Y[p] = (Y[p+'0'] + Y[p+'1'])/2; pr[p] = pr[p+'0'] + pr[p+'1']; });
  const sm = o.name.toLowerCase(), hy = top - 14;
  if(o.head) a.note(10, up(20), o.head, {tex:true, fs:14, color:C.ink});
  a.note(30, up(hy-3), sm, {tex:true, fs:14, color:C.ink, anchor:'middle'});
  a.note(94, up(hy-3), 'P('+o.name+'='+sm+')', {tex:true, fs:14, color:C.ink, anchor:'middle'});
  a.note(172, up(hy), 'codeword', {fs:13, color:C.ink, anchor:'middle'});
  a.note(232, up(hy-3), 'l', {tex:true, fs:14, color:C.ink, anchor:'middle'});
  a.note(X0, up(hy), 'merge', {fs:12, color:C.muted, anchor:'middle'});
  o.order.forEach((p,k)=>a.note(X[p], up(hy), String(k+1), {fs:12, color:C.muted, anchor:'middle'}));
  a.poly([[8, up(top-4)], [W-8, up(top-4)]], {color:C.grid, width:1});
  rows.forEach(i=>{ const c = o.codes[i], y = Y[c];
    a.note(30, up(y+2), o.lab[i], {tex:true, fs:14, color:C.in, anchor:'middle'});
    a.note(94, up(y+2), fr(o.n[i], o.D), {tex:true, fs:14, color:C.in, anchor:'middle'});
    a.note(172, up(y+5), c, {fs:14, color:C.out, anchor:'middle', weight:600});
    a.note(232, up(y+5), String(c.length), {fs:14, color:C.ink, anchor:'middle'});
  });
  o.order.forEach(p=>{ const xp = X[p];
    ['0','1'].forEach(b=>{ const c = p+b;
      a.poly([[X[c], up(Y[c])], [xp, up(Y[c])]], {color:C.muted, width:1.5});
      a.note(xp-8, up(Y[c]-5), b, {fs:12, color:C.muted, anchor:'end'}); });
    a.poly([[xp, up(Y[p+'0'])], [xp, up(Y[p+'1'])]], {color:C.muted, width:1.5});
  });
  rows.forEach(i=>a.point(X0, up(Y[o.codes[i]]), {color:C.in, r:4}));
  o.order.forEach(p=>{ a.point(X[p], up(Y[p]), {color:C.mid, r:4.2});
    if(p !== '') a.note(X[p]+7, up(Y[p]-9), fr(pr[p], o.D), {tex:true, fs:12, color:C.mid}); });
  return a.svg();
}

/* The channel-side questions draw on five more frames.

   figLimit is the plane of m6-shannon and m6-limit: spectral efficiency r
   against E_b/N_0 in dB, with the capacity boundary E_b/N_0=(2^r-1)/r. The
   region to its left, where no system works reliably, is shaded as an error,
   and the -1.59 dB floor is the red dashed line. An operating point is a dot
   with its name. A gap is a bar at one r, from the boundary to the point,
   labelled with its length in dB (at `pos` when the middle of the bar is
   crowded); the boundary end is a small cyan dot. */
const limDB = r => 10*Math.log10((Math.pow(2,r)-1)/r);
function figLimit(o){
  const [xa,xb] = o.xr, rt = o.yr[1];
  const a = P.Axes({w:720, h:o.h||300, xr:o.xr, yr:[0,rt],
    xlabel:'E_b/N_0\\;(\\mathrm{dB})', ylabel:'r\\;(\\mathrm{b/s/Hz})',
    pad:{l:58,r:30,t:40,b:46}, xstep:2, ystep:1});
  const pts = [];
  for(let r=0.002; r<=rt+1e-9; r+=0.002){ const d = limDB(r); if(d>=xa && d<=xb) pts.push([d,r]); }
  const last = pts[pts.length-1];
  const reg = [[xa,0],[pts[0][0],0]].concat(pts, last[1] < rt-1e-6 ? [[xb,last[1]],[xb,rt]] : [], [[xa,rt]]);
  a.under('<path d="M'+reg.map(p=>a.sx(p[0]).toFixed(2)+','+a.sy(p[1]).toFixed(2)).join('L')+'Z" fill="'+C.dec.err+'"/>');
  a.vline(10*Math.log10(Math.log(2)), {color:C.err, width:1.6, dash:'5 4'});
  a.poly(pts, {color:C.in, width:2.3});
  if(o.imp) a.note(o.imp[0], o.imp[1], '\\text{no reliable system}', {tex:true, fs:13, color:C.err, anchor:'middle'});
  if(o.floor) a.note(10*Math.log10(Math.log(2))-0.2, o.floor, '-1.59\\ \\mathrm{dB}', {tex:true, fs:12, color:C.err, anchor:'end'});
  (o.gaps||[]).forEach(g=>{ const x0 = limDB(g.r);
    a.poly([[x0,g.r],[g.x,g.r]], {color:g.c, width:2, dash:'6 4'});
    a.point(x0, g.r, {color:C.in, r:3.4});
    if(g.pos) a.note(g.pos[0], g.pos[1], g.lab, {tex:true, fs:12, color:g.c, anchor:g.pos[2]});
    else a.note((x0+g.x)/2 + (g.dx||0), g.r + (g.dy==null ? 0.24 : g.dy), g.lab, {tex:true, fs:12, color:g.c, anchor:'middle'}); });
  (o.pts||[]).forEach(p=>{
    a.point(p.x, p.r, {color:p.c, r:5});
    a.note(p.x + (p.dx==null ? 0.25 : p.dx), p.r + (p.dy||0), p.lab, {tex:true, fs:13, color:p.c, anchor:p.anchor||'start'}); });
  return a.svg();
}

/* figRange is the bit rate an adaptive link offers against distance: a
   staircase that steps down where each constellation runs out of range, with
   each range marked by a dashed drop to the axis. The dot is the user's
   distance on the scheme chosen there. */
function figRange(o){
  const a = P.Axes({w:720, h:260, xr:[0,o.dmax], yr:[0,o.Rmax],
    xlabel:'d\\;(\\mathrm{km})', ylabel:'R_b\\;(\\mathrm{Mb/s})',
    pad:{l:58,r:30,t:24,b:46}, xstep:0.5, ystep:6});
  let d0 = 0;
  o.steps.forEach(s=>{
    a.poly([[d0,s.R],[s.d,s.R]], {color:C.out, width:2.6});
    a.poly([[s.d,s.R],[s.d,0]], {color:C.muted, width:1.2, dash:'3 4'});
    a.note((d0+s.d)/2, s.R-3.4, s.lab, {tex:true, fs:13, color:C.out, anchor:'middle'});
    a.note(s.d+0.03, 1.2, s.dlab, {tex:true, fs:12, color:C.muted});
    d0 = s.d; });
  a.point(o.at, o.pick, {color:C.out, r:5.5});
  a.note(o.at, o.pick+2.2, 'd='+o.at+'\\ \\mathrm{km}', {tex:true, fs:12, color:C.out, anchor:'middle'});
  return a.svg();
}

/* figFlips is the pmf of the number K of flipped copies of one bit sent n
   times over a binary symmetric channel. The probabilities span several
   decades, so the stems are drawn on a logarithmic scale, each tip labelled
   with its value; the vertical axis carries no numbers. The values of K for
   which the majority vote fails sit on a red band, and their stems are red.
   A decoder that fails from `t` flips on, not from (n+1)/2, passes `t` and
   its own `head`; `room` adds headroom when the pmf spans many decades. */
function figFlips(o){
  const n = o.n, p = o.p, t = o.t || (n+1)/2;
  const comb = (m,k) => { let c = 1; for(let i=1;i<=k;i++) c = c*(m-k+i)/i; return c; };
  const pk = k => comb(n,k)*Math.pow(p,k)*Math.pow(1-p,n-k);
  const lo = Math.floor(Math.log10(pk(n))) - 0.6;
  const y = k => Math.log10(pk(k)) - lo, top = -lo + (o.room || 2.0);
  const a = P.Axes({w:720, h:o.h||240, xr:[0.3, n+1.7], yr:[0, top],
    xlabel:'k', ylabel:'P(K=k)\\;\\text{on a log scale}', pad:{l:24,r:30,t:24,b:44},
    xticksOverride:Array.from({length:n+1},(_,k)=>k+1), xtickfmt:(v=>String(Math.round(v)-1)),
    yticksOverride:[], grid:false});
  a.rect(t+0.5, 0, n+1.7, top, {fill:C.dec.err});
  for(let k=0;k<=n;k++){ const col = k>=t ? C.err : C.in;
    a.poly([[k+1,0],[k+1,y(k)]], {color:col, width:2});
    a.point(k+1, y(k), {color:col, r:4.5});
    a.note(k+1, y(k), o.lab[k], {tex:true, fs:12, color:col, anchor:'middle', dy:-16}); }
  const xm = (t+0.5+n+1.7)/2;
  a.note(xm, top-1.0, o.head || 'n='+n+'\\text{: the vote fails}', {tex:true, fs:13, color:C.err, anchor:'middle'});
  a.note(xm, top-1.0, o.fail, {tex:true, fs:13, color:C.err, anchor:'middle', dy:26});
  return a.svg();
}

/* The Gaussian tail and the binary entropy, for drawn curves only (the
   Borjesson-Sundberg form of Q, relative error below 0.3%). Every number a
   solution states comes from the table in its statement. */
function Qfn(x){
  if(x < 0) return 1 - Qfn(-x);
  return Math.exp(-x*x/2)/((0.661*x + 0.339*Math.sqrt(x*x + 5.51))*Math.sqrt(2*Math.PI));
}
const Hb = p => (p <= 0 || p >= 1) ? 0 : -(p*Math.log2(p) + (1-p)*Math.log2(1-p));

/* figHard is the capacity of one coded bit against E_b/N_0 for a code of
   rate R on Gray-coded QPSK. Kept soft, a coded bit is one use of the
   Gaussian channel, (1/2)log2(1+2E_c/N_0) with E_c=R E_b (cyan). Decided
   hard, it is one use of a BSC, 1-H_b(Q(sqrt(2E_c/N_0))) (violet, a
   quantized quantity). Each curve meets the dashed line at R at its limit;
   dotted drops take the two limits down to a red bracket that carries the
   loss. The green line is the operating point: its soft dot is green, above
   R, and its hard dot red, below it. */
function figHard(o){
  /* The frame is drawn in u = E_b/N_0 + 2.5 dB, so the range starts right of
     zero and the vertical axis sits at the left edge, not across the curves
     at 0 dB. Every x below goes through X(); the tick labels undo it. */
  const R = o.R, X = x => x + 2.5, lin = x => Math.pow(10, x/10);
  const soft = x => 0.5*Math.log2(1 + 2*R*lin(x));
  const hard = x => 1 - Hb(Qfn(Math.sqrt(2*R*lin(x))));
  const a = P.Axes({w:720, h:300, xr:[X(-2),X(4.5)], yr:[0,1.2],
    xlabel:'E_b/N_0\\;(\\mathrm{dB})', ylabel:'C\\;(\\text{bits per use})',
    pad:{l:58,r:30,t:40,b:46}, ystep:0.2,
    xticksOverride:[-2,-1,0,1,2,3,4].map(X), xtickfmt:(u=>String(Math.round(u-2.5)))});
  a.hline(R, {color:C.muted, dash:'6 4', width:1.4});
  a.note(X(-1.9), R+0.04, 'R='+o.Rlab, {tex:true, fs:13, color:C.muted});
  a.curve(u=>soft(u-2.5), {color:C.in, width:2.3});
  a.curve(u=>hard(u-2.5), {color:C.mid, width:2.3});
  a.note(X(3.4), soft(3.4)+0.05, '\\text{soft}', {tex:true, fs:13, color:C.in, anchor:'end'});
  a.note(X(3.9), hard(3.9)+0.05, '\\text{hard}', {tex:true, fs:13, color:C.mid, anchor:'end'});
  const yb = 0.3;
  [[o.soft, C.in], [o.hard, C.mid]].forEach(([x,c])=>{
    a.poly([[X(x),R],[X(x),yb]], {color:c, width:1.2, dash:'3 4'});
    a.point(X(x), R, {color:c, r:4.2}); });
  a.span(X(o.soft), X(o.hard), yb, '', {color:C.err});
  a.note(X((o.soft+o.at)/2), yb+0.03, o.loss, {tex:true, fs:13, color:C.err, anchor:'middle'});
  a.note(X(o.soft), yb-0.09, o.softLab, {tex:true, fs:12, color:C.in, anchor:'middle'});
  a.note(X(o.hard), yb-0.09, o.hardLab, {tex:true, fs:12, color:C.mid, anchor:'middle'});
  a.poly([[X(o.at),0],[X(o.at),soft(o.at)]], {color:C.out, width:1.4, dash:'5 4'});
  a.point(X(o.at), soft(o.at), {color:C.out, r:5});
  a.point(X(o.at), hard(o.at), {color:C.err, r:5});
  a.note(X(o.at-0.1), soft(o.at)+0.05, o.cs, {tex:true, fs:12, color:C.out, anchor:'end'});
  a.note(X(o.at+0.1), hard(o.at)-0.08, o.ch, {tex:true, fs:12, color:C.err, anchor:'start'});
  return a.svg();
}

/* figSyn decodes one received word of the (7,4) code. The received bits sit
   over the three rows of H, one column a position; the flipped bit is red.
   The syndrome, at the right of the rows, equals the column of H boxed in
   red, which names the position. The last row is the decoded codeword, with
   the corrected bit on a green cell, and its data bits at the right. */
function figSyn(o){
  const W = 720, H = 268, X0 = 236, dx = 52, XS = 650;
  const a = P.Axes({w:W, h:H, xr:[0,W], yr:[0,H], pad:{l:0,r:0,t:0,b:0},
    xticksOverride:[], yticksOverride:[], grid:false, zeroAxes:false, arrows:false});
  const up = y => H - y, xs = i => X0 + (i-1)*dx, e = o.err;
  const bit = (i, y, b, col, w) => a.note(xs(i), up(y+6), b, {fs:17, color:col, anchor:'middle', weight:w||400});
  a.note(20, up(30), 'position', {fs:12, color:C.muted});
  for(let i=1;i<=7;i++) a.note(xs(i), up(30), String(i), {fs:12, color:C.muted, anchor:'middle'});
  a.note(XS, up(30), 'syndrome', {fs:12, color:C.muted, anchor:'middle'});
  a.poly([[xs(4.5), up(44)], [xs(4.5), up(252)]], {color:C.grid, width:1});
  a.rect(xs(e)-19, up(210), xs(e)+19, up(44), {fill:C.dec.err});
  a.rect(xs(e)-19, up(188), xs(e)+19, up(96), {stroke:C.err, width:1.6});
  a.note(20, up(68), 'r', {tex:true, fs:15, color:C.out});
  o.r.split('').forEach((b,k)=>bit(k+1, 64, b, k+1===e ? C.err : C.out, k+1===e ? 700 : 500));
  a.poly([[14, up(86)], [W-14, up(86)]], {color:C.grid, width:1});
  o.H.forEach((row,j)=>{ const y = 114 + 32*j;
    a.note(20, up(y+4), '\\text{check }'+(j+1), {tex:true, fs:14, color:C.mid});
    row.split('').forEach((b,k)=>bit(k+1, y, b, b==='1' ? C.mid : C.muted, b==='1' ? 600 : 400));
    a.note(XS, up(y+4), 's_'+(j+1)+'='+o.s[j], {tex:true, fs:15, color:C.err, anchor:'middle'}); });
  a.note(xs(e), up(206), '\\text{column }'+e, {tex:true, fs:12, color:C.err, anchor:'middle'});
  a.poly([[14, up(218)], [W-14, up(218)]], {color:C.grid, width:1});
  a.rect(xs(e)-19, up(256), xs(e)+19, up(226), {fill:C.dec.out});
  a.note(20, up(246), '\\hat{c}', {tex:true, fs:15, color:C.out});
  o.c.split('').forEach((b,k)=>bit(k+1, 242, b, C.out, k+1===e ? 700 : 500));
  a.note(XS, up(246), '\\text{data }\\mathtt{'+o.c.slice(0,4)+'}', {tex:true, fs:14, color:C.out, anchor:'middle'});
  return a.svg();
}

/* ======================================================================
   The taxonomy: the three columns of the examination question, three
   shapes that add one judgement to it, and four shapes on the channel side.
   ====================================================================== */
CONTENT.DRILLTYPES.M6 = [
  { k:'fx', name:'A function of one uniform source',
    asks:'A uniform source $X$ and a mapping $Y\\triangleq f(X)$ are given: a remainder, an absolute value, a square, a floor, a maximum or a bit count. Find the entropy of $Y$, a binary Huffman code and its efficiency.',
    method:['List $f(x)$ for every value of $X$. A remainder is taken in $\\{0,\\ldots,m-1\\}$, also for a negative number.',
            'Add the probabilities of the values that give the same $y$. The pmf of $Y$ adds to one, and $H(Y)\\le\\log_2 K$ for $K$ symbols.',
            'Build the Huffman code on numerators over a common denominator. Then $\\bar{L}=\\sum_y P(Y=y)\\,l(y)$ and $\\eta=H(Y)/\\bar{L}$.'],
    go:'m6-entropy' },

  { k:'fxz', name:'A function of two sources, one with an unknown constant',
    asks:'A uniform $X$ and an independent $Z$ whose pmf holds a constant $c$ are given, with $Y\\triangleq f(X,Z)$. Find $c$, then the entropy, a Huffman code and its efficiency.',
    method:['Find $c$ from $\\sum_z p_Z(z)=1$. A negative exponent inverts the base, so $\\left(\\tfrac13\\right)^{-1}=3$.',
            'Over a common denominator, the pair $(x,z)$ has weight $n_X(x)\\,n_Z(z)$. Add the weights of the pairs that give the same $y$.',
            'Check that the numerators add to the denominator before the tree is built. Then code and judge as for one source.'],
    go:'m6-huffman' },

  { k:'sum', name:'Two independent sources described by ratios',
    asks:'Two independent sources are given by alphabets and ratio statements, and $Z$ is their sum, difference, product, minimum or distance. Find the entropy, a Huffman code and its efficiency.',
    method:['Turn each ratio statement into probabilities. Call the smallest one $q$, write the others as multiples of it, and use the sum of one.',
            'Tabulate $z$ for every pair $(x,y)$, and add the product probabilities of the cells with the same $z$.',
            'Merge the two smallest, $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals.'],
    go:'m6-coding' },

  { k:'judge', name:'Judging a code',
    asks:'A source is coded twice, or a proposed code is given. Compare with a fixed-length code, test the Kraft inequality, or compare the length variance of two Huffman codes.',
    method:['A fixed-length code needs $\\lceil\\log_2 K\\rceil$ bits. Lengths $l_k$ admit a prefix code only if $\\sum_k 2^{-l_k}\\le 1$.',
            'An average length below the entropy is impossible for a uniquely decodable code. Two Huffman codes of one source have the same $\\bar{L}$.',
            'Codes with equal $\\bar{L}$ differ in $\\sigma^{2}=\\sum_k p_k(l_k-\\bar{L})^{2}$. The smaller variance gives the steadier bit rate.'],
    go:'m6-huffman-var' },

  { k:'block', name:'Coding the second-order extension',
    asks:'A source with few symbols is coded one symbol at a time, then in pairs. Compare the bits per symbol and the efficiencies.',
    method:['The extension has $K^{2}$ symbols. For a memoryless source each pair probability is a product.',
            'Build the Huffman code on the pairs, then divide its average length by two.',
            'Since $H(S^{2})=2H(S)$, the pair code has efficiency $2H(S)/\\bar{L}_2$. It is never below that of the single-symbol code.'],
    go:'m6-bound' },

  { k:'info', name:'The entropy of a function against its inputs',
    asks:'A source derived from others is given. Besides its code, find the joint entropy, a conditional entropy or the mutual information between the output and an input.',
    method:['A function of $X$ has $H(Y\\mid X)=0$, so $I(X;Y)=H(Y)$ and $H(X,Y)=H(X)$.',
            'For $Z=X+Y$ with independent inputs, fixing $X$ leaves only the uncertainty of $Y$, so $H(Z\\mid X)=H(Y)$.',
            'Check $H(Y)\\le H(X)$ for a function, and $I(X;Z)\\le\\min\\{H(X),H(Z)\\}$ for any pair.'],
    go:'m6-condent' },

  { k:'coding', name:'Repetition coding over a binary symmetric channel',
    asks:'A block of bits crosses a BSC without coding, then with a repetition code and a majority vote. Find the bit and block error probabilities, the rate each code costs, and compare with the capacity.',
    method:['The number of flipped copies among $n$ is binomial, $P(K=j)=\\binom{n}{j}p^{j}(1-p)^{n-j}$. A majority vote over odd $n$ fails when $K\\ge(n+1)/2$.',
            'A block of $k$ bits is correct only when every bit is, so $P_B=1-(1-P_b)^{k}$.',
            'A repetition code has rate $1/n$. The BSC allows any rate below $C=1-H_b(p)$ with an error as small as required.'],
    go:'m6-coding-thm' },

  { k:'hamming', name:'A $(7,4)$ Hamming code',
    asks:'A $(7,4)$ Hamming code is given by its parity-check matrix $H$. Find codewords, $d_{\\min}$ and $t$, the syndrome table and a decoded word, and the probabilities of correct and wrong decoding on a BSC.',
    method:['Each row of $H$ is a parity check that passes on an even number of ones. It fixes one parity bit as the XOR of the data bits it covers.',
            'One error at position $i$ gives the syndrome equal to column $i$ of $H$. Seven different nonzero columns give $d_{\\min}=3$ and $t=1$.',
            'The decoder is right when at most one bit flips, so $P_c=(1-p)^{7}+7p(1-p)^{6}$. Two or more flips give a wrong codeword.'],
    go:'m6-codes-glimpse' },

  { k:'hard', name:'Soft and hard decisions',
    asks:'A binary code of rate $R$ is sent with Gray-coded QPSK. Find the least $E_b/N_0$ with soft decisions, the least with hard decisions that make a BSC, and the loss in dB.',
    method:['Each coded bit has energy $E_c=R\\,E_b$. A QPSK symbol carries two coded bits, so $E_s=2E_c$ and $r=2R$.',
            'Soft decisions keep the Gaussian channel, so the Shannon limit $E_b/N_0\\ge(2^{r}-1)/r$ applies.',
            'Hard decisions give a BSC with $p=Q\\big(\\sqrt{2E_c/N_0}\\big)$, which needs $1-H_b(p)\\ge R$. The loss is the difference of the two limits in dB.'],
    go:'m6-bsc' },

  { k:'capacity', name:'The Shannon limit of the bandlimited channel',
    asks:'A bit rate, a bandwidth and a received power are given, or a constellation and a target error probability. Find the spectral efficiency, the Shannon limit at that efficiency, and the gap in dB.',
    method:['The spectral efficiency is $r=R_b/W$. A reliable link needs $E_b/N_0\\ge(2^{r}-1)/r$.',
            'The energy per bit is $E_b=P/R_b$. A symbol that carries $r$ information bits has $E_s=r\\,E_b$.',
            'A gap in dB is a difference of values in dB, which is $10\\log_{10}$ of a ratio of energies.'],
    go:'m6-shannon' }
];

/* ======================================================================
   The questions.
   ====================================================================== */
CONTENT.DRILL = CONTENT.DRILL.concat([
{ id:'D6-01', module:'M6', type:'hard', src:'Madhow P7.4',
  stem:'A binary code of rate $R=\\tfrac35$ is sent with Gray-coded QPSK over a passband channel of bandwidth $W$. The noise is white and Gaussian with two-sided power spectral density $N_0/2$. The symbols use ideal Nyquist pulses with no excess bandwidth, so the link sends $W$ symbols per second. With Gray coding, each QPSK symbol carries two coded bits, and each coded bit is detected like one BPSK bit. Let $E_b$ be the energy per information bit, $E_c$ the energy per coded bit and $E_s$ the energy per symbol. A hard decision on each coded bit turns the link into a binary symmetric channel (BSC) with crossover probability $p=Q\\big(\\sqrt{2E_c/N_0}\\big)$. Here $Q(x)$ is the probability that a zero-mean, unit-variance Gaussian variable exceeds $x$. The binary entropy is $H_b(p)=-p\\log_2 p-(1-p)\\log_2(1-p)$. Use $Q(1.302)=0.0965$, $Q(1.409)=0.0794$ and $H_b(0.0965)=0.4578$. This entropy reaches $H_b(p)=0.4$ at $p=0.0794$.',
  parts:['[5 pts] Express $E_c$ and $E_s$ in terms of $E_b$, and $E_s/N_0$ in dB in terms of $E_b/N_0$ in dB. Find the spectral efficiency $r=R_b/W$ of the link.',
         '[6 pts] The receiver keeps its matched-filter outputs as they are, which is a soft decision. Find the Shannon limit at efficiency $r$, the least $E_b/N_0$ in dB for reliable transmission.',
         '[8 pts] The receiver makes hard decisions instead. Reliable transmission then needs the BSC capacity $1-H_b(p)$ to be at least $R$. Find the least $E_b/N_0$ in dB with hard decisions, and the loss in dB against part (b).',
         '[6 pts] The link runs at $E_b/N_0=1.5$ dB. Find $p$ and the capacity of the BSC. Decide whether reliable transmission is possible with soft decisions and with hard decisions, and give each margin or shortfall in dB.'],
  figSol: () => figHard({R:0.6, Rlab:'\\tfrac35', soft:0.34, hard:2.19, at:1.5,
    loss:'1.85\\ \\mathrm{dB}', softLab:'0.34', hardLab:'2.19', cs:'0.7152', ch:'0.5422'}),
  sol:'<b>Given.</b> A code of rate $R=\\tfrac35$ on Gray-coded QPSK, $W$ symbols per second in a band $W$, and noise of two-sided density $N_0/2$. A hard decision gives a BSC with $p=Q\\big(\\sqrt{2E_c/N_0}\\big)$. The statement gives two values of $Q$ and two points of $H_b$.<br>'
     +'<b>Find.</b> $E_c$, $E_s$ and $r$. The least $E_b/N_0$ with soft and with hard decisions, and the loss between them. The two verdicts at $E_b/N_0=1.5$ dB.<br>'
     +'<b>Method.</b> Soft decisions leave the channel Gaussian, so the bandlimited channel sets the limit at efficiency $r$:'
     +'$$\\frac{E_b}{N_0}\\ge\\frac{2^{r}-1}{r}$$'
     +'Hard decisions turn each coded bit into one use of a BSC. By the channel coding theorem, a code of rate $R$ can be reliable only if $R\\le C=1-H_b(p)$.'
     +' $H_b(p)$ grows on $0<p<\\tfrac12$, and $p$ falls as $E_c/N_0$ grows. So the least $E_b/N_0$ with hard decisions is the one that makes $C=R$ exactly.'
     +' A ratio $x$ is $10\\log_{10}x$ in dB, and a factor becomes an added term in dB.<br>'
     +'<b>Solution — (a).</b> '
     +'Each information bit is carried by $1/R$ coded bits, so $E_b=E_c/R$. The energy per coded bit is'
     +'$$\\begin{aligned}'
     +'E_c&=R\\,E_b\\\\'
     +'&=\\tfrac35\\,E_b\\\\'
     +'&=0.6\\,E_b'
     +'\\end{aligned}$$'
     +'A QPSK symbol carries two coded bits, so'
     +'$$\\begin{aligned}'
     +'E_s&=2E_c\\\\'
     +'&=2(0.6)\\,E_b\\\\'
     +'&=1.2\\,E_b'
     +'\\end{aligned}$$'
     +'In dB the factor $1.2$ adds $10\\log_{10}1.2=0.79$ dB:'
     +'$$\\frac{E_s}{N_0}\\bigg|_{\\text{dB}}=\\frac{E_b}{N_0}\\bigg|_{\\text{dB}}+0.79\\ \\text{dB}$$'
     +'The link sends $W$ symbols per second. Each symbol carries two coded bits, which hold $2R=1.2$ information bits.'
     +'$$\\begin{aligned}'
     +'R_b&=W(2)(0.6)\\\\'
     +'&=1.2\\,W'
     +'\\end{aligned}$$'
     +'The spectral efficiency is'
     +'$$\\begin{aligned}'
     +'r&=\\frac{R_b}{W}\\\\'
     +'&=1.2\\ \\text{b/s/Hz}'
     +'\\end{aligned}$$'
     +'As on any link that sends $W$ symbols per second in a band $W$, $E_s=r\\,E_b$.<br>'
     +'<b>Solution — (b).</b> '
     +'Put $r=1.2$ into the limit. A calculator gives $2^{1.2}=2.2974$.'
     +'$$\\begin{aligned}'
     +'\\frac{E_b}{N_0}\\bigg|_{\\text{soft}}&=\\frac{2^{1.2}-1}{1.2}\\\\'
     +'&=\\frac{1.2974}{1.2}\\\\'
     +'&=1.0812\\\\'
     +'&=10\\log_{10}1.0812\\ \\text{dB}\\\\'
     +'&=0.34\\ \\text{dB}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> '
     +'The BSC carries the code only if $1-H_b(p)\\ge0.6$, which is $H_b(p)\\le0.4$. The statement gives $H_b(p)=0.4$ at $p=0.0794$.'
     +' $H_b$ grows with $p$ below $\\tfrac12$, so the condition is $p\\le0.0794$.'
     +' The statement also gives $Q(1.409)=0.0794$. $Q$ falls as its argument grows, so $p\\le0.0794$ needs $\\sqrt{2E_c/N_0}\\ge1.409$. Square both sides and divide by $2$.'
     +'$$\\begin{aligned}'
     +'\\frac{E_c}{N_0}&\\ge\\frac{1.409^{2}}{2}\\\\'
     +'&=\\frac{1.9853}{2}\\\\'
     +'&=0.9926'
     +'\\end{aligned}$$'
     +'Divide by $R$ to return to the energy per information bit.'
     +'$$\\begin{aligned}'
     +'\\frac{E_b}{N_0}\\bigg|_{\\text{hard}}&=\\frac{0.9926}{0.6}\\\\'
     +'&=1.6544\\\\'
     +'&=10\\log_{10}1.6544\\ \\text{dB}\\\\'
     +'&=2.19\\ \\text{dB}'
     +'\\end{aligned}$$'
     +'The loss of hard decisions is the difference of the two limits.'
     +'$$2.19-0.34=1.85\\ \\text{dB}$$'
     +'Hard decisions need $1.85$ dB more energy per bit for the same code rate.<br>'
     +'<b>Solution — (d).</b> '
     +'Convert the operating point to a ratio, $10^{1.5/10}=1.4125$. The energy per coded bit is then'
     +'$$\\begin{aligned}'
     +'\\frac{E_c}{N_0}&=0.6\\,(1.4125)\\\\'
     +'&=0.8475'
     +'\\end{aligned}$$'
     +'The crossover probability follows from the value of $Q(1.302)$ in the statement.'
     +'$$\\begin{aligned}'
     +'p&=Q\\Big(\\sqrt{2(0.8475)}\\Big)\\\\'
     +'&=Q\\big(\\sqrt{1.6950}\\big)\\\\'
     +'&=Q(1.302)\\\\'
     +'&=0.0965'
     +'\\end{aligned}$$'
     +'The capacity of this BSC is'
     +'$$\\begin{aligned}'
     +'C&=1-H_b(0.0965)\\\\'
     +'&=1-0.4578\\\\'
     +'&=0.5422\\ \\text{bits per use}'
     +'\\end{aligned}$$'
     +'With hard decisions, $C=0.5422$ lies below $R=0.6$, so no code of rate $\\tfrac35$ is reliable. The link is $2.19-1.50=0.69$ dB short.'
     +' With soft decisions, $1.50$ dB lies above the limit of $0.34$ dB, so a code of rate $\\tfrac35$ can be reliable. It has $1.50-0.34=1.16$ dB to spare.'
     +' The same link works or fails according to what the receiver keeps.<br>'
     +'<b>Check.</b> '
     +'A coded bit kept soft is one use of the Gaussian channel, with signal energy $E_c$ and noise variance $N_0/2$. So $P/P_N=2E_c/N_0$, and its capacity is $\\tfrac12\\log_2(1+2E_c/N_0)$ bits per use.'
     +' At the soft limit, $2E_c/N_0=2(0.6)(1.0812)=1.2974$.'
     +'$$\\begin{aligned}'
     +'\\tfrac12\\log_2(1+1.2974)&=\\tfrac12\\log_2 2.2974\\\\'
     +'&=\\tfrac12(1.2)\\\\'
     +'&=0.6'
     +'\\end{aligned}$$'
     +'This equals $R$, so the two routes give one limit. At $1.5$ dB the soft capacity is'
     +'$$\\begin{aligned}'
     +'\\tfrac12\\log_2(1+1.6950)&=\\tfrac12\\log_2 2.6950\\\\'
     +'&=\\tfrac12(1.4303)\\\\'
     +'&=0.7152'
     +'\\end{aligned}$$'
     +'It lies above $0.6$, while the hard value $0.5422$ lies below. The two verdicts of part (d) agree with the two limits.',
  err:'Using $p=Q\\big(\\sqrt{2E_b/N_0}\\big)$ with the energy per information bit. The BSC carries coded bits, so the energy in $p$ is $E_c=R\\,E_b$, which is $2.22$ dB less here.',
  teach:'A hard decision keeps one bit of each matched-filter output and discards how sure it was. At rate $\\tfrac35$ that costs $1.85$ dB, and at $1.5$ dB it decides between a working link and a failing one.' },

{ id:'D6-02', module:'M6', type:'fx', src:'Final Q4',
  stem:'Let $X$ be a discrete memoryless source (DMS) which is modeled as a uniform random variable taking the integer values between $0$ and $9$. Let $Y\\triangleq X^{2}\\;(\\bmod 10)$ be another DMS which is a function of $X$. Here $a\\bmod m$ denotes the remainder of $a$ on division by $m$, taken in $\\{0,1,\\ldots,m-1\\}$. In words, $Y$ is the last decimal digit of $X^{2}$.',
  parts:['[10 pts] Calculate the entropy of the source, $Y$.',
         '[10 pts] Design a <em>binary</em> Huffman code for the source, $Y$.',
         '[5 pts] Calculate the coding efficiency of the Huffman code designed in part (b).'],
  figSol: () => figPmf({v:[0,1,4,5,6,9],n:[1,2,2,1,2,2],D:10,name:'Y'})+figHuff({n:[1,2,2,1,2,2],D:10,name:'Y',lab:['0','1','4','5','6','9'],codes:['010','10','11','011','000','001'],order:['01','00','1','0','']}),
  sol:'<b>Given.</b> $X$ is uniform on $0,1,\\ldots,9$, and $Y=X^{2}\\bmod 10$.<br>'
     +'<b>Find.</b> $H(Y)$, a binary Huffman code for $Y$, and its coding efficiency.<br>'
     +'<b>Method.</b> List $Y$ for every value of $X$, then add the probabilities that give the same value of $Y$. The entropy is $H(Y)=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Y)/\\bar{L}$.<br>'
     +'<b>Solution — (a).</b> '
     +'Each of the ten values of $X$ has probability $\\tfrac{1}{10}$. For example $7^{2}=49$ gives $Y=9$, and $4^{2}=16$ gives $Y=6$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' y&x\\ \\text{values}&P(Y=y)\\\\\\hline'
     +' 0&0&\\frac{1}{10}\\\\'
     +' 1&1,\\,9&\\frac{2}{10}\\\\'
     +' 4&2,\\,8&\\frac{2}{10}\\\\'
     +' 5&5&\\frac{1}{10}\\\\'
     +' 6&4,\\,6&\\frac{2}{10}\\\\'
     +' 9&3,\\,7&\\frac{2}{10}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{10}{10}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}\\\\'
     +'&=4\\cdot\\frac{2}{10}\\log_2 5+2\\cdot\\frac{1}{10}\\log_2 10\\\\'
     +'&=4(0.46439)+2(0.33219)\\\\'
     +'&=2.5219\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'Work with the numerators over $10$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $2,2,2,2,1,1$.<br>'
     +'Merge $1$: $1+1=2$, list $\\mathbf{2},2,2,2,2$.<br>'
     +'Merge $2$: $2+2=4$, list $\\mathbf{4},2,2,2$.<br>'
     +'Merge $3$: $2+2=4$, list $\\mathbf{4},4,2$.<br>'
     +'Merge $4$: $4+2=6$, list $\\mathbf{6},4$.<br>'
     +'Merge $5$: $6+4=10$, list $\\mathbf{10}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' y&P(Y=y)&\\text{codeword}&l\\\\\\hline'
     +' 6&\\frac{2}{10}&\\mathtt{000}&3\\\\'
     +' 9&\\frac{2}{10}&\\mathtt{001}&3\\\\'
     +' 0&\\frac{1}{10}&\\mathtt{010}&3\\\\'
     +' 5&\\frac{1}{10}&\\mathtt{011}&3\\\\'
     +' 1&\\frac{2}{10}&\\mathtt{10}&2\\\\'
     +' 4&\\frac{2}{10}&\\mathtt{11}&2'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (c).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{y}P(Y=y)\\,l(y)\\\\'
     +'&=\\frac{1}{10}\\bigl[2(3)+2(3)+1(3)+1(3)\\\\&\\qquad+2(2)+2(2)\\bigr]\\\\'
     +'&=\\frac{26}{10}\\\\'
     +'&=\\frac{13}{5}\\\\'
     +'&=2.6000\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Y)}{\\bar{L}}\\\\'
     +'&=\\frac{2.5219}{2.6000}\\\\'
     +'&=0.9700'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=97.00\\%$.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{2+4+4+6+10}{10}=\\frac{26}{10}$$'
     +'This matches part (c). The entropy follows by a second route, from the numerators $n_y=10\\,P(Y=y)$:'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\log_2 10-\\frac{1}{10}\\sum_{y}n_y\\log_2 n_y\\\\'
     +'&=3.3219-\\frac{1}{10}\\bigl(4\\cdot2\\log_2 2\\bigr)\\\\'
     +'&=3.3219-0.8000\\\\'
     +'&=2.5219'
     +'\\end{aligned}$$'
     +'The Kraft sum is $2\\cdot 2^{-2}+4\\cdot 2^{-3}=1$, so the tree has no unused branch. The bound $2.5219\\le 2.6000<3.5219$ holds.'
     +' Each digit other than $0$ and $5$ comes from a pair $x$ and $10-x$, because $(10-x)^{2}=100-20x+x^{2}$ ends in the same digit as $x^{2}$.',
  err:'Listing the digits $0,1,4,5,6,9$ and treating them as equally likely. The digits $0$ and $5$ each come from one value of $X$, and the other four from two.',
  teach:'Ask first which last digits a square can never have. The answer $2,3,7,8$ gives the alphabet of $Y$ before any probability is computed.' },

{ id:'D6-03', module:'M6', type:'fx', src:'Final Q4',
  stem:'Let $X$ be a discrete memoryless source (DMS) which is modeled as a uniform random variable taking the integer values between $1$ and $12$. Let $Y\\triangleq \\left\\lfloor 12/X\\right\\rfloor$ be another DMS which is a function of $X$. Here $\\lfloor u\\rfloor$ is the largest integer not greater than $u$.',
  parts:['[10 pts] Calculate the entropy of the source, $Y$.',
         '[10 pts] Design a <em>binary</em> Huffman code for the source, $Y$.',
         '[5 pts] Calculate the coding efficiency of the Huffman code designed in part (b).'],
  figSol: () => figPmf({v:[1,2,3,4,6,12],n:[6,2,1,1,1,1],D:12,name:'Y'})+figHuff({n:[6,2,1,1,1,1],D:12,name:'Y',lab:['1','2','3','4','6','12'],codes:['1','001','010','011','0000','0001'],order:['000','01','00','0','']}),
  sol:'<b>Given.</b> $X$ is uniform on $1,2,\\ldots,12$, and $Y=\\lfloor 12/X\\rfloor$.<br>'
     +'<b>Find.</b> $H(Y)$, a binary Huffman code for $Y$, and its coding efficiency.<br>'
     +'<b>Method.</b> List $Y$ for every value of $X$, then add the probabilities that give the same value of $Y$. The entropy is $H(Y)=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Y)/\\bar{L}$.<br>'
     +'<b>Solution — (a).</b> '
     +'Each of the twelve values of $X$ has probability $\\tfrac{1}{12}$. The floor keeps the integer part.'
     +' For example $\\lfloor 12/5\\rfloor=\\lfloor 2.4\\rfloor=2$ and $\\lfloor 12/7\\rfloor=\\lfloor 1.71\\rfloor=1$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' y&x\\ \\text{values}&P(Y=y)\\\\\\hline'
     +' 1&7,\\,8,\\,9,\\,10,\\,11,\\,12&\\frac{6}{12}\\\\'
     +' 2&5,\\,6&\\frac{2}{12}\\\\'
     +' 3&4&\\frac{1}{12}\\\\'
     +' 4&3&\\frac{1}{12}\\\\'
     +' 6&2&\\frac{1}{12}\\\\'
     +' 12&1&\\frac{1}{12}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{12}{12}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}\\\\'
     +'&=\\frac{6}{12}\\log_2 2+\\frac{2}{12}\\log_2 6+4\\cdot\\frac{1}{12}\\log_2 12\\\\'
     +'&=0.50000+0.43083+4(0.29875)\\\\'
     +'&=2.1258\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'Work with the numerators over $12$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $6,2,1,1,1,1$.<br>'
     +'Merge $1$: $1+1=2$, list $6,\\mathbf{2},2,1,1$.<br>'
     +'Merge $2$: $1+1=2$, list $6,\\mathbf{2},2,2$.<br>'
     +'Merge $3$: $2+2=4$, list $6,\\mathbf{4},2$.<br>'
     +'Merge $4$: $4+2=6$, list $\\mathbf{6},6$.<br>'
     +'Merge $5$: $6+6=12$, list $\\mathbf{12}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' y&P(Y=y)&\\text{codeword}&l\\\\\\hline'
     +' 6&\\frac{1}{12}&\\mathtt{0000}&4\\\\'
     +' 12&\\frac{1}{12}&\\mathtt{0001}&4\\\\'
     +' 2&\\frac{2}{12}&\\mathtt{001}&3\\\\'
     +' 3&\\frac{1}{12}&\\mathtt{010}&3\\\\'
     +' 4&\\frac{1}{12}&\\mathtt{011}&3\\\\'
     +' 1&\\frac{6}{12}&\\mathtt{1}&1'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (c).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{y}P(Y=y)\\,l(y)\\\\'
     +'&=\\frac{1}{12}\\bigl[1(4)+1(4)+2(3)+1(3)\\\\&\\qquad+1(3)+6(1)\\bigr]\\\\'
     +'&=\\frac{26}{12}\\\\'
     +'&=\\frac{13}{6}\\\\'
     +'&=2.1667\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Y)}{\\bar{L}}\\\\'
     +'&=\\frac{2.1258}{2.1667}\\\\'
     +'&=0.9811'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=98.11\\%$.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{2+2+4+6+12}{12}=\\frac{26}{12}$$'
     +'This matches part (c). The entropy follows by a second route, from the numerators $n_y=12\\,P(Y=y)$:'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\log_2 12-\\frac{1}{12}\\sum_{y}n_y\\log_2 n_y\\\\'
     +'&=3.5850-\\frac{1}{12}\\bigl(6\\log_2 6+2\\log_2 2\\bigr)\\\\'
     +'&=3.5850-1.4591\\\\'
     +'&=2.1258'
     +'\\end{aligned}$$'
     +'The Kraft sum is $2^{-1}+3\\cdot 2^{-3}+2\\cdot 2^{-4}=1$, so the tree has no unused branch. The bound $2.1258\\le 2.1667<3.1258$ holds.',
  err:'Taking $Y=12/X$ as a real number, which gives twelve different values. The floor sends $X=7,\\ldots,12$ to the single symbol $Y=1$.',
  teach:'One symbol carries half the probability, so it gets a single bit. The four symbols of probability $\\tfrac{1}{12}$ show the rule for placing sums.' },

{ id:'D6-04', module:'M6', type:'fx', src:'Final Q4',
  stem:'Let $X$ be a discrete memoryless source (DMS) which is modeled as a uniform random variable taking the integer values between $0$ and $15$. Each value of $X$ is written as a four-bit binary word. Let $Y$ be the number of ones in that word. $Y$ is another DMS which is a function of $X$.',
  parts:['[10 pts] Calculate the entropy of the source, $Y$.',
         '[10 pts] Design a <em>binary</em> Huffman code for the source, $Y$.',
         '[5 pts] Calculate the coding efficiency of the Huffman code designed in part (b).'],
  figSol: () => figPmf({v:[0,1,2,3,4],n:[1,4,6,4,1],D:16,name:'Y'})+figHuff({n:[1,4,6,4,1],D:16,name:'Y',lab:['0','1','2','3','4'],codes:['110','01','00','10','111'],order:['11','1','0','']}),
  sol:'<b>Given.</b> $X$ is uniform on $0,\\ldots,15$, and $Y$ is the number of ones in the four-bit word of $X$.<br>'
     +'<b>Find.</b> $H(Y)$, a binary Huffman code for $Y$, and its coding efficiency.<br>'
     +'<b>Method.</b> List $Y$ for every value of $X$, then add the probabilities that give the same value of $Y$. The entropy is $H(Y)=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Y)/\\bar{L}$.<br>'
     +'<b>Solution — (a).</b> '
     +'Each of the sixteen values of $X$ has probability $\\tfrac{1}{16}$. For example $X=11$ is the word $1011$, which has three ones.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' y&x\\ \\text{values}&P(Y=y)\\\\\\hline'
     +' 0&0&\\frac{1}{16}\\\\'
     +' 1&1,\\,2,\\,4,\\,8&\\frac{4}{16}\\\\'
     +' 2&3,\\,5,\\,6,\\,9,\\,10,\\,12&\\frac{6}{16}\\\\'
     +' 3&7,\\,11,\\,13,\\,14&\\frac{4}{16}\\\\'
     +' 4&15&\\frac{1}{16}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{16}{16}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}\\\\'
     +'&=\\frac{6}{16}\\log_2 \\frac{8}{3}+2\\cdot\\frac{4}{16}\\log_2 4+2\\cdot\\frac{1}{16}\\log_2 16\\\\'
     +'&=0.5306+2(0.5000)+2(0.2500)\\\\'
     +'&=2.0306\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'Work with the numerators over $16$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $6,4,4,1,1$.<br>'
     +'Merge $1$: $1+1=2$, list $6,4,4,\\mathbf{2}$.<br>'
     +'Merge $2$: $4+2=6$, list $\\mathbf{6},6,4$.<br>'
     +'Merge $3$: $6+4=10$, list $\\mathbf{10},6$.<br>'
     +'Merge $4$: $10+6=16$, list $\\mathbf{16}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' y&P(Y=y)&\\text{codeword}&l\\\\\\hline'
     +' 2&\\frac{6}{16}&\\mathtt{00}&2\\\\'
     +' 1&\\frac{4}{16}&\\mathtt{01}&2\\\\'
     +' 3&\\frac{4}{16}&\\mathtt{10}&2\\\\'
     +' 0&\\frac{1}{16}&\\mathtt{110}&3\\\\'
     +' 4&\\frac{1}{16}&\\mathtt{111}&3'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (c).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{y}P(Y=y)\\,l(y)\\\\'
     +'&=\\frac{1}{16}\\bigl[6(2)+4(2)+4(2)+1(3)+1(3)\\bigr]\\\\'
     +'&=\\frac{34}{16}\\\\'
     +'&=\\frac{17}{8}\\\\'
     +'&=2.1250\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Y)}{\\bar{L}}\\\\'
     +'&=\\frac{2.0306}{2.1250}\\\\'
     +'&=0.9556'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=95.56\\%$.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{2+6+10+16}{16}=\\frac{34}{16}$$'
     +'This matches part (c). The entropy follows by a second route, from the numerators $n_y=16\\,P(Y=y)$:'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\log_2 16-\\frac{1}{16}\\sum_{y}n_y\\log_2 n_y\\\\'
     +'&=4.0000-\\frac{1}{16}\\bigl(6\\log_2 6+2\\cdot4\\log_2 4\\bigr)\\\\'
     +'&=4.0000-1.9694\\\\'
     +'&=2.0306'
     +'\\end{aligned}$$'
     +'The Kraft sum is $3\\cdot 2^{-2}+2\\cdot 2^{-3}=1$, so the tree has no unused branch. The bound $2.0306\\le 2.1250<3.0306$ holds.'
     +' The numerators $1,4,6,4,1$ are the binomial coefficients $\\binom{4}{y}$, the number of four-bit words with $y$ ones.',
  err:'Treating $Y$ as uniform on $\\{0,\\ldots,4\\}$. Only one word has no ones, while six words have two ones.',
  teach:'The pmf is binomial. The same count returns when bit errors in a block are counted.' },

{ id:'D6-05', module:'M6', type:'fx', src:'Final Q4',
  stem:'Let $X$ be a discrete memoryless source (DMS) which is modeled as a uniform random variable taking the integer values between $-5$ and $5$. Let $Y\\triangleq \\left\\lceil |X|/2\\right\\rceil$ be another DMS which is a function of $X$. Here $\\lceil u\\rceil$ is the smallest integer not less than $u$.',
  parts:['[10 pts] Calculate the entropy of the source, $Y$.',
         '[10 pts] Design a <em>binary</em> Huffman code for the source, $Y$.',
         '[5 pts] Calculate the coding efficiency of the Huffman code designed in part (b).'],
  figSol: () => figPmf({v:[0,1,2,3],n:[1,4,4,2],D:11,name:'Y'})+figHuff({n:[1,4,4,2],D:11,name:'Y',lab:['0','1','2','3'],codes:['011','1','00','010'],order:['01','0','']}),
  sol:'<b>Given.</b> $X$ is uniform on the eleven integers $-5,\\ldots,5$, and $Y=\\lceil |X|/2\\rceil$.<br>'
     +'<b>Find.</b> $H(Y)$, a binary Huffman code for $Y$, and its coding efficiency.<br>'
     +'<b>Method.</b> List $Y$ for every value of $X$, then add the probabilities that give the same value of $Y$. The entropy is $H(Y)=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Y)/\\bar{L}$.<br>'
     +'<b>Solution — (a).</b> '
     +'Each of the eleven values of $X$ has probability $\\tfrac{1}{11}$. The ceiling rounds up.'
     +' For example $X=-3$ gives $\\lceil 3/2\\rceil=\\lceil 1.5\\rceil=2$, and $X=4$ gives $\\lceil 2\\rceil=2$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' y&x\\ \\text{values}&P(Y=y)\\\\\\hline'
     +' 0&0&\\frac{1}{11}\\\\'
     +' 1&-2,\\,-1,\\,1,\\,2&\\frac{4}{11}\\\\'
     +' 2&-4,\\,-3,\\,3,\\,4&\\frac{4}{11}\\\\'
     +' 3&-5,\\,5&\\frac{2}{11}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{11}{11}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}\\\\'
     +'&=2\\cdot\\frac{4}{11}\\log_2 \\frac{11}{4}+\\frac{2}{11}\\log_2 \\frac{11}{2}+\\frac{1}{11}\\log_2 11\\\\'
     +'&=2(0.5307)+0.4472+0.3145\\\\'
     +'&=1.8231\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'Work with the numerators over $11$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $4,4,2,1$.<br>'
     +'Merge $1$: $2+1=3$, list $4,4,\\mathbf{3}$.<br>'
     +'Merge $2$: $4+3=7$, list $\\mathbf{7},4$.<br>'
     +'Merge $3$: $7+4=11$, list $\\mathbf{11}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' y&P(Y=y)&\\text{codeword}&l\\\\\\hline'
     +' 2&\\frac{4}{11}&\\mathtt{00}&2\\\\'
     +' 3&\\frac{2}{11}&\\mathtt{010}&3\\\\'
     +' 0&\\frac{1}{11}&\\mathtt{011}&3\\\\'
     +' 1&\\frac{4}{11}&\\mathtt{1}&1'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (c).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{y}P(Y=y)\\,l(y)\\\\'
     +'&=\\frac{1}{11}\\bigl[4(2)+2(3)+1(3)+4(1)\\bigr]\\\\'
     +'&=\\frac{21}{11}\\\\'
     +'&=1.9091\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Y)}{\\bar{L}}\\\\'
     +'&=\\frac{1.8231}{1.9091}\\\\'
     +'&=0.9549'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=95.49\\%$.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{3+7+11}{11}=\\frac{21}{11}$$'
     +'This matches part (c). The entropy follows by a second route, from the numerators $n_y=11\\,P(Y=y)$:'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\log_2 11-\\frac{1}{11}\\sum_{y}n_y\\log_2 n_y\\\\'
     +'&=3.4594-\\frac{1}{11}\\bigl(2\\cdot4\\log_2 4+2\\log_2 2\\bigr)\\\\'
     +'&=3.4594-1.6364\\\\'
     +'&=1.8231'
     +'\\end{aligned}$$'
     +'The Kraft sum is $2^{-1}+2^{-2}+2\\cdot 2^{-3}=1$, so the tree has no unused branch. The bound $1.8231\\le 1.9091<2.8231$ holds.',
  err:'Rounding down instead of up, which sends $|X|=1$ to $0$. The ceiling is the smallest integer not below its argument, so $\\lceil 0.5\\rceil=1$.',
  teach:'Four symbols, but not a fixed-length code. One symbol has probability $\\tfrac{1}{11}$, and the tree becomes a ladder of lengths $1,2,3,3$.' },

{ id:'D6-06', module:'M6', type:'coding', src:'Madhow 7.1 and P7.12',
  stem:'A binary symmetric channel (BSC) flips each transmitted bit with probability $p=0.05$, independently of the other bits. A message of $k=20$ information bits is sent over it. A block error occurs when at least one of the $20$ decoded bits is wrong. A repetition code of length $n$ sends each information bit $n$ times. The receiver then decides each bit by a majority vote over its $n$ received copies. Use $H_b(0.05)=0.2864$ bits, where $H_b(p)=-p\\log_2 p-(1-p)\\log_2(1-p)$.',
  parts:['[6 pts] The $20$ bits are sent without coding. Calculate the probability of a block error.',
         '[9 pts] Each bit is sent with a repetition code of length $n=3$, and then of length $n=5$. For each $n$, calculate the bit error probability after the majority vote and the block error probability.',
         '[5 pts] Give the code rate of each repetition code, and the number of channel bits it uses for the $20$ information bits.',
         '[5 pts] Calculate the capacity of the channel. Compare the rates of part (c) with it, and state what the channel coding theorem allows.'],
  figSol: () => figFlips({n:3, p:0.05, h:220, lab:['0.857','0.135','7.13\\times10^{-3}','1.25\\times10^{-4}'],
                          fail:'P_3=7.25\\times10^{-3}'})
              + figFlips({n:5, p:0.05, h:240, lab:['0.774','0.204','0.0214','1.13\\times10^{-3}','2.97\\times10^{-5}','3.13\\times10^{-7}'],
                          fail:'P_5=1.158\\times10^{-3}'}),
  sol:'<b>Given.</b> A BSC with crossover probability $p=0.05$, a block of $k=20$ information bits, repetition codes of length $n=3$ and $n=5$ with a majority vote, and $H_b(0.05)=0.2864$.<br>'
     +'<b>Find.</b> The block error probability without coding. The bit and block error probabilities for $n=3$ and $n=5$. The code rates and channel bits. The capacity and what it allows.<br>'
     +'<b>Method.</b> The flips are independent, so the number $K$ of flipped copies among $n$ sent copies is binomial:'
     +'$$P(K=j)=\\binom{n}{j}p^{j}(1-p)^{n-j}$$'
     +'A majority vote over an odd number $n$ of copies fails when more than half of them are flipped, that is when $K\\ge (n+1)/2$.'
     +' A block is correct only when all $20$ bits are correct. So a bit error probability $P_b$ gives the block error probability $P_B=1-(1-P_b)^{20}$.'
     +' A repetition code of length $n$ has rate $R=1/n$ information bits a channel bit. The capacity of the BSC is $C=1-H_b(p)$ bits a channel use.<br>'
     +'<b>Solution — (a).</b> '
     +'Without coding each bit is decided alone, so $P_b=p=0.05$. Each bit arrives correctly with probability $1-p=0.95$. The $20$ bits are independent, so all of them arrive correctly with probability $(0.95)^{20}$.'
     +'$$\\begin{aligned}'
     +'P_B&=1-(1-p)^{20}\\\\'
     +'&=1-(0.95)^{20}\\\\'
     +'&=1-0.3585\\\\'
     +'&=0.6415'
     +'\\end{aligned}$$'
     +'Almost two blocks in three contain an error.<br>'
     +'<b>Solution — (b).</b> '
     +'For $n=3$ the vote fails when $K\\ge 2$, so two or three copies are flipped.'
     +'$$\\begin{aligned}'
     +'P_3&=P(K=2)+P(K=3)\\\\'
     +'&=\\binom{3}{2}p^{2}(1-p)+\\binom{3}{3}p^{3}\\\\'
     +'&=3(0.05)^{2}(0.95)+(0.05)^{3}\\\\'
     +'&=0.007125+0.000125\\\\'
     +'&=7.25\\times10^{-3}'
     +'\\end{aligned}$$'
     +'The block error probability for $n=3$ follows from $P_3$.'
     +'$$\\begin{aligned}'
     +'P_B&=1-(1-P_3)^{20}\\\\'
     +'&=1-(0.99275)^{20}\\\\'
     +'&=1-0.8646\\\\'
     +'&=0.1354'
     +'\\end{aligned}$$'
     +'For $n=5$ the vote fails when $K\\ge 3$, so three, four or five copies are flipped.'
     +'$$\\begin{aligned}'
     +'P_5&=\\binom{5}{3}p^{3}(1-p)^{2}+\\binom{5}{4}p^{4}(1-p)+\\binom{5}{5}p^{5}\\\\'
     +'&=10(0.05)^{3}(0.95)^{2}+5(0.05)^{4}(0.95)+(0.05)^{5}\\\\'
     +'&=1.1281\\times10^{-3}+2.969\\times10^{-5}+3.125\\times10^{-7}\\\\'
     +'&=1.158\\times10^{-3}'
     +'\\end{aligned}$$'
     +'The block error probability for $n=5$ follows from $P_5$.'
     +'$$\\begin{aligned}'
     +'P_B&=1-(1-P_5)^{20}\\\\'
     +'&=1-(0.998842)^{20}\\\\'
     +'&=1-0.97709\\\\'
     +'&=0.02291'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> '
     +'A code of length $n$ sends $n$ channel bits for each information bit, so $R=1/n$ and it uses $20n$ channel bits.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c|c}'
     +'\\text{scheme}&R&\\text{channel bits}&P_b&P_B\\\\\\hline'
     +'\\text{no coding}&1&20&0.05&0.6415\\\\'
     +'n=3&\\tfrac{1}{3}&60&7.25\\times10^{-3}&0.1354\\\\'
     +'n=5&\\tfrac{1}{5}&100&1.158\\times10^{-3}&0.02291'
     +'\\end{array}$$</div>'
     +'Each longer code lowers the block error, but only by sending more channel bits for the same message.<br>'
     +'<b>Solution — (d).</b> '
     +'The capacity of the BSC is'
     +'$$\\begin{aligned}'
     +'C&=1-H_b(p)\\\\'
     +'&=1-H_b(0.05)\\\\'
     +'&=1-0.2864\\\\'
     +'&=0.7136\\ \\text{bits per channel use}'
     +'\\end{aligned}$$'
     +'Both repetition rates, $\\tfrac13=0.333$ and $\\tfrac15=0.200$, lie far below $C$. The channel coding theorem allows any rate $R<0.7136$ with a block error as small as required, if long enough codes are used.'
     +' At a rate just below $C$, the $20$ information bits need only a little more than $20/C$ channel bits:'
     +'$$\\frac{20}{C}=\\frac{20}{0.7136}=28.03$$'
     +'The code of length $5$ spends $100$ channel bits and still loses $2.3\\%$ of the blocks. Repetition lowers the error only by pushing the rate toward zero, so it cannot approach capacity.<br>'
     +'<b>Check.</b> '
     +'The six probabilities of $K$ for $n=5$ add to one:'
     +'$$\\begin{aligned}'
     +'\\sum_{j=0}^{5}P(K=j)&=0.77378+0.20363+0.02143\\\\'
     +'&\\quad+0.00113+0.00003+0.0000003\\\\'
     +'&=1.00000'
     +'\\end{aligned}$$'
     +'For small $p$ the first failing term dominates. So $P_3\\approx 3p^{2}=0.0075$ and $P_5\\approx 10p^{3}=0.00125$, close to the exact $0.00725$ and $0.001158$.'
     +' For a small $P_b$ the block error is close to $20P_b$, and $20(1.158\\times10^{-3})=0.0232$ agrees with $0.02291$. The order $P_5<P_3<p$ holds.',
  err:'Taking the block error without coding as $20p=1.0$. The approximation $P_B\\approx 20P_b$ holds only when $20P_b$ is small. Here the exact value $1-(0.95)^{20}=0.6415$ must be used.',
  teach:'The two extremes before the coding theorem. Sending bits bare loses most blocks, and repetition buys reliability only by spending rate. Capacity says a rate near $0.71$ is possible with long codes.' },

{ id:'D6-07', module:'M6', type:'capacity', src:'Madhow Ex 7.3.1',
  stem:'A company claims a modem that sends $R_b=60$ Mb/s in a bandwidth of $W=10$ MHz. The received signal power is $P=1.8\\times10^{-11}$ W. The noise is white and Gaussian with two-sided power spectral density $N_0/2$, where $N_0=4.0\\times10^{-20}$ W/Hz. Treat the link as an ideal bandlimited channel with additive white Gaussian noise and no excess bandwidth.',
  parts:['[6 pts] Find the spectral efficiency $r=R_b/W$ of the claimed link. Then find the Shannon limit at that efficiency, the least $E_b/N_0$ in dB at which any system with it works reliably.',
         '[6 pts] Calculate the energy per bit at the receiver and the actual $E_b/N_0$ in dB.',
         '[6 pts] Decide whether the claim can be true, and by how many dB it misses or clears the limit. Confirm the verdict with the capacity $C=W\\log_2\\!\\left(1+P/(N_0W)\\right)$.',
         '[7 pts] The company then says the modem uses two separate channels at once, for example two pairs of antennas. Each has bandwidth $10$ MHz and the same $N_0$, and the power and the bits are split equally. Repeat the test for one channel and give the new verdict.'],
  figSol: () => figLimit({xr:[-4,14], yr:[0,7], h:320, imp:[3.2,4.9], floor:0.45,
    gaps:[{r:6, x:8.75, c:C.err, lab:'1.46\\ \\mathrm{dB}\\ \\text{short}', pos:[10.6, 5.5, 'start']},
          {r:3, x:8.75, c:C.mid, lab:'5.07\\ \\mathrm{dB}\\ \\text{to spare}', dx:0.7}],
    pts:[{x:8.75, r:6, c:C.err, lab:'\\text{one channel},\\ r=6', dx:-0.3, dy:-0.08, anchor:'end'},
         {x:8.75, r:3, c:C.out, lab:'\\text{each of two channels},\\ r=3', dy:-0.42}]}),
  sol:'<b>Given.</b> $R_b=60$ Mb/s, $W=10$ MHz, $P=1.8\\times10^{-11}$ W and $N_0=4.0\\times10^{-20}$ W/Hz, on an ideal bandlimited channel with white Gaussian noise.<br>'
     +'<b>Find.</b> The spectral efficiency and its Shannon limit, the actual $E_b/N_0$, the verdict with its margin, and the verdict for two parallel channels.<br>'
     +'<b>Method.</b> The spectral efficiency is $r=R_b/W$ in b/s/Hz. A reliable link at efficiency $r$ needs'
     +'$$\\frac{E_b}{N_0}\\ge\\frac{2^{r}-1}{r}$$'
     +'The energy per bit is the received power divided by the bit rate, $E_b=P/R_b$. A value $x$ in dB is $10\\log_{10}x$. The claim can be true only when the actual $E_b/N_0$ lies above the limit.<br>'
     +'<b>Solution — (a).</b> '
     +'The spectral efficiency of the claimed link is'
     +'$$\\begin{aligned}'
     +'r&=\\frac{R_b}{W}\\\\'
     +'&=\\frac{60\\times10^{6}}{10\\times10^{6}}\\\\'
     +'&=6\\ \\text{b/s/Hz}'
     +'\\end{aligned}$$'
     +'The Shannon limit at this efficiency is'
     +'$$\\begin{aligned}'
     +'\\frac{E_b}{N_0}\\bigg|_{\\min}&=\\frac{2^{6}-1}{6}\\\\'
     +'&=\\frac{63}{6}\\\\'
     +'&=10.5\\\\'
     +'&=10\\log_{10}10.5\\ \\text{dB}\\\\'
     +'&=10.21\\ \\text{dB}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'The energy per bit at the receiver is'
     +'$$\\begin{aligned}'
     +'E_b&=\\frac{P}{R_b}\\\\'
     +'&=\\frac{1.8\\times10^{-11}}{6.0\\times10^{7}}\\\\'
     +'&=3.0\\times10^{-19}\\ \\text{J}'
     +'\\end{aligned}$$'
     +'Dividing by $N_0$ gives the actual ratio.'
     +'$$\\begin{aligned}'
     +'\\frac{E_b}{N_0}&=\\frac{3.0\\times10^{-19}}{4.0\\times10^{-20}}\\\\'
     +'&=7.5\\\\'
     +'&=10\\log_{10}7.5\\ \\text{dB}\\\\'
     +'&=8.75\\ \\text{dB}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> '
     +'The actual $8.75$ dB lies below the limit of $10.21$ dB, so the claim cannot be true. The shortfall is'
     +'$$10.21-8.75=1.46\\ \\text{dB}$$'
     +'No code, modulation or receiver closes that gap at $r=6$. The capacity gives the same verdict. The signal-to-noise ratio in the band is'
     +'$$\\begin{aligned}'
     +'\\frac{P}{N_0W}&=\\frac{1.8\\times10^{-11}}{(4.0\\times10^{-20})(10\\times10^{6})}\\\\'
     +'&=\\frac{1.8\\times10^{-11}}{4.0\\times10^{-13}}\\\\'
     +'&=45'
     +'\\end{aligned}$$'
     +'The capacity of the channel is then'
     +'$$\\begin{aligned}'
     +'C&=W\\log_2\\!\\left(1+\\frac{P}{N_0W}\\right)\\\\'
     +'&=10^{7}\\log_2 46\\\\'
     +'&=10^{7}(5.5236)\\\\'
     +'&=55.24\\ \\text{Mb/s}'
     +'\\end{aligned}$$'
     +'The claimed $60$ Mb/s is above $C$, so no system reaches it reliably.<br>'
     +'<b>Solution — (d).</b> '
     +'Each channel now carries half the bits in the same $10$ MHz, with half the power. Its bit rate is $R_b\'=30$ Mb/s and its power is $P\'=0.9\\times10^{-11}$ W.'
     +'$$\\begin{aligned}'
     +'r\'&=\\frac{30\\times10^{6}}{10\\times10^{6}}\\\\'
     +'&=3\\ \\text{b/s/Hz}'
     +'\\end{aligned}$$'
     +'The Shannon limit at this efficiency is'
     +'$$\\begin{aligned}'
     +'\\frac{E_b}{N_0}\\bigg|_{\\min}&=\\frac{2^{3}-1}{3}\\\\'
     +'&=\\frac{7}{3}\\\\'
     +'&=2.333\\\\'
     +'&=3.68\\ \\text{dB}'
     +'\\end{aligned}$$'
     +'Halving both the power and the bit rate leaves the energy per bit unchanged.'
     +'$$\\begin{aligned}'
     +'E_b&=\\frac{0.9\\times10^{-11}}{3.0\\times10^{7}}\\\\'
     +'&=3.0\\times10^{-19}\\ \\text{J}'
     +'\\end{aligned}$$'
     +'So the actual $E_b/N_0$ is still $8.75$ dB. It now clears the limit by'
     +'$$8.75-3.68=5.07\\ \\text{dB}$$'
     +'The claim becomes possible. A good code that works within one or two dB of the limit would meet it.<br>'
     +'<b>Check.</b> '
     +'The signal-to-noise ratio equals $r\\,E_b/N_0$, because $P/(N_0W)=(E_bR_b)/(N_0W)$. For one channel, $6(7.5)=45$ agrees with part (c).'
     +' For each of the two channels, the ratio is $3(7.5)=22.5$, and the capacity of one channel is'
     +'$$\\begin{aligned}'
     +'C\'&=10^{7}\\log_2 23.5\\\\'
     +'&=10^{7}(4.5546)\\\\'
     +'&=45.55\\ \\text{Mb/s}'
     +'\\end{aligned}$$'
     +'This is above the $30$ Mb/s each channel carries, as the margin of part (d) says.',
  err:'Comparing $E_b/N_0$ with the $-1.59$ dB floor and accepting the claim. The floor holds only as $r\\to0$. At $r=6$ the limit is $10.21$ dB.',
  teach:'Splitting the rate over two channels halves $r$. The limit falls from $10.21$ dB to $3.68$ dB while $E_b/N_0$ stays the same. The spectral efficiency makes the first claim impossible, not the power.' },

{ id:'D6-08', module:'M6', type:'fx', src:'Final Q4',
  stem:'Let $X$ be a discrete memoryless source (DMS) which is modeled as a uniform random variable taking the integer values between $-7$ and $7$. Let $Y\\triangleq \\max(X,0)$ be another DMS which is a function of $X$.',
  parts:['[10 pts] Calculate the entropy of the source, $Y$.',
         '[10 pts] Design a <em>binary</em> Huffman code for the source, $Y$.',
         '[5 pts] Calculate the coding efficiency of the Huffman code designed in part (b).'],
  figSol: () => figPmf({v:[0,1,2,3,4,5,6,7],n:[8,1,1,1,1,1,1,1],D:15,name:'Y'})+figHuff({n:[8,1,1,1,1,1,1,1],D:15,name:'Y',lab:['0','1','2','3','4','5','6','7'],codes:['0','111','1000','1001','1010','1011','1100','1101'],order:['110','101','100','11','10','1','']}),
  sol:'<b>Given.</b> $X$ is uniform on the fifteen integers $-7,\\ldots,7$, and $Y=\\max(X,0)$.<br>'
     +'<b>Find.</b> $H(Y)$, a binary Huffman code for $Y$, and its coding efficiency.<br>'
     +'<b>Method.</b> List $Y$ for every value of $X$, then add the probabilities that give the same value of $Y$. The entropy is $H(Y)=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Y)/\\bar{L}$.<br>'
     +'<b>Solution — (a).</b> '
     +'Each of the fifteen values of $X$ has probability $\\tfrac{1}{15}$. Every $X\\le 0$ gives $Y=0$, and each positive $X$ gives itself.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' y&x\\ \\text{values}&P(Y=y)\\\\\\hline'
     +' 0&-7,\\,-6,\\,-5,\\,-4,\\,-3,\\,-2,\\,-1,\\,0&\\frac{8}{15}\\\\'
     +' 1&1&\\frac{1}{15}\\\\'
     +' 2&2&\\frac{1}{15}\\\\'
     +' 3&3&\\frac{1}{15}\\\\'
     +' 4&4&\\frac{1}{15}\\\\'
     +' 5&5&\\frac{1}{15}\\\\'
     +' 6&6&\\frac{1}{15}\\\\'
     +' 7&7&\\frac{1}{15}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{15}{15}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}\\\\'
     +'&=\\frac{8}{15}\\log_2 \\frac{15}{8}+7\\cdot\\frac{1}{15}\\log_2 15\\\\'
     +'&=0.48367+7(0.26046)\\\\'
     +'&=2.3069\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'Work with the numerators over $15$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $8,1,1,1,1,1,1,1$.<br>'
     +'Merge $1$: $1+1=2$, list $8,\\mathbf{2},1,1,1,1,1$.<br>'
     +'Merge $2$: $1+1=2$, list $8,\\mathbf{2},2,1,1,1$.<br>'
     +'Merge $3$: $1+1=2$, list $8,\\mathbf{2},2,2,1$.<br>'
     +'Merge $4$: $2+1=3$, list $8,\\mathbf{3},2,2$.<br>'
     +'Merge $5$: $2+2=4$, list $8,\\mathbf{4},3$.<br>'
     +'Merge $6$: $4+3=7$, list $8,\\mathbf{7}$.<br>'
     +'Merge $7$: $8+7=15$, list $\\mathbf{15}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' y&P(Y=y)&\\text{codeword}&l\\\\\\hline'
     +' 0&\\frac{8}{15}&\\mathtt{0}&1\\\\'
     +' 2&\\frac{1}{15}&\\mathtt{1000}&4\\\\'
     +' 3&\\frac{1}{15}&\\mathtt{1001}&4\\\\'
     +' 4&\\frac{1}{15}&\\mathtt{1010}&4\\\\'
     +' 5&\\frac{1}{15}&\\mathtt{1011}&4\\\\'
     +' 6&\\frac{1}{15}&\\mathtt{1100}&4\\\\'
     +' 7&\\frac{1}{15}&\\mathtt{1101}&4\\\\'
     +' 1&\\frac{1}{15}&\\mathtt{111}&3'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (c).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{y}P(Y=y)\\,l(y)\\\\'
     +'&=\\frac{1}{15}\\bigl[8(1)+1(4)+1(4)+1(4)\\\\&\\qquad+1(4)+1(4)+1(4)+1(3)\\bigr]\\\\'
     +'&=\\frac{35}{15}\\\\'
     +'&=\\frac{7}{3}\\\\'
     +'&=2.3333\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Y)}{\\bar{L}}\\\\'
     +'&=\\frac{2.3069}{2.3333}\\\\'
     +'&=0.9887'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=98.87\\%$.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{2+2+2+3+4+7+15}{15}=\\frac{35}{15}$$'
     +'This matches part (c). The entropy follows by a second route, from the numerators $n_y=15\\,P(Y=y)$:'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\log_2 15-\\frac{1}{15}\\sum_{y}n_y\\log_2 n_y\\\\'
     +'&=3.9069-\\frac{1}{15}\\bigl(8\\log_2 8\\bigr)\\\\'
     +'&=3.9069-1.6000\\\\'
     +'&=2.3069'
     +'\\end{aligned}$$'
     +'The Kraft sum is $2^{-1}+2^{-3}+6\\cdot 2^{-4}=1$, so the tree has no unused branch. The bound $2.3069\\le 2.3333<3.3069$ holds.',
  err:'Giving $Y=0$ the probability $\\tfrac{7}{15}$ and forgetting $X=0$. Eight values of $X$ satisfy $X\\le 0$.',
  teach:'Eight symbols and one dominant probability. The seven equal symbols are merged in pairs, so the placement rule decides almost every step.' },

{ id:'D6-09', module:'M6', type:'fxz', src:'Final Q4',
  stem:'Let $X$ be a discrete memoryless source (DMS) which is modeled as a uniform random variable on the alphabet $\\{1,2,3\\}$. Let $Z$ be a random variable (independent of $X$) with the probability mass function $p_Z(z)=c\\left(\\frac{1}{3}\\right)^{z}$ for the integers $-1\\le z\\le 1$. It is zero otherwise, and $c$ is a constant. Finally, let $Y\\triangleq X\\times Z$ be another DMS which is a function of both $X$ and $Z$.',
  parts:['[10 pts] Calculate the entropy of the source, $Y$.',
         '[10 pts] Design a <em>binary</em> Huffman code for the source, $Y$.',
         '[5 pts] Calculate the coding efficiency of the Huffman code designed in part (b).'],
  figSol: () => figPmf({v:[-3,-2,-1,0,1,2,3],n:[9,9,9,9,1,1,1],D:39,name:'Y'})+figHuff({n:[9,9,9,9,1,1,1],D:39,name:'Y',lab:['-3','-2','-1','0','1','2','3'],codes:['01','10','11','000','0011','00100','00101'],order:['0010','001','00','1','0','']}),
  sol:'<b>Given.</b> $X$ uniform on $\\{1,2,3\\}$, $p_Z(z)=c\\left(\\tfrac13\\right)^{z}$ for $z=-1,0,1$, independent, and $Y=XZ$.<br>'
     +'<b>Find.</b> $c$, $H(Y)$, a binary Huffman code for $Y$, and its coding efficiency.<br>'
     +'<b>Method.</b> Find $c$ from $\\sum_z p_Z(z)=1$ before anything else. List $Y$ for every pair $(x,z)$, then add the probabilities that give the same value of $Y$. The entropy is $H(Y)=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Y)/\\bar{L}$.<br>'
     +'<b>Solution — (a).</b> '
     +'The constant comes first. The pmf of $Z$ must add to one:'
     +'$$\\begin{aligned}'
     +'\\sum_{z}p_Z(z)&=c\\left[\\left(\\tfrac13\\right)^{-1}+\\left(\\tfrac13\\right)^{0}+\\left(\\tfrac13\\right)^{1}\\right]\\\\'
     +'&=c\\left(3+1+\\tfrac13\\right)\\\\'
     +'&=\\tfrac{13}{3}\\,c\\\\'
     +'&=1'
     +'\\end{aligned}$$'
     +'So $c=\\tfrac{3}{13}$, and $P(Z=-1)=\\tfrac{9}{13}$, $P(Z=0)=\\tfrac{3}{13}$, $P(Z=1)=\\tfrac{1}{13}$.'
     +' With $P(X=x)=\\tfrac13$, the pair $(x,z)$ has probability $n_Z(z)/39$, where $n_Z=9,3,1$ for $z=-1,0,1$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' y&(x,z)\\ \\text{pairs}&P(Y=y)\\\\\\hline'
     +'-3&(3,-1)&\\frac{9}{39}\\\\'
     +'-2&(2,-1)&\\frac{9}{39}\\\\'
     +'-1&(1,-1)&\\frac{9}{39}\\\\'
     +' 0&(1,0),\\,(2,0),\\,(3,0)&\\frac{3+3+3}{39}=\\frac{9}{39}\\\\'
     +' 1&(1,1)&\\frac{1}{39}\\\\'
     +' 2&(2,1)&\\frac{1}{39}\\\\'
     +' 3&(3,1)&\\frac{1}{39}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{39}{39}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}\\\\'
     +'&=4\\cdot\\frac{9}{39}\\log_2 \\frac{13}{3}+3\\cdot\\frac{1}{39}\\log_2 39\\\\'
     +'&=4(0.4882)+3(0.1355)\\\\'
     +'&=2.3593\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'Work with the numerators over $39$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $9,9,9,9,1,1,1$.<br>'
     +'Merge $1$: $1+1=2$, list $9,9,9,9,\\mathbf{2},1$.<br>'
     +'Merge $2$: $2+1=3$, list $9,9,9,9,\\mathbf{3}$.<br>'
     +'Merge $3$: $9+3=12$, list $\\mathbf{12},9,9,9$.<br>'
     +'Merge $4$: $9+9=18$, list $\\mathbf{18},12,9$.<br>'
     +'Merge $5$: $12+9=21$, list $\\mathbf{21},18$.<br>'
     +'Merge $6$: $21+18=39$, list $\\mathbf{39}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' y&P(Y=y)&\\text{codeword}&l\\\\\\hline'
     +' 0&\\frac{9}{39}&\\mathtt{000}&3\\\\'
     +' 2&\\frac{1}{39}&\\mathtt{00100}&5\\\\'
     +' 3&\\frac{1}{39}&\\mathtt{00101}&5\\\\'
     +' 1&\\frac{1}{39}&\\mathtt{0011}&4\\\\'
     +'-3&\\frac{9}{39}&\\mathtt{01}&2\\\\'
     +'-2&\\frac{9}{39}&\\mathtt{10}&2\\\\'
     +'-1&\\frac{9}{39}&\\mathtt{11}&2'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (c).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{y}P(Y=y)\\,l(y)\\\\'
     +'&=\\frac{1}{39}\\bigl[9(3)+1(5)+1(5)+1(4)\\\\&\\qquad+9(2)+9(2)+9(2)\\bigr]\\\\'
     +'&=\\frac{95}{39}\\\\'
     +'&=2.4359\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Y)}{\\bar{L}}\\\\'
     +'&=\\frac{2.3593}{2.4359}\\\\'
     +'&=0.9686'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=96.86\\%$.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{2+3+12+18+21+39}{39}=\\frac{95}{39}$$'
     +'This matches part (c). The entropy follows by a second route, from the numerators $n_y=39\\,P(Y=y)$:'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\log_2 39-\\frac{1}{39}\\sum_{y}n_y\\log_2 n_y\\\\'
     +'&=5.2854-\\frac{1}{39}\\bigl(4\\cdot9\\log_2 9\\bigr)\\\\'
     +'&=5.2854-2.9261\\\\'
     +'&=2.3593'
     +'\\end{aligned}$$'
     +'The Kraft sum is $3\\cdot 2^{-2}+2^{-3}+2^{-4}+2\\cdot 2^{-5}=1$, so the tree has no unused branch. The bound $2.3593\\le 2.4359<3.3593$ holds.',
  err:'Reading $\\left(\\tfrac13\\right)^{z}$ at $z=-1$ as $\\tfrac13$. A negative exponent inverts the base, so the term is $3$ and $c=\\tfrac{3}{13}$.',
  teach:'The constant comes first, and a wrong $c$ travels into every later part. The negative products dominate because $z=-1$ is the most likely value.' },

{ id:'D6-10', module:'M6', type:'hamming', src:'Madhow P7.7 and P7.8',
  stem:'A $(7,4)$ Hamming code places four data bits $d_1d_2d_3d_4$ at positions $1$ to $4$ of a codeword $c_1c_2\\cdots c_7$. Its three parity bits sit at positions $5$ to $7$. The code is defined by the parity-check matrix $$H=\\begin{bmatrix}1&1&1&0&1&0&0\\\\0&1&1&1&0&1&0\\\\1&0&1&1&0&0&1\\end{bmatrix}$$ Row $j$ of $H$ is parity check $j$. It covers the positions where the row holds a $1$, and it passes when the bits there hold an even number of ones. A codeword passes all three checks. For a received word, the syndrome $s_1s_2s_3$ has $s_j=1$ when check $j$ fails. The code is used on a binary symmetric channel (BSC) with crossover probability $p=0.02$.',
  parts:['[7 pts] Write each parity bit in terms of the data bits. Find the codewords for the data $\\mathtt{1010}$ and $\\mathtt{0111}$. Decide whether $\\mathtt{1100011}$ and $\\mathtt{0101100}$ are codewords.',
         '[5 pts] Find the minimum distance $d_{\\min}$ of the code and the number $t$ of errors it can correct.',
         '[7 pts] Write the syndrome of no error and of a single error at each position. Use this table to decode the received word $\\mathtt{1101110}$: give its syndrome, the codeword and the data bits.',
         '[6 pts] The decoder of part (c) flips the bit its table names. Find the probability that a word is decoded correctly, the probability that no table entry fits, and the probability of a decoding error.'],
  figSol: () => figSyn({r:'1101110', err:2, H:['1110100','0111010','1011001'], s:'110', c:'1001110'})
              + figFlips({n:7, p:0.02, t:2, h:260, room:3.2, head:'\\text{two or more flips: a wrong codeword}',
                          lab:['0.868','0.124','7.59\\times10^{-3}','2.58\\times10^{-4}','5.27\\times10^{-6}','6.45\\times10^{-8}','4.39\\times10^{-10}','1.28\\times10^{-12}'],
                          fail:'P_E=7.86\\times10^{-3}'}),
  sol:'<b>Given.</b> A $(7,4)$ code with data at positions $1$ to $4$, parity at $5$ to $7$, the parity-check matrix $H$, and a BSC with $p=0.02$.<br>'
     +'<b>Find.</b> The parity bits, two codewords and two membership tests. Then $d_{\\min}$ and $t$, the syndrome table and one decoded word. Last, the probabilities of correct decoding, of no fitting entry and of a decoding error.<br>'
     +'<b>Method.</b> A check passes when the sum of its bits modulo $2$ is $0$. Write that sum with $\\oplus$, so $1\\oplus1=0$.'
     +' Each row of $H$ holds exactly one of the positions $5$, $6$ and $7$, so each check fixes one parity bit.'
     +' A flipped bit at position $i$ changes exactly the checks that cover position $i$, which are the ones marked in column $i$ of $H$. So one error at position $i$ gives the syndrome equal to column $i$.'
     +' The number $K$ of flipped bits in a word of seven is binomial:'
     +'$$P(K=j)=\\binom{7}{j}p^{j}(1-p)^{7-j}$$<br>'
     +'<b>Solution — (a).</b> '
     +'Check $1$ covers positions $1,2,3,5$. It passes when $c_1\\oplus c_2\\oplus c_3\\oplus c_5=0$, so $c_5$ equals the sum of the other three. Checks $2$ and $3$ work the same way.'
     +'$$\\begin{aligned}'
     +'c_5&=d_1\\oplus d_2\\oplus d_3\\\\'
     +'c_6&=d_2\\oplus d_3\\oplus d_4\\\\'
     +'c_7&=d_1\\oplus d_3\\oplus d_4'
     +'\\end{aligned}$$'
     +'For the data $\\mathtt{1010}$ the parity bits are'
     +'$$\\begin{aligned}'
     +'c_5&=1\\oplus0\\oplus1=0\\\\'
     +'c_6&=0\\oplus1\\oplus0=1\\\\'
     +'c_7&=1\\oplus1\\oplus0=0'
     +'\\end{aligned}$$'
     +'The codeword is $\\mathtt{1010010}$. For the data $\\mathtt{0111}$ the parity bits are'
     +'$$\\begin{aligned}'
     +'c_5&=0\\oplus1\\oplus1=0\\\\'
     +'c_6&=1\\oplus1\\oplus1=1\\\\'
     +'c_7&=0\\oplus1\\oplus1=0'
     +'\\end{aligned}$$'
     +'The codeword is $\\mathtt{0111010}$.'
     +' A word is a codeword when its last three bits equal the parity bits of its first four.'
     +' For $\\mathtt{1100011}$ the data $\\mathtt{1100}$ give $c_5=1\\oplus1\\oplus0=0$, $c_6=1\\oplus0\\oplus0=1$ and $c_7=1\\oplus0\\oplus0=1$.'
     +' These match its last bits $\\mathtt{011}$, so $\\mathtt{1100011}$ is a codeword.'
     +' For $\\mathtt{0101100}$ the data $\\mathtt{0101}$ give $c_5=0\\oplus1\\oplus0=1$, $c_6=1\\oplus0\\oplus1=0$ and $c_7=0\\oplus0\\oplus1=1$.'
     +' The word ends in $\\mathtt{100}$, not $\\mathtt{101}$. Check $3$ fails, so $\\mathtt{0101100}$ is not a codeword.<br>'
     +'<b>Solution — (b).</b> '
     +'Adding two codewords bit by bit, modulo $2$, gives another codeword, because each check is a sum modulo $2$.'
     +' Two codewords differ in the places where their sum holds a $1$. So $d_{\\min}$ is the least number of ones in a codeword other than $\\mathtt{0000000}$.'
     +' A word with a single $1$, at position $i$, fails the checks marked in column $i$. No column of $H$ is all zeros, so no such word is a codeword.'
     +' A word with ones at positions $i$ and $j$ fails the checks where columns $i$ and $j$ differ. The seven columns are all different, so it fails at least one check.'
     +' Every codeword other than $\\mathtt{0000000}$ therefore holds at least three ones. The codeword $\\mathtt{1010010}$ of part (a) holds exactly three, so $d_{\\min}=3$.'
     +'$$\\begin{aligned}'
     +'t&=\\Bigl\\lfloor\\frac{d_{\\min}-1}{2}\\Bigr\\rfloor\\\\'
     +'&=\\Bigl\\lfloor\\frac{3-1}{2}\\Bigr\\rfloor\\\\'
     +'&=1'
     +'\\end{aligned}$$'
     +'The code corrects one error in each word of seven bits.<br>'
     +'<b>Solution — (c).</b> '
     +'One error at position $i$ gives column $i$ of $H$, read from the top as $s_1s_2s_3$. With no error every check passes.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.5}\\begin{array}{c|c}'
     +'\\text{error position}&s_1s_2s_3\\\\\\hline'
     +'\\text{none}&\\mathtt{000}\\\\'
     +'1&\\mathtt{101}\\\\'
     +'2&\\mathtt{110}\\\\'
     +'3&\\mathtt{111}\\\\'
     +'4&\\mathtt{011}\\\\'
     +'5&\\mathtt{100}\\\\'
     +'6&\\mathtt{010}\\\\'
     +'7&\\mathtt{001}'
     +'\\end{array}$$</div>'
     +'For the received word $\\mathtt{1101110}$, recompute each check on its bits $r_1,\\ldots,r_7$.'
     +'$$\\begin{aligned}'
     +'s_1&=r_1\\oplus r_2\\oplus r_3\\oplus r_5\\\\'
     +'&=1\\oplus1\\oplus0\\oplus1\\\\'
     +'&=1\\\\'
     +'s_2&=r_2\\oplus r_3\\oplus r_4\\oplus r_6\\\\'
     +'&=1\\oplus0\\oplus1\\oplus1\\\\'
     +'&=1\\\\'
     +'s_3&=r_1\\oplus r_3\\oplus r_4\\oplus r_7\\\\'
     +'&=1\\oplus0\\oplus1\\oplus0\\\\'
     +'&=0'
     +'\\end{aligned}$$'
     +'The syndrome $\\mathtt{110}$ is column $2$ of $H$, so the table names position $2$. Flipping bit $2$ back gives the decoded codeword $\\hat{c}$:'
     +'$$\\hat{c}=\\mathtt{1001110}$$'
     +'Its first four bits give the data $\\mathtt{1001}$.<br>'
     +'<b>Solution — (d).</b> '
     +'The table lists all $2^{3}=8$ syndromes, since $\\mathtt{000}$ and the seven different nonzero columns fill every pattern of three bits.'
     +' So every received word has an entry, and the probability that no entry fits is $0$.'
     +' The decoder returns the sent codeword exactly when at most one bit flips, $K\\le1$.'
     +'$$\\begin{aligned}'
     +'P_c&=P(K=0)+P(K=1)\\\\'
     +'&=(1-p)^{7}+7p(1-p)^{6}\\\\'
     +'&=(0.98)^{7}+7(0.02)(0.98)^{6}\\\\'
     +'&=0.86813+0.14\\,(0.88584)\\\\'
     +'&=0.86813+0.12402\\\\'
     +'&=0.99214'
     +'\\end{aligned}$$'
     +'The decoder changes at most one bit, so when two or more bits flip it cannot return the sent codeword.'
     +' Two flips, for example, give the sum of two different columns, which is a third column. The decoder flips a third bit and returns a wrong codeword without any warning.'
     +'$$\\begin{aligned}'
     +'P_E&=1-P_c\\\\'
     +'&=1-0.99214\\\\'
     +'&=7.86\\times10^{-3}'
     +'\\end{aligned}$$<br>'
     +'<b>Check.</b> '
     +'The decoded word passes all three checks. The data $\\mathtt{1001}$ give $1\\oplus0\\oplus0=1$, $0\\oplus0\\oplus1=1$ and $1\\oplus0\\oplus1=0$, which match its last bits $\\mathtt{110}$.'
     +' The error probability is close to its first term, two flips:'
     +'$$\\begin{aligned}'
     +'P(K=2)&=\\binom{7}{2}p^{2}(1-p)^{5}\\\\'
     +'&=21(0.0004)(0.90392)\\\\'
     +'&=7.59\\times10^{-3}'
     +'\\end{aligned}$$'
     +'The three-flip term $35p^{3}(1-p)^{4}=2.58\\times10^{-4}$ brings the sum to $7.85\\times10^{-3}$. The other terms add less than $10^{-5}$, which matches $P_E$.'
     +' Without the code, four data bits arrive correct with probability $(0.98)^{4}=0.92237$. A word is then wrong with probability $0.07763$, ten times as often.',
  err:'Reading the syndrome $\\mathtt{110}$ as the binary number $6$ and flipping bit $6$. That reading holds only when column $i$ of $H$ is $i$ written in binary. Here the table names position $2$.',
  teach:'The columns of $H$ are not in binary order, so the syndrome is looked up in the table, not read as a number. Put the columns in the order $1$ to $7$ in binary and the circle picture of the lecture returns. The code is perfect: its eight syndromes use every pattern, so a failure never occurs and every multiple error is a silent one.' },

{ id:'D6-11', module:'M6', type:'fxz', src:'Final Q4',
  stem:'Let $X$ be a discrete memoryless source (DMS) which is modeled as a uniform random variable on the alphabet $\\{0,1,2,3\\}$. Let $Z$ be a random variable (independent of $X$) with the probability mass function $p_Z(z)=c\\left(\\frac{1}{2}\\right)^{z}$ for the integers $0\\le z\\le 2$. It is zero otherwise, and $c$ is a constant. Finally, let $Y\\triangleq \\max(X,Z)$ be another DMS which is a function of both $X$ and $Z$.',
  parts:['[10 pts] Calculate the entropy of the source, $Y$.',
         '[10 pts] Design a <em>binary</em> Huffman code for the source, $Y$.',
         '[5 pts] Calculate the coding efficiency of the Huffman code designed in part (b).'],
  figSol: () => figPmf({v:[0,1,2,3],n:[4,8,9,7],D:28,name:'Y'})+figHuff({n:[4,8,9,7],D:28,name:'Y',lab:['0','1','2','3'],codes:['11','01','00','10'],order:['1','0','']}),
  sol:'<b>Given.</b> $X$ uniform on $\\{0,1,2,3\\}$, $p_Z(z)=c\\left(\\tfrac12\\right)^{z}$ for $z=0,1,2$, independent, and $Y=\\max(X,Z)$.<br>'
     +'<b>Find.</b> $c$, $H(Y)$, a binary Huffman code for $Y$, and its coding efficiency.<br>'
     +'<b>Method.</b> Find $c$ from $\\sum_z p_Z(z)=1$ before anything else. List $Y$ for every pair $(x,z)$, then add the probabilities that give the same value of $Y$. The entropy is $H(Y)=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Y)/\\bar{L}$.<br>'
     +'<b>Solution — (a).</b> '
     +'The constant comes first. The pmf of $Z$ must add to one:'
     +'$$\\begin{aligned}'
     +'\\sum_{z}p_Z(z)&=c\\left(1+\\tfrac12+\\tfrac14\\right)\\\\'
     +'&=\\tfrac{7}{4}\\,c\\\\'
     +'&=1'
     +'\\end{aligned}$$'
     +'So $c=\\tfrac{4}{7}$, and $P(Z=0)=\\tfrac47$, $P(Z=1)=\\tfrac27$, $P(Z=2)=\\tfrac17$.'
     +' With $P(X=x)=\\tfrac14$, the pair $(x,z)$ has probability $n_Z(z)/28$, where $n_Z=4,2,1$. For example $(x,z)=(1,2)$ gives $Y=2$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' y&(x,z)\\ \\text{pairs}&P(Y=y)\\\\\\hline'
     +' 0&(0,0)&\\frac{4}{28}\\\\'
     +' 1&(0,1),\\,(1,0),\\,(1,1)&\\frac{2+4+2}{28}=\\frac{8}{28}\\\\'
     +' 2&(0,2),\\,(1,2),\\,(2,0),\\,(2,1),\\,(2,2)&\\frac{1+1+4+2+1}{28}=\\frac{9}{28}\\\\'
     +' 3&(3,0),\\,(3,1),\\,(3,2)&\\frac{4+2+1}{28}=\\frac{7}{28}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{28}{28}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}\\\\'
     +'&=\\frac{9}{28}\\log_2 \\frac{28}{9}+\\frac{8}{28}\\log_2 \\frac{7}{2}+\\frac{7}{28}\\log_2 4\\\\'
     +'&\\quad+\\frac{4}{28}\\log_2 7\\\\'
     +'&=0.5263+0.5164+0.5000+0.4011\\\\'
     +'&=1.9438\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'Work with the numerators over $28$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $9,8,7,4$.<br>'
     +'Merge $1$: $7+4=11$, list $\\mathbf{11},9,8$.<br>'
     +'Merge $2$: $9+8=17$, list $\\mathbf{17},11$.<br>'
     +'Merge $3$: $17+11=28$, list $\\mathbf{28}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' y&P(Y=y)&\\text{codeword}&l\\\\\\hline'
     +' 2&\\frac{9}{28}&\\mathtt{00}&2\\\\'
     +' 1&\\frac{8}{28}&\\mathtt{01}&2\\\\'
     +' 3&\\frac{7}{28}&\\mathtt{10}&2\\\\'
     +' 0&\\frac{4}{28}&\\mathtt{11}&2'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (c).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{y}P(Y=y)\\,l(y)\\\\'
     +'&=\\frac{1}{28}\\bigl[9(2)+8(2)+7(2)+4(2)\\bigr]\\\\'
     +'&=\\frac{56}{28}\\\\'
     +'&=2\\\\'
     +'&=2.0000\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Y)}{\\bar{L}}\\\\'
     +'&=\\frac{1.9438}{2.0000}\\\\'
     +'&=0.9719'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=97.19\\%$.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{11+17+28}{28}=\\frac{56}{28}$$'
     +'This matches part (c). The entropy follows by a second route, from the numerators $n_y=28\\,P(Y=y)$:'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\log_2 28-\\frac{1}{28}\\sum_{y}n_y\\log_2 n_y\\\\'
     +'&=4.8074-\\frac{1}{28}\\bigl(9\\log_2 9+8\\log_2 8+7\\log_2 7+4\\log_2 4\\bigr)\\\\'
     +'&=4.8074-2.8636\\\\'
     +'&=1.9438'
     +'\\end{aligned}$$'
     +'The Kraft sum is $4\\cdot 2^{-2}=1$, so the tree has no unused branch. The bound $1.9438\\le 2.0000<2.9438$ holds.'
     +' The pmf also follows from $P(Y\\le y)=P(X\\le y)P(Z\\le y)$. For $y=1$ this gives $\\tfrac24\\cdot\\tfrac67=\\tfrac{12}{28}$, and $\\tfrac{4}{28}+\\tfrac{8}{28}=\\tfrac{12}{28}$.',
  err:'Setting $Y=X$ and forgetting the pairs with $Z>X$. The pair $(0,1)$ gives $Y=1$, not $Y=0$.',
  teach:'Four symbols with probabilities between $\\tfrac17$ and $\\tfrac{9}{28}$ give a fixed-length Huffman code. Ask why no one-bit codeword appears.' },

{ id:'D6-12', module:'M6', type:'fxz', src:'Final Q4',
  stem:'Let $X$ be a discrete memoryless source (DMS) which is modeled as a uniform random variable on the alphabet $\\{0,1,2,3\\}$. Let $Z$ be a random variable (independent of $X$) with the probability mass function $p_Z(z)=c\\,2^{-|z|}$ for the integers $-1\\le z\\le 1$. It is zero otherwise, and $c$ is a constant. The pmf is shown below. Finally, let $Y\\triangleq X+Z$ be another DMS which is a function of both $X$ and $Z$.',
  figure: () => figGiven({v:[-1,0,1],h:[0.5,1,0.5],lab:['\\tfrac{c}{2}','c','\\tfrac{c}{2}'],name:'Z'}),
  parts:['[10 pts] Calculate the entropy of the source, $Y$.',
         '[10 pts] Design a <em>binary</em> Huffman code for the source, $Y$.',
         '[5 pts] Calculate the coding efficiency of the Huffman code designed in part (b).'],
  figSol: () => figPmf({v:[-1,0,1,2,3,4],n:[1,3,4,4,3,1],D:16,name:'Y'})+figHuff({n:[1,3,4,4,3,1],D:16,name:'Y',lab:['-1','0','1','2','3','4'],codes:['0010','11','01','10','000','0011'],order:['001','00','1','0','']}),
  sol:'<b>Given.</b> $X$ uniform on $\\{0,1,2,3\\}$, $p_Z(z)=c\\,2^{-|z|}$ for $z=-1,0,1$, independent, and $Y=X+Z$.<br>'
     +'<b>Find.</b> $c$, $H(Y)$, a binary Huffman code for $Y$, and its coding efficiency.<br>'
     +'<b>Method.</b> Find $c$ from $\\sum_z p_Z(z)=1$ before anything else. List $Y$ for every pair $(x,z)$, then add the probabilities that give the same value of $Y$. The entropy is $H(Y)=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Y)/\\bar{L}$.<br>'
     +'<b>Solution — (a).</b> '
     +'The constant comes first. The pmf of $Z$ must add to one:'
     +'$$\\begin{aligned}'
     +'\\sum_{z}p_Z(z)&=c\\left(\\tfrac12+1+\\tfrac12\\right)\\\\'
     +'&=2c\\\\'
     +'&=1'
     +'\\end{aligned}$$'
     +'So $c=\\tfrac12$, and $P(Z=-1)=\\tfrac14$, $P(Z=0)=\\tfrac12$, $P(Z=1)=\\tfrac14$.'
     +' With $P(X=x)=\\tfrac14$, the pair $(x,z)$ has probability $n_Z(z)/16$, where $n_Z=1,2,1$ for $z=-1,0,1$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' y&(x,z)\\ \\text{pairs}&P(Y=y)\\\\\\hline'
     +'-1&(0,-1)&\\frac{1}{16}\\\\'
     +' 0&(0,0),\\,(1,-1)&\\frac{2+1}{16}=\\frac{3}{16}\\\\'
     +' 1&(0,1),\\,(1,0),\\,(2,-1)&\\frac{1+2+1}{16}=\\frac{4}{16}\\\\'
     +' 2&(1,1),\\,(2,0),\\,(3,-1)&\\frac{1+2+1}{16}=\\frac{4}{16}\\\\'
     +' 3&(2,1),\\,(3,0)&\\frac{1+2}{16}=\\frac{3}{16}\\\\'
     +' 4&(3,1)&\\frac{1}{16}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{16}{16}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}\\\\'
     +'&=2\\cdot\\frac{4}{16}\\log_2 4+2\\cdot\\frac{3}{16}\\log_2 \\frac{16}{3}+2\\cdot\\frac{1}{16}\\log_2 16\\\\'
     +'&=2(0.5000)+2(0.4528)+2(0.2500)\\\\'
     +'&=2.4056\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'Work with the numerators over $16$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $4,4,3,3,1,1$.<br>'
     +'Merge $1$: $1+1=2$, list $4,4,3,3,\\mathbf{2}$.<br>'
     +'Merge $2$: $3+2=5$, list $\\mathbf{5},4,4,3$.<br>'
     +'Merge $3$: $4+3=7$, list $\\mathbf{7},5,4$.<br>'
     +'Merge $4$: $5+4=9$, list $\\mathbf{9},7$.<br>'
     +'Merge $5$: $9+7=16$, list $\\mathbf{16}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' y&P(Y=y)&\\text{codeword}&l\\\\\\hline'
     +' 3&\\frac{3}{16}&\\mathtt{000}&3\\\\'
     +'-1&\\frac{1}{16}&\\mathtt{0010}&4\\\\'
     +' 4&\\frac{1}{16}&\\mathtt{0011}&4\\\\'
     +' 1&\\frac{4}{16}&\\mathtt{01}&2\\\\'
     +' 2&\\frac{4}{16}&\\mathtt{10}&2\\\\'
     +' 0&\\frac{3}{16}&\\mathtt{11}&2'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (c).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{y}P(Y=y)\\,l(y)\\\\'
     +'&=\\frac{1}{16}\\bigl[3(3)+1(4)+1(4)+4(2)\\\\&\\qquad+4(2)+3(2)\\bigr]\\\\'
     +'&=\\frac{39}{16}\\\\'
     +'&=2.4375\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Y)}{\\bar{L}}\\\\'
     +'&=\\frac{2.4056}{2.4375}\\\\'
     +'&=0.9869'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=98.69\\%$.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{2+5+7+9+16}{16}=\\frac{39}{16}$$'
     +'This matches part (c). The entropy follows by a second route, from the numerators $n_y=16\\,P(Y=y)$:'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\log_2 16-\\frac{1}{16}\\sum_{y}n_y\\log_2 n_y\\\\'
     +'&=4.0000-\\frac{1}{16}\\bigl(2\\cdot4\\log_2 4+2\\cdot3\\log_2 3\\bigr)\\\\'
     +'&=4.0000-1.5944\\\\'
     +'&=2.4056'
     +'\\end{aligned}$$'
     +'The Kraft sum is $3\\cdot 2^{-2}+2^{-3}+2\\cdot 2^{-4}=1$, so the tree has no unused branch. The bound $2.4056\\le 2.4375<3.4056$ holds.',
  err:'Writing $2^{-|z|}$ as $2^{-z}$, which makes $z=-1$ four times as likely as $z=1$. The absolute value keeps the pmf symmetric.',
  teach:'Adding a small symmetric $Z$ to a uniform $X$ spreads four symbols into six. The two edge values $-1$ and $4$ become the rare symbols.' },

{ id:'D6-13', module:'M6', type:'fxz', src:'Final Q4',
  stem:'Let $X$ be a discrete memoryless source (DMS) which is modeled as a uniform random variable on the integers $0,1,\\ldots,5$. Let $Z$ be a random variable (independent of $X$) with the probability mass function $p_Z(z)=c\\,z$ for $z\\in\\{1,3\\}$. It is zero otherwise, and $c$ is a constant. The pmf is shown below. Finally, let $Y\\triangleq \\left\\lfloor X/Z\\right\\rfloor$ be another DMS which is a function of both $X$ and $Z$. Here $\\lfloor u\\rfloor$ is the largest integer not greater than $u$.',
  figure: () => figGiven({v:[1,3],h:[1,3],lab:['c','3c'],name:'Z'}),
  parts:['[10 pts] Calculate the entropy of the source, $Y$.',
         '[10 pts] Design a <em>binary</em> Huffman code for the source, $Y$.',
         '[5 pts] Calculate the coding efficiency of the Huffman code designed in part (b).'],
  figSol: () => figPmf({v:[0,1,2,3,4,5],n:[10,10,1,1,1,1],D:24,name:'Y'})+figHuff({n:[10,10,1,1,1,1],D:24,name:'Y',lab:['0','1','2','3','4','5'],codes:['1','00','0100','0101','0110','0111'],order:['011','010','01','0','']}),
  sol:'<b>Given.</b> $X$ uniform on $\\{0,\\ldots,5\\}$, $p_Z(z)=cz$ for $z=1,3$, independent, and $Y=\\lfloor X/Z\\rfloor$.<br>'
     +'<b>Find.</b> $c$, $H(Y)$, a binary Huffman code for $Y$, and its coding efficiency.<br>'
     +'<b>Method.</b> Find $c$ from $\\sum_z p_Z(z)=1$ before anything else. List $Y$ for every pair $(x,z)$, then add the probabilities that give the same value of $Y$. The entropy is $H(Y)=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Y)/\\bar{L}$.<br>'
     +'<b>Solution — (a).</b> '
     +'The constant comes first. The pmf of $Z$ must add to one:'
     +'$$\\begin{aligned}'
     +'\\sum_{z}p_Z(z)&=c(1)+c(3)\\\\'
     +'&=4c\\\\'
     +'&=1'
     +'\\end{aligned}$$'
     +'So $c=\\tfrac14$, and $P(Z=1)=\\tfrac14$, $P(Z=3)=\\tfrac34$.'
     +' With $P(X=x)=\\tfrac16$, the pair $(x,z)$ has probability $n_Z(z)/24$, where $n_Z=1,3$ for $z=1,3$.'
     +' For example $(x,z)=(5,3)$ gives $\\lfloor 5/3\\rfloor=1$, and $(5,1)$ gives $5$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' y&(x,z)\\ \\text{pairs}&P(Y=y)\\\\\\hline'
     +' 0&(0,1),\\,(0,3),\\,(1,3),\\,(2,3)&\\frac{1+3+3+3}{24}=\\frac{10}{24}\\\\'
     +' 1&(1,1),\\,(3,3),\\,(4,3),\\,(5,3)&\\frac{1+3+3+3}{24}=\\frac{10}{24}\\\\'
     +' 2&(2,1)&\\frac{1}{24}\\\\'
     +' 3&(3,1)&\\frac{1}{24}\\\\'
     +' 4&(4,1)&\\frac{1}{24}\\\\'
     +' 5&(5,1)&\\frac{1}{24}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{24}{24}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}\\\\'
     +'&=2\\cdot\\frac{10}{24}\\log_2 \\frac{12}{5}+4\\cdot\\frac{1}{24}\\log_2 24\\\\'
     +'&=2(0.52626)+4(0.19104)\\\\'
     +'&=1.8167\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'Work with the numerators over $24$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $10,10,1,1,1,1$.<br>'
     +'Merge $1$: $1+1=2$, list $10,10,\\mathbf{2},1,1$.<br>'
     +'Merge $2$: $1+1=2$, list $10,10,\\mathbf{2},2$.<br>'
     +'Merge $3$: $2+2=4$, list $10,10,\\mathbf{4}$.<br>'
     +'Merge $4$: $10+4=14$, list $\\mathbf{14},10$.<br>'
     +'Merge $5$: $14+10=24$, list $\\mathbf{24}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' y&P(Y=y)&\\text{codeword}&l\\\\\\hline'
     +' 1&\\frac{10}{24}&\\mathtt{00}&2\\\\'
     +' 2&\\frac{1}{24}&\\mathtt{0100}&4\\\\'
     +' 3&\\frac{1}{24}&\\mathtt{0101}&4\\\\'
     +' 4&\\frac{1}{24}&\\mathtt{0110}&4\\\\'
     +' 5&\\frac{1}{24}&\\mathtt{0111}&4\\\\'
     +' 0&\\frac{10}{24}&\\mathtt{1}&1'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (c).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{y}P(Y=y)\\,l(y)\\\\'
     +'&=\\frac{1}{24}\\bigl[10(2)+1(4)+1(4)+1(4)\\\\&\\qquad+1(4)+10(1)\\bigr]\\\\'
     +'&=\\frac{46}{24}\\\\'
     +'&=\\frac{23}{12}\\\\'
     +'&=1.9167\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Y)}{\\bar{L}}\\\\'
     +'&=\\frac{1.8167}{1.9167}\\\\'
     +'&=0.9478'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=94.78\\%$.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{2+2+4+14+24}{24}=\\frac{46}{24}$$'
     +'This matches part (c). The entropy follows by a second route, from the numerators $n_y=24\\,P(Y=y)$:'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\log_2 24-\\frac{1}{24}\\sum_{y}n_y\\log_2 n_y\\\\'
     +'&=4.5850-\\frac{1}{24}\\bigl(2\\cdot10\\log_2 10\\bigr)\\\\'
     +'&=4.5850-2.7683\\\\'
     +'&=1.8167'
     +'\\end{aligned}$$'
     +'The Kraft sum is $2^{-1}+2^{-2}+4\\cdot 2^{-4}=1$, so the tree has no unused branch. The bound $1.8167\\le 1.9167<2.8167$ holds.',
  err:'Rounding $5/3$ to $2$. The floor keeps the integer part, so $\\lfloor 5/3\\rfloor=1$.',
  teach:'Two symbols share $\\tfrac{20}{24}$ of the probability. The four rare symbols sit together at depth four.' },

{ id:'D6-14', module:'M6', type:'capacity', src:'Madhow P7.2',
  stem:'Three uncoded constellations with Gray coding are used on a channel with additive white Gaussian noise: QPSK, 8-PSK and 16-QAM. Each must reach the bit error probability $P_b=10^{-4}$. With ideal Nyquist pulses and no excess bandwidth, an $M$-point constellation sends $\\log_2 M$ bits per second per hertz. The nearest-neighbour approximations of the bit error probability are $P_b=Q\\big(\\sqrt{2E_b/N_0}\\big)$ for QPSK, $P_b\\approx\\tfrac{2}{3}\\,Q\\big(\\sqrt{0.879\\,E_b/N_0}\\big)$ for 8-PSK and $P_b\\approx\\tfrac{3}{4}\\,Q\\big(\\sqrt{0.8\\,E_b/N_0}\\big)$ for 16-QAM. Here $Q(x)$ is the probability that a zero-mean, unit-variance Gaussian variable exceeds $x$. A table gives $Q(3.719)=1.00\\times10^{-4}$, $Q(3.646)=1.33\\times10^{-4}$ and $Q(3.615)=1.50\\times10^{-4}$.',
  parts:['[10 pts] For each constellation, find the $E_b/N_0$ in dB that gives $P_b=10^{-4}$.',
         '[8 pts] Give the spectral efficiency $r$ of each constellation. Then find the Shannon limit at that efficiency, the least $E_b/N_0$ in dB at which any system with it works reliably.',
         '[7 pts] How far is each constellation from its Shannon limit, in dB? Name the constellation farthest from its limit, and give that gap as a ratio of energies per bit.'],
  figSol: () => figLimit({xr:[-4,16], yr:[0,5], h:320, imp:[2.2,4.3], floor:0.35,
    gaps:[{r:2, x:8.40, c:C.mid, lab:'6.64\\ \\mathrm{dB}'},
          {r:3, x:11.72, c:C.mid, lab:'8.04\\ \\mathrm{dB}'},
          {r:4, x:12.21, c:C.mid, lab:'6.47\\ \\mathrm{dB}'}],
    pts:[{x:8.40, r:2, c:C.out, lab:'\\text{QPSK}'},
         {x:11.72, r:3, c:C.out, lab:'8\\text{-PSK}'},
         {x:12.21, r:4, c:C.out, lab:'16\\text{-QAM}'}]}),
  sol:'<b>Given.</b> QPSK, 8-PSK and 16-QAM with Gray coding, the target $P_b=10^{-4}$, their nearest-neighbour approximations, $r=\\log_2 M$ b/s/Hz, and three values of $Q$.<br>'
     +'<b>Find.</b> The $E_b/N_0$ each constellation needs, its spectral efficiency and Shannon limit, and the gap between the two in dB.<br>'
     +'<b>Method.</b> Each approximation has the form $P_b\\approx a\\,Q\\big(\\sqrt{b\\,E_b/N_0}\\big)$. Divide the target by $a$ to get the value of $Q$, read its argument $x$ from the table, and solve $b\\,E_b/N_0=x^{2}$.'
     +' The Shannon limit at efficiency $r$ is the capacity boundary of the bandlimited channel:'
     +'$$\\frac{E_b}{N_0}\\bigg|_{\\min}=\\frac{2^{r}-1}{r}$$'
     +'A gap in dB is the difference of two values in dB, which is $10\\log_{10}$ of the ratio of the two energies per bit.<br>'
     +'<b>Solution — (a).</b> '
     +'For QPSK, $a=1$, so $Q\\big(\\sqrt{2E_b/N_0}\\big)=1.00\\times10^{-4}$ and the table gives the argument $3.719$.'
     +'$$\\begin{aligned}'
     +'\\frac{E_b}{N_0}&=\\frac{3.719^{2}}{2}\\\\'
     +'&=\\frac{13.831}{2}\\\\'
     +'&=6.915\\\\'
     +'&=8.40\\ \\text{dB}'
     +'\\end{aligned}$$'
     +'For 8-PSK, the value of $Q$ is $10^{-4}/\\tfrac{2}{3}=1.50\\times10^{-4}$, so the argument is $3.615$.'
     +'$$\\begin{aligned}'
     +'\\frac{E_b}{N_0}&=\\frac{3.615^{2}}{0.879}\\\\'
     +'&=\\frac{13.068}{0.879}\\\\'
     +'&=14.867\\\\'
     +'&=11.72\\ \\text{dB}'
     +'\\end{aligned}$$'
     +'For 16-QAM, the value of $Q$ is $10^{-4}/\\tfrac{3}{4}=1.33\\times10^{-4}$, so the argument is $3.646$.'
     +'$$\\begin{aligned}'
     +'\\frac{E_b}{N_0}&=\\frac{3.646^{2}}{0.8}\\\\'
     +'&=\\frac{13.293}{0.8}\\\\'
     +'&=16.617\\\\'
     +'&=12.21\\ \\text{dB}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'The spectral efficiencies are $r=\\log_2 4=2$, $\\log_2 8=3$ and $\\log_2 16=4$ b/s/Hz. The limit at each one follows from the boundary.'
     +'$$\\begin{aligned}'
     +'r=2:\\quad\\frac{E_b}{N_0}\\bigg|_{\\min}&=\\frac{2^{2}-1}{2}=1.5=1.76\\ \\text{dB}\\\\'
     +'r=3:\\quad\\frac{E_b}{N_0}\\bigg|_{\\min}&=\\frac{2^{3}-1}{3}=2.333=3.68\\ \\text{dB}\\\\'
     +'r=4:\\quad\\frac{E_b}{N_0}\\bigg|_{\\min}&=\\frac{2^{4}-1}{4}=3.75=5.74\\ \\text{dB}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> '
     +'Each gap is the required value of part (a) minus the limit of part (b).'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c|c}'
     +'\\text{constellation}&r&E_b/N_0\\ \\text{needed}&\\text{limit}&\\text{gap}\\\\\\hline'
     +'\\text{QPSK}&2&8.40\\ \\text{dB}&1.76\\ \\text{dB}&6.64\\ \\text{dB}\\\\'
     +'8\\text{-PSK}&3&11.72\\ \\text{dB}&3.68\\ \\text{dB}&8.04\\ \\text{dB}\\\\'
     +'16\\text{-QAM}&4&12.21\\ \\text{dB}&5.74\\ \\text{dB}&6.47\\ \\text{dB}'
     +'\\end{array}$$</div>'
     +'8-PSK is farthest from its limit. As a ratio of energies per bit, its gap is'
     +'$$\\begin{aligned}'
     +'\\frac{14.867}{2.333}&=6.37\\\\'
     +'&=10\\log_{10}6.37\\ \\text{dB}\\\\'
     +'&=8.04\\ \\text{dB}'
     +'\\end{aligned}$$'
     +'A code with the same efficiency could at best cut the energy per bit of 8-PSK by a factor of $6.37$.<br>'
     +'<b>Check.</b> '
     +'Each gap also follows from the ratio of energies per bit. For QPSK, $6.915/1.5=4.610$, and $10\\log_{10}4.610=6.64$ dB. For 16-QAM, $16.617/3.75=4.431$, and $10\\log_{10}4.431=6.47$ dB.'
     +' Every constellation needs more than its limit, as an uncoded system must. The limits rise with $r$, and none lies below the floor of $-1.59$ dB.',
  err:'Setting $Q\\big(\\sqrt{b\\,E_b/N_0}\\big)=10^{-4}$ for 8-PSK and 16-QAM. The factor in front must be divided out first, so the values of $Q$ are $1.50\\times10^{-4}$ and $1.33\\times10^{-4}$.',
  teach:'8-PSK sits farthest from its limit because its points share one circle, while 16-QAM uses the plane. Uncoded systems leave six to eight dB that coding can recover.' },

{ id:'D6-15', module:'M6', type:'fxz', src:'Final Q4',
  stem:'Let $X$ be a discrete memoryless source (DMS) which is modeled as a uniform random variable on the alphabet $\\{0,1,2,3\\}$. Let $Z$ be a random variable (independent of $X$) with the probability mass function $p_Z(z)=c\\left(\\frac{1}{2}\\right)^{z}$ for the integers $0\\le z\\le 3$. It is zero otherwise, and $c$ is a constant. Finally, let $Y\\triangleq \\min(X,Z)$ be another DMS which is a function of both $X$ and $Z$.',
  parts:['[10 pts] Calculate the entropy of the source, $Y$.',
         '[10 pts] Design a <em>binary</em> Huffman code for the source, $Y$.',
         '[5 pts] Calculate the coding efficiency of the Huffman code designed in part (b).'],
  figSol: () => figPmf({v:[0,1,2,3],n:[39,15,5,1],D:60,name:'Y'})+figHuff({n:[39,15,5,1],D:60,name:'Y',lab:['0','1','2','3'],codes:['0','10','110','111'],order:['11','1','']}),
  sol:'<b>Given.</b> $X$ uniform on $\\{0,1,2,3\\}$, $p_Z(z)=c\\left(\\tfrac12\\right)^{z}$ for $z=0,\\ldots,3$, independent, and $Y=\\min(X,Z)$.<br>'
     +'<b>Find.</b> $c$, $H(Y)$, a binary Huffman code for $Y$, and its coding efficiency.<br>'
     +'<b>Method.</b> Find $c$ from $\\sum_z p_Z(z)=1$ before anything else. List $Y$ for every pair $(x,z)$, then add the probabilities that give the same value of $Y$. The entropy is $H(Y)=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Y)/\\bar{L}$.<br>'
     +'<b>Solution — (a).</b> '
     +'The constant comes first. The pmf of $Z$ must add to one:'
     +'$$\\begin{aligned}'
     +'\\sum_{z}p_Z(z)&=c\\left(1+\\tfrac12+\\tfrac14+\\tfrac18\\right)\\\\'
     +'&=\\tfrac{15}{8}\\,c\\\\'
     +'&=1'
     +'\\end{aligned}$$'
     +'So $c=\\tfrac{8}{15}$, and $P(Z=z)=\\tfrac{8}{15},\\tfrac{4}{15},\\tfrac{2}{15},\\tfrac{1}{15}$ for $z=0,1,2,3$.'
     +' With $P(X=x)=\\tfrac14$, the pair $(x,z)$ has probability $n_Z(z)/60$, where $n_Z=8,4,2,1$ for $z=0,1,2,3$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' y&(x,z)\\ \\text{pairs}&P(Y=y)\\\\\\hline'
     +' 0&(0,0),\\,(0,1),\\,(0,2),\\,(0,3),\\,(1,0),\\,(2,0),\\,(3,0)&\\frac{8+4+2+1+8+8+8}{60}=\\frac{39}{60}\\\\'
     +' 1&(1,1),\\,(1,2),\\,(1,3),\\,(2,1),\\,(3,1)&\\frac{4+2+1+4+4}{60}=\\frac{15}{60}\\\\'
     +' 2&(2,2),\\,(2,3),\\,(3,2)&\\frac{2+1+2}{60}=\\frac{5}{60}\\\\'
     +' 3&(3,3)&\\frac{1}{60}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{60}{60}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}\\\\'
     +'&=\\frac{39}{60}\\log_2 \\frac{20}{13}+\\frac{15}{60}\\log_2 4+\\frac{5}{60}\\log_2 12\\\\'
     +'&\\quad+\\frac{1}{60}\\log_2 60\\\\'
     +'&=0.40397+0.50000+0.29875+0.09845\\\\'
     +'&=1.3012\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'Work with the numerators over $60$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $39,15,5,1$.<br>'
     +'Merge $1$: $5+1=6$, list $39,15,\\mathbf{6}$.<br>'
     +'Merge $2$: $15+6=21$, list $39,\\mathbf{21}$.<br>'
     +'Merge $3$: $39+21=60$, list $\\mathbf{60}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' y&P(Y=y)&\\text{codeword}&l\\\\\\hline'
     +' 0&\\frac{39}{60}&\\mathtt{0}&1\\\\'
     +' 1&\\frac{15}{60}&\\mathtt{10}&2\\\\'
     +' 2&\\frac{5}{60}&\\mathtt{110}&3\\\\'
     +' 3&\\frac{1}{60}&\\mathtt{111}&3'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (c).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{y}P(Y=y)\\,l(y)\\\\'
     +'&=\\frac{1}{60}\\bigl[39(1)+15(2)+5(3)+1(3)\\bigr]\\\\'
     +'&=\\frac{87}{60}\\\\'
     +'&=\\frac{29}{20}\\\\'
     +'&=1.4500\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Y)}{\\bar{L}}\\\\'
     +'&=\\frac{1.3012}{1.4500}\\\\'
     +'&=0.8974'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=89.74\\%$.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{6+21+60}{60}=\\frac{87}{60}$$'
     +'This matches part (c). The entropy follows by a second route, from the numerators $n_y=60\\,P(Y=y)$:'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\log_2 60-\\frac{1}{60}\\sum_{y}n_y\\log_2 n_y\\\\'
     +'&=5.9069-\\frac{1}{60}\\bigl(39\\log_2 39+15\\log_2 15+5\\log_2 5\\bigr)\\\\'
     +'&=5.9069-4.6057\\\\'
     +'&=1.3012'
     +'\\end{aligned}$$'
     +'The Kraft sum is $2^{-1}+2^{-2}+2\\cdot 2^{-3}=1$, so the tree has no unused branch. The bound $1.3012\\le 1.4500<2.3012$ holds.'
     +' The tail also follows from $P(Y\\ge y)=P(X\\ge y)P(Z\\ge y)$. For $y=3$ it gives $\\tfrac14\\cdot\\tfrac{1}{15}=\\tfrac{1}{60}$, the value in the table.',
  err:'Using the rule for a maximum, $P(Y\\le y)=P(X\\le y)P(Z\\le y)$, for a minimum. For a minimum the product rule holds for $P(Y\\ge y)$.',
  teach:'The symbol $Y=0$ holds $\\tfrac{39}{60}$ of the probability. A single-symbol code cannot go below one bit, so the efficiency stays under $0.9$.' },

{ id:'D6-16', module:'M6', type:'sum', src:'Final Q4',
  stem:'Consider two <em>independent</em> discrete memoryless sources, $X$ and $Y$. The source $X$ is described by the alphabet $\\mathcal{X}=\\{0,1,2\\}$, where $P(X=0)=2P(X=1)=4P(X=2)$. Similarly, the source $Y$ is described by the alphabet $\\mathcal{Y}=\\{0,1,2,3\\}$, where each symbol is generated with equal probability. Let $Z\\triangleq X+Y$ be another discrete memoryless source.',
  parts:['[10 pts] Calculate the entropy of the source, $Z$.',
         '[10 pts] Design a <em>binary</em> Huffman code for the source, $Z$.',
         '[5 pts] Calculate the coding efficiency of the Huffman code designed in part (b).'],
  figSol: () => figPmf({v:[0,1,2,3,4,5],n:[4,6,7,7,3,1],D:28,name:'Z'})+figHuff({n:[4,6,7,7,3,1],D:28,name:'Z',lab:['0','1','2','3','4','5'],codes:['001','11','01','10','0000','0001'],order:['000','00','1','0','']}),
  sol:'<b>Given.</b> $P(X=0)=2P(X=1)=4P(X=2)$ on $\\{0,1,2\\}$, $Y$ uniform on $\\{0,1,2,3\\}$, independent, and $Z=X+Y$.<br>'
     +'<b>Find.</b> $H(Z)$, a binary Huffman code for $Z$, and its coding efficiency.<br>'
     +'<b>Method.</b> Turn the ratio statement into probabilities first. List $Z$ for every pair $(x,y)$, then add the probabilities that give the same value of $Z$. The entropy is $H(Z)=\\sum_{z}P(Z=z)\\log_2\\frac{1}{P(Z=z)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Z)/\\bar{L}$.<br>'
     +'<b>Solution — (a).</b> '
     +'Write $P(X=2)=q$. Then $P(X=1)=2q$ and $P(X=0)=4q$, and $7q=1$ gives $q=\\tfrac17$.'
     +' So the pair $(x,y)$ has probability $n_X(x)/28$, where $n_X=4,2,1$ for $x=0,1,2$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' z&(x,y)\\ \\text{pairs}&P(Z=z)\\\\\\hline'
     +' 0&(0,0)&\\frac{4}{28}\\\\'
     +' 1&(0,1),\\,(1,0)&\\frac{4+2}{28}=\\frac{6}{28}\\\\'
     +' 2&(0,2),\\,(1,1),\\,(2,0)&\\frac{4+2+1}{28}=\\frac{7}{28}\\\\'
     +' 3&(0,3),\\,(1,2),\\,(2,1)&\\frac{4+2+1}{28}=\\frac{7}{28}\\\\'
     +' 4&(1,3),\\,(2,2)&\\frac{2+1}{28}=\\frac{3}{28}\\\\'
     +' 5&(2,3)&\\frac{1}{28}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{28}{28}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Z)&=\\sum_{z}P(Z=z)\\log_2\\frac{1}{P(Z=z)}\\\\'
     +'&=2\\cdot\\frac{7}{28}\\log_2 4+\\frac{6}{28}\\log_2 \\frac{14}{3}+\\frac{4}{28}\\log_2 7\\\\'
     +'&\\quad+\\frac{3}{28}\\log_2 \\frac{28}{3}+\\frac{1}{28}\\log_2 28\\\\'
     +'&=2(0.50000)+0.47623+0.40105+0.34526\\\\'
     +'&\\quad+0.17169\\\\'
     +'&=2.3942\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'Work with the numerators over $28$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $7,7,6,4,3,1$.<br>'
     +'Merge $1$: $3+1=4$, list $7,7,6,\\mathbf{4},4$.<br>'
     +'Merge $2$: $4+4=8$, list $\\mathbf{8},7,7,6$.<br>'
     +'Merge $3$: $7+6=13$, list $\\mathbf{13},8,7$.<br>'
     +'Merge $4$: $8+7=15$, list $\\mathbf{15},13$.<br>'
     +'Merge $5$: $15+13=28$, list $\\mathbf{28}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' z&P(Z=z)&\\text{codeword}&l\\\\\\hline'
     +' 4&\\frac{3}{28}&\\mathtt{0000}&4\\\\'
     +' 5&\\frac{1}{28}&\\mathtt{0001}&4\\\\'
     +' 0&\\frac{4}{28}&\\mathtt{001}&3\\\\'
     +' 2&\\frac{7}{28}&\\mathtt{01}&2\\\\'
     +' 3&\\frac{7}{28}&\\mathtt{10}&2\\\\'
     +' 1&\\frac{6}{28}&\\mathtt{11}&2'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (c).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{z}P(Z=z)\\,l(z)\\\\'
     +'&=\\frac{1}{28}\\bigl[3(4)+1(4)+4(3)+7(2)\\\\&\\qquad+7(2)+6(2)\\bigr]\\\\'
     +'&=\\frac{68}{28}\\\\'
     +'&=\\frac{17}{7}\\\\'
     +'&=2.4286\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Z)}{\\bar{L}}\\\\'
     +'&=\\frac{2.3942}{2.4286}\\\\'
     +'&=0.9859'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=98.59\\%$.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{4+8+13+15+28}{28}=\\frac{68}{28}$$'
     +'This matches part (c). The entropy follows by a second route, from the numerators $n_z=28\\,P(Z=z)$:'
     +'$$\\begin{aligned}'
     +' H(Z)&=\\log_2 28-\\frac{1}{28}\\sum_{z}n_z\\log_2 n_z\\\\'
     +'&=4.8074-\\frac{1}{28}\\bigl(2\\cdot7\\log_2 7+6\\log_2 6+4\\log_2 4+3\\log_2 3\\bigr)\\\\'
     +'&=4.8074-2.4131\\\\'
     +'&=2.3942'
     +'\\end{aligned}$$'
     +'The Kraft sum is $3\\cdot 2^{-2}+2^{-3}+2\\cdot 2^{-4}=1$, so the tree has no unused branch. The bound $2.3942\\le 2.4286<3.3942$ holds.',
  err:'Reading $P(X=0)=2P(X=1)=4P(X=2)$ as $P(X=0)=\\tfrac27$. The chain makes $X=0$ the most likely, with four parts out of seven.',
  teach:'The closest shape to the examination\'s sum of two sources. Students misread the ratio statement, so ask for the three probabilities before anything else.' },

{ id:'D6-17', module:'M6', type:'sum', src:'Final Q4',
  stem:'Consider two <em>independent</em> discrete memoryless sources, $X$ and $Y$. The source $X$ is described by the alphabet $\\mathcal{X}=\\{1,2,3\\}$, where each symbol is generated with equal probability. Similarly, the source $Y$ is described by the alphabet $\\mathcal{Y}=\\{1,2,3\\}$, where $P(Y=1)=2P(Y=2)=2P(Y=3)$. Let $Z\\triangleq X\\times Y$ be another discrete memoryless source.',
  parts:['[10 pts] Calculate the entropy of the source, $Z$.',
         '[10 pts] Design a <em>binary</em> Huffman code for the source, $Z$.',
         '[5 pts] Calculate the coding efficiency of the Huffman code designed in part (b).'],
  figSol: () => figPmf({v:[1,2,3,4,6,9],n:[2,3,3,1,2,1],D:12,name:'Z'})+figHuff({n:[2,3,3,1,2,1],D:12,name:'Z',lab:['1','2','3','4','6','9'],codes:['000','01','10','110','001','111'],order:['11','00','1','0','']}),
  sol:'<b>Given.</b> $X$ uniform on $\\{1,2,3\\}$, $P(Y=1)=2P(Y=2)=2P(Y=3)$, independent, and $Z=XY$.<br>'
     +'<b>Find.</b> $H(Z)$, a binary Huffman code for $Z$, and its coding efficiency.<br>'
     +'<b>Method.</b> Turn the ratio statement into probabilities first. List $Z$ for every pair $(x,y)$, then add the probabilities that give the same value of $Z$. The entropy is $H(Z)=\\sum_{z}P(Z=z)\\log_2\\frac{1}{P(Z=z)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Z)/\\bar{L}$.<br>'
     +'<b>Solution — (a).</b> '
     +'With $P(Y=2)=P(Y=3)=q$ and $P(Y=1)=2q$, the sum $4q=1$ gives $q=\\tfrac14$.'
     +' So the pair $(x,y)$ has probability $n_Y(y)/12$, where $n_Y=2,1,1$ for $y=1,2,3$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' z&(x,y)\\ \\text{pairs}&P(Z=z)\\\\\\hline'
     +' 1&(1,1)&\\frac{2}{12}\\\\'
     +' 2&(1,2),\\,(2,1)&\\frac{1+2}{12}=\\frac{3}{12}\\\\'
     +' 3&(1,3),\\,(3,1)&\\frac{1+2}{12}=\\frac{3}{12}\\\\'
     +' 4&(2,2)&\\frac{1}{12}\\\\'
     +' 6&(2,3),\\,(3,2)&\\frac{2}{12}\\\\'
     +' 9&(3,3)&\\frac{1}{12}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{12}{12}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Z)&=\\sum_{z}P(Z=z)\\log_2\\frac{1}{P(Z=z)}\\\\'
     +'&=2\\cdot\\frac{3}{12}\\log_2 4+2\\cdot\\frac{2}{12}\\log_2 6+2\\cdot\\frac{1}{12}\\log_2 12\\\\'
     +'&=2(0.50000)+2(0.43083)+2(0.29875)\\\\'
     +'&=2.4591\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'Work with the numerators over $12$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $3,3,2,2,1,1$.<br>'
     +'Merge $1$: $1+1=2$, list $3,3,\\mathbf{2},2,2$.<br>'
     +'Merge $2$: $2+2=4$, list $\\mathbf{4},3,3,2$.<br>'
     +'Merge $3$: $3+2=5$, list $\\mathbf{5},4,3$.<br>'
     +'Merge $4$: $4+3=7$, list $\\mathbf{7},5$.<br>'
     +'Merge $5$: $7+5=12$, list $\\mathbf{12}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' z&P(Z=z)&\\text{codeword}&l\\\\\\hline'
     +' 1&\\frac{2}{12}&\\mathtt{000}&3\\\\'
     +' 6&\\frac{2}{12}&\\mathtt{001}&3\\\\'
     +' 2&\\frac{3}{12}&\\mathtt{01}&2\\\\'
     +' 3&\\frac{3}{12}&\\mathtt{10}&2\\\\'
     +' 4&\\frac{1}{12}&\\mathtt{110}&3\\\\'
     +' 9&\\frac{1}{12}&\\mathtt{111}&3'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (c).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{z}P(Z=z)\\,l(z)\\\\'
     +'&=\\frac{1}{12}\\bigl[2(3)+2(3)+3(2)+3(2)\\\\&\\qquad+1(3)+1(3)\\bigr]\\\\'
     +'&=\\frac{30}{12}\\\\'
     +'&=\\frac{5}{2}\\\\'
     +'&=2.5000\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Z)}{\\bar{L}}\\\\'
     +'&=\\frac{2.4591}{2.5000}\\\\'
     +'&=0.9837'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=98.37\\%$.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{2+4+5+7+12}{12}=\\frac{30}{12}$$'
     +'This matches part (c). The entropy follows by a second route, from the numerators $n_z=12\\,P(Z=z)$:'
     +'$$\\begin{aligned}'
     +' H(Z)&=\\log_2 12-\\frac{1}{12}\\sum_{z}n_z\\log_2 n_z\\\\'
     +'&=3.5850-\\frac{1}{12}\\bigl(2\\cdot3\\log_2 3+2\\cdot2\\log_2 2\\bigr)\\\\'
     +'&=3.5850-1.1258\\\\'
     +'&=2.4591'
     +'\\end{aligned}$$'
     +'The Kraft sum is $2\\cdot 2^{-2}+4\\cdot 2^{-3}=1$, so the tree has no unused branch. The bound $2.4591\\le 2.5000<3.4591$ holds.',
  err:'Listing $Z=2$ from the pair $(2,1)$ only. The pair $(1,2)$ also gives $Z=2$, so a product with two factorisations collects two terms.',
  teach:'The nine pairs give six different products. The collisions at $2$, $3$ and $6$ are where students lose probability.' },

{ id:'D6-18', module:'M6', type:'sum', src:'Final Q4',
  stem:'Consider two <em>independent</em> discrete memoryless sources, $X$ and $Y$. The source $X$ is described by the alphabet $\\mathcal{X}=\\{0,1,2,3\\}$, where each symbol is generated with equal probability. Similarly, the source $Y$ is described by the alphabet $\\mathcal{Y}=\\{0,1,\\ldots,5\\}$, where each symbol is generated with equal probability. Let $Z\\triangleq |X-Y|$ be another discrete memoryless source.',
  parts:['[10 pts] Calculate the entropy of the source, $Z$.',
         '[10 pts] Design a <em>binary</em> Huffman code for the source, $Z$.',
         '[5 pts] Calculate the coding efficiency of the Huffman code designed in part (b).'],
  figSol: () => figPmf({v:[0,1,2,3,4,5],n:[4,7,6,4,2,1],D:24,name:'Z'})+figHuff({n:[4,7,6,4,2,1],D:24,name:'Z',lab:['0','1','2','3','4','5'],codes:['11','01','10','000','0010','0011'],order:['001','00','1','0','']}),
  sol:'<b>Given.</b> $X$ uniform on $\\{0,\\ldots,3\\}$, $Y$ uniform on $\\{0,\\ldots,5\\}$, independent, and $Z=|X-Y|$.<br>'
     +'<b>Find.</b> $H(Z)$, a binary Huffman code for $Z$, and its coding efficiency.<br>'
     +'<b>Method.</b> List $Z$ for every pair $(x,y)$, then add the probabilities that give the same value of $Z$. The entropy is $H(Z)=\\sum_{z}P(Z=z)\\log_2\\frac{1}{P(Z=z)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Z)/\\bar{L}$.<br>'
     +'<b>Solution — (a).</b> '
     +'Each of the $24$ pairs has probability $\\tfrac{1}{24}$. So $P(Z=z)$ is the number of pairs with $|x-y|=z$, divided by $24$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' z&(x,y)\\ \\text{pairs}&P(Z=z)\\\\\\hline'
     +' 0&(0,0),\\,(1,1),\\,(2,2),\\,(3,3)&\\frac{4}{24}\\\\'
     +' 1&(0,1),\\,(1,0),\\,(1,2),\\,(2,1),\\,(2,3),\\,(3,2),\\,(3,4)&\\frac{7}{24}\\\\'
     +' 2&(0,2),\\,(1,3),\\,(2,0),\\,(2,4),\\,(3,1),\\,(3,5)&\\frac{6}{24}\\\\'
     +' 3&(0,3),\\,(1,4),\\,(2,5),\\,(3,0)&\\frac{4}{24}\\\\'
     +' 4&(0,4),\\,(1,5)&\\frac{2}{24}\\\\'
     +' 5&(0,5)&\\frac{1}{24}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{24}{24}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Z)&=\\sum_{z}P(Z=z)\\log_2\\frac{1}{P(Z=z)}\\\\'
     +'&=\\frac{7}{24}\\log_2 \\frac{24}{7}+\\frac{6}{24}\\log_2 4+2\\cdot\\frac{4}{24}\\log_2 6\\\\'
     +'&\\quad+\\frac{2}{24}\\log_2 12+\\frac{1}{24}\\log_2 24\\\\'
     +'&=0.51847+0.50000+2(0.43083)+0.29875\\\\'
     +'&\\quad+0.19104\\\\'
     +'&=2.3699\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'Work with the numerators over $24$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $7,6,4,4,2,1$.<br>'
     +'Merge $1$: $2+1=3$, list $7,6,4,4,\\mathbf{3}$.<br>'
     +'Merge $2$: $4+3=7$, list $\\mathbf{7},7,6,4$.<br>'
     +'Merge $3$: $6+4=10$, list $\\mathbf{10},7,7$.<br>'
     +'Merge $4$: $7+7=14$, list $\\mathbf{14},10$.<br>'
     +'Merge $5$: $14+10=24$, list $\\mathbf{24}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' z&P(Z=z)&\\text{codeword}&l\\\\\\hline'
     +' 3&\\frac{4}{24}&\\mathtt{000}&3\\\\'
     +' 4&\\frac{2}{24}&\\mathtt{0010}&4\\\\'
     +' 5&\\frac{1}{24}&\\mathtt{0011}&4\\\\'
     +' 1&\\frac{7}{24}&\\mathtt{01}&2\\\\'
     +' 2&\\frac{6}{24}&\\mathtt{10}&2\\\\'
     +' 0&\\frac{4}{24}&\\mathtt{11}&2'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (c).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{z}P(Z=z)\\,l(z)\\\\'
     +'&=\\frac{1}{24}\\bigl[4(3)+2(4)+1(4)+7(2)\\\\&\\qquad+6(2)+4(2)\\bigr]\\\\'
     +'&=\\frac{58}{24}\\\\'
     +'&=\\frac{29}{12}\\\\'
     +'&=2.4167\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Z)}{\\bar{L}}\\\\'
     +'&=\\frac{2.3699}{2.4167}\\\\'
     +'&=0.9807'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=98.07\\%$.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{3+7+10+14+24}{24}=\\frac{58}{24}$$'
     +'This matches part (c). The entropy follows by a second route, from the numerators $n_z=24\\,P(Z=z)$:'
     +'$$\\begin{aligned}'
     +' H(Z)&=\\log_2 24-\\frac{1}{24}\\sum_{z}n_z\\log_2 n_z\\\\'
     +'&=4.5850-\\frac{1}{24}\\bigl(7\\log_2 7+6\\log_2 6+2\\cdot4\\log_2 4+2\\log_2 2\\bigr)\\\\'
     +'&=4.5850-2.2151\\\\'
     +'&=2.3699'
     +'\\end{aligned}$$'
     +'The Kraft sum is $3\\cdot 2^{-2}+2^{-3}+2\\cdot 2^{-4}=1$, so the tree has no unused branch. The bound $2.3699\\le 2.4167<3.3699$ holds.',
  err:'Dropping the absolute value, so $Z$ runs from $-5$ to $3$. The distance $|x-y|$ folds each negative difference onto the positive one.',
  teach:'A folded variable. Ask for the alphabet first: $\\{0,\\ldots,5\\}$, which the larger range sets.' },

{ id:'D6-19', module:'M6', type:'sum', src:'Final Q4',
  stem:'Consider two <em>independent</em> discrete memoryless sources, $X$ and $Y$. The source $X$ is described by the alphabet $\\mathcal{X}=\\{1,2,3,4,5\\}$, where each symbol is generated with equal probability. Similarly, the source $Y$ is described by the same alphabet, where each symbol is generated with equal probability. Let $Z\\triangleq \\min(X,Y)$ be another discrete memoryless source.',
  parts:['[10 pts] Calculate the entropy of the source, $Z$.',
         '[10 pts] Design a <em>binary</em> Huffman code for the source, $Z$.',
         '[5 pts] Calculate the coding efficiency of the Huffman code designed in part (b).'],
  figSol: () => figPmf({v:[1,2,3,4,5],n:[9,7,5,3,1],D:25,name:'Z'})+figHuff({n:[9,7,5,3,1],D:25,name:'Z',lab:['1','2','3','4','5'],codes:['00','01','10','110','111'],order:['11','1','0','']}),
  sol:'<b>Given.</b> $X$ and $Y$ independent and uniform on $\\{1,\\ldots,5\\}$, and $Z=\\min(X,Y)$.<br>'
     +'<b>Find.</b> $H(Z)$, a binary Huffman code for $Z$, and its coding efficiency.<br>'
     +'<b>Method.</b> List $Z$ for every pair $(x,y)$, then add the probabilities that give the same value of $Z$. The entropy is $H(Z)=\\sum_{z}P(Z=z)\\log_2\\frac{1}{P(Z=z)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Z)/\\bar{L}$.<br>'
     +'<b>Solution — (a).</b> '
     +'Each of the $25$ pairs has probability $\\tfrac{1}{25}$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' z&(x,y)\\ \\text{pairs}&P(Z=z)\\\\\\hline'
     +' 1&(1,1),\\,(1,2),\\,(1,3),\\,(1,4),\\,(1,5),\\,(2,1),\\,(3,1),\\,(4,1),\\,(5,1)&\\frac{9}{25}\\\\'
     +' 2&(2,2),\\,(2,3),\\,(2,4),\\,(2,5),\\,(3,2),\\,(4,2),\\,(5,2)&\\frac{7}{25}\\\\'
     +' 3&(3,3),\\,(3,4),\\,(3,5),\\,(4,3),\\,(5,3)&\\frac{5}{25}\\\\'
     +' 4&(4,4),\\,(4,5),\\,(5,4)&\\frac{3}{25}\\\\'
     +' 5&(5,5)&\\frac{1}{25}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{25}{25}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Z)&=\\sum_{z}P(Z=z)\\log_2\\frac{1}{P(Z=z)}\\\\'
     +'&=\\frac{9}{25}\\log_2 \\frac{25}{9}+\\frac{7}{25}\\log_2 \\frac{25}{7}+\\frac{5}{25}\\log_2 5\\\\'
     +'&\\quad+\\frac{3}{25}\\log_2 \\frac{25}{3}+\\frac{1}{25}\\log_2 25\\\\'
     +'&=0.53062+0.51422+0.46439+0.36707\\\\'
     +'&\\quad+0.18575\\\\'
     +'&=2.0620\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'Work with the numerators over $25$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $9,7,5,3,1$.<br>'
     +'Merge $1$: $3+1=4$, list $9,7,5,\\mathbf{4}$.<br>'
     +'Merge $2$: $5+4=9$, list $\\mathbf{9},9,7$.<br>'
     +'Merge $3$: $9+7=16$, list $\\mathbf{16},9$.<br>'
     +'Merge $4$: $16+9=25$, list $\\mathbf{25}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' z&P(Z=z)&\\text{codeword}&l\\\\\\hline'
     +' 1&\\frac{9}{25}&\\mathtt{00}&2\\\\'
     +' 2&\\frac{7}{25}&\\mathtt{01}&2\\\\'
     +' 3&\\frac{5}{25}&\\mathtt{10}&2\\\\'
     +' 4&\\frac{3}{25}&\\mathtt{110}&3\\\\'
     +' 5&\\frac{1}{25}&\\mathtt{111}&3'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (c).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{z}P(Z=z)\\,l(z)\\\\'
     +'&=\\frac{1}{25}\\bigl[9(2)+7(2)+5(2)+3(3)+1(3)\\bigr]\\\\'
     +'&=\\frac{54}{25}\\\\'
     +'&=2.1600\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Z)}{\\bar{L}}\\\\'
     +'&=\\frac{2.0620}{2.1600}\\\\'
     +'&=0.9546'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=95.46\\%$.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{4+9+16+25}{25}=\\frac{54}{25}$$'
     +'This matches part (c). The entropy follows by a second route, from the numerators $n_z=25\\,P(Z=z)$:'
     +'$$\\begin{aligned}'
     +' H(Z)&=\\log_2 25-\\frac{1}{25}\\sum_{z}n_z\\log_2 n_z\\\\'
     +'&=4.6439-\\frac{1}{25}\\bigl(9\\log_2 9+7\\log_2 7+5\\log_2 5+3\\log_2 3\\bigr)\\\\'
     +'&=4.6439-2.5818\\\\'
     +'&=2.0620'
     +'\\end{aligned}$$'
     +'The Kraft sum is $3\\cdot 2^{-2}+2\\cdot 2^{-3}=1$, so the tree has no unused branch. The bound $2.0620\\le 2.1600<3.0620$ holds.'
     +' The count for $Z=z$ is $(6-z)^{2}-(5-z)^{2}=11-2z$. This gives $9,7,5,3,1$, as in the table.',
  err:'Counting the pair $(z,z)$ twice when listing the pairs with minimum $z$. There are $2(5-z)+1$ such pairs, not $2(5-z)+2$.',
  teach:'The odd numerators $9,7,5,3,1$ fall in equal steps. The Huffman code still uses only two lengths.' },

{ id:'D6-20', module:'M6', type:'sum', src:'Final Q4',
  stem:'Consider two <em>independent</em> discrete memoryless sources, $X$ and $Y$. The source $X$ is described by the alphabet $\\mathcal{X}=\\{0,1,2\\}$, where $P(X=1)=2P(X=0)=2P(X=2)$. Similarly, the source $Y$ is described by the alphabet $\\mathcal{Y}=\\{0,1,2\\}$, where $P(Y=0)=2P(Y=1)=4P(Y=2)$. Let $Z\\triangleq X-Y$ be another discrete memoryless source.',
  parts:['[10 pts] Calculate the entropy of the source, $Z$.',
         '[10 pts] Design a <em>binary</em> Huffman code for the source, $Z$.',
         '[5 pts] Calculate the coding efficiency of the Huffman code designed in part (b).'],
  figSol: () => figPmf({v:[-2,-1,0,1,2],n:[1,4,9,10,4],D:28,name:'Z'})+figHuff({n:[1,4,9,10,4],D:28,name:'Z',lab:['-2','-1','0','1','2'],codes:['0001','001','01','1','0000'],order:['000','00','0','']}),
  sol:'<b>Given.</b> $P(X=1)=2P(X=0)=2P(X=2)$, $P(Y=0)=2P(Y=1)=4P(Y=2)$, both on $\\{0,1,2\\}$, independent, and $Z=X-Y$.<br>'
     +'<b>Find.</b> $H(Z)$, a binary Huffman code for $Z$, and its coding efficiency.<br>'
     +'<b>Method.</b> Turn both ratio statements into probabilities first. List $Z$ for every pair $(x,y)$, then add the probabilities that give the same value of $Z$. The entropy is $H(Z)=\\sum_{z}P(Z=z)\\log_2\\frac{1}{P(Z=z)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Z)/\\bar{L}$.<br>'
     +'<b>Solution — (a).</b> '
     +'For $X$, $P(X=0)=P(X=2)=q$ and $P(X=1)=2q$, so $q=\\tfrac14$.'
     +' For $Y$, $P(Y=2)=r$, $P(Y=1)=2r$ and $P(Y=0)=4r$, so $r=\\tfrac17$.'
     +' The pair $(x,y)$ has probability $n_X(x)\\,n_Y(y)/28$, with $n_X=1,2,1$ and $n_Y=4,2,1$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' z&(x,y)\\ \\text{pairs}&P(Z=z)\\\\\\hline'
     +'-2&(0,2)&\\frac{1}{28}\\\\'
     +'-1&(0,1),\\,(1,2)&\\frac{2+2}{28}=\\frac{4}{28}\\\\'
     +' 0&(0,0),\\,(1,1),\\,(2,2)&\\frac{4+2\\cdot2+1}{28}=\\frac{9}{28}\\\\'
     +' 1&(1,0),\\,(2,1)&\\frac{2\\cdot4+2}{28}=\\frac{10}{28}\\\\'
     +' 2&(2,0)&\\frac{4}{28}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{28}{28}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Z)&=\\sum_{z}P(Z=z)\\log_2\\frac{1}{P(Z=z)}\\\\'
     +'&=\\frac{10}{28}\\log_2 \\frac{14}{5}+\\frac{9}{28}\\log_2 \\frac{28}{9}+2\\cdot\\frac{4}{28}\\log_2 7\\\\'
     +'&\\quad+\\frac{1}{28}\\log_2 28\\\\'
     +'&=0.53051+0.52632+2(0.40105)+0.17169\\\\'
     +'&=2.0306\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'Work with the numerators over $28$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $10,9,4,4,1$.<br>'
     +'Merge $1$: $4+1=5$, list $10,9,\\mathbf{5},4$.<br>'
     +'Merge $2$: $5+4=9$, list $10,\\mathbf{9},9$.<br>'
     +'Merge $3$: $9+9=18$, list $\\mathbf{18},10$.<br>'
     +'Merge $4$: $18+10=28$, list $\\mathbf{28}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' z&P(Z=z)&\\text{codeword}&l\\\\\\hline'
     +' 2&\\frac{4}{28}&\\mathtt{0000}&4\\\\'
     +'-2&\\frac{1}{28}&\\mathtt{0001}&4\\\\'
     +'-1&\\frac{4}{28}&\\mathtt{001}&3\\\\'
     +' 0&\\frac{9}{28}&\\mathtt{01}&2\\\\'
     +' 1&\\frac{10}{28}&\\mathtt{1}&1'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (c).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{z}P(Z=z)\\,l(z)\\\\'
     +'&=\\frac{1}{28}\\bigl[4(4)+1(4)+4(3)+9(2)+10(1)\\bigr]\\\\'
     +'&=\\frac{60}{28}\\\\'
     +'&=\\frac{15}{7}\\\\'
     +'&=2.1429\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Z)}{\\bar{L}}\\\\'
     +'&=\\frac{2.0306}{2.1429}\\\\'
     +'&=0.9476'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=94.76\\%$.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{5+9+18+28}{28}=\\frac{60}{28}$$'
     +'This matches part (c). The entropy follows by a second route, from the numerators $n_z=28\\,P(Z=z)$:'
     +'$$\\begin{aligned}'
     +' H(Z)&=\\log_2 28-\\frac{1}{28}\\sum_{z}n_z\\log_2 n_z\\\\'
     +'&=4.8074-\\frac{1}{28}\\bigl(10\\log_2 10+9\\log_2 9+2\\cdot4\\log_2 4\\bigr)\\\\'
     +'&=4.8074-2.7767\\\\'
     +'&=2.0306'
     +'\\end{aligned}$$'
     +'The Kraft sum is $2^{-1}+2^{-2}+2^{-3}+2\\cdot 2^{-4}=1$, so the tree has no unused branch. The bound $2.0306\\le 2.1429<3.0306$ holds.',
  err:'Computing $Y-X$ in place of $X-Y$. The pmf is then reflected about zero, and every symbol gets the probability of its negative.',
  teach:'Both sources are given by ratios, so two constants are found. The difference piles up at $0$ and $1$, which gives a ladder-shaped tree.' },

{ id:'D6-21', module:'M6', type:'sum', src:'Final Q4',
  stem:'Consider two <em>independent</em> discrete memoryless sources, $X$ and $Y$. The source $X$ is described by the alphabet $\\mathcal{X}=\\{1,2,3,4\\}$, where $P(X=k)=k\\,P(X=1)$. Similarly, the source $Y$ is described by the alphabet $\\mathcal{Y}=\\{0,2,4\\}$, where each symbol is generated with equal probability. Let $Z\\triangleq X+Y$ be another discrete memoryless source.',
  parts:['[10 pts] Calculate the entropy of the source, $Z$.',
         '[10 pts] Design a <em>binary</em> Huffman code for the source, $Z$.',
         '[5 pts] Calculate the coding efficiency of the Huffman code designed in part (b).'],
  figSol: () => figPmf({v:[1,2,3,4,5,6,7,8],n:[1,2,4,6,4,6,3,4],D:30,name:'Z'})+figHuff({n:[1,2,4,6,4,6,3,4],D:30,name:'Z',lab:['1','2','3','4','5','6','7','8'],codes:['1001','1000','001','11','010','000','101','011'],order:['100','10','01','00','1','0','']}),
  sol:'<b>Given.</b> $P(X=k)=kP(X=1)$ on $\\{1,2,3,4\\}$, $Y$ uniform on $\\{0,2,4\\}$, independent, and $Z=X+Y$.<br>'
     +'<b>Find.</b> $H(Z)$, a binary Huffman code for $Z$, and its coding efficiency.<br>'
     +'<b>Method.</b> Turn the ratio statement into probabilities first. List $Z$ for every pair $(x,y)$, then add the probabilities that give the same value of $Z$. The entropy is $H(Z)=\\sum_{z}P(Z=z)\\log_2\\frac{1}{P(Z=z)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Z)/\\bar{L}$.<br>'
     +'<b>Solution — (a).</b> '
     +'The ratio gives $P(X=k)=kq$, and $q(1+2+3+4)=10q=1$, so $q=\\tfrac{1}{10}$.'
     +' The pair $(x,y)$ has probability $n_X(x)/30$, where $n_X(x)=x$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' z&(x,y)\\ \\text{pairs}&P(Z=z)\\\\\\hline'
     +' 1&(1,0)&\\frac{1}{30}\\\\'
     +' 2&(2,0)&\\frac{2}{30}\\\\'
     +' 3&(1,2),\\,(3,0)&\\frac{1+3}{30}=\\frac{4}{30}\\\\'
     +' 4&(2,2),\\,(4,0)&\\frac{2+4}{30}=\\frac{6}{30}\\\\'
     +' 5&(1,4),\\,(3,2)&\\frac{1+3}{30}=\\frac{4}{30}\\\\'
     +' 6&(2,4),\\,(4,2)&\\frac{2+4}{30}=\\frac{6}{30}\\\\'
     +' 7&(3,4)&\\frac{3}{30}\\\\'
     +' 8&(4,4)&\\frac{4}{30}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{30}{30}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Z)&=\\sum_{z}P(Z=z)\\log_2\\frac{1}{P(Z=z)}\\\\'
     +'&=2\\cdot\\frac{6}{30}\\log_2 5+3\\cdot\\frac{4}{30}\\log_2 \\frac{15}{2}+\\frac{3}{30}\\log_2 10\\\\'
     +'&\\quad+\\frac{2}{30}\\log_2 15+\\frac{1}{30}\\log_2 30\\\\'
     +'&=2(0.46439)+3(0.38759)+0.33219+0.26046\\\\'
     +'&\\quad+0.16356\\\\'
     +'&=2.8477\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'Work with the numerators over $30$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $6,6,4,4,4,3,2,1$.<br>'
     +'Merge $1$: $2+1=3$, list $6,6,4,4,4,\\mathbf{3},3$.<br>'
     +'Merge $2$: $3+3=6$, list $\\mathbf{6},6,6,4,4,4$.<br>'
     +'Merge $3$: $4+4=8$, list $\\mathbf{8},6,6,6,4$.<br>'
     +'Merge $4$: $6+4=10$, list $\\mathbf{10},8,6,6$.<br>'
     +'Merge $5$: $6+6=12$, list $\\mathbf{12},10,8$.<br>'
     +'Merge $6$: $10+8=18$, list $\\mathbf{18},12$.<br>'
     +'Merge $7$: $18+12=30$, list $\\mathbf{30}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' z&P(Z=z)&\\text{codeword}&l\\\\\\hline'
     +' 6&\\frac{6}{30}&\\mathtt{000}&3\\\\'
     +' 3&\\frac{4}{30}&\\mathtt{001}&3\\\\'
     +' 5&\\frac{4}{30}&\\mathtt{010}&3\\\\'
     +' 8&\\frac{4}{30}&\\mathtt{011}&3\\\\'
     +' 2&\\frac{2}{30}&\\mathtt{1000}&4\\\\'
     +' 1&\\frac{1}{30}&\\mathtt{1001}&4\\\\'
     +' 7&\\frac{3}{30}&\\mathtt{101}&3\\\\'
     +' 4&\\frac{6}{30}&\\mathtt{11}&2'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (c).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{z}P(Z=z)\\,l(z)\\\\'
     +'&=\\frac{1}{30}\\bigl[6(3)+4(3)+4(3)+4(3)\\\\&\\qquad+2(4)+1(4)+3(3)+6(2)\\bigr]\\\\'
     +'&=\\frac{87}{30}\\\\'
     +'&=\\frac{29}{10}\\\\'
     +'&=2.9000\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Z)}{\\bar{L}}\\\\'
     +'&=\\frac{2.8477}{2.9000}\\\\'
     +'&=0.9820'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=98.20\\%$.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{3+6+8+10+12+18+30}{30}=\\frac{87}{30}$$'
     +'This matches part (c). The entropy follows by a second route, from the numerators $n_z=30\\,P(Z=z)$:'
     +'$$\\begin{aligned}'
     +' H(Z)&=\\log_2 30-\\frac{1}{30}\\sum_{z}n_z\\log_2 n_z\\\\'
     +'&=4.9069-\\frac{1}{30}\\bigl(2\\cdot6\\log_2 6+3\\cdot4\\log_2 4+3\\log_2 3+2\\log_2 2\\bigr)\\\\'
     +'&=4.9069-2.0591\\\\'
     +'&=2.8477'
     +'\\end{aligned}$$'
     +'The Kraft sum is $2^{-2}+5\\cdot 2^{-3}+2\\cdot 2^{-4}=1$, so the tree has no unused branch. The bound $2.8477\\le 2.9000<3.8477$ holds.',
  err:'Taking $P(X=k)=\\tfrac{k}{4}$, which adds to $\\tfrac{10}{4}$. The constant must make the four probabilities add to one.',
  teach:'Eight output symbols, the largest alphabet in the set. The sums overlap only in the middle, where $3,4,5,6$ each have two routes.' },

{ id:'D6-22', module:'M6', type:'capacity', src:'Madhow P7.5',
  stem:'An adaptive link uses a binary code of rate $\\tfrac12$ with one of three constellations: QPSK, 16-QAM or 64-QAM. The passband channel has bandwidth $W=6$ MHz. The symbols use ideal Nyquist pulses with no excess bandwidth, so the link sends $W$ symbols per second. Each coded scheme works $1.5$ dB above the Shannon limit for its spectral efficiency. The transmit power and the noise are fixed, and the received power falls as $1/d^{2}$ with the distance $d$.',
  parts:['[6 pts] Calculate the information bit rate $R_b$ of each scheme and its spectral efficiency $r=R_b/W$.',
         '[8 pts] Find the minimum $E_s/N_0$ in dB that each scheme needs, where $E_s$ is the energy per symbol.',
         '[6 pts] QPSK reaches the largest range, $2.4$ km. Find the ranges of the other two schemes.',
         '[5 pts] A user is at $d=1.2$ km. Which scheme gives the highest bit rate there, and with how many dB to spare?'],
  figSol: () => figLimit({xr:[-4,8], yr:[0,4], h:300, imp:[0.2,3.3], floor:0.3,
    gaps:[{r:1, x:1.50, c:C.mid, lab:'1.5\\ \\mathrm{dB}', dy:-0.32},
          {r:2, x:3.26, c:C.mid, lab:'1.5\\ \\mathrm{dB}', dy:-0.32},
          {r:3, x:5.18, c:C.mid, lab:'1.5\\ \\mathrm{dB}', dy:-0.32}],
    pts:[{x:1.50, r:1, c:C.out, lab:'\\text{QPSK}', dy:-0.02},
         {x:3.26, r:2, c:C.out, lab:'16\\text{-QAM}', dy:-0.02},
         {x:5.18, r:3, c:C.out, lab:'64\\text{-QAM}', dy:-0.02}]})
     + figRange({dmax:2.8, Rmax:22, at:1.2, pick:12,
    steps:[{d:0.907, R:18, lab:'64\\text{-QAM}', dlab:'0.91\\ \\mathrm{km}'},
           {d:1.386, R:12, lab:'16\\text{-QAM}', dlab:'1.39\\ \\mathrm{km}'},
           {d:2.4, R:6, lab:'\\text{QPSK}', dlab:'2.4\\ \\mathrm{km}'}]}),
  sol:'<b>Given.</b> A rate-$\\tfrac12$ code with QPSK, 16-QAM or 64-QAM, $W=6$ MHz and $W$ symbols per second. Each scheme works $1.5$ dB above its Shannon limit. The received power is proportional to $1/d^{2}$, and QPSK reaches $2.4$ km.<br>'
     +'<b>Find.</b> The bit rates and spectral efficiencies, the minimum $E_s/N_0$ of each scheme, the other two ranges, and the best scheme at $1.2$ km.<br>'
     +'<b>Method.</b> An $M$-point symbol carries $\\log_2 M$ coded bits. A code of rate $\\tfrac12$ makes half of them information bits.'
     +' The Shannon limit at efficiency $r$ is'
     +'$$\\frac{E_b}{N_0}\\bigg|_{\\min}=\\frac{2^{r}-1}{r}$$'
     +'Each symbol carries $r$ information bits here, so $E_s=r\\,E_b$. At a fixed transmit power the received $E_s/N_0$ is proportional to $1/d^{2}$. So a scheme that needs $\\Delta$ dB more has its range scaled by $10^{-\\Delta/20}$.<br>'
     +'<b>Solution — (a).</b> '
     +'The symbol rate is $6\\times10^{6}$ symbols per second. A symbol carries $\\tfrac12\\log_2 M$ information bits: $1$ for QPSK, $2$ for 16-QAM and $3$ for 64-QAM.'
     +'$$\\begin{aligned}'
     +'\\text{QPSK:}\\quad R_b&=(6\\times10^{6})(1)=6\\ \\text{Mb/s},\\quad r=1\\\\'
     +'\\text{16-QAM:}\\quad R_b&=(6\\times10^{6})(2)=12\\ \\text{Mb/s},\\quad r=2\\\\'
     +'\\text{64-QAM:}\\quad R_b&=(6\\times10^{6})(3)=18\\ \\text{Mb/s},\\quad r=3'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'First the Shannon limit of each efficiency, in dB.'
     +'$$\\begin{aligned}'
     +'r=1:\\quad\\frac{E_b}{N_0}\\bigg|_{\\min}&=\\frac{2-1}{1}=1=0\\ \\text{dB}\\\\'
     +'r=2:\\quad\\frac{E_b}{N_0}\\bigg|_{\\min}&=\\frac{4-1}{2}=1.5=1.76\\ \\text{dB}\\\\'
     +'r=3:\\quad\\frac{E_b}{N_0}\\bigg|_{\\min}&=\\frac{8-1}{3}=2.333=3.68\\ \\text{dB}'
     +'\\end{aligned}$$'
     +'Each scheme works $1.5$ dB above its limit. Then $E_s/N_0$ in dB adds $10\\log_{10}r$, because $E_s=r\\,E_b$.'
     +'$$\\begin{aligned}'
     +'\\text{QPSK:}\\quad \\frac{E_s}{N_0}&=0+1.5+10\\log_{10}1=1.50\\ \\text{dB}\\\\'
     +'\\text{16-QAM:}\\quad \\frac{E_s}{N_0}&=1.76+1.5+3.01=6.27\\ \\text{dB}\\\\'
     +'\\text{64-QAM:}\\quad \\frac{E_s}{N_0}&=3.68+1.5+4.77=9.95\\ \\text{dB}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> '
     +'16-QAM needs $6.27-1.50=4.77$ dB more than QPSK, and 64-QAM needs $9.95-1.50=8.45$ dB more. The received power falls as $1/d^{2}$. So a range shorter by a factor $k$ gives $20\\log_{10}k$ dB more power.'
     +'$$\\begin{aligned}'
     +'d_{16}&=2.4\\times10^{-4.77/20}\\\\'
     +'&=2.4\\,(0.5774)\\\\'
     +'&=1.39\\ \\text{km}\\\\'
     +'d_{64}&=2.4\\times10^{-8.45/20}\\\\'
     +'&=2.4\\,(0.3780)\\\\'
     +'&=0.91\\ \\text{km}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> '
     +'At $2.4$ km the received $E_s/N_0$ is $1.50$ dB, just what QPSK needs. Halving the distance raises it by $20\\log_{10}2=6.02$ dB.'
     +'$$\\begin{aligned}'
     +'\\frac{E_s}{N_0}\\bigg|_{1.2\\ \\text{km}}&=1.50+6.02\\\\'
     +'&=7.52\\ \\text{dB}'
     +'\\end{aligned}$$'
     +'64-QAM needs $9.95$ dB and falls $2.43$ dB short. 16-QAM needs $6.27$ dB and has $7.52-6.27=1.25$ dB to spare.'
     +' So 16-QAM is the best choice at $1.2$ km, with $R_b=12$ Mb/s.<br>'
     +'<b>Check.</b> '
     +'At the limit, $E_s/N_0=r\\,(2^{r}-1)/r=2^{r}-1$. That gives $1$, $3$ and $7$, or $0$, $4.77$ and $8.45$ dB. Adding $1.5$ dB returns $1.50$, $6.27$ and $9.95$ dB.'
     +' The $1.5$ dB cancels in the ranges, so $d_{16}=2.4/\\sqrt{3}=1.386$ km and $d_{64}=2.4/\\sqrt{7}=0.907$ km. The distance $1.2$ km lies between them, as part (d) found.',
  err:'Adding $1.5$ dB to $(2^{r}-1)/r$ and calling the result $E_s/N_0$. That expression is $E_b/N_0$. The energy per symbol is $r$ times larger, so $10\\log_{10}r$ must be added.',
  teach:'An adaptive link steps down the constellations as the user moves away. The two steps up in rate cost $4.77$ dB and then $3.68$ dB. They shorten the range by factors of $\\sqrt{3}$ and then $\\sqrt{7/3}$.' },

{ id:'D6-23', module:'M6', type:'judge', src:'Final Q4 (variant)',
  stem:'Let $X$ be a discrete memoryless source (DMS) which is modeled as a uniform random variable taking the integer values between $1$ and $16$. Let $Y\\triangleq \\left\\lfloor \\log_2 X\\right\\rfloor$ be another DMS which is a function of $X$. Here $\\lfloor u\\rfloor$ is the largest integer not greater than $u$.',
  parts:['[8 pts] Calculate the entropy of the source, $Y$.',
         '[8 pts] Design a <em>binary</em> Huffman code for the source, $Y$.',
         '[5 pts] A fixed-length binary code is proposed for $Y$ instead. Give its codeword length and its coding efficiency.',
         '[4 pts] Calculate the coding efficiency of the Huffman code of part (b), and explain the value.'],
  figSol: () => figPmf({v:[0,1,2,3,4],n:[1,2,4,8,1],D:16,name:'Y'})+figHuff({n:[1,2,4,8,1],D:16,name:'Y',lab:['0','1','2','3','4'],codes:['0000','001','01','1','0001'],order:['000','00','0','']}),
  sol:'<b>Given.</b> $X$ uniform on $1,\\ldots,16$, and $Y=\\lfloor\\log_2 X\\rfloor$.<br>'
     +'<b>Find.</b> $H(Y)$, a Huffman code, the fixed-length alternative, and both efficiencies.<br>'
     +'<b>Method.</b> List $Y$ for every value of $X$, then add the probabilities that give the same value of $Y$. The entropy is $H(Y)=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Y)/\\bar{L}$. A fixed-length code for $K$ symbols needs $\\lceil\\log_2 K\\rceil$ bits for each.<br>'
     +'<b>Solution — (a).</b> '
     +'Each of the sixteen values has probability $\\tfrac{1}{16}$. $Y=k$ when $2^{k}\\le X<2^{k+1}$.'
     +' For example $X=6$ lies between $4$ and $8$, so $Y=\\lfloor\\log_2 6\\rfloor=2$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' y&x\\ \\text{values}&P(Y=y)\\\\\\hline'
     +' 0&1&\\frac{1}{16}\\\\'
     +' 1&2,\\,3&\\frac{2}{16}\\\\'
     +' 2&4,\\,5,\\,6,\\,7&\\frac{4}{16}\\\\'
     +' 3&8,\\,9,\\,10,\\,11,\\,12,\\,13,\\,14,\\,15&\\frac{8}{16}\\\\'
     +' 4&16&\\frac{1}{16}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{16}{16}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}\\\\'
     +'&=\\frac{8}{16}\\log_2 2+\\frac{4}{16}\\log_2 4+\\frac{2}{16}\\log_2 8\\\\'
     +'&\\quad+2\\cdot\\frac{1}{16}\\log_2 16\\\\'
     +'&=0.5000+0.5000+0.3750+2(0.2500)\\\\'
     +'&=1.8750\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'Work with the numerators over $16$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $8,4,2,1,1$.<br>'
     +'Merge $1$: $1+1=2$, list $8,4,\\mathbf{2},2$.<br>'
     +'Merge $2$: $2+2=4$, list $8,\\mathbf{4},4$.<br>'
     +'Merge $3$: $4+4=8$, list $\\mathbf{8},8$.<br>'
     +'Merge $4$: $8+8=16$, list $\\mathbf{16}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' y&P(Y=y)&\\text{codeword}&l\\\\\\hline'
     +' 0&\\frac{1}{16}&\\mathtt{0000}&4\\\\'
     +' 4&\\frac{1}{16}&\\mathtt{0001}&4\\\\'
     +' 1&\\frac{2}{16}&\\mathtt{001}&3\\\\'
     +' 2&\\frac{4}{16}&\\mathtt{01}&2\\\\'
     +' 3&\\frac{8}{16}&\\mathtt{1}&1'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (c).</b> '
     +'$Y$ takes $5$ values. A fixed-length binary code needs $\\lceil\\log_2 5\\rceil=\\lceil 2.3219\\rceil=3$ bits for every symbol, so $\\bar{L}_{\\text{fixed}}=3$.'
     +' Its efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta_{\\text{fixed}}&=\\frac{H(Y)}{3}\\\\'
     +'&=\\frac{1.8750}{3}\\\\'
     +'&=0.6250'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (d).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{y}P(Y=y)\\,l(y)\\\\'
     +'&=\\frac{1}{16}\\bigl[1(4)+1(4)+2(3)+4(2)+8(1)\\bigr]\\\\'
     +'&=\\frac{30}{16}\\\\'
     +'&=\\frac{15}{8}\\\\'
     +'&=1.8750\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Y)}{\\bar{L}}\\\\'
     +'&=\\frac{1.8750}{1.8750}\\\\'
     +'&=1.0000'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=100.00\\%$.'
     +' Every probability is a power of two, from $2^{-1}$ to $2^{-4}$. Each ideal length $\\log_2\\frac{1}{P(Y=y)}$ is then a whole number.'
     +' The Huffman lengths equal those ideal lengths, so $\\bar{L}=H(Y)$ exactly.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{2+4+8+16}{16}=\\frac{30}{16}$$'
     +'This matches part (d). The entropy follows by a second route, from the numerators $n_y=16\\,P(Y=y)$:'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\log_2 16-\\frac{1}{16}\\sum_{y}n_y\\log_2 n_y\\\\'
     +'&=4.0000-\\frac{1}{16}\\bigl(8\\log_2 8+4\\log_2 4+2\\log_2 2\\bigr)\\\\'
     +'&=4.0000-2.1250\\\\'
     +'&=1.8750'
     +'\\end{aligned}$$'
     +'The Kraft sum is $2^{-1}+2^{-2}+2^{-3}+2\\cdot 2^{-4}=1$, so the tree has no unused branch. The bound $1.8750\\le 1.8750<2.8750$ holds.',
  err:'Choosing the fixed-length code because five symbols seem few. It spends $3$ bits where $1.875$ are enough, which is $60\\%$ more than needed.',
  teach:'A dyadic source, so the Huffman code reaches the entropy exactly. Part (c) shows what a fixed-length code wastes on the same source.' },

{ id:'D6-24', module:'M6', type:'judge', src:'Final Q4 (variant)',
  stem:'Consider two <em>independent</em> discrete memoryless sources, $X$ and $Y$. The source $X$ is described by the alphabet $\\mathcal{X}=\\{0,1,2,3\\}$, where each symbol is generated with equal probability. Similarly, the source $Y$ is described by the same alphabet, where each symbol is generated with equal probability. Let $Z\\triangleq |X-Y|$ be another discrete memoryless source.',
  parts:['[7 pts] Calculate the entropy of the source, $Z$.',
         '[8 pts] Design a <em>binary</em> Huffman code for $Z$, placing each merged probability as high as possible in the list.',
         '[6 pts] Design a second binary Huffman code, placing each merged probability as low as possible. Show that both codes have the same average length.',
         '[4 pts] Calculate the coding efficiency and the variance of the codeword lengths of both codes. Which code suits a transmitter with a finite buffer?'],
  figSol: () => figPmf({v:[0,1,2,3],n:[4,6,4,2],D:16,name:'Z'})+figHuff({n:[4,6,4,2],D:16,name:'Z',lab:['0','1','2','3'],codes:['01','00','10','11'],order:['1','0',''],head:'\\text{high placement}'})+figHuff({n:[4,6,4,2],D:16,name:'Z',lab:['0','1','2','3'],codes:['01','1','000','001'],order:['00','0',''],head:'\\text{low placement}'}),
  sol:'<b>Given.</b> $X$ and $Y$ independent and uniform on $\\{0,1,2,3\\}$, and $Z=|X-Y|$.<br>'
     +'<b>Find.</b> $H(Z)$, two Huffman codes, their average lengths, efficiencies and length variances.<br>'
     +'<b>Method.</b> List $Z$ for every pair $(x,y)$, then add the probabilities that give the same value of $Z$. The entropy is $H(Z)=\\sum_{z}P(Z=z)\\log_2\\frac{1}{P(Z=z)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Z)/\\bar{L}$. The variance of the lengths is $\\sigma^{2}=\\sum_z P(Z=z)\\bigl(l(z)-\\bar{L}\\bigr)^{2}$.<br>'
     +'<b>Solution — (a).</b> '
     +'Each of the $16$ pairs has probability $\\tfrac{1}{16}$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' z&(x,y)\\ \\text{pairs}&P(Z=z)\\\\\\hline'
     +' 0&(0,0),\\,(1,1),\\,(2,2),\\,(3,3)&\\frac{4}{16}\\\\'
     +' 1&(0,1),\\,(1,0),\\,(1,2),\\,(2,1),\\,(2,3),\\,(3,2)&\\frac{6}{16}\\\\'
     +' 2&(0,2),\\,(1,3),\\,(2,0),\\,(3,1)&\\frac{4}{16}\\\\'
     +' 3&(0,3),\\,(3,0)&\\frac{2}{16}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{16}{16}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Z)&=\\sum_{z}P(Z=z)\\log_2\\frac{1}{P(Z=z)}\\\\'
     +'&=\\frac{6}{16}\\log_2 \\frac{8}{3}+2\\cdot\\frac{4}{16}\\log_2 4+\\frac{2}{16}\\log_2 8\\\\'
     +'&=0.5306+2(0.5000)+0.3750\\\\'
     +'&=1.9056\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'Work with the numerators over $16$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $6,4,4,2$.<br>'
     +'Merge $1$: $4+2=6$, list $\\mathbf{6},6,4$.<br>'
     +'Merge $2$: $6+4=10$, list $\\mathbf{10},6$.<br>'
     +'Merge $3$: $10+6=16$, list $\\mathbf{16}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' z&P(Z=z)&\\text{codeword}&l\\\\\\hline'
     +' 1&\\frac{6}{16}&\\mathtt{00}&2\\\\'
     +' 0&\\frac{4}{16}&\\mathtt{01}&2\\\\'
     +' 2&\\frac{4}{16}&\\mathtt{10}&2\\\\'
     +' 3&\\frac{2}{16}&\\mathtt{11}&2'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (c).</b> '
     +'Now each sum is placed as low as possible among equal values. With numerators over $16$:<br>'
     +'Start: $6,4,4,2$.<br>'
     +'Merge $1$: $4+2=6$, list $6,\\mathbf{6},4$.<br>'
     +'Merge $2$: $6+4=10$, list $\\mathbf{10},6$.<br>'
     +'Merge $3$: $10+6=16$, list $\\mathbf{16}$.<br>'
     +'Reading the labels from the root back to each symbol gives the second code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' z&P(Z=z)&\\text{codeword}&l\\\\\\hline'
     +' 2&\\frac{4}{16}&\\mathtt{000}&3\\\\'
     +' 3&\\frac{2}{16}&\\mathtt{001}&3\\\\'
     +' 0&\\frac{4}{16}&\\mathtt{01}&2\\\\'
     +' 1&\\frac{6}{16}&\\mathtt{1}&1'
     +'\\end{array}$$</div>'
     +'Every codeword of the first code has two bits, so $\\bar{L}_1=2$. For the second code,'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{z}P(Z=z)\\,l(z)\\\\'
     +'&=\\frac{1}{16}\\bigl[4(3)+2(3)+4(2)+6(1)\\bigr]\\\\'
     +'&=\\frac{32}{16}\\\\'
     +'&=2\\\\'
     +'&=2.0000\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'Both codes reach the same optimal average length.<br>'
     +'<b>Solution — (d).</b> '
     +'Both codes have the same efficiency,'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Z)}{\\bar{L}}\\\\'
     +'&=\\frac{1.9056}{2}\\\\'
     +'&=0.9528'
     +'\\end{aligned}$$'
     +'The first code has every length equal to $\\bar{L}$, so $\\sigma_1^{2}=0$. For the second code,'
     +'$$\\begin{aligned}'
     +'\\sigma_2^{2}&=\\sum_z P(Z=z)\\bigl(l(z)-\\bar{L}\\bigr)^{2}\\\\'
     +'&=\\frac{1}{16}\\bigl[4(3-2)^{2}+2(3-2)^{2}+4(2-2)^{2}+6(1-2)^{2}\\bigr]\\\\'
     +'&=\\frac{12}{16}\\\\'
     +'&=0.7500'
     +'\\end{aligned}$$'
     +'The first code is preferable. Its bit rate is constant, so a finite buffer neither fills nor empties.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{6+10+16}{16}=\\frac{32}{16}$$'
     +'This matches part (c). The entropy follows by a second route, from the numerators $n_z=16\\,P(Z=z)$:'
     +'$$\\begin{aligned}'
     +' H(Z)&=\\log_2 16-\\frac{1}{16}\\sum_{z}n_z\\log_2 n_z\\\\'
     +'&=4.0000-\\frac{1}{16}\\bigl(6\\log_2 6+2\\cdot4\\log_2 4+2\\log_2 2\\bigr)\\\\'
     +'&=4.0000-2.0944\\\\'
     +'&=1.9056'
     +'\\end{aligned}$$'
     +'The Kraft sum is $4\\cdot 2^{-2}=1$, so the tree has no unused branch. The bound $1.9056\\le 2.0000<2.9056$ holds.'
     +' The second code also passes, since $2^{-1}+2^{-2}+2\\cdot 2^{-3}=1$.',
  err:'Calling the second code worse because its longest codeword is longer. Both codes have $\\bar{L}=2$. They differ only in how the lengths spread about that average.',
  teach:'The minimum-variance rule in its simplest form. The high placement returns the plain two-bit code, with zero variance.' },

{ id:'D6-25', module:'M6', type:'block', src:'Final Q4 (variant)',
  stem:'Let $X$ be a DMS which is modeled as a uniform random variable on $\\{0,1,2,3\\}$. Let $Z$ be independent of $X$ and uniform on $\\{0,1\\}$. Let $Y\\triangleq (X\\times Z)\\;(\\bmod 2)$ be another DMS, the parity of the product.',
  parts:['[6 pts] Calculate the probabilities and the entropy of the source, $Y$.',
         '[5 pts] Design a <em>binary</em> Huffman code for $Y$ and calculate its coding efficiency.',
         '[9 pts] Design a binary Huffman code for the second-order extension of $Y$, whose symbols are pairs $Y_1Y_2$ of successive outputs.',
         '[5 pts] Calculate the average number of bits per symbol of $Y$ and the coding efficiency for the code of part (c). Compare with part (b).'],
  figSol: () => figPmf({v:[0,1],n:[3,1],D:4,name:'Y'})+figHuff({n:[9,3,3,1],D:16,name:'W',lab:['\\mathtt{00}','\\mathtt{01}','\\mathtt{10}','\\mathtt{11}'],codes:['0','11','100','101'],order:['10','1','']}),
  sol:'<b>Given.</b> $X$ uniform on $\\{0,1,2,3\\}$, $Z$ uniform on $\\{0,1\\}$, independent, and $Y=XZ\\bmod 2$.<br>'
     +'<b>Find.</b> $H(Y)$, a code for $Y$, a code for its second-order extension, and both efficiencies.<br>'
     +'<b>Method.</b> Find $P(Y=1)$ by counting the pairs $(x,z)$ with an odd product. A two-symbol source cannot be coded below one bit a symbol. The second-order extension has $2^{2}=4$ symbols, with probabilities that are products because the source is memoryless. Build its Huffman code as usual: merge the two smallest, $0$ to the upper and $1$ to the lower, each sum as high as possible. Divide the pair length by two to compare with the single-symbol code.<br>'
     +'<b>Solution — (a).</b> '
     +'Each of the $8$ pairs has probability $\\tfrac18$. The product $xz$ is odd only when $x$ is odd and $z=1$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' y&(x,z)\\ \\text{pairs}&P(Y=y)\\\\\\hline'
     +' 0&(0,0),\\,(0,1),\\,(1,0),\\,(2,0),\\,(2,1),\\,(3,0)&\\frac{6}{8}=\\frac{3}{4}\\\\'
     +' 1&(1,1),\\,(3,1)&\\frac{2}{8}=\\frac{1}{4}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{4}{4}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}\\\\'
     +'&=\\frac{3}{4}\\log_2 \\frac{4}{3}+\\frac{1}{4}\\log_2 4\\\\'
     +'&=0.3113+0.5000\\\\'
     +'&=0.8113\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'With two symbols each codeword has one bit, $\\mathtt{0}$ for $Y=0$ and $\\mathtt{1}$ for $Y=1$.'
     +' So $\\bar{L}=1$ bit/symbol and $\\eta=H(Y)/1=0.8113$.<br>'
     +'<b>Solution — (c).</b> '
     +'The source is memoryless, so a pair $W=Y_1Y_2$ has the product of the two probabilities:'
     +'$$\\begin{aligned}'
     +' P(W=00)&=\\tfrac34\\cdot\\tfrac34=\\tfrac{9}{16}\\\\'
     +' P(W=01)&=P(W=10)=\\tfrac34\\cdot\\tfrac14=\\tfrac{3}{16}\\\\'
     +' P(W=11)&=\\tfrac14\\cdot\\tfrac14=\\tfrac{1}{16}'
     +'\\end{aligned}$$'
     +'Work with the numerators over $16$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $9,3,3,1$.<br>'
     +'Merge $1$: $3+1=4$, list $9,\\mathbf{4},3$.<br>'
     +'Merge $2$: $4+3=7$, list $9,\\mathbf{7}$.<br>'
     +'Merge $3$: $9+7=16$, list $\\mathbf{16}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' w&P(W=w)&\\text{codeword}&l\\\\\\hline'
     +' 00&\\frac{9}{16}&\\mathtt{0}&1\\\\'
     +' 10&\\frac{3}{16}&\\mathtt{100}&3\\\\'
     +' 11&\\frac{1}{16}&\\mathtt{101}&3\\\\'
     +' 01&\\frac{3}{16}&\\mathtt{11}&2'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (d).</b> '
     +'The pair code has average length'
     +'$$\\begin{aligned}'
     +'\\bar{L}_2&=\\frac{1}{16}\\bigl[9(1)+3(3)+1(3)+3(2)\\bigr]\\\\'
     +'&=\\frac{27}{16}\\\\'
     +'&=1.6875\\ \\text{bits/pair}'
     +'\\end{aligned}$$'
     +'Each pair carries two symbols of $Y$, so the cost per symbol and the efficiency are'
     +'$$\\begin{aligned}'
     +'\\frac{\\bar{L}_2}{2}&=\\frac{27}{32}=0.8438\\ \\text{bits/symbol}\\\\'
     +'\\eta_2&=\\frac{H(Y)}{\\bar{L}_2/2}=\\frac{0.8113}{0.8438}=0.9615'
     +'\\end{aligned}$$'
     +'Coding pairs raises the efficiency from $0.8113$ to $0.9615$.<br>'
     +'<b>Check.</b> '
     +'The pair code\'s average length equals the sum of its merge probabilities:'
     +'$$\\bar{L}_2=\\frac{4+7+16}{16}=\\frac{27}{16}$$'
     +'For a memoryless source $H(W)=2H(Y)=1.6226$ bits, and $1.6226\\le 1.6875<2.6226$ holds as the bound requires.'
     +' The entropy of $Y$ also follows as $\\log_2 4-\\tfrac34\\log_2 3=2-1.1887=0.8113$.',
  err:'Dividing the pair length by one instead of two. The code of part (c) spends $\\tfrac{27}{16}$ bits on two symbols, so each symbol costs $\\tfrac{27}{32}$ bits.',
  teach:'A binary source cannot be compressed symbol by symbol. Coding pairs recovers most of the gap, which is the reason the module extends a source.' },

{ id:'D6-26', module:'M6', type:'info', src:'Final Q4 (variant)',
  stem:'Let $X$ be a discrete memoryless source (DMS) which is modeled as a uniform random variable taking the integer values between $-2$ and $5$. Let $Y\\triangleq |X-1|$ be another DMS which is a function of $X$.',
  parts:['[6 pts] Calculate the entropies $H(X)$ and $H(Y)$.',
         '[7 pts] Calculate the mutual information $I(X;Y)$, the conditional entropy $H(X\\mid Y)$ and the joint entropy $H(X,Y)$.',
         '[8 pts] Design a <em>binary</em> Huffman code for the source, $Y$.',
         '[4 pts] Calculate the coding efficiency of the Huffman code designed in part (c).'],
  figSol: () => figPmf({v:[0,1,2,3,4],n:[1,2,2,2,1],D:8,name:'Y'})+figHuff({n:[1,2,2,2,1],D:8,name:'Y',lab:['0','1','2','3','4'],codes:['000','01','10','11','001'],order:['00','1','0','']}),
  sol:'<b>Given.</b> $X$ uniform on the eight integers $-2,\\ldots,5$, and $Y=|X-1|$.<br>'
     +'<b>Find.</b> $H(X)$, $H(Y)$, $I(X;Y)$, $H(X\\mid Y)$, $H(X,Y)$, a Huffman code for $Y$ and its efficiency.<br>'
     +'<b>Method.</b> List $Y$ for every value of $X$, then add the probabilities that give the same value of $Y$. The entropy is $H(Y)=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Y)/\\bar{L}$. Since $Y$ is a function of $X$, $H(Y\\mid X)=0$. Then $I(X;Y)=H(Y)-H(Y\\mid X)$ and $H(X,Y)=H(X)+H(Y)-I(X;Y)$.<br>'
     +'<b>Solution — (a).</b> '
     +'Each of the eight values of $X$ has probability $\\tfrac18$, so $H(X)=\\log_2 8=3$ bits.<br>'
     +'For $Y$, for example $X=-2$ gives $|-2-1|=3$, and $X=4$ gives $|4-1|=3$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' y&x\\ \\text{values}&P(Y=y)\\\\\\hline'
     +' 0&1&\\frac{1}{8}\\\\'
     +' 1&0,\\,2&\\frac{2}{8}\\\\'
     +' 2&-1,\\,3&\\frac{2}{8}\\\\'
     +' 3&-2,\\,4&\\frac{2}{8}\\\\'
     +' 4&5&\\frac{1}{8}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{8}{8}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}\\\\'
     +'&=3\\cdot\\frac{2}{8}\\log_2 4+2\\cdot\\frac{1}{8}\\log_2 8\\\\'
     +'&=3(0.5000)+2(0.3750)\\\\'
     +'&=2.2500\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'Given $X$, the value of $Y$ is fixed, so $H(Y\\mid X)=0$. The mutual information is then'
     +'$$\\begin{aligned}'
     +' I(X;Y)&=H(Y)-H(Y\\mid X)\\\\'
     +'&=2.2500-0\\\\'
     +'&=2.2500\\ \\text{bits}'
     +'\\end{aligned}$$'
     +'The conditional entropy follows from $I(X;Y)=H(X)-H(X\\mid Y)$:'
     +'$$\\begin{aligned}'
     +' H(X\\mid Y)&=H(X)-I(X;Y)\\\\'
     +'&=3-2.2500\\\\'
     +'&=0.7500\\ \\text{bits}'
     +'\\end{aligned}$$'
     +'The joint entropy is'
     +'$$\\begin{aligned}'
     +' H(X,Y)&=H(X)+H(Y)-I(X;Y)\\\\'
     +'&=3+2.2500-2.2500\\\\'
     +'&=3\\ \\text{bits}'
     +'\\end{aligned}$$'
     +'The pair holds no more information than $X$ alone, because $Y$ is computed from $X$.<br>'
     +'<b>Solution — (c).</b> '
     +'Work with the numerators over $8$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $2,2,2,1,1$.<br>'
     +'Merge $1$: $1+1=2$, list $\\mathbf{2},2,2,2$.<br>'
     +'Merge $2$: $2+2=4$, list $\\mathbf{4},2,2$.<br>'
     +'Merge $3$: $2+2=4$, list $\\mathbf{4},4$.<br>'
     +'Merge $4$: $4+4=8$, list $\\mathbf{8}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' y&P(Y=y)&\\text{codeword}&l\\\\\\hline'
     +' 0&\\frac{1}{8}&\\mathtt{000}&3\\\\'
     +' 4&\\frac{1}{8}&\\mathtt{001}&3\\\\'
     +' 1&\\frac{2}{8}&\\mathtt{01}&2\\\\'
     +' 2&\\frac{2}{8}&\\mathtt{10}&2\\\\'
     +' 3&\\frac{2}{8}&\\mathtt{11}&2'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (d).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{y}P(Y=y)\\,l(y)\\\\'
     +'&=\\frac{1}{8}\\bigl[1(3)+1(3)+2(2)+2(2)+2(2)\\bigr]\\\\'
     +'&=\\frac{18}{8}\\\\'
     +'&=\\frac{9}{4}\\\\'
     +'&=2.2500\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Y)}{\\bar{L}}\\\\'
     +'&=\\frac{2.2500}{2.2500}\\\\'
     +'&=1.0000'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=100.00\\%$.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{2+4+4+8}{8}=\\frac{18}{8}$$'
     +'This matches part (d). The entropy follows by a second route, from the numerators $n_y=8\\,P(Y=y)$:'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\log_2 8-\\frac{1}{8}\\sum_{y}n_y\\log_2 n_y\\\\'
     +'&=3.0000-\\frac{1}{8}\\bigl(3\\cdot2\\log_2 2\\bigr)\\\\'
     +'&=3.0000-0.7500\\\\'
     +'&=2.2500'
     +'\\end{aligned}$$'
     +'The Kraft sum is $3\\cdot 2^{-2}+2\\cdot 2^{-3}=1$, so the tree has no unused branch. The bound $2.2500\\le 2.2500<3.2500$ holds.'
     +' Directly, $H(X\\mid Y)=\\sum_y P(Y=y)H(X\\mid Y=y)$. For $y=1,2,3$ two equally likely values of $X$ remain, which is $1$ bit.'
     +' For $y=0$ and $y=4$ one value remains. Hence $H(X\\mid Y)=\\tfrac{6}{8}(1)=0.75$ bits.',
  err:'Taking $H(X,Y)=H(X)+H(Y)$ as if $X$ and $Y$ were independent. $Y$ is a function of $X$, so $H(X,Y)=H(X)=3$ bits.',
  teach:'A function can only lose information, so $H(Y)\\le H(X)$. The lost part is $H(X\\mid Y)$, the sign of $X-1$ that the absolute value removes.' },

{ id:'D6-27', module:'M6', type:'info', src:'Final Q4 (variant)',
  stem:'Consider two <em>independent</em> discrete memoryless sources, $X$ and $Y$. The source $X$ is described by the alphabet $\\mathcal{X}=\\{0,1,2\\}$, where $P(X=0)=2P(X=1)=2P(X=2)$. Similarly, the source $Y$ is described by the alphabet $\\mathcal{Y}=\\{0,1,2,3\\}$, where each symbol is generated with equal probability. Let $Z\\triangleq X+Y$ be another discrete memoryless source.',
  parts:['[8 pts] Calculate the entropy of the source, $Z$.',
         '[6 pts] Calculate the conditional entropy $H(Z\\mid X)$ and the mutual information $I(X;Z)$.',
         '[7 pts] Design a <em>binary</em> Huffman code for the source, $Z$.',
         '[4 pts] Calculate the coding efficiency of the Huffman code designed in part (c).'],
  figSol: () => figPmf({v:[0,1,2,3,4,5],n:[2,3,4,4,2,1],D:16,name:'Z'})+figHuff({n:[2,3,4,4,2,1],D:16,name:'Z',lab:['0','1','2','3','4','5'],codes:['001','000','01','10','110','111'],order:['11','00','1','0','']}),
  sol:'<b>Given.</b> $P(X=0)=2P(X=1)=2P(X=2)$ on $\\{0,1,2\\}$, $Y$ uniform on $\\{0,1,2,3\\}$, independent, and $Z=X+Y$.<br>'
     +'<b>Find.</b> $H(Z)$, $H(Z\\mid X)$, $I(X;Z)$, a Huffman code for $Z$ and its efficiency.<br>'
     +'<b>Method.</b> Turn the ratio statement into probabilities first. List $Z$ for every pair $(x,y)$, then add the probabilities that give the same value of $Z$. The entropy is $H(Z)=\\sum_{z}P(Z=z)\\log_2\\frac{1}{P(Z=z)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Z)/\\bar{L}$. For the information part, $H(Z\\mid X)=\\sum_x P(X=x)H(Z\\mid X=x)$ and $I(X;Z)=H(Z)-H(Z\\mid X)$.<br>'
     +'<b>Solution — (a).</b> '
     +'Write $P(X=1)=P(X=2)=q$. Then $P(X=0)=2q$, and $4q=1$ gives $q=\\tfrac14$.'
     +' The pair $(x,y)$ has probability $n_X(x)/16$, where $n_X=2,1,1$ for $x=0,1,2$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' z&(x,y)\\ \\text{pairs}&P(Z=z)\\\\\\hline'
     +' 0&(0,0)&\\frac{2}{16}\\\\'
     +' 1&(0,1),\\,(1,0)&\\frac{2+1}{16}=\\frac{3}{16}\\\\'
     +' 2&(0,2),\\,(1,1),\\,(2,0)&\\frac{2+1+1}{16}=\\frac{4}{16}\\\\'
     +' 3&(0,3),\\,(1,2),\\,(2,1)&\\frac{2+1+1}{16}=\\frac{4}{16}\\\\'
     +' 4&(1,3),\\,(2,2)&\\frac{2}{16}\\\\'
     +' 5&(2,3)&\\frac{1}{16}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{16}{16}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Z)&=\\sum_{z}P(Z=z)\\log_2\\frac{1}{P(Z=z)}\\\\'
     +'&=2\\cdot\\frac{4}{16}\\log_2 4+\\frac{3}{16}\\log_2 \\frac{16}{3}+2\\cdot\\frac{2}{16}\\log_2 8\\\\'
     +'&\\quad+\\frac{1}{16}\\log_2 16\\\\'
     +'&=2(0.5000)+0.4528+2(0.3750)+0.2500\\\\'
     +'&=2.4528\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'Given $X=x$, the output $Z=x+Y$ takes the four values $x,\\ldots,x+3$, each with probability $\\tfrac14$.'
     +' So $H(Z\\mid X=x)=\\log_2 4=2$ bits for every $x$, and'
     +'$$\\begin{aligned}'
     +' H(Z\\mid X)&=\\sum_x P(X=x)\\,H(Z\\mid X=x)\\\\'
     +'&=\\left(\\tfrac12+\\tfrac14+\\tfrac14\\right)(2)\\\\'
     +'&=2\\ \\text{bits}'
     +'\\end{aligned}$$'
     +'The mutual information is'
     +'$$\\begin{aligned}'
     +' I(X;Z)&=H(Z)-H(Z\\mid X)\\\\'
     +'&=2.4528-2\\\\'
     +'&=0.4528\\ \\text{bits}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> '
     +'Work with the numerators over $16$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $4,4,3,2,2,1$.<br>'
     +'Merge $1$: $2+1=3$, list $4,4,\\mathbf{3},3,2$.<br>'
     +'Merge $2$: $3+2=5$, list $\\mathbf{5},4,4,3$.<br>'
     +'Merge $3$: $4+3=7$, list $\\mathbf{7},5,4$.<br>'
     +'Merge $4$: $5+4=9$, list $\\mathbf{9},7$.<br>'
     +'Merge $5$: $9+7=16$, list $\\mathbf{16}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' z&P(Z=z)&\\text{codeword}&l\\\\\\hline'
     +' 1&\\frac{3}{16}&\\mathtt{000}&3\\\\'
     +' 0&\\frac{2}{16}&\\mathtt{001}&3\\\\'
     +' 2&\\frac{4}{16}&\\mathtt{01}&2\\\\'
     +' 3&\\frac{4}{16}&\\mathtt{10}&2\\\\'
     +' 4&\\frac{2}{16}&\\mathtt{110}&3\\\\'
     +' 5&\\frac{1}{16}&\\mathtt{111}&3'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (d).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{z}P(Z=z)\\,l(z)\\\\'
     +'&=\\frac{1}{16}\\bigl[3(3)+2(3)+4(2)+4(2)\\\\&\\qquad+2(3)+1(3)\\bigr]\\\\'
     +'&=\\frac{40}{16}\\\\'
     +'&=\\frac{5}{2}\\\\'
     +'&=2.5000\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Z)}{\\bar{L}}\\\\'
     +'&=\\frac{2.4528}{2.5000}\\\\'
     +'&=0.9811'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=98.11\\%$.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{3+5+7+9+16}{16}=\\frac{40}{16}$$'
     +'This matches part (d). The entropy follows by a second route, from the numerators $n_z=16\\,P(Z=z)$:'
     +'$$\\begin{aligned}'
     +' H(Z)&=\\log_2 16-\\frac{1}{16}\\sum_{z}n_z\\log_2 n_z\\\\'
     +'&=4.0000-\\frac{1}{16}\\bigl(2\\cdot4\\log_2 4+3\\log_2 3+2\\cdot2\\log_2 2\\bigr)\\\\'
     +'&=4.0000-1.5472\\\\'
     +'&=2.4528'
     +'\\end{aligned}$$'
     +'The Kraft sum is $2\\cdot 2^{-2}+4\\cdot 2^{-3}=1$, so the tree has no unused branch. The bound $2.4528\\le 2.5000<3.4528$ holds.'
     +' Also $I(X;Z)\\le H(X)=1.5$ bits, as it must be. $Z$ cannot reveal more about $X$ than $X$ holds.',
  err:'Setting $H(Z\\mid X)=H(X)$. Once $X$ is known, the only uncertainty left in $Z$ is $Y$, so $H(Z\\mid X)=H(Y)=2$ bits.',
  teach:'Read $Z=X+Y$ as a channel with input $X$ and an additive disturbance $Y$. This links the source question to the channel half of the module.' },

{ id:'D6-28', module:'M6', type:'judge', src:'Final Q4 (variant)',
  stem:'Let $X$ be a discrete memoryless source (DMS) which is modeled as a uniform random variable taking the integer values between $1$ and $9$. Let $Y\\triangleq X\\;(\\bmod 4)$ be another DMS which is a function of $X$. Here $a\\bmod m$ denotes the remainder of $a$ on division by $m$, taken in $\\{0,1,\\ldots,m-1\\}$. A designer proposes the code $Y=1\\to\\mathtt{0}$, $Y=0\\to\\mathtt{1}$, $Y=2\\to\\mathtt{01}$, $Y=3\\to\\mathtt{10}$.',
  parts:['[7 pts] Calculate the entropy of the source, $Y$.',
         '[6 pts] Use the Kraft inequality to decide whether a prefix code with the lengths of the proposed code exists. Give a bit string that the proposed code cannot decode uniquely.',
         '[8 pts] Design a <em>binary</em> Huffman code for the source, $Y$.',
         '[4 pts] Calculate the coding efficiency of the Huffman code, and compare it with a fixed-length code for $Y$.'],
  figSol: () => figPmf({v:[0,1,2,3],n:[2,3,2,2],D:9,name:'Y'})+figHuff({n:[2,3,2,2],D:9,name:'Y',lab:['0','1','2','3'],codes:['01','00','10','11'],order:['1','0','']}),
  sol:'<b>Given.</b> $X$ uniform on $1,\\ldots,9$, $Y=X\\bmod 4$, and a proposed code with lengths $1,1,2,2$.<br>'
     +'<b>Find.</b> $H(Y)$, the Kraft test of the proposal, a Huffman code and its efficiency.<br>'
     +'<b>Method.</b> List $Y$ for every value of $X$, then add the probabilities that give the same value of $Y$. The entropy is $H(Y)=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Y)/\\bar{L}$. The Kraft sum $\\sum 2^{-l}$ must not exceed one for a prefix code to exist.<br>'
     +'<b>Solution — (a).</b> '
     +'Each of the nine values of $X$ has probability $\\tfrac19$. For example $X=6$ gives $6\\bmod 4=2$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' y&x\\ \\text{values}&P(Y=y)\\\\\\hline'
     +' 0&4,\\,8&\\frac{2}{9}\\\\'
     +' 1&1,\\,5,\\,9&\\frac{3}{9}\\\\'
     +' 2&2,\\,6&\\frac{2}{9}\\\\'
     +' 3&3,\\,7&\\frac{2}{9}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{9}{9}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}\\\\'
     +'&=\\frac{3}{9}\\log_2 3+3\\cdot\\frac{2}{9}\\log_2 \\frac{9}{2}\\\\'
     +'&=0.5283+3(0.4822)\\\\'
     +'&=1.9749\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'The proposed code assigns $Y=1\\to\\mathtt{0}$, $Y=0\\to\\mathtt{1}$, $Y=2\\to\\mathtt{01}$ and $Y=3\\to\\mathtt{10}$. Its lengths are $1,1,2,2$, and'
     +'$$2^{-1}+2^{-1}+2^{-2}+2^{-2}=1.5>1$$'
     +'The Kraft sum exceeds one, so no prefix code has these lengths.'
     +' The string $\\mathtt{01}$ shows the failure. It is the codeword of $Y=2$, and also $Y=1$ followed by $Y=0$.'
     +' The proposed code would average'
     +'$$\\begin{aligned}'
     +'\\bar{L}_{\\text{prop}}&=\\frac{3(1)+2(1)+2(2)+2(2)}{9}\\\\'
     +'&=\\frac{13}{9}\\\\'
     +'&=1.4444\\ \\text{bits}'
     +'\\end{aligned}$$'
     +'This is below $H(Y)$, which no uniquely decodable code can reach.<br>'
     +'<b>Solution — (c).</b> '
     +'Work with the numerators over $9$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $3,2,2,2$.<br>'
     +'Merge $1$: $2+2=4$, list $\\mathbf{4},3,2$.<br>'
     +'Merge $2$: $3+2=5$, list $\\mathbf{5},4$.<br>'
     +'Merge $3$: $5+4=9$, list $\\mathbf{9}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' y&P(Y=y)&\\text{codeword}&l\\\\\\hline'
     +' 1&\\frac{3}{9}&\\mathtt{00}&2\\\\'
     +' 0&\\frac{2}{9}&\\mathtt{01}&2\\\\'
     +' 2&\\frac{2}{9}&\\mathtt{10}&2\\\\'
     +' 3&\\frac{2}{9}&\\mathtt{11}&2'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (d).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{y}P(Y=y)\\,l(y)\\\\'
     +'&=\\frac{1}{9}\\bigl[3(2)+2(2)+2(2)+2(2)\\bigr]\\\\'
     +'&=\\frac{18}{9}\\\\'
     +'&=2\\\\'
     +'&=2.0000\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Y)}{\\bar{L}}\\\\'
     +'&=\\frac{1.9749}{2.0000}\\\\'
     +'&=0.9875'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=98.75\\%$.'
     +' The Huffman code is the plain two-bit code. The probabilities $\\tfrac29$ to $\\tfrac39$ are too close for unequal lengths to pay.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{4+5+9}{9}=\\frac{18}{9}$$'
     +'This matches part (d). The entropy follows by a second route, from the numerators $n_y=9\\,P(Y=y)$:'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\log_2 9-\\frac{1}{9}\\sum_{y}n_y\\log_2 n_y\\\\'
     +'&=3.1699-\\frac{1}{9}\\bigl(3\\log_2 3+3\\cdot2\\log_2 2\\bigr)\\\\'
     +'&=3.1699-1.1950\\\\'
     +'&=1.9749'
     +'\\end{aligned}$$'
     +'The Kraft sum is $4\\cdot 2^{-2}=1$, so the tree has no unused branch. The bound $1.9749\\le 2.0000<2.9749$ holds.',
  err:'Accepting the proposed code because its average length is small. An average length below the entropy is the mark of a code that cannot be decoded.',
  teach:'The Kraft test does real work here. The Huffman code then turns out to be the plain two-bit code.' },

{ id:'D6-29', module:'M6', type:'judge', src:'Final Q4 (variant)',
  stem:'Let $X$ be a discrete memoryless source (DMS) which is modeled as a uniform random variable taking the integer values between $1$ and $12$. Let $Y\\triangleq X\\;(\\bmod 5)$ be another DMS which is a function of $X$. Here $a\\bmod m$ denotes the remainder of $a$ on division by $m$, taken in $\\{0,1,\\ldots,m-1\\}$.',
  parts:['[7 pts] Calculate the entropy of the source, $Y$.',
         '[6 pts] Give each symbol the length $l(y)=\\left\\lceil\\log_2\\frac{1}{P(Y=y)}\\right\\rceil$. Check the Kraft inequality for these lengths and calculate their average length.',
         '[8 pts] Design a <em>binary</em> Huffman code for the source, $Y$.',
         '[4 pts] Calculate the coding efficiency of both codes. Which one is optimal?'],
  figSol: () => figPmf({v:[0,1,2,3,4],n:[2,3,3,2,2],D:12,name:'Y'})+figHuff({n:[2,3,3,2,2],D:12,name:'Y',lab:['0','1','2','3','4'],codes:['11','01','10','000','001'],order:['00','1','0','']}),
  sol:'<b>Given.</b> $X$ uniform on $1,\\ldots,12$, and $Y=X\\bmod 5$.<br>'
     +'<b>Find.</b> $H(Y)$, the rounded-up lengths and their average, a Huffman code, and both efficiencies.<br>'
     +'<b>Method.</b> List $Y$ for every value of $X$, then add the probabilities that give the same value of $Y$. The entropy is $H(Y)=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Y)/\\bar{L}$. Rounding $\\log_2\\frac{1}{P(Y=y)}$ up always passes the Kraft test, but it need not be optimal.<br>'
     +'<b>Solution — (a).</b> '
     +'Each of the twelve values has probability $\\tfrac{1}{12}$. For example $X=12$ gives $12\\bmod 5=2$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' y&x\\ \\text{values}&P(Y=y)\\\\\\hline'
     +' 0&5,\\,10&\\frac{2}{12}\\\\'
     +' 1&1,\\,6,\\,11&\\frac{3}{12}\\\\'
     +' 2&2,\\,7,\\,12&\\frac{3}{12}\\\\'
     +' 3&3,\\,8&\\frac{2}{12}\\\\'
     +' 4&4,\\,9&\\frac{2}{12}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{12}{12}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}\\\\'
     +'&=2\\cdot\\frac{3}{12}\\log_2 4+3\\cdot\\frac{2}{12}\\log_2 6\\\\'
     +'&=2(0.50000)+3(0.43083)\\\\'
     +'&=2.2925\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (b).</b> '
     +'The lengths are $\\lceil\\log_2 4\\rceil=2$ for the two symbols of probability $\\tfrac{3}{12}$.'
     +' The three symbols of probability $\\tfrac{2}{12}$ get $\\lceil\\log_2 6\\rceil=\\lceil 2.585\\rceil=3$. The Kraft sum is'
     +'$$2\\cdot2^{-2}+3\\cdot2^{-3}=0.875\\le 1$$'
     +'So a prefix code with these lengths exists. Its average length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}_S&=\\frac{1}{12}\\bigl[2(3)+3(2)+3(2)+2(3)+2(3)\\bigr]\\\\'
     +'&=\\frac{30}{12}\\\\'
     +'&=2.5000\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> '
     +'Work with the numerators over $12$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $3,3,2,2,2$.<br>'
     +'Merge $1$: $2+2=4$, list $\\mathbf{4},3,3,2$.<br>'
     +'Merge $2$: $3+2=5$, list $\\mathbf{5},4,3$.<br>'
     +'Merge $3$: $4+3=7$, list $\\mathbf{7},5$.<br>'
     +'Merge $4$: $7+5=12$, list $\\mathbf{12}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' y&P(Y=y)&\\text{codeword}&l\\\\\\hline'
     +' 3&\\frac{2}{12}&\\mathtt{000}&3\\\\'
     +' 4&\\frac{2}{12}&\\mathtt{001}&3\\\\'
     +' 1&\\frac{3}{12}&\\mathtt{01}&2\\\\'
     +' 2&\\frac{3}{12}&\\mathtt{10}&2\\\\'
     +' 0&\\frac{2}{12}&\\mathtt{11}&2'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (d).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{y}P(Y=y)\\,l(y)\\\\'
     +'&=\\frac{1}{12}\\bigl[2(3)+2(3)+3(2)+3(2)+2(2)\\bigr]\\\\'
     +'&=\\frac{28}{12}\\\\'
     +'&=\\frac{7}{3}\\\\'
     +'&=2.3333\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Y)}{\\bar{L}}\\\\'
     +'&=\\frac{2.2925}{2.3333}\\\\'
     +'&=0.9825'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=98.25\\%$.'
     +' For the rounded-up lengths,'
     +'$$\\begin{aligned}'
     +'\\eta_S&=\\frac{2.2925}{2.5000}\\\\'
     +'&=0.9170'
     +'\\end{aligned}$$'
     +'The Huffman code is optimal. The rounded lengths leave $1-0.875=0.125$ of the code tree unused.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{4+5+7+12}{12}=\\frac{28}{12}$$'
     +'This matches part (d). The entropy follows by a second route, from the numerators $n_y=12\\,P(Y=y)$:'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\log_2 12-\\frac{1}{12}\\sum_{y}n_y\\log_2 n_y\\\\'
     +'&=3.5850-\\frac{1}{12}\\bigl(2\\cdot3\\log_2 3+3\\cdot2\\log_2 2\\bigr)\\\\'
     +'&=3.5850-1.2925\\\\'
     +'&=2.2925'
     +'\\end{aligned}$$'
     +'The Kraft sum is $3\\cdot 2^{-2}+2\\cdot 2^{-3}=1$, so the tree has no unused branch. The bound $2.2925\\le 2.3333<3.2925$ holds.',
  err:'Rounding $\\log_2 6=2.585$ down to $2$. With five lengths of $2$ bits the Kraft sum is $\\tfrac54>1$, and no prefix code exists.',
  teach:'The rounded-up lengths meet the bound $\\bar{L}<H(Y)+1$ but waste part of the tree. The Huffman code uses the whole tree.' },

{ id:'D6-30', module:'M6', type:'fxz', src:'Final Q4 (variant)',
  stem:'Let $X$ be a discrete memoryless source (DMS) which is modeled as a uniform random variable on the alphabet $\\{0,1,2,3\\}$. Let $Z$ be a random variable (independent of $X$) with the probability mass function $p_Z(z)=c\\,a^{z}$ for $z\\in\\{0,1,2\\}$. It is zero otherwise, and $c$ and $0<a<1$ are constants. Finally, let $Y\\triangleq X\\times Z$ be another DMS which is a function of both $X$ and $Z$. It is known that $P(Y=0)=\\frac{10}{13}$.',
  parts:['[7 pts] Find the constants $c$ and $a$.',
         '[7 pts] Calculate the entropy of the source, $Y$.',
         '[7 pts] Design a <em>binary</em> Huffman code for the source, $Y$.',
         '[4 pts] Calculate the coding efficiency of the Huffman code designed in part (c).'],
  figSol: () => figPmf({v:[0,1,2,3,4,6],n:[40,3,4,3,1,1],D:52,name:'Y'})+figHuff({n:[40,3,4,3,1,1],D:52,name:'Y',lab:['0','1','2','3','4','6'],codes:['0','101','100','110','1110','1111'],order:['111','11','10','1','']}),
  sol:'<b>Given.</b> $X$ uniform on $\\{0,1,2,3\\}$, $p_Z(z)=ca^{z}$ for $z=0,1,2$, independent, $Y=XZ$, and $P(Y=0)=\\tfrac{10}{13}$.<br>'
     +'<b>Find.</b> $c$, $a$, $H(Y)$, a binary Huffman code for $Y$, and its coding efficiency.<br>'
     +'<b>Method.</b> Write $P(Y=0)$ in terms of $c$ and solve for it. Then $\\sum_z p_Z(z)=1$ gives a quadratic in $a$. List $Y$ for every pair $(x,z)$, then add the probabilities that give the same value of $Y$. The entropy is $H(Y)=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}$, in bits because the logarithm has base two. Huffman\'s procedure fits the code part, since no prefix code for single symbols has a smaller average length. Merge the two smallest, give $0$ to the upper and $1$ to the lower, and place each sum as high as possible among equals. The efficiency is $\\eta=H(Y)/\\bar{L}$.<br>'
     +'<b>Solution — (a).</b> '
     +'$Y=0$ when $Z=0$, or when $Z\\neq 0$ and $X=0$. With $P(Z=0)=c$ and $P(X=0)=\\tfrac14$,'
     +'$$\\begin{aligned}'
     +' P(Y=0)&=c+\\tfrac14(1-c)\\\\'
     +'&=\\frac{1+3c}{4}\\\\'
     +'&=\\frac{10}{13}'
     +'\\end{aligned}$$'
     +'So $1+3c=\\tfrac{40}{13}$, which gives $3c=\\tfrac{27}{13}$ and $c=\\tfrac{9}{13}$. Normalisation then fixes $a$:'
     +'$$\\begin{aligned}'
     +' c\\,(1+a+a^{2})&=1\\\\'
     +' 1+a+a^{2}&=\\tfrac{13}{9}\\\\'
     +' 9a^{2}+9a-4&=0\\\\'
     +' a&=\\frac{-9\\pm\\sqrt{81+144}}{18}\\\\'
     +'&=\\frac{-9\\pm 15}{18}'
     +'\\end{aligned}$$'
     +'The root $-\\tfrac43$ is negative and is rejected, so $a=\\tfrac13$. Then $P(Z=z)=\\tfrac{9}{13},\\tfrac{3}{13},\\tfrac{1}{13}$ for $z=0,1,2$.<br>'
     +'<b>Solution — (b).</b> '
     +'The pair $(x,z)$ has probability $n_Z(z)/52$, where $n_Z=9,3,1$ for $z=0,1,2$.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c}'
     +' y&(x,z)\\ \\text{pairs}&P(Y=y)\\\\\\hline'
     +' 0&(0,0),\\,(0,1),\\,(0,2),\\,(1,0),\\,(2,0),\\,(3,0)&\\frac{9+3+1+9+9+9}{52}=\\frac{40}{52}\\\\'
     +' 1&(1,1)&\\frac{3}{52}\\\\'
     +' 2&(1,2),\\,(2,1)&\\frac{1+3}{52}=\\frac{4}{52}\\\\'
     +' 3&(3,1)&\\frac{3}{52}\\\\'
     +' 4&(2,2)&\\frac{1}{52}\\\\'
     +' 6&(3,2)&\\frac{1}{52}'
     +'\\end{array}$$</div>'
     +'The probabilities add to $\\frac{52}{52}=1$. The entropy is'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\sum_{y}P(Y=y)\\log_2\\frac{1}{P(Y=y)}\\\\'
     +'&=\\frac{40}{52}\\log_2 \\frac{13}{10}+\\frac{4}{52}\\log_2 13+2\\cdot\\frac{3}{52}\\log_2 \\frac{52}{3}\\\\'
     +'&\\quad+2\\cdot\\frac{1}{52}\\log_2 52\\\\'
     +'&=0.29116+0.28465+2(0.23743)+2(0.10962)\\\\'
     +'&=1.2699\\ \\text{bits/symbol}'
     +'\\end{aligned}$$<br>'
     +'<b>Solution — (c).</b> '
     +'Work with the numerators over $52$. Each line gives one merge and the new list, with the new sum in bold.<br>'
     +'Start: $40,4,3,3,1,1$.<br>'
     +'Merge $1$: $1+1=2$, list $40,4,3,3,\\mathbf{2}$.<br>'
     +'Merge $2$: $3+2=5$, list $40,\\mathbf{5},4,3$.<br>'
     +'Merge $3$: $4+3=7$, list $40,\\mathbf{7},5$.<br>'
     +'Merge $4$: $7+5=12$, list $40,\\mathbf{12}$.<br>'
     +'Merge $5$: $40+12=52$, list $\\mathbf{52}$.<br>'
     +'In every merge the upper entry takes $0$ and the lower entry takes $1$. Reading the labels from the root back to each symbol gives the code.'
     +'<div class="eq plain sm">$$\\def\\arraystretch{1.6}\\begin{array}{c|c|c|c}'
     +' y&P(Y=y)&\\text{codeword}&l\\\\\\hline'
     +' 0&\\frac{40}{52}&\\mathtt{0}&1\\\\'
     +' 2&\\frac{4}{52}&\\mathtt{100}&3\\\\'
     +' 1&\\frac{3}{52}&\\mathtt{101}&3\\\\'
     +' 3&\\frac{3}{52}&\\mathtt{110}&3\\\\'
     +' 4&\\frac{1}{52}&\\mathtt{1110}&4\\\\'
     +' 6&\\frac{1}{52}&\\mathtt{1111}&4'
     +'\\end{array}$$</div><br>'
     +'<b>Solution — (d).</b> '
     +'The average codeword length is'
     +'$$\\begin{aligned}'
     +'\\bar{L}&=\\sum_{y}P(Y=y)\\,l(y)\\\\'
     +'&=\\frac{1}{52}\\bigl[40(1)+4(3)+3(3)+3(3)\\\\&\\qquad+1(4)+1(4)\\bigr]\\\\'
     +'&=\\frac{78}{52}\\\\'
     +'&=\\frac{3}{2}\\\\'
     +'&=1.5000\\ \\text{bits/symbol}'
     +'\\end{aligned}$$'
     +'The coding efficiency is'
     +'$$\\begin{aligned}'
     +'\\eta&=\\frac{H(Y)}{\\bar{L}}\\\\'
     +'&=\\frac{1.2699}{1.5000}\\\\'
     +'&=0.8466'
     +'\\end{aligned}$$'
     +'In percent, $\\eta=84.66\\%$.<br>'
     +'<b>Check.</b> '
     +'The average length also equals the sum of the probabilities formed by the merges, the root included:'
     +'$$\\bar{L}=\\frac{2+5+7+12+52}{52}=\\frac{78}{52}$$'
     +'This matches part (d). The entropy follows by a second route, from the numerators $n_y=52\\,P(Y=y)$:'
     +'$$\\begin{aligned}'
     +' H(Y)&=\\log_2 52-\\frac{1}{52}\\sum_{y}n_y\\log_2 n_y\\\\'
     +'&=5.7004-\\frac{1}{52}\\bigl(40\\log_2 40+4\\log_2 4+2\\cdot3\\log_2 3\\bigr)\\\\'
     +'&=5.7004-4.4305\\\\'
     +'&=1.2699'
     +'\\end{aligned}$$'
     +'The Kraft sum is $2^{-1}+3\\cdot 2^{-3}+2\\cdot 2^{-4}=1$, so the tree has no unused branch. The bound $1.2699\\le 1.5000<2.2699$ holds.'
     +' With these constants the table gives $P(Y=0)=\\tfrac{40}{52}=\\tfrac{10}{13}$, the value in the question.',
  err:'Setting $P(Y=0)=P(Z=0)$. The pairs with $X=0$ and $Z\\neq0$ also give $Y=0$, and they add $\\tfrac14(1-c)$.',
  teach:'A reversed question: a probability of the output is given and the pmf of $Z$ is recovered. The quadratic has one root in $(0,1)$.' }
]);

window.DRILL_M6 = [

{ id:'m6-drill', module:'M6', nav:'Module 6 · practice questions',
  title:'Module 6 — practice questions',
  objective:'Thirty open-ended questions with worked solutions, in the form they are asked in.',
  keywords:'practice questions module 6 entropy derived source function mod floor maximum minimum sum product huffman code efficiency kraft variance extension mutual information repetition code binary symmetric channel capacity shannon limit spectral efficiency soft hard decision hamming code parity check syndrome',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 6 · Practice D6-01 … D6-30'},
  {t:'title', text:'Practice questions'},
  {t:'small', html:'Work each question before opening its solution. Use these checks:<ul><li>The pmf of the derived source adds to one.</li><li>$H\\le\\log_2 K$ for a source with $K$ symbols.</li><li>A Huffman code has $H\\le\\bar{L}<H+1$ and a Kraft sum of one.</li><li>$\\bar{L}$ equals the sum of the probabilities formed by the merges.</li><li>The coding efficiency is at most one.</li><li>A reliable link at spectral efficiency $r$ has $E_b/N_0\\ge(2^{r}-1)/r$.</li></ul>'},
  {t:'rule', short:true},
  {t:'drill', module:'M6'}
]}

];
})();
