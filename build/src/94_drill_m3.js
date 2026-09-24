/* ==========================================================================
   Practice questions — Module 3.

   Thirty questions in the form of the examination questions. The module has
   no examination question of its own: its material is the geometric half of
   two of them. The midterm's third question draws two waveforms on [0,T]; here
   the student builds their basis by Gram-Schmidt, reads off the coordinates,
   energies, distance and correlation, and draws the constellation. The final's
   third question gives an M-ary family of carrier waveforms on 0<=t<=1; here
   the student finds the basis, the signal vectors, the energies, the minimum
   distance and the number of nearest neighbours. Error probabilities belong to
   Modules 4 and 5 and are not asked.

   D3-01 … D3-12   drawn waveforms and Gram-Schmidt (midterm shape)
   D3-13 … D3-24   carrier waveform families (final shape)
   D3-25 … D3-30   reversed and comparison questions in the same format

   Every number a solution states has a check in verify/drills_m3.py that
   reaches it by sampling the waveforms and running the procedure numerically.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;

CONTENT.DRILLTYPES.M3 = [
  { k:'gs', name:'Drawn waveforms and Gram–Schmidt',
    asks:'Two or three piecewise-constant waveforms on $[0,T]$ are drawn. Find an orthonormal basis, the signal vectors, energies, distances and correlation, and draw the constellation.',
    method:['Normalise the first waveform: $\\psi_1=s_1/\\sqrt{E_1}$. For each later waveform, subtract its projections on the axes found so far and normalise the remainder.',
            'For a piecewise-constant waveform every integral is a sum of heights times widths. Write each one out interval by interval.',
            'A zero remainder adds no axis. Check each energy twice: from the vector and from the waveform.'],
    go:'m3-ex-gs' },

  { k:'band', name:'A carrier waveform family and its constellation',
    asks:'An $M$-ary set $s_k(t)=A_k\\cos(2\\pi f_ct+\\theta_k)$ on $0\\le t\\le 1$ is given. Find the basis, the signal vectors, the energies, $E_{s,av}$, $d_{\\min}$ and the nearest neighbours.',
    method:['Expand $\\cos(2\\pi f_ct+\\theta)=\\cos\\theta\\cos(2\\pi f_ct)-\\sin\\theta\\sin(2\\pi f_ct)$. The basis is $\\sqrt2\\cos(2\\pi f_ct)$ and $-\\sqrt2\\sin(2\\pi f_ct)$ when $2f_c$ is an integer.',
            'The coordinates of $A\\cos(2\\pi f_ct+\\theta)$ are $\\tfrac{A}{\\sqrt2}(\\cos\\theta,\\sin\\theta)$. The energy is $A^2/2$.',
            'List every distance between neighbouring points, take the smallest, and count for each point how many others sit at exactly $d_{\\min}$.'],
    go:'m3-constellation' },

  { k:'reverse', name:'From a constellation back to the waveforms',
    asks:'A basis and a constellation are given. Write the waveforms, their energies and the distances between them.',
    method:['Use synthesis: $s_i(t)=\\sum_j s_{ij}\\psi_j(t)$. Add the scaled basis functions interval by interval.',
            'Energy is the squared length of the vector. Confirm it on the waveform you built.',
            'Two waveforms are orthogonal exactly when their vectors have zero inner product.'],
    go:'m3-project' },

  { k:'dim', name:'How many dimensions a set needs',
    asks:'A set of $M$ waveforms is given. Show how many basis functions it needs, which may be fewer than $M$, and find its geometry.',
    method:['Look for a waveform that is a combination of the others before integrating anything.',
            'Run Gram–Schmidt anyway. A remainder $g_k(t)=0$ proves the dependence.',
            'Points on one line through the origin need one axis. Points on a line that misses the origin need two.'],
    go:'m3-gs' },

  { k:'compare', name:'Comparing two descriptions or two designs',
    asks:'The same set is described in two bases, or two designs are compared at the same average energy. Show what the geometry keeps and what it changes.',
    method:['A different order in Gram–Schmidt gives different axes and different coordinates.',
            'Energies, distances and inner products do not depend on the basis. Compute them in each basis to see it.',
            'Compare designs by $d_{\\min}^2/E_{s,av}$. A factor of two is $3.01$ dB.'],
    go:'m3-remarks' }
];

/* ---------- figures ----------
   A waveform is a list of [t0, t1, height] pieces. Several small plots sit
   side by side in one grid, so each keeps its own axes and labels. */
const U = (h, w) => h.map((v,i)=>[i*(w||1),(i+1)*(w||1),v]);
const ROW = (list, n) => `<div style="display:grid;grid-template-columns:repeat(${n||list.length},minmax(0,1fr));gap:18px;align-items:end;width:100%;max-width:${(n||list.length)*520}px;margin:0 auto">${list.join('')}</div>`;

const BOX = (svg, w) => `<div style="width:100%;max-width:${Math.round(1.45*w)}px;margin:0 auto">${svg}</div>`;

function wave(segs, o){
  const T = o.T, hs = segs.map(s=>s[2]);
  const lo = Math.min(0,...hs), hi = Math.max(0,...hs), sp = (hi-lo)||1;
  const negLab = (o.lab||[]).some((l,i)=>l && segs[i][2]<0);
  const yr = o.yr || [lo<0 ? lo-(negLab?0.5:0.22)*sp : -0.12*sp, hi>0 ? hi+0.28*sp : 0.12*sp];
  const xt = o.xt || Array.from({length:T+1},(_,i)=>i);
  const yt = o.yt || [...new Set(hs.concat([0]))].sort((a,b)=>a-b);
  /* A waveform that goes negative has its jumps cross the zero line, where
     the time ticks would sit. Its tick numbers and axis name go under the
     data area instead, so no trace runs through them. */
  const neg = lo < 0;
  const opt = {w:o.w||360,h:o.h||(neg?240:220),xr:[-0.3,T+0.5],yr:yr,
    xlabel:neg?'':'t\\;(\\mathrm{s})',ylabel:o.name,pad:{l:46,r:16,t:22,b:neg?58:36},
    xticksOverride:xt,yticksOverride:yt};
  if(neg) opt.xtickfmt = () => '';
  const a = P.Axes(opt);
  if(neg){ xt.forEach(v=>a.note(v, yr[0], P.fmt(v,3), {fs:13, anchor:'middle', dy:19}));
    a.note(T+0.5, yr[0], 't\\;(\\mathrm{s})', {tex:true, fs:15, color:C.ink, anchor:'end', dy:47}); }
  const pts = [[-0.3,0],[segs[0][0],0]];
  segs.forEach(s=>{ pts.push([s[0],s[2]],[s[1],s[2]]); });
  pts.push([segs[segs.length-1][1],0],[T+0.5,0]);
  a.poly(pts,{color:o.color||C.in,width:2.3});
  if(o.lab) segs.forEach((s,i)=>{ if(o.lab[i]) a.note((s[0]+s[1])/2, s[2], o.lab[i],
    {tex:true,fs:14,color:o.color||C.in,anchor:'middle',dy:s[2]>=0?-9:30}); });
  return a.svg();
}

const OFF = { n:{dy:-12,anchor:'middle'}, s:{dy:27,anchor:'middle'},
  e:{dx:12,dy:7,anchor:'start'}, w:{dx:-12,dy:7,anchor:'end'},
  ne:{dx:8,dy:-9,anchor:'start'}, nw:{dx:-8,dy:-9,anchor:'end'},
  se:{dx:8,dy:25,anchor:'start'}, sw:{dx:-8,dy:25,anchor:'end'} };

/* A constellation: pts are [x, y, label, where]; `d` lists the pairs at the
   minimum distance, drawn in the error colour; `dl` places the d_min label. */
function cons(pts, o){
  const a = P.Axes({w:o.w||560,h:o.h||380,xr:o.xr,yr:o.yr,
    xlabel:o.xl||'\\psi_1',ylabel:o.oneD?'':(o.yl||'\\psi_2'),pad:{l:54,r:30,t:28,b:44},
    xstep:o.xs||1,ystep:o.ys||1,arrows:o.arrows!==false,zeroAxes:!o.oneD,
    xticksOverride:o.xt||null,yticksOverride:o.oneD?[]:(o.yt||null)});
  if(o.oneD){ a.poly([[o.xr[0],0],[o.xr[1],0]],{color:C.axis,width:1.5});
    a.note(0,0,'0',{fs:13,anchor:'middle',dy:20}); }
  if(o.ring) { const c=[]; for(let i=0;i<=180;i++){ const t=2*Math.PI*i/180; c.push([o.ring*Math.cos(t),o.ring*Math.sin(t)]); }
    a.poly(c,{color:C.rule,width:1.2,dash:'4 5'}); }
  (o.d||[]).forEach(([i,j])=>a.poly([[pts[i][0],pts[i][1]],[pts[j][0],pts[j][1]]],{color:C.err,width:2.4}));
  pts.forEach(p=>{ a.point(p[0],p[1],{color:C.in,r:6});
    if(p[2]) a.note(p[0],p[1],p[2],Object.assign({tex:true,fs:15,color:C.in},OFF[p[3]||'n'])); });
  if(o.dl) a.note(o.dl[0],o.dl[1],o.dl[2],{tex:true,fs:14,color:C.err,anchor:o.dl[3]||'start'});
  return BOX(a.svg(), o.w||560);
}

/* A three-dimensional constellation in oblique projection: psi_1 to the right,
   psi_2 up, psi_3 drawn down and to the left. */
function cons3(pts, o){
  const pr = (x,y,z) => [x-0.3*z, y-0.6*z];
  const a = P.Axes({w:560,h:400,xr:[-1,2.4],yr:[-1.45,1.9],pad:{l:20,r:20,t:20,b:20},
    grid:false,zeroAxes:false,arrows:false,xticksOverride:[],yticksOverride:[]});
  const ax = [[pr(2.0,0,0),'\\psi_1','s'],[pr(0,1.75,0),'\\psi_2','e'],[pr(0,0,2.0),'\\psi_3','w']];
  ax.forEach(([q,l,w])=>{ a.poly([[0,0],q],{color:C.axis,width:1.5});
    a.note(q[0],q[1],l,Object.assign({tex:true,fs:15,color:C.ink},OFF[w])); });
  pts.forEach(p=>{ const q = pr(p[0],p[1],p[2]), f = pr(p[0],0,p[2]);
    if(Math.abs(p[1])>1e-9) a.poly([f,q],{color:C.rule,width:1,dash:'3 4'}); });
  (o.d||[]).forEach(([i,j])=>a.poly([pr(...pts[i]),pr(...pts[j])],{color:C.err,width:2.2}));
  pts.forEach(p=>{ const q = pr(p[0],p[1],p[2]); a.point(q[0],q[1],{color:C.in,r:6});
    a.note(q[0],q[1],p[3],Object.assign({tex:true,fs:15,color:C.in},OFF[p[4]||'n'])); });
  if(o.dl) a.note(o.dl[0],o.dl[1],o.dl[2],{tex:true,fs:14,color:C.err,anchor:o.dl[3]||'start'});
  return BOX(a.svg(), 560);
}

/* a chain of equalities, one to a line, aligned at the equals sign */
const AL = (...l) => '$$\\begin{aligned}' + l.join('\\\\') + '\\end{aligned}$$';
/* the in-phase and quadrature basis on 0<=t<=1, shown orthonormal; w is the
   angular frequency as TeX (e.g. '4000\\pi') and w2 twice it */
const ORTHO = (w, w2) => 'Take $\\psi_1(t)=\\sqrt2\\cos('+w+' t)$ and $\\psi_2(t)=-\\sqrt2\\sin('+w+' t)$ on $0\\le t\\le 1$. With $2\\cos^2x=1+\\cos2x$, the energy of $\\psi_1$ is'
  + AL('\\int_0^1\\psi_1^2\\,dt&=\\int_0^1\\big[1+\\cos('+w2+' t)\\big]\\,dt','&=\\Big[t+\\frac{\\sin('+w2+' t)}{'+w2+'}\\Big]_0^1','&=1+\\frac{\\sin('+w2+')}{'+w2+'}','&=1.')
  + 'In the same way, $2\\sin^2x=1-\\cos2x$ gives $\\int_0^1\\psi_2^2\\,dt=1$. With $2\\sin x\\cos x=\\sin2x$, the inner product is'
  + AL('\\int_0^1\\psi_1\\psi_2\\,dt&=-\\int_0^1\\sin('+w2+' t)\\,dt','&=\\Big[\\frac{\\cos('+w2+' t)}{'+w2+'}\\Big]_0^1','&=\\frac{\\cos('+w2+')-1}{'+w2+'}','&=0.')
  + 'Here $\\sin('+w2+')=0$ and $\\cos('+w2+')=1$, because $'+w2+'$ is a whole multiple of $2\\pi$. So $\\{\\psi_1,\\psi_2\\}$ is orthonormal.';
const EXPAND = 'Expand with $\\cos(x+\\theta)=\\cos\\theta\\cos x-\\sin\\theta\\sin x$. A waveform $A\\cos(2\\pi f_ct+\\theta)$ becomes $\\tfrac{A}{\\sqrt2}\\cos\\theta\\,\\psi_1(t)+\\tfrac{A}{\\sqrt2}\\sin\\theta\\,\\psi_2(t)$. '
  + 'So its vector is $\\tfrac{A}{\\sqrt2}(\\cos\\theta,\\,\\sin\\theta)$ and its energy is $A^2/2$.';
const BAND = f => 'Consider an $M$-ary modulation scheme where the equiprobable symbols have the following waveforms:' + f
  + 'These signals are planned to be transmitted over a standard AWGN channel. According to the information given above,';
const BPARTS = ['[8 pts] Find an orthonormal basis for the signal set and show that it is orthonormal.',
  '[7 pts] Find the signal vectors and draw the signal constellation.',
  '[5 pts] Calculate the symbol energies and the average symbol energy $E_{s,av}$.',
  '[5 pts] Determine the minimum distance $d_{\\min}$ and the number of nearest neighbours of each symbol.'];
const R2 = Math.SQRT2, R3 = Math.sqrt(3), R6 = Math.sqrt(6);

