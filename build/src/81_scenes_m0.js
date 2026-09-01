/* ==========================================================================
   Module 0 — The frame of the course.

   Written last, because a course opening is easier to write once the course
   exists. It carries no examinable method and therefore no question section:
   nothing here is on a paper, and everything here is needed to read the rest.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;

/* The six modules on a circle around the question they all answer. A list
   would say the same thing and would imply an order the course does not quite
   have — modules 3 to 5 are one argument told in three passes, and the ring
   shows that better than a column of numbers. */
function figMap(){
  const R = 0.95;
  /* The ring is drawn inside a wider frame than the circle needs, because the
     labels beside it are the chapter titles rather than short tags. Each title
     is centred over its point rather than run outwards from it: centred, a
     title spends half its width on each side, so a font that measures wider
     than this one does cannot push it off the frame. */
  const a = P.Axes({w:570,h:416,xr:[-2.24,2.24],yr:[-1.6,1.6],
    pad:{l:12,r:12,t:12,b:12}, xticksOverride:[], yticksOverride:[],
    grid:false, zeroAxes:false, arrows:false});
  const items = [
    ['1', 'Analog to digital',        C.in],
    ['2', 'Baseband transmission',    C.out],
    ['3', 'Geometric representation', C.h],
    ['4', 'The optimal receiver',     C.err],
    ['5', 'Digital modulation',       C.in],
    ['6', 'Information theory',       C.out]
  ];
  items.forEach((it,i)=>{
    const th = Math.PI/2 - i*2*Math.PI/6;
    const x = R*Math.cos(th), y = R*Math.sin(th);
    a.poly([[0,0],[x*0.74,y*0.74]], {color:C.grid, width:1.2});
    a.point(x, y, {color:it[2], r:15});
    /* The number, so the ring and the cards beside it can be matched without
       reading a label twice. */
    a.note(x, y - 0.055, it[0], {fs:15, color:C.paper, anchor:'middle'});
    /* The title sits outside the point, clear of it above or below depending
       on which half of the ring the point is in. No point of a six-point ring
       lies on the horizontal axis, so there is no third case. */
    const out = 1.28;
    a.note(x*out, y*out + (y > 0 ? 0.24 : -0.24), it[1],
      {fs:12.5, color:C.dim, anchor:'middle'});
  });
  a.point(0, 0, {color:C.ink, r:5});
  a.note(0, -0.22, 'one question', {fs:12.5, color:C.dim, anchor:'middle'});
  return a.svg();
}

/* The system every module takes a piece of. */
function figChain(){
  return P.blocks({w:720,h:180,items:[
    {t:'arrow',x1:24,y1:80,x2:100,y2:80},
    {t:'box',x:100,y:50,w:132,h:60,label:'Transmitter',fs:14},
    {t:'arrow',x1:232,y1:80,x2:316,y2:80},
    {t:'box',x:316,y:50,w:112,h:60,label:'Channel',fs:14},
    {t:'arrow',x1:428,y1:80,x2:512,y2:80},
    {t:'box',x:512,y:50,w:132,h:60,label:'Receiver',fs:14},
    {t:'arrow',x1:644,y1:80,x2:706,y2:80},
    {t:'text',x:274,y:64,label:'s_i(t)',tex:true,fs:15},
    {t:'text',x:470,y:64,label:'r(t)',tex:true,fs:15},
    {t:'text',x:166,y:144,label:'chooses the waveform',fs:12},
    {t:'text',x:372,y:144,label:'adds noise',fs:12},
    {t:'text',x:578,y:144,label:'names the symbol',fs:12}
  ]});
}

/* ---- pictograms for the how-to-read strip ----
   Four small emblems, one per habit the reader needs. Each is a shape, not a
   diagram: it marks the card the way an icon marks a control. */
function mini(w,h,xr,yr){ return P.Axes({w:w,h:h,xr:xr,yr:yr,pad:{l:10,r:10,t:8,b:8},
  xticksOverride:[], yticksOverride:[], grid:false, zeroAxes:false, arrows:false}); }
function icoSteps(){
  const a = mini(300,64,[0,10],[-1.2,1.2]);
  a.point(2,0,{color:C.ink,r:6}); a.point(5,0,{color:C.ink,r:6});
  a.point(8,0,{color:C.grid,r:6});
  a.poly([[2.8,0],[4.2,0]],{color:C.grid,width:1.6});
  a.poly([[5.8,0],[7.2,0]],{color:C.grid,width:1.6});
  return a.svg();
}
function icoLab(){
  const a = mini(300,64,[0,10],[-1.4,1.4]);
  a.poly([[1,0.6],[9,0.6]],{color:C.grid,width:2});
  a.point(6.2,0.6,{color:C.h,r:6});
  a.poly([[1,-0.7],[9,-0.7]],{color:C.grid,width:2});
  a.point(3.4,-0.7,{color:C.h,r:6});
  return a.svg();
}
function icoModes(){
  const a = mini(300,64,[0,10],[-1.2,1.2]);
  [[0.8,C.dec.in],[3.1,C.dec.out],[5.4,C.dec.mid],[7.7,C.dec.h]].forEach(([x,f])=>
    a.rect(x,-0.85,x+1.6,0.85,{fill:f}));
  return a.svg();
}
function icoGauss(){
  const a = mini(300,64,[-3,3],[0,1.15]);
  a.curve(x=>Math.exp(-x*x/1.1),{color:C.ink,width:2});
  return a.svg();
}

const SC = [

/* The cover takes no address. It is the one scene in the artifact that does
   not, and the way that is marked is by leaving it out of `CONTENT.SECTIONS`
   entirely: an address is derived only for a scene that is declared there. */
{ id:'title', module:'M0', nav:'Title', title:'Digital Communications',
  keywords:'title cover version', steps:0, blocks:[
  {t:'stack', style:'justify-content:center;flex:1;align-items:flex-start', items:[
    {t:'eyebrow', text:'Digital Communications'},
    {t:'title', level:1, text:'Digital Communications'},
    {t:'lede', text:'A digital communication system carries a finite alphabet of symbols across a channel that adds noise to everything it carries. The course is the study of how those symbols are chosen, how they are recovered, and how often the recovery is wrong.'},
    {t:'small', html:'Seven modules, ten laboratories and one hundred and twenty practice questions with worked solutions. Every figure is drawn from the mathematics beside it, and every number is checked by a program that computes it a second way.'}
  ]}
]},

/* ---------------------------------------------------------------- 0.1 ---- */
{ id:'m0-open', module:'M0', nav:'What the course asks', title:'One question, asked in seven ways',
  objective:'State the question the whole course answers before any machinery is introduced.',
  keywords:'opening digital communication noise decision error probability transmitter receiver',
  steps:2, blocks:[
  {t:'eyebrow', text:'Module 0 · The frame of the course'},
  {t:'title', text:'One question, asked in seven ways'},
  {t:'lede', text:'A transmitter sends a waveform for one symbol. A channel adds noise. A receiver observes the result and decides which symbol was sent. The course studies waveform design, receiver decisions, and error probability.'},
  {t:'fig', frame:true, svg:()=>figChain(),
    caption:'The transmitter selects a waveform. The channel adds noise. The receiver decides which symbol was sent.'},
  {t:'reveal', at:1, items:[
    {t:'grid', cols:3, gap:'22px', items:[
      [{t:'card', head:'Transmitted signal', items:[
        {t:'small', html:'A finite set of $M$ waveforms, one for each symbol. Choosing them well is Modules 1, 2 and 5.'}]}],
      [{t:'card', head:'Received signal', items:[
        {t:'small', html:'The receiver observes the waveform plus noise. The noise is white and Gaussian. Its symmetry makes distance the correct decision measure. Modules 3 and 4 develop this result.'}]}],
      [{t:'card', head:'Error probability', items:[
        {t:'small', html:'One number, and almost always one $Q$ of a distance. Every error probability in this course has that shape.'}]}]
    ]}
  ]},
  {t:'reveal', at:2, items:[
    {t:'note', kind:'ok', head:'Main result', html:'<b>The distance between signal points controls the error probability.</b> Module 3 defines this distance. Module 4 derives the decision rule. Module 5 applies the result to common modulation methods.'}
  ]}
]},

/* ---------------------------------------------------------------- 0.2 ---- */
{ id:'m0-why', module:'M0', nav:'Why digital', title:'Digital transmission',
  objective:'Give the one reason digital transmission is used, and its price.',
  keywords:'why digital regeneration repeater noise accumulation bandwidth quantization',
  steps:2, blocks:[
  {t:'eyebrow', text:'Module 0 · The frame of the course'},
  {t:'title', text:'Digital transmission'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>An analog signal that travels through a long link picks up noise at every stage, and there is nothing to be done about it. An amplifier cannot tell the signal from what has been added to it, so it amplifies both. After twenty hops the noise has been added twenty times.</p>'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Regeneration', html:'A digital receiver makes a decision instead of amplifying its input. A correct decision produces a clean copy of the transmitted waveform. Therefore, noise from the previous hop does not continue to the next hop.'},
      {t:'body', html:'<p>This regeneration works only when the decision is correct. The error probability at each hop therefore controls the performance of a long digital link.</p>'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Costs', html:'Digital transmission uses <b>bandwidth</b> because sharp pulses contain many frequencies. It also loses <b>accuracy</b> when quantization rounds a continuous value. Module 1 studies quantization. Module 2 studies pulse bandwidth.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a = P.Axes({w:480,h:290,xr:[0,20],yr:[0,21],
        xlabel:'\\text{hops}', ylabel:'\\text{accumulated noise}',
        pad:{l:64,r:22,t:24,b:44}, xtarget:5, ytarget:5});
      a.curve(n=>n, {color:C.err, width:2.2});
      a.hline(1, {color:C.in, width:2.2});
      a.note(12.6, 15.4, 'analog', {fs:13, color:C.err});
      a.note(18.6, 3.0, 'digital, regenerated', {fs:13, color:C.in, anchor:'end'});
      return a.svg();
    },
      caption:'Noise power against the number of hops. An analog link adds noise at each stage. A digital link does not carry previous noise forward after a correct decision.'},
    {t:'small', html:'The digital curve stays flat only while the decisions are correct. A bit error probability of $10^{-9}$ makes this model practical. A probability of $10^{-2}$ does not.'}
  ]}
]},