CONTENT.DRILL = CONTENT.DRILL.concat([

/* ---- drawn waveforms and Gram–Schmidt ---------------------------------- */

{ id:'D3-01', module:'M3', type:'gs', src:'MT Q3',
  stem:'In an additive white Gaussian noise channel, two equiprobable messages are transmitted by the waveforms $s_0(t)$ and $s_1(t)$ below, with $T=4$ s. '
      +'Before a receiver is designed, the pair is written in geometric form. The correlation coefficient of the pair is '
      +'$$\\rho_{01}=\\frac{1}{\\sqrt{E_0E_1}}\\int_0^{T}s_0(t)\\,s_1(t)\\,dt.$$According to the information given above,',
  figure: () => ROW([wave(U([0,2,2,0]),{T:4,name:'s_0(t)',color:C.in}), wave(U([1,1,1,1]),{T:4,name:'s_1(t)',color:C.out})]),
  parts:['[8 pts] Find an orthonormal basis for $\\{s_0(t),s_1(t)\\}$ by the Gram–Schmidt procedure, starting with $s_0(t)$. Plot the basis functions.',
         '[7 pts] Find the signal vectors $\\mathbf{s}_0$, $\\mathbf{s}_1$ and the energies $E_0$, $E_1$.',
         '[5 pts] Calculate the distance $d_{01}=\\|\\mathbf{s}_0-\\mathbf{s}_1\\|$ and the correlation coefficient $\\rho_{01}$.',
         '[5 pts] Draw the signal constellation. How many dimensions does the signal set need?'],
  sol:'<b>Given.</b> $s_0(t)=2$ for $1\\le t<3$ and zero elsewhere on $[0,4]$. $s_1(t)=1$ for $0\\le t\\le 4$.<br>'
     +'<b>Find.</b> A basis, $\\mathbf{s}_0$, $\\mathbf{s}_1$, $E_0$, $E_1$, $d_{01}$, $\\rho_{01}$ and the number of dimensions.<br>'
     +'<b>Method.</b> Gram–Schmidt builds the basis one waveform at a time. Each waveform is constant on unit intervals. So every integral is a constant times $t$, evaluated at the ends of its interval.<br>'
     +'<b>Solution — (a).</b> Start with the energy of $s_0$:'
     + AL('E_0&=\\int_1^3 2^2\\,dt','&=4t\\,\\Big|_1^3','&=12-4','&=8.')
     +'Normalise $s_0$ to get the first basis function:$$\\psi_1(t)=\\frac{s_0(t)}{\\sqrt8}=\\frac{1}{\\sqrt2},\\qquad 1\\le t<3.$$'
     +'Project $s_1$ on $\\psi_1$:'
     + AL('s_{11}&=\\int_1^3 (1)\\Big(\\frac{1}{\\sqrt2}\\Big)dt','&=\\frac{t}{\\sqrt2}\\,\\Big|_1^3','&=\\frac{2}{\\sqrt2}','&=\\sqrt2.')
     +'The remainder is $g(t)=s_1(t)-\\sqrt2\\,\\psi_1(t)$. On $[1,3)$ it is $1-\\sqrt2\\cdot\\tfrac{1}{\\sqrt2}=0$. On $[0,1)$ and $[3,4]$ it is $1$. Its energy is'
     + AL('E_g&=\\int_0^1 1\\,dt+\\int_3^4 1\\,dt','&=t\\,\\Big|_0^1+t\\,\\Big|_3^4','&=1+1','&=2.')
     +'So $\\psi_2(t)=g(t)/\\sqrt2=1/\\sqrt2$ on $[0,1)$ and on $[3,4]$, and zero on $[1,3)$.<br>'
     +'<b>Solution — (b).</b> $s_0=\\sqrt8\\,\\psi_1$, so $\\mathbf{s}_0=(2\\sqrt2,\\,0)$. The second coordinate of $s_1$ is'
     + AL('s_{12}&=\\int_0^1 \\frac{1}{\\sqrt2}\\,dt+\\int_3^4 \\frac{1}{\\sqrt2}\\,dt','&=\\frac{1}{\\sqrt2}+\\frac{1}{\\sqrt2}','&=\\sqrt2.')
     +'So $\\mathbf{s}_1=(\\sqrt2,\\,\\sqrt2)$. The energies are the squared lengths:'
     + AL('E_0&=(2\\sqrt2)^2+0^2=8,','E_1&=(\\sqrt2)^2+(\\sqrt2)^2=4.')
     +'<b>Solution — (c).</b> Subtract the vectors and take the length:'
     + AL('d_{01}^2&=(2\\sqrt2-\\sqrt2)^2+(0-\\sqrt2)^2','&=2+2','&=4,')
     +'so $d_{01}=2$. The inner product is $\\langle\\mathbf{s}_0,\\mathbf{s}_1\\rangle=(2\\sqrt2)(\\sqrt2)+(0)(\\sqrt2)=4$. Therefore'
     + AL('\\rho_{01}&=\\frac{4}{\\sqrt{(8)(4)}}','&=\\frac{4}{\\sqrt{32}}','&=0.7071.')
     +'<b>Solution — (d).</b> $\\mathbf{s}_0$ lies on the $\\psi_1$ axis and $\\mathbf{s}_1$ lies at $45^\\circ$ between the axes. The remainder $g(t)$ was not zero, so $s_1$ is not a multiple of $s_0$. The set needs <b>two</b> dimensions.<br>'
     +'<b>Check.</b> Compute $E_1$ and $d_{01}$ from the waveforms. $E_1=\\int_0^4 1^2\\,dt=4$. The difference $s_0(t)-s_1(t)$ is $-1$ on $[0,1)$, $+1$ on $[1,3)$ and $-1$ on $[3,4]$. '
     +'Its energy is $1+2+1=4$, so $d_{01}=2$. The integral $\\int_1^3(2)(1)\\,dt=4$ also matches the inner product of the vectors.',
  figSol: () => ROW([wave([[1,3,1/R2]],{T:4,name:'\\psi_1(t)',color:C.mid,yt:[0],lab:['\\frac{1}{\\sqrt2}']}),
                     wave([[0,1,1/R2],[1,3,0],[3,4,1/R2]],{T:4,name:'\\psi_2(t)',color:C.mid,yt:[0],lab:['\\frac{1}{\\sqrt2}',null,'\\frac{1}{\\sqrt2}']})])
     + cons([[2*R2,0,'\\mathbf{s}_0','ne'],[R2,R2,'\\mathbf{s}_1','n']],
            {xr:[-0.6,3.6],yr:[-0.6,2.1],d:[[0,1]],dl:[2.25,0.95,'d_{01}=2']}),
  err:'Normalising with $E_0$ instead of $\\sqrt{E_0}$, so that $\\psi_1=s_0/8$. That function has energy $1/8$, not $1$, and every coordinate comes out $\\sqrt8$ times too small.',
  teach:'This is the examination shape with the matched-filter half replaced by the geometry. Ask for the check by waveform every time: it catches a wrong normalisation at once.' },

{ id:'D3-02', module:'M3', type:'gs', src:'MT Q3',
  stem:'Two equiprobable messages are transmitted by the waveforms $s_0(t)$ and $s_1(t)$ shown below, with $T=3$ s. '
      +'The correlation coefficient of the pair is $\\rho_{01}=\\langle s_0,s_1\\rangle/\\sqrt{E_0E_1}$, where $\\langle s_0,s_1\\rangle=\\int_0^T s_0(t)s_1(t)\\,dt$. According to the information given above,',
  figure: () => ROW([wave(U([2,2,0]),{T:3,name:'s_0(t)',color:C.in}), wave(U([1,1,-2]),{T:3,name:'s_1(t)',color:C.out})]),
  parts:['[8 pts] Use the Gram–Schmidt procedure, starting with $s_0(t)$, to find an orthonormal basis. Plot the basis functions.',
         '[6 pts] Find the signal vectors and the energies $E_0$ and $E_1$.',
         '[6 pts] Calculate $d_{01}$ and $\\rho_{01}$.',
         '[5 pts] Draw the signal constellation and calculate the average symbol energy $E_{s,av}$.'],
  sol:'<b>Given.</b> $s_0(t)=2$ on $[0,2)$ and $0$ on $[2,3]$. $s_1(t)=1$ on $[0,2)$ and $-2$ on $[2,3]$.<br>'
     +'<b>Find.</b> The basis, $\\mathbf{s}_0$, $\\mathbf{s}_1$, $E_0$, $E_1$, $d_{01}$, $\\rho_{01}$ and $E_{s,av}$.<br>'
     +'<b>Method.</b> Normalise $s_0$, remove its component from $s_1$, and normalise the remainder. Then read every other quantity off the two vectors.<br>'
     +'<b>Solution — (a).</b> The energy of $s_0$ is'
     + AL('E_0&=\\int_0^2 2^2\\,dt','&=4t\\,\\Big|_0^2','&=8.')
     +'So $\\psi_1(t)=s_0(t)/\\sqrt8=1/\\sqrt2$ on $[0,2)$ and zero on $[2,3]$. The projection of $s_1$ on it is'
     + AL('s_{11}&=\\int_0^2 (1)\\Big(\\frac{1}{\\sqrt2}\\Big)dt','&=\\frac{t}{\\sqrt2}\\,\\Big|_0^2','&=\\sqrt2.')
     +'The remainder $g(t)=s_1(t)-\\sqrt2\\,\\psi_1(t)$ is $1-1=0$ on $[0,2)$ and $-2$ on $[2,3]$. Its energy is'
     + AL('E_g&=\\int_2^3 (-2)^2\\,dt','&=4t\\,\\Big|_2^3','&=4.')
     +'So $\\psi_2(t)=g(t)/2=-1$ on $[2,3]$ and zero on $[0,2)$.<br>'
     +'<b>Solution — (b).</b> $\\mathbf{s}_0=(\\sqrt{E_0},0)=(2\\sqrt2,\\,0)$. The second coordinate of $s_1$ is'
     + AL('s_{12}&=\\int_2^3 (-2)(-1)\\,dt','&=2t\\,\\Big|_2^3','&=2.')
     +'So $\\mathbf{s}_1=(\\sqrt2,\\,2)$. Then $E_0=8$ and $E_1=(\\sqrt2)^2+2^2=6$.<br>'
     +'<b>Solution — (c).</b> The distance is'
     + AL('d_{01}^2&=(2\\sqrt2-\\sqrt2)^2+(0-2)^2','&=2+4','&=6,')
     +'so $d_{01}=\\sqrt6=2.449$. The inner product is $(2\\sqrt2)(\\sqrt2)+(0)(2)=4$, so'
     + AL('\\rho_{01}&=\\frac{4}{\\sqrt{(8)(6)}}','&=\\frac{4}{\\sqrt{48}}','&=0.5774.')
     +'<b>Solution — (d).</b> $\\mathbf{s}_0$ sits on the $\\psi_1$ axis at $2.828$. $\\mathbf{s}_1$ sits at $(1.414,\\,2)$. With equiprobable symbols,'
     + AL('E_{s,av}&=\\tfrac12(E_0+E_1)','&=\\tfrac12(8+6)','&=7.')
     +'<b>Check.</b> From the waveform, $E_1=1^2(1)+1^2(1)+(-2)^2(1)=6$. The difference $s_0(t)-s_1(t)$ is $1$ on $[0,2)$ and $2$ on $[2,3]$. '
     +'Its energy is $1(2)+4(1)=6$, which is $d_{01}^2$.',
  figSol: () => ROW([wave([[0,2,1/R2]],{T:3,name:'\\psi_1(t)',color:C.mid,yt:[0],lab:['\\frac{1}{\\sqrt2}']}),
                     wave([[0,2,0],[2,3,-1]],{T:3,name:'\\psi_2(t)',color:C.mid,yt:[-1,0]})])
     + cons([[2*R2,0,'\\mathbf{s}_0','ne'],[R2,2,'\\mathbf{s}_1','n']],
            {xr:[-0.6,3.6],yr:[-0.6,2.7],d:[[0,1]],dl:[2.25,1.2,'d_{01}=\\sqrt6']}),
  err:'Choosing $\\psi_2=+1$ on $[2,3]$ but keeping $s_{12}=+2$. A basis function and its coordinate change sign together. With $\\psi_2=+1$ the coordinate is $-2$, and every distance is unchanged.',
  teach:'The negative basis function is deliberate. Students who flip it for neatness must flip the coordinate too, and the check by waveform shows whether they did.' },

{ id:'D3-03', module:'M3', type:'gs', src:'MT Q3',
  stem:'In an additive white Gaussian noise channel, two equiprobable messages are transmitted by the waveforms below, with $T=3$ s. According to the information given above,',
  figure: () => ROW([wave(U([2,2,-4]),{T:3,name:'s_0(t)',color:C.in}), wave(U([-1,-1,2]),{T:3,name:'s_1(t)',color:C.out})]),
  parts:['[9 pts] Apply the Gram–Schmidt procedure, starting with $s_0(t)$. Show that it stops after one basis function, and plot that function.',
         '[6 pts] Find the coordinates of the two signals and their energies.',
         '[5 pts] Calculate the distance $d_{01}$ and the correlation coefficient $\\rho_{01}=\\langle s_0,s_1\\rangle/\\sqrt{E_0E_1}$.',
         '[5 pts] Draw the signal constellation and give $E_{s,av}$.'],
  sol:'<b>Given.</b> $s_0(t)=2$ on $[0,2)$ and $-4$ on $[2,3]$. $s_1(t)=-1$ on $[0,2)$ and $2$ on $[2,3]$.<br>'
     +'<b>Find.</b> The basis, the coordinates, $E_0$, $E_1$, $d_{01}$, $\\rho_{01}$ and $E_{s,av}$.<br>'
     +'<b>Method.</b> Run Gram–Schmidt. If the remainder of $s_1$ is zero, one axis carries both signals.<br>'
     +'<b>Solution — (a).</b> The energy of $s_0$ is'
     + AL('E_0&=\\int_0^2 2^2\\,dt+\\int_2^3 (-4)^2\\,dt','&=4t\\,\\Big|_0^2+16t\\,\\Big|_2^3','&=8+16','&=24.')
     +'So $\\psi_1(t)=s_0(t)/\\sqrt{24}$. Its height is $2/(2\\sqrt6)=1/\\sqrt6$ on $[0,2)$ and $-4/(2\\sqrt6)=-2/\\sqrt6$ on $[2,3]$. The projection of $s_1$ is'
     + AL('s_{11}&=\\int_0^2(-1)\\Big(\\frac{1}{\\sqrt6}\\Big)dt+\\int_2^3(2)\\Big(\\frac{-2}{\\sqrt6}\\Big)dt','&=-\\frac{2}{\\sqrt6}-\\frac{4}{\\sqrt6}','&=-\\sqrt6.')
     +'The remainder $g(t)=s_1(t)+\\sqrt6\\,\\psi_1(t)$ is $-1+1=0$ on $[0,2)$ and $2-2=0$ on $[2,3]$. So $g(t)=0$ and no second axis is added. One basis function is enough.<br>'
     +'<b>Solution — (b).</b> $s_0=\\sqrt{24}\\,\\psi_1$, so $s_{01}=2\\sqrt6=4.899$. Also $s_{11}=-\\sqrt6=-2.449$. The energies are $E_0=24$ and $E_1=(-\\sqrt6)^2=6$.<br>'
     +'<b>Solution — (c).</b> On one axis the distance is the difference of the coordinates:'
     + AL('d_{01}&=2\\sqrt6-(-\\sqrt6)','&=3\\sqrt6','&=7.348.')
     +'The inner product is $(2\\sqrt6)(-\\sqrt6)=-12$, so $\\rho_{01}=-12/\\sqrt{(24)(6)}=-12/12=-1$.<br>'
     +'<b>Solution — (d).</b> Both points lie on the $\\psi_1$ axis, on opposite sides of the origin. With equiprobable symbols, $E_{s,av}=\\tfrac12(24+6)=15$.<br>'
     +'<b>Check.</b> $s_1(t)=-\\tfrac12 s_0(t)$ on every interval, which explains $\\rho_{01}=-1$. From the waveforms, $s_0-s_1$ is $3$ on $[0,2)$ and $-6$ on $[2,3]$. '
     +'Its energy is $9(2)+36(1)=54$, and $\\sqrt{54}=7.348=d_{01}$.',
  figSol: () => ROW([wave([[0,2,1/R6],[2,3,-2/R6]],{T:3,name:'\\psi_1(t)',color:C.mid,yt:[0],lab:['\\frac{1}{\\sqrt6}','-\\frac{2}{\\sqrt6}']}),
                     cons([[2*R6,0,'\\mathbf{s}_0','n'],[-R6,0,'\\mathbf{s}_1','n']],
                          {w:420,h:220,xr:[-3.5,5.8],yr:[-0.6,1.2],oneD:true,d:[[0,1]],dl:[1.2,0.55,'d_{01}=3\\sqrt6','middle']})]),
  err:'Adding a second axis because the two waveforms "look different". A negative multiple of a waveform points along the same axis. The remainder is zero, and that settles it.',
  teach:'This set has the same shape as the midterm pair: one waveform a negative multiple of the other. It is a one-dimensional set with unequal energies, not an antipodal pair.' },

{ id:'D3-04', module:'M3', type:'gs', src:'MT Q3',
  stem:'Two equiprobable messages are transmitted by the waveforms $s_0(t)$ and $s_1(t)$ shown below, with $T=4$ s. According to the information given above,',
  figure: () => ROW([wave(U([1,1,1,1]),{T:4,name:'s_0(t)',color:C.in}), wave(U([3,3,-1,-1]),{T:4,name:'s_1(t)',color:C.out})]),
  parts:['[8 pts] Find an orthonormal basis for the two signals by the Gram–Schmidt procedure, starting with $s_0(t)$. Plot the basis functions.',
         '[7 pts] Find $\\mathbf{s}_0$ and $\\mathbf{s}_1$, and compute each energy both from the vector and from the waveform.',
         '[5 pts] Calculate $d_{01}$ and $\\rho_{01}=\\langle s_0,s_1\\rangle/\\sqrt{E_0E_1}$.',
         '[5 pts] Draw the signal constellation and give $E_{s,av}$.'],
  sol:'<b>Given.</b> $s_0(t)=1$ on $[0,4]$. $s_1(t)=3$ on $[0,2)$ and $-1$ on $[2,4]$.<br>'
     +'<b>Find.</b> The basis, both vectors, both energies, $d_{01}$, $\\rho_{01}$ and $E_{s,av}$.<br>'
     +'<b>Method.</b> Gram–Schmidt, then squared lengths and distances of the vectors.<br>'
     +'<b>Solution — (a).</b> $E_0=\\int_0^4 1\\,dt=t\\,\\big|_0^4=4$, so $\\psi_1(t)=s_0(t)/2=\\tfrac12$ on $[0,4]$. The projection of $s_1$ is'
     + AL('s_{11}&=\\int_0^2 (3)\\big(\\tfrac12\\big)dt+\\int_2^4 (-1)\\big(\\tfrac12\\big)dt','&=\\tfrac32 t\\,\\Big|_0^2-\\tfrac12 t\\,\\Big|_2^4','&=3-1','&=2.')
     +'The remainder $g(t)=s_1(t)-2\\psi_1(t)=s_1(t)-1$ is $2$ on $[0,2)$ and $-2$ on $[2,4]$. Its energy is'
     + AL('E_g&=\\int_0^2 4\\,dt+\\int_2^4 4\\,dt','&=8+8','&=16.')
     +'So $\\psi_2(t)=g(t)/4$, which is $\\tfrac12$ on $[0,2)$ and $-\\tfrac12$ on $[2,4]$.<br>'
     +'<b>Solution — (b).</b> $\\mathbf{s}_0=(2,\\,0)$. The second coordinate of $s_1$ is'
     + AL('s_{12}&=\\int_0^2 (3)\\big(\\tfrac12\\big)dt+\\int_2^4 (-1)\\big(-\\tfrac12\\big)dt','&=3+1','&=4.')
     +'So $\\mathbf{s}_1=(2,\\,4)$. From the vectors, $E_0=4$ and $E_1=2^2+4^2=20$. From the waveforms, $E_0=1^2(4)=4$ and $E_1=3^2(2)+(-1)^2(2)=18+2=20$.<br>'
     +'<b>Solution — (c).</b> $\\mathbf{s}_1-\\mathbf{s}_0=(0,\\,4)$, so $d_{01}=4$. The inner product is $(2)(2)+(0)(4)=4$, so'
     + AL('\\rho_{01}&=\\frac{4}{\\sqrt{(4)(20)}}','&=\\frac{4}{\\sqrt{80}}','&=0.4472.')
     +'<b>Solution — (d).</b> $\\mathbf{s}_0$ lies on the $\\psi_1$ axis at $2$. $\\mathbf{s}_1$ lies straight above it at $(2,4)$. With equal priors, $E_{s,av}=\\tfrac12(4+20)=12$.<br>'
     +'<b>Check.</b> The difference $s_1(t)-s_0(t)$ is $2$ on $[0,2)$ and $-2$ on $[2,4]$. Its energy is $4(2)+4(2)=16$, so the distance is $4$. '
     +'It is the remainder $g(t)$ itself, because $s_{11}$ equals the only coordinate of $s_0$.',
  figSol: () => ROW([wave([[0,4,0.5]],{T:4,name:'\\psi_1(t)',color:C.mid,yt:[0,0.5]}),
                     wave([[0,2,0.5],[2,4,-0.5]],{T:4,name:'\\psi_2(t)',color:C.mid,yt:[-0.5,0,0.5]})])
     + cons([[2,0,'\\mathbf{s}_0','ne'],[2,4,'\\mathbf{s}_1','e']],
            {xr:[-0.8,4],yr:[-0.8,4.8],d:[[0,1]],dl:[1.85,2,'d_{01}=4','end']}),
  err:'Taking $\\psi_2$ proportional to $s_1(t)$ itself. The second axis must be built from the remainder after the $\\psi_1$ part is removed. Otherwise the two axes are not orthogonal.',
  teach:'The two points share their first coordinate, so the distance is the remainder energy. That is a quick route to part (c) worth pointing out.' },

{ id:'D3-05', module:'M3', type:'gs', src:'MT Q3',
  stem:'Three equiprobable messages are transmitted by the waveforms $s_1(t)$, $s_2(t)$ and $s_3(t)$ shown below, with $T=3$ s. According to the information given above,',
  figure: () => ROW([wave(U([3,0,0]),{T:3,name:'s_1(t)',color:C.in}), wave(U([1,1,1]),{T:3,name:'s_2(t)',color:C.out}), wave(U([0,-2,-2]),{T:3,name:'s_3(t)',color:C.mid})]),
  parts:['[9 pts] Find an orthonormal basis by the Gram–Schmidt procedure, taking the signals in the order $s_1,s_2,s_3$. Plot the basis functions.',
         '[6 pts] Find the three signal vectors and their energies.',
         '[6 pts] Calculate the three distances between the signals and give $d_{\\min}$.',
         '[4 pts] Draw the signal constellation and state the number of dimensions.'],
  sol:'<b>Given.</b> $s_1=3$ on $[0,1)$. $s_2=1$ on $[0,3]$. $s_3=-2$ on $[1,3]$. Each is zero elsewhere on $[0,3]$.<br>'
     +'<b>Find.</b> The basis, $\\mathbf{s}_1,\\mathbf{s}_2,\\mathbf{s}_3$, the energies, the distances and the dimension.<br>'
     +'<b>Method.</b> Gram–Schmidt in the stated order. A zero remainder adds no axis.<br>'
     +'<b>Solution — (a).</b> $E_1=\\int_0^1 9\\,dt=9t\\,\\big|_0^1=9$, so $\\psi_1(t)=s_1(t)/3=1$ on $[0,1)$. The projection of $s_2$ is $s_{21}=\\int_0^1(1)(1)\\,dt=1$. '
     +'The remainder $g_2=s_2-\\psi_1$ is $0$ on $[0,1)$ and $1$ on $[1,3]$. Its energy is $\\int_1^3 1\\,dt=t\\,\\big|_1^3=2$. So $\\psi_2(t)=1/\\sqrt2$ on $[1,3]$.<br>'
     +'For $s_3$, $s_{31}=0$ because $s_3$ is zero where $\\psi_1$ is not. The second projection is'
     + AL('s_{32}&=\\int_1^3(-2)\\Big(\\frac{1}{\\sqrt2}\\Big)dt','&=-\\frac{2t}{\\sqrt2}\\,\\Big|_1^3','&=-\\frac{4}{\\sqrt2}','&=-2\\sqrt2.')
     +'The remainder $g_3=s_3+2\\sqrt2\\,\\psi_2$ is $-2+2=0$ on $[1,3]$ and $0$ on $[0,1)$. No third axis is added.<br>'
     +'<b>Solution — (b).</b> $s_{22}=\\int_1^3 (1)(1/\\sqrt2)\\,dt=2/\\sqrt2=\\sqrt2$. The vectors are'
     +'$$\\mathbf{s}_1=(3,\\,0),\\quad \\mathbf{s}_2=(1,\\,\\sqrt2),\\quad \\mathbf{s}_3=(0,\\,-2\\sqrt2).$$'
     +'The energies are $E_1=9$, $E_2=1+2=3$ and $E_3=8$.<br>'
     +'<b>Solution — (c).</b> The three squared distances are'
     + AL('d_{12}^2&=(3-1)^2+(0-\\sqrt2)^2=6,','d_{13}^2&=(3-0)^2+(0+2\\sqrt2)^2=17,','d_{23}^2&=(1-0)^2+(\\sqrt2+2\\sqrt2)^2=19.')
     +'So $d_{12}=2.449$, $d_{13}=4.123$ and $d_{23}=4.359$. The minimum distance is $d_{\\min}=\\sqrt6=2.449$, between $s_1$ and $s_2$.<br>'
     +'<b>Solution — (d).</b> Three signals need only <b>two</b> dimensions. $\\mathbf{s}_1$ is on the $\\psi_1$ axis, $\\mathbf{s}_3$ is on the negative $\\psi_2$ axis, and $\\mathbf{s}_2$ is in the first quadrant.<br>'
     +'<b>Check.</b> The dependence is visible in the waveforms: $s_3=\\tfrac23 s_1-2s_2$, because $\\tfrac23(3)-2(1)=0$ on $[0,1)$ and $0-2(1)=-2$ on $[1,3]$. '
     +'Also $s_1-s_2$ is $2$ on $[0,1)$ and $-1$ on $[1,3]$, with energy $4+1+1=6=d_{12}^2$.',
  figSol: () => ROW([wave([[0,1,1]],{T:3,name:'\\psi_1(t)',color:C.mid,yt:[0,1]}),
                     wave([[0,1,0],[1,3,1/R2]],{T:3,name:'\\psi_2(t)',color:C.mid,yt:[0],lab:[null,'\\frac{1}{\\sqrt2}']})])
     + cons([[3,0,'\\mathbf{s}_1','n'],[1,R2,'\\mathbf{s}_2','n'],[0,-2*R2,'\\mathbf{s}_3','e']],
            {xr:[-1,4],yr:[-3.4,2.2],d:[[0,1]],dl:[2.15,0.95,'d_{\\min}=\\sqrt6']}),
  err:'Adding a third basis function because there are three signals. The number of axes is at most the number of signals, and here $g_3=0$, so there are only two.',
  teach:'A three-signal version of the midterm question. The dependence $s_3=\\tfrac23 s_1-2s_2$ is not obvious from the drawing, which is why the remainder is worth computing.' },

{ id:'D3-06', module:'M3', type:'gs', src:'MT Q3',
  stem:'Three equiprobable symbols are represented by the waveforms shown below on $0\\le t\\le T$, with $T=3$ s. According to the information given above,',
  figure: () => ROW([wave(U([1,1,1]),{T:3,name:'s_1(t)',color:C.in}), wave(U([2,2,-1]),{T:3,name:'s_2(t)',color:C.out}), wave(U([-1,-1,2]),{T:3,name:'s_3(t)',color:C.mid})]),
  parts:['[9 pts] Use the Gram–Schmidt procedure in the order $s_1,s_2,s_3$ to find an orthonormal basis. Plot the basis functions.',
         '[6 pts] Find the signal vectors.',
         '[5 pts] Calculate $E_{s,av}$ and the minimum distance $d_{\\min}$.',
         '[5 pts] Draw the signal constellation, and write $s_3(t)$ as a combination of $s_1(t)$ and $s_2(t)$.'],
  sol:'<b>Given.</b> $s_1=1$ on $[0,3]$. $s_2=2$ on $[0,2)$ and $-1$ on $[2,3]$. $s_3=-1$ on $[0,2)$ and $2$ on $[2,3]$.<br>'
     +'<b>Find.</b> The basis, the vectors, $E_{s,av}$, $d_{\\min}$ and the relation among the signals.<br>'
     +'<b>Method.</b> Gram–Schmidt in order. Then energies and distances from the vectors.<br>'
     +'<b>Solution — (a).</b> $E_1=\\int_0^3 1\\,dt=3$, so $\\psi_1(t)=1/\\sqrt3$ on $[0,3]$. The projection of $s_2$ is'
     + AL('s_{21}&=\\int_0^2 \\frac{2}{\\sqrt3}\\,dt+\\int_2^3 \\frac{-1}{\\sqrt3}\\,dt','&=\\frac{4}{\\sqrt3}-\\frac{1}{\\sqrt3}','&=\\sqrt3.')
     +'The remainder $g_2=s_2-\\sqrt3\\,\\psi_1=s_2-1$ is $1$ on $[0,2)$ and $-2$ on $[2,3]$. Its energy is $\\int_0^2 1\\,dt+\\int_2^3 4\\,dt=2+4=6$. '
     +'So $\\psi_2=g_2/\\sqrt6$, which is $1/\\sqrt6$ on $[0,2)$ and $-2/\\sqrt6$ on $[2,3]$.<br>'
     +'For $s_3$ the two projections are'
     + AL('s_{31}&=\\int_0^2\\frac{-1}{\\sqrt3}\\,dt+\\int_2^3\\frac{2}{\\sqrt3}\\,dt=-\\frac{2}{\\sqrt3}+\\frac{2}{\\sqrt3}=0,','s_{32}&=\\int_0^2\\frac{-1}{\\sqrt6}\\,dt+\\int_2^3\\frac{-4}{\\sqrt6}\\,dt=-\\frac{6}{\\sqrt6}=-\\sqrt6.')
     +'The remainder $g_3=s_3+\\sqrt6\\,\\psi_2=s_3+g_2$ is $-1+1=0$ on $[0,2)$ and $2-2=0$ on $[2,3]$. No third axis.<br>'
     +'<b>Solution — (b).</b> $s_{22}=\\sqrt{E_{g_2}}=\\sqrt6$. The vectors are'
     +'$$\\mathbf{s}_1=(\\sqrt3,\\,0),\\quad \\mathbf{s}_2=(\\sqrt3,\\,\\sqrt6),\\quad \\mathbf{s}_3=(0,\\,-\\sqrt6).$$<br>'
     +'<b>Solution — (c).</b> The energies are $3$, $3+6=9$ and $6$, so $E_{s,av}=(3+9+6)/3=6$. The squared distances are'
     + AL('d_{12}^2&=0^2+(\\sqrt6)^2=6,','d_{13}^2&=(\\sqrt3)^2+(\\sqrt6)^2=9,','d_{23}^2&=(\\sqrt3)^2+(2\\sqrt6)^2=27.')
     +'So $d_{\\min}=\\sqrt6=2.449$, between $s_1$ and $s_2$.<br>'
     +'<b>Solution — (d).</b> $\\mathbf{s}_1-\\mathbf{s}_2=(0,\\,-\\sqrt6)=\\mathbf{s}_3$. So $s_3(t)=s_1(t)-s_2(t)$. The constellation has two dimensions.<br>'
     +'<b>Check.</b> On the waveforms, $s_1-s_2$ is $1-2=-1$ on $[0,2)$ and $1+1=2$ on $[2,3]$. That is exactly $s_3$. '
     +'The energy of $s_2$ from its waveform is $4(2)+1(1)=9$, the squared length of $(\\sqrt3,\\sqrt6)$.',
  figSol: () => ROW([wave([[0,3,1/R3]],{T:3,name:'\\psi_1(t)',color:C.mid,yt:[0],lab:['\\frac{1}{\\sqrt3}']}),
                     wave([[0,2,1/R6],[2,3,-2/R6]],{T:3,name:'\\psi_2(t)',color:C.mid,yt:[0],lab:['\\frac{1}{\\sqrt6}','-\\frac{2}{\\sqrt6}']})])
     + cons([[R3,0,'\\mathbf{s}_1','ne'],[R3,R6,'\\mathbf{s}_2','e'],[0,-R6,'\\mathbf{s}_3','e']],
            {xr:[-1,3],yr:[-3.2,3.2],d:[[0,1]],dl:[1.6,1.25,'d_{\\min}=\\sqrt6','end']}),
  err:'Stopping at $\\psi_2$ without testing $s_3$. The count of axes is proved by the remainder $g_3=0$, not assumed. A set of three signals can need three.',
  teach:'Part (d) turns the zero remainder into a statement about waveforms. Students should find $s_3=s_1-s_2$ on the drawing afterwards.' },

{ id:'D3-07', module:'M3', type:'gs', src:'MT Q3',
  stem:'Three equiprobable messages are transmitted by the waveforms shown below, with $T=4$ s. According to the information given above,',
  figure: () => ROW([wave(U([2,2,-2,-2]),{T:4,name:'s_1(t)',color:C.in}), wave(U([1,-1,-1,1]),{T:4,name:'s_2(t)',color:C.out}), wave(U([3,1,-3,-1]),{T:4,name:'s_3(t)',color:C.mid})]),
  parts:['[6 pts] Show that $s_1(t)$ and $s_2(t)$ are orthogonal, and give their correlation coefficient $\\rho_{12}=\\langle s_1,s_2\\rangle/\\sqrt{E_1E_2}$.',
         '[9 pts] Find an orthonormal basis for all three signals by the Gram–Schmidt procedure in the order $s_1,s_2,s_3$, and the three signal vectors.',
         '[5 pts] Calculate the three distances and $d_{\\min}$. Which pair is closest?',
         '[5 pts] Draw the signal constellation and calculate $E_{s,av}$.'],
  sol:'<b>Given.</b> On the four unit intervals, $s_1$ takes $2,2,-2,-2$, $s_2$ takes $1,-1,-1,1$ and $s_3$ takes $3,1,-3,-1$.<br>'
     +'<b>Find.</b> $\\rho_{12}$, the basis, the vectors, the distances, $d_{\\min}$ and $E_{s,av}$.<br>'
     +'<b>Method.</b> Each inner product is a sum over the four unit intervals of height times height. Gram–Schmidt then uses the same sums.<br>'
     +'<b>Solution — (a).</b> Interval by interval,'
     + AL('\\langle s_1,s_2\\rangle&=(2)(1)+(2)(-1)+(-2)(-1)+(-2)(1)','&=2-2+2-2','&=0.')
     +'So the two are orthogonal and $\\rho_{12}=0$.<br>'
     +'<b>Solution — (b).</b> $E_1=4(4)=16$, so $\\psi_1=s_1/4$, which is $\\tfrac12$ on $[0,2)$ and $-\\tfrac12$ on $[2,4]$. Because $\\langle s_2,\\psi_1\\rangle=0$, the remainder is $g_2=s_2$. '
     +'Its energy is $E_2=1+1+1+1=4$, so $\\psi_2=s_2/2$, which is $\\pm\\tfrac12$. The projections of $s_3$ are'
     + AL('s_{31}&=(3)\\big(\\tfrac12\\big)+(1)\\big(\\tfrac12\\big)+(-3)\\big(-\\tfrac12\\big)+(-1)\\big(-\\tfrac12\\big)=4,','s_{32}&=(3)\\big(\\tfrac12\\big)+(1)\\big(-\\tfrac12\\big)+(-3)\\big(-\\tfrac12\\big)+(-1)\\big(\\tfrac12\\big)=2.')
     +'The remainder $g_3=s_3-4\\psi_1-2\\psi_2=s_3-s_1-s_2$ has heights $3-2-1$, $1-2+1$, $-3+2+1$ and $-1+2-1$. All four are $0$, so there is no third axis. The vectors are'
     +'$$\\mathbf{s}_1=(4,\\,0),\\quad \\mathbf{s}_2=(0,\\,2),\\quad \\mathbf{s}_3=(4,\\,2).$$<br>'
     +'<b>Solution — (c).</b> The distances are'
     + AL('d_{12}&=\\sqrt{4^2+2^2}=\\sqrt{20}=4.472,','d_{13}&=\\sqrt{0^2+2^2}=2,','d_{23}&=\\sqrt{4^2+0^2}=4.')
     +'So $d_{\\min}=2$, between $s_1$ and $s_3$.<br>'
     +'<b>Solution — (d).</b> $\\mathbf{s}_1$ lies on the $\\psi_1$ axis and $\\mathbf{s}_2$ on the $\\psi_2$ axis. $\\mathbf{s}_3$ is the corner $(4,2)$ of the rectangle they span. The energies are $16$, $4$ and $20$, so'
     + AL('E_{s,av}&=\\tfrac13(16+4+20)','&=\\tfrac{40}{3}','&=13.33.')
     +'<b>Check.</b> The waveform $s_3-s_1$ has heights $1,-1,-1,1$, which is $s_2$. Its energy is $4$, so $d_{13}=2$. '
     +'From the waveform, $E_3=9+1+9+1=20$, the squared length of $(4,2)$.',
  figSol: () => ROW([wave([[0,2,0.5],[2,4,-0.5]],{T:4,name:'\\psi_1(t)',color:C.mid,yt:[-0.5,0,0.5]}),
                     wave(U([0.5,-0.5,-0.5,0.5]),{T:4,name:'\\psi_2(t)',color:C.mid,yt:[-0.5,0,0.5]})])
     + cons([[4,0,'\\mathbf{s}_1','ne'],[0,2,'\\mathbf{s}_2','e'],[4,2,'\\mathbf{s}_3','n']],
            {xr:[-0.8,5],yr:[-0.8,3],d:[[0,2]],dl:[4.15,1,'d_{\\min}=2']}),
  err:'Concluding that $s_3$ needs a third axis because it is not orthogonal to $s_1$ or $s_2$. Dependence, not orthogonality, decides the count, and $s_3=s_1+s_2$.',
  teach:'Part (a) lets students find the first two axes without any subtraction. The third waveform then shows that a zero remainder can hide behind a busy drawing.' },

{ id:'D3-08', module:'M3', type:'gs', src:'MT Q3',
  stem:'Three equiprobable symbols are transmitted with the staircase waveforms shown below on $0\\le t\\le T$, with $T=3$ s. According to the information given above,',
  figure: () => ROW([wave(U([1,1,1]),{T:3,name:'s_1(t)',color:C.in}), wave(U([3,1,-1]),{T:3,name:'s_2(t)',color:C.out}), wave(U([-1,1,3]),{T:3,name:'s_3(t)',color:C.mid})]),
  parts:['[9 pts] Find an orthonormal basis by the Gram–Schmidt procedure in the order $s_1,s_2,s_3$. Plot the basis functions.',
         '[6 pts] Find the signal vectors and the symbol energies.',
         '[6 pts] Calculate all distances, $d_{\\min}$, and the number of nearest neighbours of each symbol.',
         '[4 pts] Draw the constellation. The three points lie on one straight line. Explain why the set still needs two dimensions.'],
  sol:'<b>Given.</b> $s_1$ takes $1,1,1$, $s_2$ takes $3,1,-1$ and $s_3$ takes $-1,1,3$ on the three unit intervals.<br>'
     +'<b>Find.</b> The basis, the vectors, the energies, the distances, $d_{\\min}$, the nearest neighbours and the dimension.<br>'
     +'<b>Method.</b> Gram–Schmidt with sums over unit intervals. Then distances from the vectors.<br>'
     +'<b>Solution — (a).</b> $E_1=3$, so $\\psi_1=1/\\sqrt3$ on $[0,3]$. The projection of $s_2$ is $s_{21}=(3+1-1)/\\sqrt3=\\sqrt3$. '
     +'The remainder $g_2=s_2-\\sqrt3\\,\\psi_1=s_2-1$ takes $2,0,-2$, with energy $4+0+4=8$. So $\\psi_2=g_2/(2\\sqrt2)$ takes $\\tfrac{1}{\\sqrt2},0,-\\tfrac{1}{\\sqrt2}$.<br>'
     +'For $s_3$ the projections are'
     + AL('s_{31}&=\\frac{-1+1+3}{\\sqrt3}=\\sqrt3,','s_{32}&=\\frac{(-1)(1)+(1)(0)+(3)(-1)}{\\sqrt2}=-2\\sqrt2.')
     +'The remainder $g_3=s_3-1+2\\sqrt2\\,\\psi_2=s_3-1+g_2$ takes $-1-1+2=0$, $1-1+0=0$ and $3-1-2=0$. No third axis is added.<br>'
     +'<b>Solution — (b).</b> $s_{22}=\\sqrt{8}=2\\sqrt2$. The vectors are'
     +'$$\\mathbf{s}_1=(\\sqrt3,\\,0),\\quad \\mathbf{s}_2=(\\sqrt3,\\,2\\sqrt2),\\quad \\mathbf{s}_3=(\\sqrt3,\\,-2\\sqrt2).$$'
     +'The energies are $E_1=3$ and $E_2=E_3=3+8=11$.<br>'
     +'<b>Solution — (c).</b> All three share the first coordinate, so each distance is a difference of second coordinates:'
     + AL('d_{12}&=|0-2\\sqrt2|=2.828,','d_{13}&=|0+2\\sqrt2|=2.828,','d_{23}&=|2\\sqrt2+2\\sqrt2|=5.657.')
     +'So $d_{\\min}=2\\sqrt2=2.828$. $s_1$ has two nearest neighbours. $s_2$ and $s_3$ have one each.<br>'
     +'<b>Solution — (d).</b> The points lie on the vertical line $\\psi_1=\\sqrt3$. That line does not pass through the origin. A set on one axis must lie on a line through the origin, so this set needs <b>two</b> dimensions.<br>'
     +'<b>Check.</b> From the waveforms, $E_2=9+1+1=11$. The difference $s_2-s_1$ takes $2,0,-2$, with energy $8$, so $d_{12}=\\sqrt8=2.828$. '
     +'The average energy is $E_{s,av}=(3+11+11)/3=8.333$.',
  figSol: () => ROW([wave([[0,3,1/R3]],{T:3,name:'\\psi_1(t)',color:C.mid,yt:[0],lab:['\\frac{1}{\\sqrt3}']}),
                     wave([[0,1,1/R2],[1,2,0],[2,3,-1/R2]],{T:3,name:'\\psi_2(t)',color:C.mid,yt:[0],lab:['\\frac{1}{\\sqrt2}',null,'-\\frac{1}{\\sqrt2}']})])
     + cons([[R3,0,'\\mathbf{s}_1','ne'],[R3,2*R2,'\\mathbf{s}_2','e'],[R3,-2*R2,'\\mathbf{s}_3','e']],
            {xr:[-1,3.2],yr:[-3.6,3.6],d:[[0,1],[0,2]],dl:[1.6,1.4,'d_{\\min}=2\\sqrt2','end']}),
  err:'Reading "the points lie on a line" as "the set is one-dimensional". One dimension needs a line through the origin. Here every point has the same non-zero first coordinate.',
  teach:'The staircase shapes make the second axis a ramp. Part (d) is the conceptual core: dimension is about lines through the origin.' },

{ id:'D3-09', module:'M3', type:'gs', src:'MT Q3',
  stem:'Three equiprobable messages are transmitted by the waveforms shown below, with $T=3$ s. Each waveform is $1$ on two of the three unit intervals and $0$ on the third. According to the information given above,',
  figure: () => ROW([wave(U([1,1,0]),{T:3,name:'s_1(t)',color:C.in}), wave(U([1,0,1]),{T:3,name:'s_2(t)',color:C.out}), wave(U([0,1,1]),{T:3,name:'s_3(t)',color:C.mid})]),
  parts:['[10 pts] Apply the Gram–Schmidt procedure in the order $s_1,s_2,s_3$ and find an orthonormal basis. Plot the basis functions.',
         '[6 pts] Find the three signal vectors.',
         '[5 pts] Calculate the energies and the three distances.',
         '[4 pts] How many dimensions does the set need, and what shape do the three points form?'],
  sol:'<b>Given.</b> $s_1$ takes $1,1,0$, $s_2$ takes $1,0,1$ and $s_3$ takes $0,1,1$ on the unit intervals of $[0,3]$.<br>'
     +'<b>Find.</b> The basis, the vectors, the energies, the distances and the dimension.<br>'
     +'<b>Method.</b> Gram–Schmidt. Every inner product is a sum of three products over unit intervals.<br>'
     +'<b>Solution — (a).</b> $E_1=1+1=2$, so $\\psi_1=s_1/\\sqrt2$, which takes $\\tfrac{1}{\\sqrt2},\\tfrac{1}{\\sqrt2},0$.<br>'
     +'For $s_2$, $s_{21}=(1)(\\tfrac{1}{\\sqrt2})=\\tfrac{1}{\\sqrt2}$. The remainder is $g_2=s_2-\\tfrac{1}{\\sqrt2}\\psi_1=s_2-\\tfrac12 s_1$, which takes $\\tfrac12,-\\tfrac12,1$. Its energy is'
     + AL('E_{g_2}&=\\tfrac14+\\tfrac14+1','&=\\tfrac32.')
     +'So $\\psi_2=g_2/\\sqrt{3/2}$, which takes $\\tfrac{1}{\\sqrt6},-\\tfrac{1}{\\sqrt6},\\tfrac{2}{\\sqrt6}$.<br>'
     +'For $s_3$ the projections are $s_{31}=\\tfrac{1}{\\sqrt2}$ and $s_{32}=(0)(\\tfrac{1}{\\sqrt6})+(1)(-\\tfrac{1}{\\sqrt6})+(1)(\\tfrac{2}{\\sqrt6})=\\tfrac{1}{\\sqrt6}$. The remainder is'
     + AL('g_3&=s_3-\\tfrac{1}{\\sqrt2}\\psi_1-\\tfrac{1}{\\sqrt6}\\psi_2','&=(0,1,1)-\\big(\\tfrac12,\\tfrac12,0\\big)-\\big(\\tfrac16,-\\tfrac16,\\tfrac13\\big)','&=\\big(-\\tfrac23,\\tfrac23,\\tfrac23\\big),')
     +'listed by interval. Its energy is $3\\cdot\\tfrac49=\\tfrac43$, which is not zero. So $\\psi_3=g_3/\\sqrt{4/3}$ takes $-\\tfrac{1}{\\sqrt3},\\tfrac{1}{\\sqrt3},\\tfrac{1}{\\sqrt3}$.<br>'
     +'<b>Solution — (b).</b> The last coordinate of each signal is the square root of its remainder energy. So'
     + AL('\\mathbf{s}_1&=\\big(\\sqrt2,\\,0,\\,0\\big),','\\mathbf{s}_2&=\\big(\\tfrac{1}{\\sqrt2},\\,\\sqrt{3/2},\\,0\\big),','\\mathbf{s}_3&=\\big(\\tfrac{1}{\\sqrt2},\\,\\tfrac{1}{\\sqrt6},\\,\\tfrac{2}{\\sqrt3}\\big).')
     +'<b>Solution — (c).</b> $E_1=2$. $E_2=\\tfrac12+\\tfrac32=2$. $E_3=\\tfrac12+\\tfrac16+\\tfrac43=2$. For the distances,'
     + AL('d_{12}^2&=\\big(\\tfrac{1}{\\sqrt2}\\big)^2+\\tfrac32=2,','d_{13}^2&=\\big(\\tfrac{1}{\\sqrt2}\\big)^2+\\tfrac16+\\tfrac43=2,','d_{23}^2&=0+\\big(\\sqrt{3/2}-\\tfrac{1}{\\sqrt6}\\big)^2+\\tfrac43=\\tfrac23+\\tfrac43=2.')
     +'All three distances are $\\sqrt2=1.414$.<br>'
     +'<b>Solution — (d).</b> The set needs <b>three</b> dimensions, one per signal. The points are at equal distance $\\sqrt2$ from the origin and from each other. They form an equilateral triangle.<br>'
     +'<b>Check.</b> Any two waveforms differ on exactly two intervals, by $+1$ and $-1$. So each difference has energy $1+1=2$, and each distance is $\\sqrt2$.',
  figSol: () => ROW([wave([[0,2,1/R2],[2,3,0]],{T:3,name:'\\psi_1(t)',color:C.mid,yt:[0],lab:['\\frac{1}{\\sqrt2}',null]}),
                     wave([[0,1,1/R6],[1,2,-1/R6],[2,3,2/R6]],{T:3,name:'\\psi_2(t)',color:C.mid,yt:[0],lab:['\\frac{1}{\\sqrt6}','-\\frac{1}{\\sqrt6}','\\frac{2}{\\sqrt6}']}),
                     wave([[0,1,-1/R3],[1,3,1/R3]],{T:3,name:'\\psi_3(t)',color:C.mid,yt:[0],lab:['-\\frac{1}{\\sqrt3}','\\frac{1}{\\sqrt3}']})])
     + cons3([[R2,0,0,'\\mathbf{s}_1','ne'],[1/R2,Math.sqrt(1.5),0,'\\mathbf{s}_2','n'],[1/R2,1/R6,2/R3,'\\mathbf{s}_3','sw']],
             {d:[[0,1],[0,2],[1,2]],dl:[1.35,0.75,'d=\\sqrt2']}),
  err:'Stopping after two axes because "three signals in a small space" seem dependent. The remainder $g_3$ has energy $\\tfrac43$, so a third axis is needed.',
  teach:'A three-dimensional answer, drawn in oblique view. The equal distances follow from the waveforms at once, which makes a good check.' },

{ id:'D3-10', module:'M3', type:'gs', src:'MT Q3',
  stem:'Three equiprobable messages are transmitted by the waveforms shown below, with $T=4$ s. According to the information given above,',
  figure: () => ROW([wave(U([1,1,-1,-1]),{T:4,name:'s_1(t)',color:C.in}), wave(U([1,1,1,1]),{T:4,name:'s_2(t)',color:C.out}), wave(U([0,0,2,2]),{T:4,name:'s_3(t)',color:C.mid})]),
  parts:['[8 pts] Find an orthonormal basis by the Gram–Schmidt procedure in the order $s_1,s_2,s_3$. Plot the basis functions.',
         '[6 pts] Find the signal vectors and the energies.',
         '[6 pts] Calculate $\\rho_{12}$ and $\\rho_{23}$, where $\\rho_{ij}=\\langle s_i,s_j\\rangle/\\sqrt{E_iE_j}$, and all three distances.',
         '[5 pts] Draw the signal constellation, give $d_{\\min}$, and write $s_3(t)$ in terms of $s_1(t)$ and $s_2(t)$.'],
  sol:'<b>Given.</b> $s_1$ takes $1,1,-1,-1$, $s_2$ takes $1,1,1,1$ and $s_3$ takes $0,0,2,2$ on the unit intervals of $[0,4]$.<br>'
     +'<b>Find.</b> The basis, the vectors, the energies, $\\rho_{12}$, $\\rho_{23}$, the distances, $d_{\\min}$ and the relation.<br>'
     +'<b>Method.</b> Gram–Schmidt with interval sums. Correlations and distances from the vectors.<br>'
     +'<b>Solution — (a).</b> $E_1=4$, so $\\psi_1=s_1/2$ takes $\\tfrac12,\\tfrac12,-\\tfrac12,-\\tfrac12$. The projection of $s_2$ is $s_{21}=\\tfrac12+\\tfrac12-\\tfrac12-\\tfrac12=0$. '
     +'So $g_2=s_2$, with energy $4$, and $\\psi_2=s_2/2=\\tfrac12$ on $[0,4]$.<br>'
     +'For $s_3$, $s_{31}=\\int_2^4(2)(-\\tfrac12)\\,dt=-2$ and $s_{32}=\\int_2^4(2)(\\tfrac12)\\,dt=2$. The remainder $g_3=s_3+2\\psi_1-2\\psi_2=s_3+s_1-s_2$ takes $0+1-1$, $0+1-1$, $2-1-1$ and $2-1-1$. It is zero, so there is no third axis.<br>'
     +'<b>Solution — (b).</b> $\\mathbf{s}_1=(2,\\,0)$, $\\mathbf{s}_2=(0,\\,2)$ and $\\mathbf{s}_3=(-2,\\,2)$. The energies are $4$, $4$ and $8$.<br>'
     +'<b>Solution — (c).</b> $\\langle\\mathbf{s}_1,\\mathbf{s}_2\\rangle=0$, so $\\rho_{12}=0$. Also $\\langle\\mathbf{s}_2,\\mathbf{s}_3\\rangle=(0)(-2)+(2)(2)=4$, so'
     + AL('\\rho_{23}&=\\frac{4}{\\sqrt{(4)(8)}}','&=\\frac{1}{\\sqrt2}','&=0.7071.')
     +'The distances are'
     + AL('d_{12}&=\\sqrt{2^2+2^2}=2\\sqrt2=2.828,','d_{13}&=\\sqrt{4^2+2^2}=\\sqrt{20}=4.472,','d_{23}&=\\sqrt{2^2+0^2}=2.')
     +'<b>Solution — (d).</b> The points are $(2,0)$, $(0,2)$ and $(-2,2)$. So $d_{\\min}=2$, between $s_2$ and $s_3$. From part (a), $s_3=s_2-s_1$.<br>'
     +'<b>Check.</b> On the waveforms, $s_2-s_1$ takes $0,0,2,2$, which is $s_3$. The difference $s_3-s_2$ takes $-1,-1,1,1$, with energy $4$. So $d_{23}=2$.',
  figSol: () => ROW([wave([[0,2,0.5],[2,4,-0.5]],{T:4,name:'\\psi_1(t)',color:C.mid,yt:[-0.5,0,0.5]}),
                     wave([[0,4,0.5]],{T:4,name:'\\psi_2(t)',color:C.mid,yt:[0,0.5]})])
     + cons([[2,0,'\\mathbf{s}_1','n'],[0,2,'\\mathbf{s}_2','e'],[-2,2,'\\mathbf{s}_3','n']],
            {xr:[-3,3],yr:[-0.8,3],yt:[1,3],d:[[1,2]],dl:[-1,1.55,'d_{\\min}=2','middle']}),
  err:'Writing $\\rho_{23}=\\langle s_2,s_3\\rangle$ without dividing by $\\sqrt{E_2E_3}$. The correlation coefficient must lie between $-1$ and $1$, and $4$ does not.',
  teach:'The first two waveforms are orthogonal, so the Gram–Schmidt work is light. The effort goes into the correlation and the relation $s_3=s_2-s_1$.' },

{ id:'D3-11', module:'M3', type:'gs', src:'MT Q3',
  stem:'Four equiprobable symbols are transmitted by the waveforms $s_1(t)$ and $s_2(t)$ shown below and by their negatives, $s_3(t)=-s_1(t)$ and $s_4(t)=-s_2(t)$, with $T=4$ s. According to the information given above,',
  figure: () => ROW([wave(U([1,1,1,1]),{T:4,name:'s_1(t)',color:C.in}), wave(U([1,1,-1,-1]),{T:4,name:'s_2(t)',color:C.out})]),
  parts:['[8 pts] Find an orthonormal basis for the four signals by the Gram–Schmidt procedure, in the order $s_1,s_2,s_3,s_4$.',
         '[6 pts] Find the four signal vectors.',
         '[6 pts] Calculate $E_{s,av}$, the minimum distance $d_{\\min}$, and the number of nearest neighbours of each symbol.',
         '[5 pts] Draw the signal constellation and give the ratio $d_{\\min}^2/E_{s,av}$.'],
  sol:'<b>Given.</b> $s_1=1$ on $[0,4]$. $s_2=1$ on $[0,2)$ and $-1$ on $[2,4]$. $s_3=-s_1$ and $s_4=-s_2$.<br>'
     +'<b>Find.</b> The basis, the vectors, $E_{s,av}$, $d_{\\min}$, the nearest neighbours and $d_{\\min}^2/E_{s,av}$.<br>'
     +'<b>Method.</b> Gram–Schmidt. A negative of an earlier signal leaves a zero remainder.<br>'
     +'<b>Solution — (a).</b> $E_1=\\int_0^4 1\\,dt=4$, so $\\psi_1=\\tfrac12$ on $[0,4]$. The projection of $s_2$ is'
     + AL('s_{21}&=\\int_0^2\\tfrac12\\,dt-\\int_2^4\\tfrac12\\,dt','&=1-1','&=0.')
     +'So $g_2=s_2$, with energy $4$, and $\\psi_2=s_2/2$. For $s_3=-s_1$, the projection is $s_{31}=-2$ and $g_3=s_3+2\\psi_1=-s_1+s_1=0$. For $s_4=-s_2$, $s_{42}=-2$ and $g_4=0$. Two basis functions carry all four signals.<br>'
     +'<b>Solution — (b).</b> $\\mathbf{s}_1=(2,0)$, $\\mathbf{s}_2=(0,2)$, $\\mathbf{s}_3=(-2,0)$ and $\\mathbf{s}_4=(0,-2)$.<br>'
     +'<b>Solution — (c).</b> Every energy is $4$, so $E_{s,av}=4$. Neighbouring points are $\\sqrt{2^2+2^2}=2\\sqrt2$ apart. Opposite points are $4$ apart. '
     +'So $d_{\\min}=2\\sqrt2=2.828$, and each symbol has <b>two</b> nearest neighbours.<br>'
     +'<b>Solution — (d).</b> The four points form a square rotated by $45^\\circ$, on the axes at distance $2$. The ratio is'
     + AL('\\frac{d_{\\min}^2}{E_{s,av}}&=\\frac{8}{4}','&=2.')
     +'<b>Check.</b> The waveform $s_1-s_2$ is $0$ on $[0,2)$ and $2$ on $[2,4]$. Its energy is $4(2)=8$, so $d_{12}=2\\sqrt2$. The waveform $s_1-s_3=2s_1$ has energy $16$, so opposite points are $4$ apart.',
  figSol: () => ROW([wave([[0,4,0.5]],{T:4,name:'\\psi_1(t)',color:C.mid,yt:[0,0.5]}),
                     wave([[0,2,0.5],[2,4,-0.5]],{T:4,name:'\\psi_2(t)',color:C.mid,yt:[-0.5,0,0.5]})])
     + cons([[2,0,'\\mathbf{s}_1','n'],[0,2,'\\mathbf{s}_2','ne'],[-2,0,'\\mathbf{s}_3','n'],[0,-2,'\\mathbf{s}_4','se']],
            {xr:[-3,3],yr:[-3,3],xt:[-3,-1,1,3],yt:[-3,-1,1,3],d:[[0,1],[1,2],[2,3],[3,0]],dl:[1.15,1.25,'d_{\\min}=2\\sqrt2']}),
  err:'Giving each symbol three nearest neighbours because the other three are "nearby". The opposite point is $4$ away, not $2\\sqrt2$, so only two sit at $d_{\\min}$.',
  teach:'The four waveforms are a baseband version of QPSK. The nearest-neighbour count prepares the union-bound work of the next modules without asking for it.' },

{ id:'D3-12', module:'M3', type:'gs', src:'MT Q3',
  stem:'Two equiprobable messages are transmitted by the waveforms $s_0(t)$ and $s_1(t)$ shown below, with $T=3$ s. Note that $s_0(t)$ changes value at $t=1.5$ s. According to the information given above,',
  figure: () => ROW([wave([[0,1.5,2],[1.5,3,0]],{T:3,name:'s_0(t)',color:C.in,xt:[0,1.5,3]}), wave([[0,3,1]],{T:3,name:'s_1(t)',color:C.out,xt:[0,1.5,3]})]),
  parts:['[8 pts] Find an orthonormal basis by the Gram–Schmidt procedure, starting with $s_0(t)$. Plot the basis functions.',
         '[7 pts] Find the signal vectors and the energies.',
         '[5 pts] Calculate $d_{01}$ and $\\rho_{01}=\\langle s_0,s_1\\rangle/\\sqrt{E_0E_1}$.',
         '[5 pts] Draw the signal constellation and calculate $d_{01}^2/E_{s,av}$.'],
  sol:'<b>Given.</b> $s_0(t)=2$ on $[0,1.5)$ and $0$ on $[1.5,3]$. $s_1(t)=1$ on $[0,3]$.<br>'
     +'<b>Find.</b> The basis, the vectors, the energies, $d_{01}$, $\\rho_{01}$ and $d_{01}^2/E_{s,av}$.<br>'
     +'<b>Method.</b> Gram–Schmidt. The intervals now have width $1.5$, so each integral is a height times $1.5$.<br>'
     +'<b>Solution — (a).</b> The energy of $s_0$ is'
     + AL('E_0&=\\int_0^{1.5} 2^2\\,dt','&=4t\\,\\Big|_0^{1.5}','&=6.')
     +'So $\\psi_1=s_0/\\sqrt6$, which is $2/\\sqrt6=\\sqrt{2/3}$ on $[0,1.5)$. The projection of $s_1$ is'
     + AL('s_{11}&=\\int_0^{1.5}(1)\\sqrt{2/3}\\,dt','&=1.5\\sqrt{2/3}','&=\\sqrt{3/2}.')
     +'The remainder $g=s_1-\\sqrt{3/2}\\,\\psi_1$ is $1-\\sqrt{3/2}\\sqrt{2/3}=0$ on $[0,1.5)$ and $1$ on $[1.5,3]$. Its energy is $\\int_{1.5}^3 1\\,dt=1.5$. '
     +'So $\\psi_2=g/\\sqrt{1.5}$, which is $\\sqrt{2/3}$ on $[1.5,3]$.<br>'
     +'<b>Solution — (b).</b> $\\mathbf{s}_0=(\\sqrt6,\\,0)=(2.449,\\,0)$. The second coordinate of $s_1$ is $\\sqrt{E_g}=\\sqrt{3/2}$. So $\\mathbf{s}_1=(\\sqrt{3/2},\\,\\sqrt{3/2})=(1.225,\\,1.225)$. '
     +'The energies are $E_0=6$ and $E_1=\\tfrac32+\\tfrac32=3$.<br>'
     +'<b>Solution — (c).</b> The distance is'
     + AL('d_{01}^2&=\\big(\\sqrt6-\\sqrt{3/2}\\big)^2+\\big(\\sqrt{3/2}\\big)^2','&=\\tfrac32+\\tfrac32','&=3,')
     +'because $\\sqrt6-\\sqrt{3/2}=2\\sqrt{3/2}-\\sqrt{3/2}=\\sqrt{3/2}$. So $d_{01}=\\sqrt3=1.732$. The inner product is $\\sqrt6\\sqrt{3/2}=3$, so'
     + AL('\\rho_{01}&=\\frac{3}{\\sqrt{(6)(3)}}','&=\\frac{1}{\\sqrt2}','&=0.7071.')
     +'<b>Solution — (d).</b> $E_{s,av}=\\tfrac12(6+3)=4.5$, so'
     + AL('\\frac{d_{01}^2}{E_{s,av}}&=\\frac{3}{4.5}','&=0.6667.')
     +'<b>Check.</b> The difference $s_0-s_1$ is $1$ on $[0,1.5)$ and $-1$ on $[1.5,3]$. Its energy is $1(1.5)+1(1.5)=3$, so $d_{01}=\\sqrt3$. '
     +'Also $\\int_0^{1.5}(2)(1)\\,dt=3$, the inner product.',
  figSol: () => ROW([wave([[0,1.5,Math.sqrt(2/3)],[1.5,3,0]],{T:3,name:'\\psi_1(t)',color:C.mid,xt:[0,1.5,3],yt:[0],lab:['\\sqrt{2/3}',null]}),
                     wave([[0,1.5,0],[1.5,3,Math.sqrt(2/3)]],{T:3,name:'\\psi_2(t)',color:C.mid,xt:[0,1.5,3],yt:[0],lab:[null,'\\sqrt{2/3}']})])
     + cons([[R6,0,'\\mathbf{s}_0','ne'],[Math.sqrt(1.5),Math.sqrt(1.5),'\\mathbf{s}_1','n']],
            {xr:[-0.6,3.2],yr:[-0.6,2],d:[[0,1]],dl:[1.95,0.75,'d_{01}=\\sqrt3']}),
  err:'Taking the interval width as $1$ out of habit. The pieces here are $1.5$ s long, and every energy then comes out too small by a factor $1.5$.',
  teach:'The break at $1.5$ s tests whether students integrate or count boxes. The two basis functions turn out to be the two halves of the interval.' },

/* ---- carrier waveform families ------------------------------------------ */

{ id:'D3-13', module:'M3', type:'band', src:'Final Q3',
  stem: BAND('$$s_k(t)=\\sqrt{18}\\cos\\Big(4000\\pi t+\\frac{\\pi(2k-1)}{6}\\Big),\\qquad k\\in\\{1,\\ldots,6\\},\\quad 0\\le t\\le 1.$$'),
  parts: BPARTS,
  sol:'<b>Given.</b> Six waveforms of amplitude $\\sqrt{18}$ at $f_c=2000$ Hz, with phases $\\theta_k=\\pi(2k-1)/6$, on $0\\le t\\le 1$.<br>'
     +'<b>Find.</b> The basis, the vectors, the energies, $E_{s,av}$, $d_{\\min}$ and the nearest neighbours.<br>'
     +'<b>Method.</b> Every symbol is one cosine at one frequency, so two basis functions carry the set. The phase fixes the direction of each point and the amplitude its length.<br>'
     +'<b>Solution — (a).</b> ' + ORTHO('4000\\pi','8000\\pi') + '<br>'
     +'<b>Solution — (b).</b> ' + EXPAND + ' Here $A/\\sqrt2=\\sqrt{18}/\\sqrt2=3$, so $\\mathbf{s}_k=3(\\cos\\theta_k,\\sin\\theta_k)$:'
     +'$$\\begin{array}{c|cccccc}k&1&2&3&4&5&6\\\\\\hline \\theta_k&\\pi/6&\\pi/2&5\\pi/6&7\\pi/6&3\\pi/2&11\\pi/6\\\\ s_{k1}&2.598&0&-2.598&-2.598&0&2.598\\\\ s_{k2}&1.5&3&1.5&-1.5&-3&-1.5\\end{array}$$'
     +'The six points lie on a circle of radius $3$, spaced by $60^\\circ$.<br>'
     +'<b>Solution — (c).</b> Every symbol has $E_k=3^2=9$, so $E_{s,av}=9$.<br>'
     +'<b>Solution — (d).</b> Take the neighbours $\\mathbf{s}_1$ and $\\mathbf{s}_2$:'
     + AL('d_{12}^2&=(2.598-0)^2+(1.5-3)^2','&=6.75+2.25','&=9.')
     +'So $d_{\\min}=3$. Points two steps apart are $\\sqrt{(5.196)^2+0^2}=5.196$ apart, and opposite points are $6$ apart. Each symbol has <b>two</b> nearest neighbours.<br>'
     +'<b>Check.</b> Two points on a circle of radius $r$ separated by an angle $\\Delta$ are $2r\\sin(\\Delta/2)$ apart. With $r=3$ and $\\Delta=60^\\circ$, this is $2(3)(0.5)=3$. '
     +'From the waveforms, $\\int_0^1 18\\cos^2(4000\\pi t+\\theta_k)\\,dt=18/2=9$ for every $k$.',
  figSol: () => cons([[3*Math.cos(Math.PI/6),1.5,'\\mathbf{s}_1','ne'],[0,3,'\\mathbf{s}_2','ne'],[-3*Math.cos(Math.PI/6),1.5,'\\mathbf{s}_3','nw'],
                      [-3*Math.cos(Math.PI/6),-1.5,'\\mathbf{s}_4','sw'],[0,-3,'\\mathbf{s}_5','e'],[3*Math.cos(Math.PI/6),-1.5,'\\mathbf{s}_6','se']],
                     {xr:[-4.2,4.2],yr:[-4,4],ring:3,d:[[0,1]],dl:[1.9,3.15,'d_{\\min}=3'],w:520,h:460}),
  err:'Using the amplitude $\\sqrt{18}$ as the radius of the circle. The coordinates are $A/\\sqrt2$, because the basis functions carry the factor $\\sqrt2$.',
  teach:'This is the examination family with a new amplitude, frequency and phase offset. Part (a) is the orthonormality proof that the examination leaves implicit.' },

{ id:'D3-14', module:'M3', type:'band', src:'Final Q3',
  stem: BAND('$$\\begin{aligned}s_1(t)&=0,\\\\ s_2(t)&=3\\sqrt2\\cos(6000\\pi t),\\\\ s_3(t)&=3\\sqrt2\\cos\\Big(6000\\pi t+\\frac{\\pi}{2}\\Big),\\\\ s_4(t)&=6\\cos\\Big(6000\\pi t+\\frac{\\pi}{4}\\Big),\\end{aligned}\\qquad 0\\le t\\le 1.$$'),
  parts:['[8 pts] Find an orthonormal basis for the signal set and show that it is orthonormal.',
         '[7 pts] Find the four signal vectors and draw the signal constellation.',
         '[5 pts] Calculate the symbol energies and $E_{s,av}$.',
         '[5 pts] Determine $d_{\\min}$, the number of nearest neighbours of each symbol, and $d_{\\min}^2/E_{s,av}$.'],
  sol:'<b>Given.</b> One zero waveform and three cosines at $f_c=3000$ Hz, on $0\\le t\\le 1$.<br>'
     +'<b>Find.</b> The basis, the vectors, the energies, $E_{s,av}$, $d_{\\min}$, the nearest neighbours and $d_{\\min}^2/E_{s,av}$.<br>'
     +'<b>Method.</b> All non-zero symbols are cosines at one frequency. Write each against the in-phase and quadrature basis.<br>'
     +'<b>Solution — (a).</b> ' + ORTHO('6000\\pi','12000\\pi') + '<br>'
     +'<b>Solution — (b).</b> ' + EXPAND + ' The vectors are'
     + AL('\\mathbf{s}_1&=(0,\\,0),','\\mathbf{s}_2&=\\tfrac{3\\sqrt2}{\\sqrt2}(\\cos0,\\sin0)=(3,\\,0),','\\mathbf{s}_3&=3\\big(\\cos\\tfrac{\\pi}{2},\\sin\\tfrac{\\pi}{2}\\big)=(0,\\,3),','\\mathbf{s}_4&=\\tfrac{6}{\\sqrt2}\\big(\\cos\\tfrac{\\pi}{4},\\sin\\tfrac{\\pi}{4}\\big)=(3,\\,3).')
     +'The four points are the corners of a square of side $3$, with one corner at the origin.<br>'
     +'<b>Solution — (c).</b> $E_1=0$, $E_2=E_3=9$ and $E_4=9+9=18$. So'
     + AL('E_{s,av}&=\\tfrac14(0+9+9+18)','&=9.')
     +'<b>Solution — (d).</b> The sides of the square are $3$ and the diagonals are $3\\sqrt2=4.243$. So $d_{\\min}=3$. Each symbol has <b>two</b> nearest neighbours, the two corners next to it. The ratio is $d_{\\min}^2/E_{s,av}=9/9=1$.<br>'
     +'<b>Check.</b> Compute $s_4-s_2$ as a waveform. $6\\cos(x+\\pi/4)=3\\sqrt2\\cos x-3\\sqrt2\\sin x$, so $s_4-s_2=-3\\sqrt2\\sin(6000\\pi t)$. '
     +'Its energy is $(3\\sqrt2)^2/2=9$, so $d_{24}=3$.',
  figSol: () => cons([[0,0,'\\mathbf{s}_1','sw'],[3,0,'\\mathbf{s}_2','ne'],[0,3,'\\mathbf{s}_3','ne'],[3,3,'\\mathbf{s}_4','ne']],
                     {xr:[-1.2,4.2],yr:[-1.2,4.2],d:[[0,1],[1,3],[3,2],[2,0]],dl:[3.1,1.5,'d_{\\min}=3'],w:480,h:440}),
  err:'Placing $\\mathbf{s}_3$ at $(0,-3)$ from $\\cos(x+\\pi/2)=-\\sin x$. With $\\psi_2=-\\sqrt2\\sin x$, the waveform $-3\\sqrt2\\sin x$ is $+3\\psi_2$.',
  teach:'Same shape as the examination set: a zero symbol, an in-phase symbol and two phase-shifted ones. Here they close into a square, so every symbol has two neighbours.' },

{ id:'D3-15', module:'M3', type:'band', src:'Final Q3',
  stem: BAND('$$s_k(t)=(2k-5)\\sqrt2\\cos(5000\\pi t),\\qquad k\\in\\{1,2,3,4\\},\\quad 0\\le t\\le 1.$$'),
  parts:['[8 pts] Show that one basis function is enough for this set. Give it and show that it has unit energy.',
         '[7 pts] Find the signal coordinates and draw the signal constellation.',
         '[5 pts] Calculate the symbol energies and $E_{s,av}$.',
         '[5 pts] Determine $d_{\\min}$, the number of nearest neighbours of each symbol, and their average.'],
  sol:'<b>Given.</b> Four scaled copies of one cosine at $f_c=2500$ Hz, with amplitudes $(2k-5)\\sqrt2=-3\\sqrt2,-\\sqrt2,\\sqrt2,3\\sqrt2$.<br>'
     +'<b>Find.</b> The basis, the coordinates, the energies, $E_{s,av}$, $d_{\\min}$ and the nearest neighbours.<br>'
     +'<b>Method.</b> Every symbol is a multiple of the same waveform, so one normalised copy of it is the whole basis.<br>'
     +'<b>Solution — (a).</b> Take $\\psi(t)=\\sqrt2\\cos(5000\\pi t)$. Then $s_k(t)=(2k-5)\\psi(t)$, so every symbol lies on one axis. Its energy is'
     + AL('\\int_0^1\\psi^2\\,dt&=\\int_0^1\\big[1+\\cos(10000\\pi t)\\big]\\,dt','&=\\Big[t+\\frac{\\sin(10000\\pi t)}{10000\\pi}\\Big]_0^1','&=1+0','&=1.')
     +'<b>Solution — (b).</b> The coordinates are $s_k=2k-5$, which gives $-3,-1,1,3$. The constellation is four equally spaced points on the $\\psi$ axis.<br>'
     +'<b>Solution — (c).</b> The energies are $9,1,1,9$, so'
     + AL('E_{s,av}&=\\tfrac14(9+1+1+9)','&=5.')
     +'<b>Solution — (d).</b> Neighbouring points are $2$ apart, so $d_{\\min}=2$. The two outer symbols have one nearest neighbour each. The two inner symbols have two each. The average is $(1+2+2+1)/4=1.5$.<br>'
     +'<b>Check.</b> The waveform $s_2-s_1=2\\sqrt2\\cos(5000\\pi t)$ has energy $(2\\sqrt2)^2/2=4$, so $d_{12}=2$. From the waveform, $E_4=(3\\sqrt2)^2/2=9$.',
  figSol: () => cons([[-3,0,'\\mathbf{s}_1','n'],[-1,0,'\\mathbf{s}_2','n'],[1,0,'\\mathbf{s}_3','n'],[3,0,'\\mathbf{s}_4','n']],
                     {xr:[-4,4.2],yr:[-0.6,1.3],oneD:true,xl:'\\psi',d:[[1,2]],dl:[0,0.9,'d_{\\min}=2','middle'],w:560,h:200}),
  err:'Taking the coordinates as the amplitudes $(2k-5)\\sqrt2$. The basis function already contains $\\sqrt2$, so the coordinates are $2k-5$.',
  teach:'A one-dimensional member of the examination family. The average number of nearest neighbours, $1.5$, is the number a union bound would use later.' },

{ id:'D3-16', module:'M3', type:'band', src:'Final Q3',
  stem: BAND('$$s_k(t)=2\\cos\\Big(2000\\pi t+\\frac{k\\pi}{4}\\Big),\\qquad k\\in\\{0,1,\\ldots,7\\},\\quad 0\\le t\\le 1.$$'),
  parts:['[8 pts] Find an orthonormal basis for the signal set and show that it is orthonormal.',
         '[7 pts] Find the signal vectors and draw the signal constellation.',
         '[5 pts] Calculate $E_{s,av}$ and the minimum distance $d_{\\min}$.',
         '[5 pts] Give the number of nearest neighbours of each symbol and the ratio $d_{\\min}^2/E_{s,av}$.'],
  sol:'<b>Given.</b> Eight cosines of amplitude $2$ at $f_c=1000$ Hz, with phases $k\\pi/4$.<br>'
     +'<b>Find.</b> The basis, the vectors, $E_{s,av}$, $d_{\\min}$, the nearest neighbours and $d_{\\min}^2/E_{s,av}$.<br>'
     +'<b>Method.</b> In-phase and quadrature basis, then read the points off a circle.<br>'
     +'<b>Solution — (a).</b> ' + ORTHO('2000\\pi','4000\\pi') + '<br>'
     +'<b>Solution — (b).</b> ' + EXPAND + ' Here $A/\\sqrt2=\\sqrt2$, so $\\mathbf{s}_k=\\sqrt2\\big(\\cos\\tfrac{k\\pi}{4},\\sin\\tfrac{k\\pi}{4}\\big)$. '
     +'That gives $(\\sqrt2,0)$, $(1,1)$, $(0,\\sqrt2)$, $(-1,1)$, $(-\\sqrt2,0)$, $(-1,-1)$, $(0,-\\sqrt2)$ and $(1,-1)$ for $k=0,\\ldots,7$.<br>'
     +'<b>Solution — (c).</b> Every symbol has $E_k=2$, so $E_{s,av}=2$. For the neighbours $\\mathbf{s}_0$ and $\\mathbf{s}_1$,'
     + AL('d_{01}^2&=(\\sqrt2-1)^2+(0-1)^2','&=(3-2\\sqrt2)+1','&=4-2\\sqrt2','&=1.172.')
     +'So $d_{\\min}=\\sqrt{4-2\\sqrt2}=1.082$.<br>'
     +'<b>Solution — (d).</b> Each symbol has <b>two</b> nearest neighbours, the points $45^\\circ$ away on either side. The ratio is'
     + AL('\\frac{d_{\\min}^2}{E_{s,av}}&=\\frac{4-2\\sqrt2}{2}','&=2-\\sqrt2','&=0.5858.')
     +'<b>Check.</b> On a circle of radius $\\sqrt2$, points $45^\\circ$ apart are $2\\sqrt2\\sin(22.5^\\circ)=2(1.4142)(0.38268)=1.082$ apart. That matches $d_{\\min}$.',
  figSol: () => cons([[R2,0,'\\mathbf{s}_0','ne'],[1,1,'\\mathbf{s}_1','ne'],[0,R2,'\\mathbf{s}_2','ne'],[-1,1,'\\mathbf{s}_3','nw'],
                      [-R2,0,'\\mathbf{s}_4','nw'],[-1,-1,'\\mathbf{s}_5','sw'],[0,-R2,'\\mathbf{s}_6','se'],[1,-1,'\\mathbf{s}_7','se']],
                     {xr:[-2.2,2.2],yr:[-2.2,2.2],xs:0.5,ys:0.5,ring:R2,d:[[0,1]],dl:[1.5,0.7,'d_{\\min}=1.082'],w:500,h:470}),
  err:'Taking $d_{\\min}$ as the arc length $\\sqrt2\\cdot\\pi/4=1.111$. Distance in signal space is the straight chord, $2r\\sin(\\Delta/2)$.',
  teach:'Eight-phase keying with clean coordinates: the diagonal points land on $(\\pm1,\\pm1)$. Compare $d_{\\min}^2/E_{s,av}=0.586$ with $2$ for four phases.' },

{ id:'D3-17', module:'M3', type:'band', src:'Final Q3',
  stem: BAND('$$s_k(t)=\\sqrt{10}\\cos\\Big(6000\\pi t+\\frac{(2k-1)\\pi}{4}\\Big),\\qquad k\\in\\{1,2,3,4\\},\\quad 0\\le t\\le 1.$$'),
  parts:['[8 pts] Find an orthonormal basis for the signal set and show that it is orthonormal.',
         '[7 pts] Find the signal vectors and draw the signal constellation.',
         '[5 pts] Calculate $E_{s,av}$.',
         '[5 pts] Determine $d_{\\min}$, the number of nearest neighbours, and the largest distance between two symbols.'],
  sol:'<b>Given.</b> Four cosines of amplitude $\\sqrt{10}$ at $f_c=3000$ Hz, with phases $\\pi/4$, $3\\pi/4$, $5\\pi/4$ and $7\\pi/4$.<br>'
     +'<b>Find.</b> The basis, the vectors, $E_{s,av}$, $d_{\\min}$, the nearest neighbours and the largest distance.<br>'
     +'<b>Method.</b> In-phase and quadrature basis. Each phase is an odd multiple of $45^\\circ$, so the points sit on the diagonals.<br>'
     +'<b>Solution — (a).</b> ' + ORTHO('6000\\pi','12000\\pi') + '<br>'
     +'<b>Solution — (b).</b> ' + EXPAND + ' Here $A/\\sqrt2=\\sqrt5$ and $\\cos\\theta_k,\\sin\\theta_k=\\pm\\tfrac{1}{\\sqrt2}$. So each coordinate is $\\pm\\sqrt5/\\sqrt2=\\pm1.581$:'
     +'$$\\mathbf{s}_1=(1.581,1.581),\\ \\mathbf{s}_2=(-1.581,1.581),\\ \\mathbf{s}_3=(-1.581,-1.581),\\ \\mathbf{s}_4=(1.581,-1.581).$$<br>'
     +'<b>Solution — (c).</b> Every symbol has $E_k=A^2/2=10/2=5$, so $E_{s,av}=5$.<br>'
     +'<b>Solution — (d).</b> Neighbours differ in one coordinate by $2(1.581)=3.162$. So $d_{\\min}=\\sqrt{10}=3.162$, and each symbol has <b>two</b> nearest neighbours. Opposite symbols are'
     + AL('d_{13}&=\\sqrt{(3.162)^2+(3.162)^2}','&=\\sqrt{20}','&=4.472')
     +'apart, which is $2\\sqrt{E_{s,av}}$.<br>'
     +'<b>Check.</b> $s_3(t)=-s_1(t)$, so $s_1-s_3=2s_1$ has energy $4(5)=20$ and $d_{13}=\\sqrt{20}$. For neighbours, $d_{\\min}^2=2E_{s,av}=10$.',
  figSol: () => { const c=Math.sqrt(2.5);
    return cons([[c,c,'\\mathbf{s}_1','ne'],[-c,c,'\\mathbf{s}_2','nw'],[-c,-c,'\\mathbf{s}_3','sw'],[c,-c,'\\mathbf{s}_4','se']],
                {xr:[-2.8,2.8],yr:[-2.8,2.8],ring:Math.sqrt(5),d:[[0,1]],dl:[0.15,1.05,'d_{\\min}=\\sqrt{10}'],w:480,h:460}); },
  err:'Reporting $d_{\\min}=\\sqrt5$, the radius. The radius is $\\sqrt{E_s}$. The distance between neighbours on a square of that radius is $\\sqrt2$ times larger.',
  teach:'Four-phase keying written with a phase offset of $45^\\circ$. The largest distance ties back to the antipodal pair.' },

{ id:'D3-18', module:'M3', type:'band', src:'Final Q3',
  stem: BAND('$$s_{m,n}(t)=\\sqrt2\\,\\big[(2m-5)\\cos(4000\\pi t)-(2n-5)\\sin(4000\\pi t)\\big],\\qquad m,n\\in\\{1,2,3,4\\},\\quad 0\\le t\\le 1.$$'),
  parts:['[8 pts] Find an orthonormal basis for the signal set and show that it is orthonormal.',
         '[6 pts] Find the signal vector of $s_{m,n}$ and draw the signal constellation.',
         '[6 pts] Calculate the symbol energies that occur and $E_{s,av}$.',
         '[5 pts] Determine $d_{\\min}$ and the number of nearest neighbours of a corner, an edge and an inner symbol. Give the average.'],
  sol:'<b>Given.</b> Sixteen symbols, each a combination of $\\cos(4000\\pi t)$ and $\\sin(4000\\pi t)$ with weights from $\\{-3,-1,1,3\\}$.<br>'
     +'<b>Find.</b> The basis, the vectors, the energies, $E_{s,av}$, $d_{\\min}$ and the nearest neighbours.<br>'
     +'<b>Method.</b> The waveform is already written against the in-phase and quadrature functions. Read the coordinates off directly.<br>'
     +'<b>Solution — (a).</b> ' + ORTHO('4000\\pi','8000\\pi') + '<br>'
     +'<b>Solution — (b).</b> $s_{m,n}(t)=(2m-5)\\psi_1(t)+(2n-5)\\psi_2(t)$. So $\\mathbf{s}_{m,n}=(2m-5,\\,2n-5)$. The points form a $4\\times4$ square grid with coordinates $-3,-1,1,3$ on each axis.<br>'
     +'<b>Solution — (c).</b> The energy is $E_{m,n}=(2m-5)^2+(2n-5)^2$. Four inner points have $1+1=2$. Eight edge points have $9+1=10$. Four corners have $9+9=18$. So'
     + AL('E_{s,av}&=\\tfrac{1}{16}\\big[4(2)+8(10)+4(18)\\big]','&=\\tfrac{1}{16}(8+80+72)','&=10.')
     +'<b>Solution — (d).</b> Neighbouring grid points are $2$ apart, so $d_{\\min}=2$. A corner has $2$ nearest neighbours, an edge point $3$ and an inner point $4$. The average is'
     + AL('\\bar N&=\\tfrac{1}{16}\\big[4(2)+8(3)+4(4)\\big]','&=\\tfrac{48}{16}','&=3.')
     +'<b>Check.</b> The average energy separates into two axes. Each coordinate takes $\\pm1,\\pm3$ equally often, with mean square $(1+9)/2=5$. Two axes give $E_{s,av}=2(5)=10$.',
  figSol: () => { const pts=[]; for(let m=1;m<=4;m++) for(let n=1;n<=4;n++){
      const l = (m===1&&n===1)?'\\mathbf{s}_{1,1}':(m===4&&n===4)?'\\mathbf{s}_{4,4}':(m===2&&n===3)?'\\mathbf{s}_{2,3}':null;
      pts.push([2*m-5,2*n-5,l,(m===1&&n===1)?'sw':(m===4&&n===4)?'ne':'nw']); }
    return cons(pts,{xr:[-4.4,4.4],yr:[-4.4,4.4],d:[[11,15]],dl:[2,3.3,'d_{\\min}=2','middle'],w:500,h:480}); },
  err:'Giving every symbol four nearest neighbours. Only the four inner points have four. Edge points have three and corners two, so the average is $3$.',
  teach:'Sixteen-point quadrature amplitude modulation, read directly from its formula. The check shows that the average energy splits across the two axes.' },

{ id:'D3-19', module:'M3', type:'band', src:'Final Q3',
  stem: BAND('$$s_k(t)=\\begin{cases}2\\sqrt2\\cos\\Big(2000\\pi t+\\dfrac{(k-1)\\pi}{2}\\Big), & k\\in\\{1,2,3,4\\},\\\\[6pt] 4\\cos\\Big(2000\\pi t+\\dfrac{(2k-9)\\pi}{4}\\Big), & k\\in\\{5,6,7,8\\},\\end{cases}\\qquad 0\\le t\\le 1.$$'),
  parts: BPARTS,
  sol:'<b>Given.</b> Eight cosines at $f_c=1000$ Hz. Four have amplitude $2\\sqrt2$ and phases $0,\\tfrac{\\pi}{2},\\pi,\\tfrac{3\\pi}{2}$. Four have amplitude $4$ and phases $\\tfrac{\\pi}{4},\\tfrac{3\\pi}{4},\\tfrac{5\\pi}{4},\\tfrac{7\\pi}{4}$.<br>'
     +'<b>Find.</b> The basis, the vectors, the energies, $E_{s,av}$, $d_{\\min}$ and the nearest neighbours.<br>'
     +'<b>Method.</b> In-phase and quadrature basis. Two amplitudes give two rings of points.<br>'
     +'<b>Solution — (a).</b> ' + ORTHO('2000\\pi','4000\\pi') + '<br>'
     +'<b>Solution — (b).</b> ' + EXPAND + ' For $k\\le4$, $A/\\sqrt2=2$, which gives $(2,0)$, $(0,2)$, $(-2,0)$ and $(0,-2)$. '
     +'For $k\\ge5$, $A/\\sqrt2=2\\sqrt2$ at odd multiples of $45^\\circ$, which gives $(2,2)$, $(-2,2)$, $(-2,-2)$ and $(2,-2)$. '
     +'The eight points are a $3\\times3$ grid of spacing $2$ with the centre missing.<br>'
     +'<b>Solution — (c).</b> The inner symbols have $E_k=(2\\sqrt2)^2/2=4$. The outer symbols have $E_k=4^2/2=8$. So'
     + AL('E_{s,av}&=\\tfrac18\\big[4(4)+4(8)\\big]','&=6.')
     +'<b>Solution — (d).</b> The candidate distances are'
     + AL('\\|(2,0)-(2,2)\\|&=2,','\\|(2,0)-(0,2)\\|&=2\\sqrt2=2.828,','\\|(2,2)-(-2,2)\\|&=4.')
     +'So $d_{\\min}=2$. Each inner symbol has <b>two</b> nearest neighbours, the outer corners on either side. Each outer symbol also has two, the inner points next to it.<br>'
     +'<b>Check.</b> Compute $s_5-s_1$ as a waveform. $4\\cos(x+\\pi/4)=2\\sqrt2\\cos x-2\\sqrt2\\sin x$, so $s_5-s_1=-2\\sqrt2\\sin(2000\\pi t)$. '
     +'Its energy is $(2\\sqrt2)^2/2=4$, so $d_{15}=2$.',
  figSol: () => cons([[2,0,'\\mathbf{s}_1','ne'],[0,2,'\\mathbf{s}_2','ne'],[-2,0,'\\mathbf{s}_3','nw'],[0,-2,'\\mathbf{s}_4','se'],
                      [2,2,'\\mathbf{s}_5','ne'],[-2,2,'\\mathbf{s}_6','nw'],[-2,-2,'\\mathbf{s}_7','sw'],[2,-2,'\\mathbf{s}_8','se']],
                     {xr:[-3.3,3.3],yr:[-3.3,3.3],xt:[-3,-1,1,3],d:[[0,4],[0,7]],dl:[2.15,1.1,'d_{\\min}=2'],w:500,h:470}),
  err:'Taking $d_{\\min}=2\\sqrt2$, the spacing within the inner ring. The closest pairs are one inner and one outer point, $2$ apart.',
  teach:'Two rings of four, offset by $45^\\circ$, land on a square grid. The minimum distance is found between the rings, not within either.' },

{ id:'D3-20', module:'M3', type:'band', src:'Final Q3',
  stem: BAND('$$s_1(t)=0,\\qquad s_k(t)=2\\sqrt2\\cos\\Big(2000\\pi t+\\frac{2\\pi(k-2)}{3}\\Big),\\quad k\\in\\{2,3,4\\},\\qquad 0\\le t\\le 1.$$'),
  parts:['[8 pts] Find an orthonormal basis for the signal set and show that it is orthonormal.',
         '[7 pts] Find the four signal vectors and draw the signal constellation.',
         '[5 pts] Calculate the symbol energies and $E_{s,av}$.',
         '[5 pts] Determine $d_{\\min}$, the number of nearest neighbours of each symbol, and $d_{\\min}^2/E_{s,av}$.'],
  sol:'<b>Given.</b> A zero symbol and three cosines of amplitude $2\\sqrt2$ at $f_c=1000$ Hz, with phases $0$, $2\\pi/3$ and $4\\pi/3$.<br>'
     +'<b>Find.</b> The basis, the vectors, the energies, $E_{s,av}$, $d_{\\min}$, the nearest neighbours and $d_{\\min}^2/E_{s,av}$.<br>'
     +'<b>Method.</b> In-phase and quadrature basis. The zero symbol sits at the origin.<br>'
     +'<b>Solution — (a).</b> ' + ORTHO('2000\\pi','4000\\pi') + '<br>'
     +'<b>Solution — (b).</b> ' + EXPAND + ' Here $A/\\sqrt2=2$. So'
     + AL('\\mathbf{s}_1&=(0,\\,0),','\\mathbf{s}_2&=2(\\cos0,\\sin0)=(2,\\,0),','\\mathbf{s}_3&=2\\big(\\cos\\tfrac{2\\pi}{3},\\sin\\tfrac{2\\pi}{3}\\big)=(-1,\\,\\sqrt3),','\\mathbf{s}_4&=2\\big(\\cos\\tfrac{4\\pi}{3},\\sin\\tfrac{4\\pi}{3}\\big)=(-1,\\,-\\sqrt3).')
     +'The three non-zero points form an equilateral triangle around the origin.<br>'
     +'<b>Solution — (c).</b> $E_1=0$ and $E_2=E_3=E_4=4$. So $E_{s,av}=\\tfrac14(0+4+4+4)=3$.<br>'
     +'<b>Solution — (d).</b> The origin is $2$ from each outer point. Two outer points are'
     + AL('d_{23}&=\\sqrt{(2+1)^2+(0-\\sqrt3)^2}','&=\\sqrt{12}','&=3.464')
     +'apart. So $d_{\\min}=2$. $\\mathbf{s}_1$ has <b>three</b> nearest neighbours and each outer symbol has <b>one</b>. The ratio is $d_{\\min}^2/E_{s,av}=4/3=1.333$.<br>'
     +'<b>Check.</b> Points on a circle of radius $2$ that are $120^\\circ$ apart are $2(2)\\sin60^\\circ=2\\sqrt3=3.464$ apart. From the waveform, $\\int_0^1 8\\cos^2(2000\\pi t)\\,dt=4$, so $E_2=4$.',
  figSol: () => cons([[0,0,'\\mathbf{s}_1','se'],[2,0,'\\mathbf{s}_2','ne'],[-1,R3,'\\mathbf{s}_3','nw'],[-1,-R3,'\\mathbf{s}_4','sw']],
                     {xr:[-2.6,3],yr:[-2.6,2.6],ring:2,d:[[0,1],[0,2],[0,3]],dl:[0.55,-0.95,'d_{\\min}=2'],w:480,h:460}),
  err:'Counting only the outer points and giving $d_{\\min}=2\\sqrt3$. The zero symbol is a point of the constellation, and it is the closest to all the others.',
  teach:'Like the examination set, this one contains a zero symbol. It makes the nearest-neighbour count unequal: three for the origin, one for each outer point.' },

{ id:'D3-21', module:'M3', type:'band', src:'Final Q3',
  stem: BAND('$$\\begin{aligned}s_1(t)&=3\\sqrt2\\cos(2000\\pi t), & s_3(t)&=-s_1(t),\\\\ s_2(t)&=3\\sqrt2\\cos(3000\\pi t), & s_4(t)&=-s_2(t),\\end{aligned}\\qquad 0\\le t\\le 1.$$'),
  parts:['[8 pts] Show that $\\psi_1(t)=\\sqrt2\\cos(2000\\pi t)$ and $\\psi_2(t)=\\sqrt2\\cos(3000\\pi t)$ form an orthonormal basis for the set.',
         '[7 pts] Find the signal vectors and draw the signal constellation.',
         '[5 pts] Calculate the symbol energies and $E_{s,av}$.',
         '[5 pts] Determine $d_{\\min}$ and the number of nearest neighbours of each symbol.'],
  sol:'<b>Given.</b> Two cosines of amplitude $3\\sqrt2$ at $1000$ Hz and $1500$ Hz, and their negatives, on $0\\le t\\le 1$.<br>'
     +'<b>Find.</b> The orthonormality of the basis, the vectors, the energies, $E_{s,av}$, $d_{\\min}$ and the nearest neighbours.<br>'
     +'<b>Method.</b> Here the two axes are two frequencies, not two phases. Each inner product becomes a sum of cosines by $2\\cos a\\cos b=\\cos(a-b)+\\cos(a+b)$.<br>'
     +'<b>Solution — (a).</b> The energy of $\\psi_1$ is'
     + AL('\\int_0^1 2\\cos^2(2000\\pi t)\\,dt&=\\Big[t+\\frac{\\sin(4000\\pi t)}{4000\\pi}\\Big]_0^1','&=1.')
     +'The energy of $\\psi_2$ is'
     + AL('\\int_0^1 2\\cos^2(3000\\pi t)\\,dt&=\\Big[t+\\frac{\\sin(6000\\pi t)}{6000\\pi}\\Big]_0^1','&=1.')
     +'The inner product is'
     + AL('\\int_0^1\\psi_1\\psi_2\\,dt&=\\int_0^1\\big[\\cos(1000\\pi t)+\\cos(5000\\pi t)\\big]\\,dt','&=\\Big[\\frac{\\sin(1000\\pi t)}{1000\\pi}+\\frac{\\sin(5000\\pi t)}{5000\\pi}\\Big]_0^1','&=0.')
     +'Every sine above is evaluated at a whole multiple of $\\pi$, so it is zero. The pair is orthonormal. Since $s_1=3\\psi_1$ and $s_2=3\\psi_2$, it is a basis for the set.<br>'
     +'<b>Solution — (b).</b> $\\mathbf{s}_1=(3,0)$, $\\mathbf{s}_2=(0,3)$, $\\mathbf{s}_3=(-3,0)$ and $\\mathbf{s}_4=(0,-3)$. The points sit on the two axes, one on each half-axis.<br>'
     +'<b>Solution — (c).</b> Every symbol has $E_k=9$, so $E_{s,av}=9$.<br>'
     +'<b>Solution — (d).</b> Points on different axes are $\\sqrt{3^2+3^2}=3\\sqrt2=4.243$ apart. Opposite points are $6$ apart. So $d_{\\min}=3\\sqrt2$, and each symbol has <b>two</b> nearest neighbours.<br>'
     +'<b>Check.</b> The waveforms $s_1$ and $s_2$ are orthogonal, so the energy of $s_1-s_2$ is $E_1+E_2=18$. That gives $d_{12}=\\sqrt{18}=4.243$.',
  figSol: () => cons([[3,0,'\\mathbf{s}_1','ne'],[0,3,'\\mathbf{s}_2','ne'],[-3,0,'\\mathbf{s}_3','nw'],[0,-3,'\\mathbf{s}_4','se']],
                     {xr:[-4,4],yr:[-4,4],d:[[0,1]],dl:[1.75,1.9,'d_{\\min}=3\\sqrt2'],w:480,h:460}),
  err:'Using the in-phase and quadrature basis at one frequency. These symbols use two frequencies, so each frequency needs its own axis.',
  teach:'A creative turn on the family: the second axis is a second frequency. The geometry is the same square as four-phase keying, rotated by $45^\\circ$.' },

{ id:'D3-22', module:'M3', type:'band', src:'Final Q3',
  stem: BAND('$$s_k(t)=(3k-6)\\sqrt2\\cos(2500\\pi t),\\qquad k\\in\\{0,1,2,3,4\\},\\quad 0\\le t\\le 1.$$'),
  parts:['[8 pts] Find a basis for the signal set, show that it has unit energy, and state the number of dimensions.',
         '[7 pts] Find the signal coordinates and draw the signal constellation.',
         '[5 pts] Calculate the symbol energies and $E_{s,av}$.',
         '[5 pts] Determine $d_{\\min}$, the number of nearest neighbours of each symbol, and $d_{\\min}^2/E_{s,av}$.'],
  sol:'<b>Given.</b> Five multiples of $\\sqrt2\\cos(2500\\pi t)$ with factors $3k-6=-6,-3,0,3,6$, so $f_c=1250$ Hz.<br>'
     +'<b>Find.</b> The basis, the coordinates, the energies, $E_{s,av}$, $d_{\\min}$, the nearest neighbours and $d_{\\min}^2/E_{s,av}$.<br>'
     +'<b>Method.</b> All symbols are multiples of one waveform, so the set is one-dimensional.<br>'
     +'<b>Solution — (a).</b> Take $\\psi(t)=\\sqrt2\\cos(2500\\pi t)$. Its energy is'
     + AL('\\int_0^1\\psi^2\\,dt&=\\int_0^1\\big[1+\\cos(5000\\pi t)\\big]\\,dt','&=\\Big[t+\\frac{\\sin(5000\\pi t)}{5000\\pi}\\Big]_0^1','&=1,')
     +'because $\\sin(5000\\pi)=0$. Every symbol is $(3k-6)\\psi(t)$, so the set needs <b>one</b> dimension.<br>'
     +'<b>Solution — (b).</b> The coordinates are $-6,-3,0,3,6$. The constellation is five equally spaced points on the $\\psi$ axis, one of them at the origin.<br>'
     +'<b>Solution — (c).</b> The energies are $36,9,0,9,36$. So'
     + AL('E_{s,av}&=\\tfrac15(36+9+0+9+36)','&=\\tfrac{90}{5}','&=18.')
     +'<b>Solution — (d).</b> Neighbours are $3$ apart, so $d_{\\min}=3$. The two outer symbols have one nearest neighbour, the three inner symbols two. The ratio is $d_{\\min}^2/E_{s,av}=9/18=0.5$.<br>'
     +'<b>Check.</b> The waveform $s_1-s_0=3\\sqrt2\\cos(2500\\pi t)$ has energy $(3\\sqrt2)^2/2=9$, so $d_{01}=3$. From the waveform, $E_4=(6\\sqrt2)^2/2=36$.',
  figSol: () => cons([[-6,0,'\\mathbf{s}_0','n'],[-3,0,'\\mathbf{s}_1','n'],[0,0,'\\mathbf{s}_2','n'],[3,0,'\\mathbf{s}_3','n'],[6,0,'\\mathbf{s}_4','n']],
                     {xr:[-7.5,7.5],yr:[-0.6,1.3],oneD:true,xl:'\\psi',xs:3,d:[[3,4]],dl:[4.5,0.9,'d_{\\min}=3','middle'],w:560,h:200}),
  err:'Leaving the zero symbol out of $E_{s,av}$ and dividing $90$ by $4$. The zero symbol is sent as often as any other, so the sum is divided by $5$.',
  teach:'The examination set with three levels, extended to five. The zero symbol stays in the average energy, which is the usual slip.' },

{ id:'D3-23', module:'M3', type:'band', src:'Final Q3',
  stem: BAND('$$s_{m,n}(t)=\\sqrt2\\,\\big[(2m-5)\\cos(2000\\pi t)-(2n-3)\\sin(2000\\pi t)\\big],\\qquad m\\in\\{1,2,3,4\\},\\ n\\in\\{1,2\\},\\quad 0\\le t\\le 1.$$'),
  parts:['[8 pts] Find an orthonormal basis for the signal set and show that it is orthonormal.',
         '[6 pts] Find the signal vectors and draw the signal constellation.',
         '[5 pts] Calculate the symbol energies and $E_{s,av}$.',
         '[6 pts] Determine $d_{\\min}$ and the number of nearest neighbours of each symbol. Give the average.'],
  sol:'<b>Given.</b> Eight symbols, each a combination of $\\cos(2000\\pi t)$ and $\\sin(2000\\pi t)$. The cosine weight is from $\\{-3,-1,1,3\\}$ and the sine weight from $\\{-1,1\\}$.<br>'
     +'<b>Find.</b> The basis, the vectors, the energies, $E_{s,av}$, $d_{\\min}$ and the nearest neighbours.<br>'
     +'<b>Method.</b> The waveforms are written against the in-phase and quadrature functions. Read the coordinates off directly.<br>'
     +'<b>Solution — (a).</b> ' + ORTHO('2000\\pi','4000\\pi') + '<br>'
     +'<b>Solution — (b).</b> $s_{m,n}(t)=(2m-5)\\psi_1(t)+(2n-3)\\psi_2(t)$. So $\\mathbf{s}_{m,n}=(2m-5,\\,2n-3)$. The points form a $4\\times2$ grid: first coordinates $-3,-1,1,3$ and second coordinates $-1,1$.<br>'
     +'<b>Solution — (c).</b> The four inner points $(\\pm1,\\pm1)$ have energy $2$. The four outer points $(\\pm3,\\pm1)$ have energy $9+1=10$. So'
     + AL('E_{s,av}&=\\tfrac18\\big[4(2)+4(10)\\big]','&=6.')
     +'<b>Solution — (d).</b> Neighbouring grid points are $2$ apart, so $d_{\\min}=2$. An inner point has three nearest neighbours: one across, one above or below, and one outer point. An outer point has two. The average is'
     + AL('\\bar N&=\\tfrac18\\big[4(3)+4(2)\\big]','&=2.5.')
     +'<b>Check.</b> $\\mathbf{s}_{2,1}-\\mathbf{s}_{1,1}=(2,0)$, so $s_{2,1}-s_{1,1}=2\\sqrt2\\cos(2000\\pi t)$. Its energy is $(2\\sqrt2)^2/2=4$, so the distance is $2$.',
  figSol: () => { const pts=[]; for(let m=1;m<=4;m++) for(let n=1;n<=2;n++) pts.push([2*m-5,2*n-3,'\\mathbf{s}_{'+m+','+n+'}',n===2?'n':'s']);
    return cons(pts,{xr:[-4.2,4.2],yr:[-2.4,2.4],d:[[1,3]],dl:[-2,0.45,'d_{\\min}=2','middle'],w:540,h:360}); },
  err:'Giving every inner point four nearest neighbours as in a square grid. This grid has only two rows, so an inner point has nothing above or below on one side.',
  teach:'A rectangular eight-point set. The unequal neighbour counts, $3$ and $2$, are the point of part (d).' },

{ id:'D3-24', module:'M3', type:'band', src:'Final Q3',
  stem: BAND('$$s_k(t)=k\\sqrt2\\cos\\Big(3000\\pi t+\\frac{k\\pi}{2}\\Big),\\qquad k\\in\\{1,2,3,4\\},\\quad 0\\le t\\le 1.$$'),
  parts:['[8 pts] Find an orthonormal basis for the signal set and show that it is orthonormal.',
         '[7 pts] Find the four signal vectors and draw the signal constellation.',
         '[4 pts] Calculate the symbol energies and $E_{s,av}$.',
         '[6 pts] Calculate all six distances, $d_{\\min}$, and the number of nearest neighbours of each symbol.'],
  sol:'<b>Given.</b> Four cosines at $f_c=1500$ Hz. Symbol $k$ has amplitude $k\\sqrt2$ and phase $k\\pi/2$.<br>'
     +'<b>Find.</b> The basis, the vectors, the energies, $E_{s,av}$, the distances, $d_{\\min}$ and the nearest neighbours.<br>'
     +'<b>Method.</b> In-phase and quadrature basis. The amplitude grows while the phase turns, so the points trace a spiral.<br>'
     +'<b>Solution — (a).</b> ' + ORTHO('3000\\pi','6000\\pi') + '<br>'
     +'<b>Solution — (b).</b> ' + EXPAND + ' Here $A/\\sqrt2=k$, so $\\mathbf{s}_k=k\\big(\\cos\\tfrac{k\\pi}{2},\\sin\\tfrac{k\\pi}{2}\\big)$:'
     +'$$\\mathbf{s}_1=(0,1),\\quad \\mathbf{s}_2=(-2,0),\\quad \\mathbf{s}_3=(0,-3),\\quad \\mathbf{s}_4=(4,0).$$<br>'
     +'<b>Solution — (c).</b> $E_k=k^2$, which gives $1,4,9,16$. So $E_{s,av}=\\tfrac14(1+4+9+16)=7.5$.<br>'
     +'<b>Solution — (d).</b> The six distances are'
     + AL('d_{12}&=\\sqrt{4+1}=2.236, & d_{13}&=4, & d_{14}&=\\sqrt{16+1}=4.123,','d_{23}&=\\sqrt{4+9}=3.606, & d_{24}&=6, & d_{34}&=\\sqrt{16+9}=5.')
     +'So $d_{\\min}=\\sqrt5=2.236$, between $s_1$ and $s_2$. Symbols $s_1$ and $s_2$ have one nearest neighbour each. Symbols $s_3$ and $s_4$ have none at $d_{\\min}$.<br>'
     +'<b>Check.</b> $s_1$ and $s_2$ are $90^\\circ$ apart in phase, so their waveforms are orthogonal. The energy of $s_1-s_2$ is then $E_1+E_2=1+4=5$, so $d_{12}=\\sqrt5$.',
  figSol: () => cons([[0,1,'\\mathbf{s}_1','ne'],[-2,0,'\\mathbf{s}_2','nw'],[0,-3,'\\mathbf{s}_3','e'],[4,0,'\\mathbf{s}_4','ne']],
                     {xr:[-3,5],yr:[-4,2.5],yt:[-4,-3,-2,-1,2],d:[[0,1]],dl:[-1.2,0.95,'d_{\\min}=\\sqrt5','end'],w:520,h:440}),
  err:'Assuming every symbol has the same number of nearest neighbours. Here only one pair sits at $d_{\\min}$, so two symbols have one neighbour and two have none.',
  teach:'A creative member of the family with unequal energies. Students must list all six distances, which is the honest way to find $d_{\\min}$ in an irregular set.' },

/* ---- reversed and comparison questions ---------------------------------- */

{ id:'D3-25', module:'M3', type:'reverse', src:'MT Q3 (variant)',
  stem:'A signal set is built on the two basis functions $\\psi_1(t)$ and $\\psi_2(t)$ shown below, with $T=4$ s. '
      +'The four equiprobable symbols have the signal vectors $\\mathbf{s}_1=(2,2)$, $\\mathbf{s}_2=(2,-2)$, $\\mathbf{s}_3=(-2,-2)$ and $\\mathbf{s}_4=(-2,2)$. According to the information given above,',
  figure: () => ROW([wave([[0,4,0.5]],{T:4,name:'\\psi_1(t)',color:C.mid,yt:[0,0.5]}),
                     wave([[0,2,0.5],[2,4,-0.5]],{T:4,name:'\\psi_2(t)',color:C.mid,yt:[-0.5,0,0.5]})]),
  parts:['[6 pts] Show that $\\psi_1(t)$ and $\\psi_2(t)$ are orthonormal.',
         '[8 pts] Write the four waveforms $s_1(t),\\ldots,s_4(t)$ and sketch them.',
         '[6 pts] Calculate the energy of each waveform from its sketch, and $E_{s,av}$.',
         '[5 pts] Determine $d_{\\min}$ and the number of nearest neighbours. Which pairs of waveforms are orthogonal?'],
  sol:'<b>Given.</b> $\\psi_1=\\tfrac12$ on $[0,4]$. $\\psi_2=\\tfrac12$ on $[0,2)$ and $-\\tfrac12$ on $[2,4]$. Four vectors at the corners of a square.<br>'
     +'<b>Find.</b> Orthonormality, the waveforms, the energies, $E_{s,av}$, $d_{\\min}$, the nearest neighbours and the orthogonal pairs.<br>'
     +'<b>Method.</b> Synthesis: $s_i(t)=s_{i1}\\psi_1(t)+s_{i2}\\psi_2(t)$, added interval by interval.<br>'
     +'<b>Solution — (a).</b> The three integrals are'
     + AL('\\int_0^4\\psi_1^2\\,dt&=\\tfrac14 t\\,\\Big|_0^4=1,','\\int_0^4\\psi_2^2\\,dt&=\\tfrac14 t\\,\\Big|_0^2+\\tfrac14 t\\,\\Big|_2^4=\\tfrac12+\\tfrac12=1,','\\int_0^4\\psi_1\\psi_2\\,dt&=\\tfrac14 t\\,\\Big|_0^2-\\tfrac14 t\\,\\Big|_2^4=\\tfrac12-\\tfrac12=0.')
     +'So the pair is orthonormal.<br>'
     +'<b>Solution — (b).</b> On $[0,2)$, $\\psi_1=\\psi_2=\\tfrac12$. On $[2,4]$, $\\psi_1=\\tfrac12$ and $\\psi_2=-\\tfrac12$. So'
     + AL('s_1&=2\\psi_1+2\\psi_2: & &2\\ \\text{on }[0,2), & &0\\ \\text{on }[2,4],','s_2&=2\\psi_1-2\\psi_2: & &0\\ \\text{on }[0,2), & &2\\ \\text{on }[2,4],','s_3&=-2\\psi_1-2\\psi_2: & &{-2}\\ \\text{on }[0,2), & &0\\ \\text{on }[2,4],','s_4&=-2\\psi_1+2\\psi_2: & &0\\ \\text{on }[0,2), & &{-2}\\ \\text{on }[2,4].')
     +'Each symbol is a pulse of height $\\pm2$ on one half of the interval.<br>'
     +'<b>Solution — (c).</b> Each pulse has energy $\\int 2^2\\,dt$ over a width of $2$, which is $8$. The vectors agree: $2^2+2^2=8$. So $E_{s,av}=8$.<br>'
     +'<b>Solution — (d).</b> Neighbouring corners differ in one coordinate by $4$, so $d_{\\min}=4$. Opposite corners are $4\\sqrt2=5.657$ apart. Each symbol has <b>two</b> nearest neighbours. '
     +'The inner product of neighbours is zero, for example $\\langle\\mathbf{s}_1,\\mathbf{s}_2\\rangle=4-4=0$. So the orthogonal pairs are $(s_1,s_2)$, $(s_2,s_3)$, $(s_3,s_4)$ and $(s_4,s_1)$.<br>'
     +'<b>Check.</b> $s_1$ and $s_2$ are pulses on different halves, so their product is zero everywhere. The difference $s_1-s_2$ is $2$ on $[0,2)$ and $-2$ on $[2,4]$. Its energy is $4(2)+4(2)=16$, so $d_{12}=4$.',
  figSol: () => ROW([wave([[0,2,2],[2,4,0]],{T:4,name:'s_1(t)',color:C.in}), wave([[0,2,0],[2,4,2]],{T:4,name:'s_2(t)',color:C.in}),
                     wave([[0,2,-2],[2,4,0]],{T:4,name:'s_3(t)',color:C.in}), wave([[0,2,0],[2,4,-2]],{T:4,name:'s_4(t)',color:C.in})], 2)
     + cons([[2,2,'\\mathbf{s}_1','ne'],[2,-2,'\\mathbf{s}_2','se'],[-2,-2,'\\mathbf{s}_3','sw'],[-2,2,'\\mathbf{s}_4','nw']],
            {xr:[-3.2,3.2],yr:[-3.2,3.2],xt:[-3,-1,1,3],d:[[0,1]],dl:[2.15,0.45,'d_{\\min}=4'],w:460,h:440}),
  err:'Adding the coordinates as heights, so that $s_1=2+2=4$ on $[0,2)$. Each coordinate multiplies a basis function of height $\\tfrac12$, so the height is $2(\\tfrac12)+2(\\tfrac12)=2$.',
  teach:'The midterm question run backwards: the geometry is given and the drawing is asked for. The four symbols turn out to be two orthogonal pulses and their negatives.' },

{ id:'D3-26', module:'M3', type:'reverse', src:'Final Q3 (variant)',
  stem:'An $M$-ary modulation scheme uses the basis $\\psi_1(t)=\\sqrt2\\cos(4000\\pi t)$ and $\\psi_2(t)=-\\sqrt2\\sin(4000\\pi t)$ on $0\\le t\\le 1$, which is orthonormal. '
      +'Its eight equiprobable symbols form the constellation below. According to the information given above,',
  figure: () => cons([[1,1,'\\mathbf{s}_1','ne'],[-1,1,'\\mathbf{s}_2','nw'],[-1,-1,'\\mathbf{s}_3','sw'],[1,-1,'\\mathbf{s}_4','se'],
                      [3,0,'\\mathbf{s}_5','ne'],[0,3,'\\mathbf{s}_6','ne'],[-3,0,'\\mathbf{s}_7','nw'],[0,-3,'\\mathbf{s}_8','se']],
                     {xr:[-4,4],yr:[-4,4],w:460,h:440}),
  parts:['[10 pts] Write each waveform in the form $s_k(t)=A_k\\cos(4000\\pi t+\\theta_k)$.',
         '[5 pts] Calculate the symbol energies from the waveforms, and $E_{s,av}$.',
         '[5 pts] Determine $d_{\\min}$ and the number of nearest neighbours of each symbol.',
         '[5 pts] An eight-phase set with the same $E_{s,av}$ is proposed. Which of the two sets has the larger $d_{\\min}$?'],
  sol:'<b>Given.</b> The points $(\\pm1,\\pm1)$ and $(\\pm3,0)$, $(0,\\pm3)$, and the in-phase and quadrature basis at $f_c=2000$ Hz.<br>'
     +'<b>Find.</b> $A_k$ and $\\theta_k$, the energies, $E_{s,av}$, $d_{\\min}$, the nearest neighbours and a comparison with eight-phase keying.<br>'
     +'<b>Method.</b> Synthesis, then the identity $\\cos(x+\\theta)=\\cos\\theta\\cos x-\\sin\\theta\\sin x$ read backwards.<br>'
     +'<b>Solution — (a).</b> Write the point as $(r\\cos\\theta,\\,r\\sin\\theta)$. Then'
     + AL('s(t)&=r\\cos\\theta\\,\\psi_1(t)+r\\sin\\theta\\,\\psi_2(t)','&=\\sqrt2\\,r\\big[\\cos\\theta\\cos(4000\\pi t)-\\sin\\theta\\sin(4000\\pi t)\\big]','&=\\sqrt2\\,r\\cos(4000\\pi t+\\theta).')
     +'So $A_k=\\sqrt2\\,r_k$. The inner points have $r=\\sqrt2$, so $A=2$, with $\\theta=\\tfrac{\\pi}{4},\\tfrac{3\\pi}{4},\\tfrac{5\\pi}{4},\\tfrac{7\\pi}{4}$ for $k=1,2,3,4$. '
     +'The outer points have $r=3$, so $A=3\\sqrt2$, with $\\theta=0,\\tfrac{\\pi}{2},\\pi,\\tfrac{3\\pi}{2}$ for $k=5,6,7,8$.<br>'
     +'<b>Solution — (b).</b> A cosine of amplitude $A$ on $[0,1]$ has energy $A^2/2$. So the inner symbols have $4/2=2$ and the outer symbols $18/2=9$. Then'
     + AL('E_{s,av}&=\\tfrac18\\big[4(2)+4(9)\\big]','&=\\tfrac{44}{8}','&=5.5.')
     +'<b>Solution — (c).</b> The candidate distances are'
     + AL('\\|(1,1)-(-1,1)\\|&=2,','\\|(1,1)-(3,0)\\|&=\\sqrt{4+1}=2.236,','\\|(3,0)-(0,3)\\|&=3\\sqrt2=4.243.')
     +'So $d_{\\min}=2$. Each inner symbol has <b>two</b> nearest neighbours in the inner square. The outer symbols have none at $d_{\\min}$, since their closest points are $2.236$ away.<br>'
     +'<b>Solution — (d).</b> Eight phases at energy $5.5$ lie on a circle of radius $\\sqrt{5.5}=2.345$, spaced by $45^\\circ$. Their minimum distance is'
     + AL('d_{\\min}&=2\\sqrt{5.5}\\,\\sin(22.5^\\circ)','&=2(2.345)(0.3827)','&=1.795.')
     +'So the given set has the larger minimum distance, $2$ against $1.795$.<br>'
     +'<b>Check.</b> The vectors give the same energies: $1^2+1^2=2$ and $3^2=9$. The waveform $s_1-s_2$ equals $2\\psi_1$, because the two points differ only in the first coordinate. Its energy is $4$, so $d_{12}=2$.',
  figSol: () => cons([[1,1,'\\mathbf{s}_1','ne'],[-1,1,'\\mathbf{s}_2','nw'],[-1,-1,'\\mathbf{s}_3','sw'],[1,-1,'\\mathbf{s}_4','se'],
                      [3,0,'\\mathbf{s}_5','ne'],[0,3,'\\mathbf{s}_6','ne'],[-3,0,'\\mathbf{s}_7','nw'],[0,-3,'\\mathbf{s}_8','se']],
                     {xr:[-4,4],yr:[-4,4],xt:[-4,-3,-2,2,3,4],yt:[-4,-3,-2,2,3,4],d:[[0,1],[1,2],[2,3],[3,0]],dl:[1.15,0.45,'d_{\\min}=2'],w:460,h:440}),
  err:'Writing $A_k=r_k$, the distance from the origin. The basis functions have amplitude $\\sqrt2$, so the waveform amplitude is $\\sqrt2\\,r_k$.',
  teach:'The final question run backwards. Part (d) compares two designs by distance at equal average energy, which is the geometric content of a later error-probability comparison.' },

{ id:'D3-27', module:'M3', type:'dim', src:'MT Q3 (variant)',
  stem:'Four equiprobable messages are transmitted by the waveforms shown below, with $T=4$ s. According to the information given above,',
  figure: () => ROW([wave(U([2,2,0,0]),{T:4,name:'s_1(t)',color:C.in}), wave(U([0,0,2,2]),{T:4,name:'s_2(t)',color:C.out}),
                     wave(U([1,1,1,1]),{T:4,name:'s_3(t)',color:C.mid}), wave(U([3,3,-1,-1]),{T:4,name:'s_4(t)',color:C.h})], 2),
  parts:['[8 pts] Apply the Gram–Schmidt procedure in the order $s_1,s_2,s_3,s_4$. How many basis functions does the set need?',
         '[6 pts] Find the four signal vectors and the energies.',
         '[6 pts] Determine $d_{\\min}$ and the number of nearest neighbours of each symbol.',
         '[5 pts] Draw the constellation, give $E_{s,av}$, and write $s_3(t)$ and $s_4(t)$ in terms of $s_1(t)$ and $s_2(t)$.'],
  sol:'<b>Given.</b> On the unit intervals, $s_1$ takes $2,2,0,0$, $s_2$ takes $0,0,2,2$, $s_3$ takes $1,1,1,1$ and $s_4$ takes $3,3,-1,-1$.<br>'
     +'<b>Find.</b> The basis, its size, the vectors, the energies, $d_{\\min}$, the nearest neighbours, $E_{s,av}$ and the two relations.<br>'
     +'<b>Method.</b> Gram–Schmidt. Every waveform is constant on $[0,2)$ and on $[2,4]$, which suggests two axes at most.<br>'
     +'<b>Solution — (a).</b> $E_1=\\int_0^2 4\\,dt=8$, so $\\psi_1=1/\\sqrt2$ on $[0,2)$. $s_2$ does not overlap $\\psi_1$, so $s_{21}=0$, $g_2=s_2$ and $\\psi_2=1/\\sqrt2$ on $[2,4]$.<br>'
     +'For $s_3$, $s_{31}=\\int_0^2\\tfrac{1}{\\sqrt2}\\,dt=\\sqrt2$ and $s_{32}=\\sqrt2$. The remainder $g_3=s_3-\\sqrt2\\psi_1-\\sqrt2\\psi_2$ is $1-1=0$ on both halves.<br>'
     +'For $s_4$, the projections are'
     + AL('s_{41}&=\\int_0^2\\frac{3}{\\sqrt2}\\,dt=3\\sqrt2,','s_{42}&=\\int_2^4\\frac{-1}{\\sqrt2}\\,dt=-\\sqrt2.')
     +'The remainder $g_4=s_4-3\\sqrt2\\psi_1+\\sqrt2\\psi_2$ is $3-3=0$ on $[0,2)$ and $-1+1=0$ on $[2,4]$. So <b>two</b> basis functions carry all four signals.<br>'
     +'<b>Solution — (b).</b> The vectors are'
     +'$$\\mathbf{s}_1=(2\\sqrt2,0),\\ \\mathbf{s}_2=(0,2\\sqrt2),\\ \\mathbf{s}_3=(\\sqrt2,\\sqrt2),\\ \\mathbf{s}_4=(3\\sqrt2,-\\sqrt2).$$'
     +'The energies are $8$, $8$, $4$ and $18+2=20$.<br>'
     +'<b>Solution — (c).</b> Each of the pairs $(s_1,s_3)$, $(s_2,s_3)$ and $(s_1,s_4)$ differs by $(\\pm\\sqrt2,\\mp\\sqrt2)$. So each is $\\sqrt{2+2}=2$ apart. The other distances are'
     + AL('d_{12}&=\\sqrt{8+8}=4,','d_{34}&=\\sqrt{8+8}=4,','d_{24}&=\\sqrt{18+18}=6.')
     +'So $d_{\\min}=2$. $s_1$ and $s_3$ have two nearest neighbours. $s_2$ and $s_4$ have one.<br>'
     +'<b>Solution — (d).</b> The four points lie on the line $\\psi_1+\\psi_2=2\\sqrt2$, equally spaced by $2$, in the order $s_2,s_3,s_1,s_4$. Then $E_{s,av}=\\tfrac14(8+8+4+20)=10$. '
     +'From the vectors, $s_3=\\tfrac12(s_1+s_2)$ and $s_4=\\tfrac32 s_1-\\tfrac12 s_2$.<br>'
     +'<b>Check.</b> On the waveforms, $\\tfrac32 s_1-\\tfrac12 s_2$ takes $3,3,-1,-1$, which is $s_4$. The difference $s_4-s_1$ takes $1,1,-1,-1$, with energy $4$, so $d_{14}=2$.',
  figSol: () => ROW([wave([[0,2,1/R2],[2,4,0]],{T:4,name:'\\psi_1(t)',color:C.mid,yt:[0],lab:['\\frac{1}{\\sqrt2}',null]}),
                     wave([[0,2,0],[2,4,1/R2]],{T:4,name:'\\psi_2(t)',color:C.mid,yt:[0],lab:[null,'\\frac{1}{\\sqrt2}']})])
     + cons([[2*R2,0,'\\mathbf{s}_1','ne'],[0,2*R2,'\\mathbf{s}_2','ne'],[R2,R2,'\\mathbf{s}_3','ne'],[3*R2,-R2,'\\mathbf{s}_4','ne']],
            {xr:[-0.8,5],yr:[-2.2,3.6],xt:[1,2,4,5],d:[[1,2],[2,0],[0,3]],dl:[1.1,0.75,'d_{\\min}=2','end'],w:500,h:470}),
  err:'Concluding from four waveforms that four axes are needed. Every waveform is constant on each half of the interval, so two axes, one per half, are enough.',
  teach:'Four signals in two dimensions, equally spaced on a line that misses the origin. It is four-level amplitude signalling shifted off the origin, which costs energy.' },

{ id:'D3-28', module:'M3', type:'dim', src:'Final Q3 (variant)',
  stem:'Consider an $M$-ary modulation scheme where the equiprobable symbols have the following waveforms:'
      +'$$s_k(t)=2(2k-5)\\cos\\Big(2000\\pi t+\\frac{\\pi}{3}\\Big),\\qquad k\\in\\{1,2,3,4\\},\\quad 0\\le t\\le 1.$$'
      +'The functions $\\psi_1(t)=\\sqrt2\\cos(2000\\pi t)$ and $\\psi_2(t)=-\\sqrt2\\sin(2000\\pi t)$ are orthonormal on this interval. According to the information given above,',
  parts:['[8 pts] Find the signal vectors against $\\psi_1$ and $\\psi_2$, and draw the constellation.',
         '[7 pts] Show that the set needs only one dimension. Give a single unit-energy basis function $\\phi(t)$ and the coordinates against it.',
         '[5 pts] Calculate the symbol energies and $E_{s,av}$.',
         '[5 pts] Determine $d_{\\min}$ and the number of nearest neighbours, in both descriptions.'],
  sol:'<b>Given.</b> Four multiples of one cosine at $1000$ Hz with phase $\\pi/3$. The amplitudes are $2(2k-5)=-6,-2,2,6$.<br>'
     +'<b>Find.</b> The two-axis vectors, a one-axis basis, the coordinates, the energies, $E_{s,av}$, $d_{\\min}$ and the nearest neighbours.<br>'
     +'<b>Method.</b> Expand each symbol against $\\psi_1,\\psi_2$. Then notice that all four vectors point along one direction.<br>'
     +'<b>Solution — (a).</b> ' + EXPAND + ' Here $A/\\sqrt2=\\sqrt2(2k-5)$ and $\\theta=\\pi/3$, with $\\cos\\tfrac{\\pi}{3}=\\tfrac12$ and $\\sin\\tfrac{\\pi}{3}=\\tfrac{\\sqrt3}{2}$. So'
     + AL('\\mathbf{s}_k&=\\sqrt2(2k-5)\\big(\\tfrac12,\\,\\tfrac{\\sqrt3}{2}\\big)','&=(2k-5)\\,(0.7071,\\;1.2247).')
     +'This gives $(-2.121,-3.674)$, $(-0.707,-1.225)$, $(0.707,1.225)$ and $(2.121,3.674)$. All four lie on the line through the origin at $60^\\circ$.<br>'
     +'<b>Solution — (b).</b> Take $\\phi(t)=\\sqrt2\\cos(2000\\pi t+\\pi/3)$. Its energy is'
     + AL('\\int_0^1\\phi^2\\,dt&=\\int_0^1\\Big[1+\\cos\\Big(4000\\pi t+\\frac{2\\pi}{3}\\Big)\\Big]dt','&=\\Big[t+\\frac{\\sin(4000\\pi t+2\\pi/3)}{4000\\pi}\\Big]_0^1','&=1+\\frac{\\sin(4000\\pi+2\\pi/3)-\\sin(2\\pi/3)}{4000\\pi}','&=1,')
     +'because adding $4000\\pi$ does not change a sine. Every symbol is $s_k=\\sqrt2(2k-5)\\,\\phi(t)$, so one dimension is enough. The coordinates are $\\sqrt2(2k-5)$, which gives $-4.243,-1.414,1.414,4.243$.<br>'
     +'<b>Solution — (c).</b> The energies are $2(2k-5)^2$, which gives $18,2,2,18$. So $E_{s,av}=\\tfrac14(18+2+2+18)=10$.<br>'
     +'<b>Solution — (d).</b> On the $\\phi$ axis, neighbours are $2\\sqrt2=2.828$ apart. In the plane, $\\mathbf{s}_3-\\mathbf{s}_2=(1.414,\\,2.449)$, so'
     + AL('d_{23}^2&=2+6','&=8.')
     +'Both descriptions give $d_{\\min}=2\\sqrt2=2.828$. The outer symbols have one nearest neighbour and the inner symbols two.<br>'
     +'<b>Check.</b> The waveform $s_3-s_2=4\\cos(2000\\pi t+\\pi/3)$ has energy $4^2/2=8$. So $d_{23}=\\sqrt8=2.828$, independent of any basis.',
  figSol: () => { const u=[1/R2,R3/R2]; const pts=[1,2,3,4].map(k=>[(2*k-5)*u[0],(2*k-5)*u[1],'\\mathbf{s}_'+k,k<3?'w':'e']);
    return cons(pts,{xr:[-3,3.4],yr:[-4.4,4.4],d:[[1,2]],dl:[-0.25,0.2,'d_{\\min}=2\\sqrt2','end'],w:440,h:500}); },
  err:'Counting two dimensions because the set is written with a cosine and a sine. The phase is the same for every symbol, so all points lie on one line through the origin.',
  teach:'The four-level amplitude set, rotated by $60^\\circ$. The in-phase and quadrature basis works but wastes an axis. Gram–Schmidt would find the single axis directly.' },

{ id:'D3-29', module:'M3', type:'compare', src:'MT Q3 (variant)',
  stem:'Two equiprobable messages are transmitted by the waveforms $s_1(t)$ and $s_2(t)$ shown below, with $T=3$ s. According to the information given above,',
  figure: () => ROW([wave(U([1,1,1]),{T:3,name:'s_1(t)',color:C.in}), wave(U([2,0,0]),{T:3,name:'s_2(t)',color:C.out})]),
  parts:['[8 pts] Apply the Gram–Schmidt procedure starting with $s_1(t)$. Give the basis $\\{\\psi_1,\\psi_2\\}$ and the two signal vectors.',
         '[8 pts] Apply it again starting with $s_2(t)$. Give the basis $\\{\\phi_1,\\phi_2\\}$ and the two signal vectors.',
         '[5 pts] In each basis, calculate $E_1$, $E_2$, $d_{12}$ and $\\rho_{12}=\\langle\\mathbf{s}_1,\\mathbf{s}_2\\rangle/\\sqrt{E_1E_2}$.',
         '[4 pts] Draw both constellations. State what changed between them and what did not.'],
  sol:'<b>Given.</b> $s_1=1$ on $[0,3]$. $s_2=2$ on $[0,1)$ and $0$ on $[1,3]$.<br>'
     +'<b>Find.</b> Two bases, the vectors in each, and the energies, distance and correlation in each.<br>'
     +'<b>Method.</b> Run Gram–Schmidt twice. Then compare the numbers the two runs produce.<br>'
     +'<b>Solution — (a).</b> $E_1=3$, so $\\psi_1=1/\\sqrt3$ on $[0,3]$. The projection of $s_2$ is $s_{21}=\\int_0^1\\tfrac{2}{\\sqrt3}\\,dt=\\tfrac{2}{\\sqrt3}$. '
     +'The remainder $g=s_2-\\tfrac{2}{\\sqrt3}\\psi_1=s_2-\\tfrac23$ takes $\\tfrac43,-\\tfrac23,-\\tfrac23$. Its energy is'
     + AL('E_g&=\\tfrac{16}{9}+\\tfrac49+\\tfrac49','&=\\tfrac{8}{3}.')
     +'So $\\psi_2=g/\\sqrt{8/3}$, which takes $\\tfrac{2}{\\sqrt6},-\\tfrac{1}{\\sqrt6},-\\tfrac{1}{\\sqrt6}$. The vectors are $\\mathbf{s}_1=(\\sqrt3,\\,0)=(1.732,0)$ and $\\mathbf{s}_2=\\big(\\tfrac{2}{\\sqrt3},\\sqrt{8/3}\\big)=(1.155,\\,1.633)$.<br>'
     +'<b>Solution — (b).</b> $E_2=\\int_0^1 4\\,dt=4$, so $\\phi_1=s_2/2=1$ on $[0,1)$. The projection of $s_1$ is $\\int_0^1(1)(1)\\,dt=1$. '
     +'The remainder $s_1-\\phi_1$ is $0$ on $[0,1)$ and $1$ on $[1,3]$, with energy $2$. So $\\phi_2=1/\\sqrt2$ on $[1,3]$. The vectors are $\\mathbf{s}_1=(1,\\,\\sqrt2)$ and $\\mathbf{s}_2=(2,\\,0)$.<br>'
     +'<b>Solution — (c).</b> In the first basis,'
     + AL('E_1&=3,\\quad E_2=\\tfrac43+\\tfrac83=4,','d_{12}^2&=\\big(\\sqrt3-\\tfrac{2}{\\sqrt3}\\big)^2+\\tfrac83=\\tfrac13+\\tfrac83=3,','\\langle\\mathbf{s}_1,\\mathbf{s}_2\\rangle&=\\sqrt3\\cdot\\tfrac{2}{\\sqrt3}=2.')
     +'In the second basis,'
     + AL('E_1&=1+2=3,\\quad E_2=4,','d_{12}^2&=(1-2)^2+(\\sqrt2)^2=3,','\\langle\\mathbf{s}_1,\\mathbf{s}_2\\rangle&=(1)(2)=2.')
     +'Both give $d_{12}=\\sqrt3=1.732$ and $\\rho_{12}=2/\\sqrt{12}=0.5774$.<br>'
     +'<b>Solution — (d).</b> The axes and the coordinates changed. The two constellations are the same pair of points turned about the origin. Energies, the distance and the correlation did not change.<br>'
     +'<b>Check.</b> From the waveforms, $s_1-s_2$ takes $-1,1,1$, with energy $3$. The inner product is $\\int_0^1(1)(2)\\,dt=2$. Neither depends on a basis.',
  figSol: () => ROW([wave([[0,3,1/R3]],{T:3,name:'\\psi_1(t)',color:C.mid,yt:[0],lab:['\\frac{1}{\\sqrt3}']}),
                     wave([[0,1,2/R6],[1,3,-1/R6]],{T:3,name:'\\psi_2(t)',color:C.mid,yt:[0],lab:['\\frac{2}{\\sqrt6}','-\\frac{1}{\\sqrt6}']}),
                     wave([[0,1,1],[1,3,0]],{T:3,name:'\\phi_1(t)',color:C.mid,yt:[0,1]}),
                     wave([[0,1,0],[1,3,1/R2]],{T:3,name:'\\phi_2(t)',color:C.mid,yt:[0],lab:[null,'\\frac{1}{\\sqrt2}']})], 2)
     + ROW([cons([[R3,0,'\\mathbf{s}_1','ne'],[2/R3,Math.sqrt(8/3),'\\mathbf{s}_2','ne']],{xr:[-0.6,2.6],yr:[-0.6,2.2],d:[[0,1]],dl:[1.5,0.95,'\\sqrt3'],w:420,h:360}),
            cons([[1,R2,'\\mathbf{s}_1','ne'],[2,0,'\\mathbf{s}_2','ne']],{xr:[-0.6,2.6],yr:[-0.6,2.2],xl:'\\phi_1',yl:'\\phi_2',d:[[0,1]],dl:[1.6,0.85,'\\sqrt3'],w:420,h:360})]),
  err:'Concluding that the order was wrong because the coordinates differ. Any order is correct. Only the quantities that do not depend on the axes can be compared.',
  teach:'This is the order remark of the Gram–Schmidt scene turned into a question. The numbers $3$, $4$, $\\sqrt3$ and $2$ reappear in both runs.' },

{ id:'D3-30', module:'M3', type:'compare', src:'MT Q3 (variant)',
  stem:'Three binary designs are proposed for two equiprobable messages on $[0,T]$, with $T=4$ s. Each design uses the pair of waveforms in one column below. According to the information given above,',
  figure: () => ROW([wave(U([1,1,1,1]),{T:4,name:'\\text{A: }s_0(t)',color:C.in}), wave(U([1,1,1,1]),{T:4,name:'\\text{B: }s_0(t)',color:C.in}), wave(U([0,0,0,0]),{T:4,name:'\\text{C: }s_0(t)',color:C.in,yr:[-0.5,2.4]}),
                     wave(U([-1,-1,-1,-1]),{T:4,name:'\\text{A: }s_1(t)',color:C.out}), wave(U([1,1,-1,-1]),{T:4,name:'\\text{B: }s_1(t)',color:C.out}), wave(U([2,2,0,0]),{T:4,name:'\\text{C: }s_1(t)',color:C.out})], 3),
  parts:['[6 pts] Find an orthonormal basis for each design and give its number of dimensions.',
         '[6 pts] Find the signal vectors and $E_{s,av}$ of each design.',
         '[6 pts] Calculate the distance $d_{01}$ of each design.',
         '[7 pts] Compare the designs by $d_{01}^2/E_{s,av}$. By how many decibels does the best design exceed the others?'],
  sol:'<b>Given.</b> Design A: $s_0=1$ on $[0,4]$ and $s_1=-s_0$. Design B: the same $s_0$, and $s_1=1$ on $[0,2)$, $-1$ on $[2,4]$. Design C: $s_0=0$, and $s_1=2$ on $[0,2)$.<br>'
     +'<b>Find.</b> The bases, the vectors, $E_{s,av}$, $d_{01}$ and the comparison.<br>'
     +'<b>Method.</b> Gram–Schmidt for each pair. Designs are fair to compare only at the same average energy, so compare $d_{01}^2/E_{s,av}$.<br>'
     +'<b>Solution — (a).</b> A: $E_0=4$, so $\\psi=s_0/2=\\tfrac12$ on $[0,4]$. $s_1=-2\\psi$ leaves no remainder, so A is <b>one</b>-dimensional. '
     +'B: the same $\\psi_1$. The projection of $s_1$ is $\\tfrac12(1+1-1-1)=0$, so $\\psi_2=s_1/2$ and B is <b>two</b>-dimensional. '
     +'C: the zero waveform adds nothing. $E_1=\\int_0^2 4\\,dt=8$, so $\\psi=s_1/\\sqrt8=1/\\sqrt2$ on $[0,2)$. C is <b>one</b>-dimensional.<br>'
     +'<b>Solution — (b).</b> A: $s_0=2$, $s_1=-2$, and $E_{s,av}=\\tfrac12(4+4)=4$. B: $\\mathbf{s}_0=(2,0)$, $\\mathbf{s}_1=(0,2)$, and $E_{s,av}=4$. C: $s_0=0$, $s_1=2\\sqrt2$, and $E_{s,av}=\\tfrac12(0+8)=4$.<br>'
     +'<b>Solution — (c).</b> A: $d_{01}=2-(-2)=4$. B: $d_{01}=\\sqrt{2^2+2^2}=2\\sqrt2$. C: $d_{01}=2\\sqrt2$.<br>'
     +'<b>Solution — (d).</b> The ratios are $16/4=4$ for A and $8/4=2$ for B and C. A is best, by a factor of $2$ in squared distance:'
     + AL('10\\log_{10}\\frac{4}{2}&=10(0.30103)','&=3.01\\ \\text{dB}.')
     +'B and C tie. Orthogonal signals and on-off signals give the same distance at the same average energy.<br>'
     +'<b>Check.</b> From the waveforms: A gives $s_0-s_1=2$ on $[0,4]$, energy $16$. B gives $s_0-s_1=2$ on $[2,4]$, energy $8$. C gives $s_1-s_0=s_1$, energy $8$. These are the three $d_{01}^2$.',
  figSol: () => ROW([cons([[2,0,'\\mathbf{s}_0','n'],[-2,0,'\\mathbf{s}_1','n']],{xr:[-3,3],yr:[-0.6,1.3],oneD:true,xl:'\\psi',xs:1,d:[[0,1]],dl:[0,0.85,'\\text{A: }d=4','middle'],w:340,h:190}),
                     cons([[2,0,'\\mathbf{s}_0','ne'],[0,2,'\\mathbf{s}_1','ne']],{xr:[-0.8,3],yr:[-0.8,3],d:[[0,1]],dl:[1.2,1.35,'\\text{B: }d=2\\sqrt2'],w:340,h:320}),
                     cons([[0,0,'\\mathbf{s}_0','n'],[2*R2,0,'\\mathbf{s}_1','n']],{xr:[-0.8,3.6],yr:[-0.6,1.3],oneD:true,xl:'\\psi',xs:1,d:[[0,1]],dl:[1.41,0.85,'\\text{C: }d=2\\sqrt2','middle'],w:340,h:190})]),
  err:'Comparing the designs by distance alone without fixing the energy. A design can always win on distance by using more energy. The fair measure is $d_{01}^2/E_{s,av}$.',
  teach:'The $3$ dB statement of the energy-and-distance scene, reached by three Gram–Schmidt runs. It sets up the error-probability comparison of the next module.' },

]);

window.DRILL_M3 = [

{ id:'m3-drill', module:'M3', nav:'Module 3 · practice questions',
  title:'Module 3 — practice questions',
  objective:'Thirty examination questions on the geometry of signal sets, with worked solutions.',
  keywords:'practice questions module 3 gram schmidt orthonormal basis signal vectors constellation energy distance correlation minimum distance nearest neighbours psk qam pam',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 3 · Practice D3-01 … D3-30'},
  {t:'title', text:'Practice questions'},
  {t:'small', html:'Work each question before opening its solution. Use these checks:<ul><li>Each basis function has unit energy.</li><li>Vector energy equals waveform energy.</li><li>The number of axes cannot exceed the number of signals.</li><li>The distance between two points is the square root of the energy of their difference.</li></ul>'},
  {t:'rule', short:true},
  {t:'drill', module:'M3'}
]}

];
})();