/* ---------------------------------------------------------------- 0.3 ---- */
{ id:'m0-map', module:'M0', nav:'The course map', title:'Course modules',
  objective:'Give the shape of the course and how the modules depend on each other.',
  keywords:'course map modules overview structure dependencies sampling baseband signal space receiver modulation information',
  steps:2, blocks:[
  {t:'eyebrow', text:'Module 0 · The frame of the course'},
  {t:'title', text:'Course modules'},
  {t:'cols', ratio:'c-5-7', vcenter:true, left:[
    {t:'fig', frame:true, svg:()=>figMap(),
      caption:'The six modules and the one question at the centre of them. Modules 3, 4 and 5 are one argument told three times: make the distance meaningful, prove it decides, then measure it.'}
  ], right:[
    {t:'grid', cols:2, gap:'16px', items:[
      [{t:'card', head:'1 · The transition from analog to digital', items:[
        {t:'small', html:'Sampling, the reconstruction that follows from it, quantization and the noise it adds, and pulse-code modulation. Where the bits come from.'}]}],
      [{t:'card', head:'2 · Baseband transmission of digital signals', items:[
        {t:'small', html:'The matched filter, the demodulator, intersymbol interference, and the Nyquist condition that removes it. How a pulse train survives a channel.'}]}],
      [{t:'card', head:'3 · Geometric representation of signal waveforms', items:[
        {t:'small', html:'A signal as a point. Energy becomes a squared length and difference becomes a distance, which is the move the rest of the course rests on.'}]}],
      [{t:'card', head:'4 · The optimal receiver in AWGN', items:[
        {t:'small', html:'The rule that makes the fewest mistakes, the regions it draws, and the union bound that turns geometry into a number.'}]}],
      [{t:'card', head:'5 · Digital modulation methods', items:[
        {t:'small', html:'PSK, PAM, QAM and FSK: place the points, measure the distance, read the error probability off Module 4. Nothing new is needed.'}]}],
      [{t:'card', head:'6 · An introduction to information theory', items:[
        {t:'small', html:'Entropy, the source-coding theorem, prefix codes and Huffman. How few bits the message needed in the first place.'}]}]
    ]},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Module order', html:'Modules 1 and 2 are independent. Module 3 is required for Module 4, and Module 4 is required for Module 5. Module 6 does not depend on the other modules.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Ten laboratories and a hundred and twenty questions', html:'Each module carries one or two laboratories, where every control changes the mathematics rather than the picture. It also carries twenty practice questions whose solutions are worked rather than stated. The questions follow the shapes the papers actually set, and each module names those shapes before it starts.'}
    ]}
  ]}
]},

/* ---------------------------------------------------------------- 0.4 ---- */
{ id:'m0-how', module:'M0', nav:'How to read this', title:'Course controls and conventions',
  objective:'Explain the reveal, the laboratories, the editions and the textbook anchor convention.',
  keywords:'how to read reveal steps laboratories editions anchors textbook convention notation',
  steps:1, blocks:[
  {t:'eyebrow', text:'Module 0 · The frame of the course'},
  {t:'title', text:'Course controls and conventions'},
  {t:'grid', cols:4, gap:'20px', items:[
    [{t:'card', head:'Scenes build in steps', items:[
      {t:'fig', svg:icoSteps},
      {t:'small', html:'Space or the right arrow takes the next step. Pause at each one: a question is worth answering before its answer appears.'}
    ]}],
    [{t:'card', head:'The laboratories are live', items:[
      {t:'fig', svg:icoLab},
      {t:'small', html:'Every control changes the mathematics, not the drawing. The numbers beside a figure are recomputed the moment a control moves.'}
    ]}],
    [{t:'card', head:'Four ways to read it', items:[
      {t:'fig', svg:icoModes},
      {t:'small', html:'<b>Normal</b>, <b>lecture</b>, <b>self-study</b>, and <b>student</b> or <b>instructor</b>. The controls are along the top, and the choice is remembered.'}
    ]}],
    [{t:'card', head:'The conventions are fixed', items:[
      {t:'fig', svg:icoGauss},
      {t:'small', html:'Noise is white and Gaussian with two-sided density $N_0/2$. Also, $Q(x)=\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$, and $\\log$ means base two. The notation panel lists these conventions.'}
    ]}]
  ]},
  {t:'reveal', at:1, items:[
    {t:'grid', cols:2, gap:'24px', items:[
      [{t:'note', kind:'def', head:'Textbook addresses', html:'Most scenes show a textbook address, such as <b>PS CH8.4.1</b>. The <b>PS</b> mark identifies this address as a textbook section. A scene without this mark has no direct textbook section.'}],
      [{t:'note', kind:'ok', head:'Numerical checks', html:'A separate calculation checks every numerical result. The checks rebuild constellations, construct Huffman codes with two algorithms, and compare simulated error probabilities with their formulas.'}]
    ]}
  ]}
]}

];

window.SCENES_M0 = SC;
})();
