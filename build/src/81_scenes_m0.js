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
  const R = 1.0;
  const a = P.Axes({w:520,h:416,xr:[-2.0,2.0],yr:[-1.6,1.6],
    pad:{l:12,r:12,t:12,b:12}, xticksOverride:[], yticksOverride:[],
    grid:false, zeroAxes:false, arrows:false});
  const items = [
    ['1', 'Analog to digital', C.in],
    ['2', 'Baseband',          C.out],
    ['3', 'Signal space',      C.h],
    ['4', 'The receiver',      C.err],
    ['5', 'Modulation',        C.in],
    ['6', 'Information',       C.out]
  ];
  items.forEach((it,i)=>{
    const th = Math.PI/2 - i*2*Math.PI/6;
    const x = R*Math.cos(th), y = R*Math.sin(th);
    a.poly([[0,0],[x*0.74,y*0.74]], {color:C.grid, width:1.2});
    a.point(x, y, {color:it[2], r:15});
    /* The number, so the ring and the cards beside it can be matched without
       reading a label twice. */
    a.note(x, y - 0.055, it[0], {fs:15, color:C.paper, anchor:'middle'});
    const out = 1.26;
    a.note(x*out, y*out + (Math.abs(y) < 0.2 ? 0 : (y > 0 ? 0.17 : -0.17)), it[1],
      {fs:12.5, color:C.dim, anchor: Math.abs(x) < 0.2 ? 'middle' : (x > 0 ? 'start' : 'end')});
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

const SC = [

/* The cover takes no address. It is the one scene in the artifact that does
   not, and the way that is marked is by leaving it out of `CONTENT.SECTIONS`
   entirely: an address is derived only for a scene that is declared there. */
{ id:'title', module:'M0', nav:'Title', title:'Digital Communications',
  keywords:'title cover version', steps:0, blocks:[
  {t:'stack', style:'justify-content:center;flex:1;align-items:flex-start', items:[
    {t:'eyebrow', text:'EE 413 · Communication Systems II'},
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
  {t:'lede', text:'A transmitter is given a symbol and sends a waveform. A channel adds noise to that waveform. A receiver observes the sum and decides which symbol was sent. Everything in this course is either a way of choosing the waveforms, a way of making the decision, or a way of working out how often the decision is wrong.'},
  {t:'fig', frame:true, svg:()=>figChain(),
    caption:'The system, and the three places a module can work on it. The transmitter chooses the waveforms; the channel is given and cannot be argued with; the receiver decides.'},
  {t:'reveal', at:1, items:[
    {t:'grid', cols:3, gap:'22px', items:[
      [{t:'card', head:'What is sent', items:[
        {t:'small', html:'A finite set of $M$ waveforms, one for each symbol. Choosing them well is Modules 1, 2 and 5.'}]}],
      [{t:'card', head:'What arrives', items:[
        {t:'small', html:'The waveform plus noise. The noise is Gaussian, white, and the same in every direction — which is why distance is the right thing to measure. That is Modules 3 and 4.'}]}],
      [{t:'card', head:'How often it is wrong', items:[
        {t:'small', html:'One number, and almost always one $Q$ of a distance. Every error probability in this course has that shape.'}]}]
    ]}
  ]},
  {t:'reveal', at:2, items:[
    {t:'note', kind:'ok', head:'The sentence the course keeps returning to', html:'<b>Errors are decided by the distance between the signal points, and by almost nothing else.</b> Module 3 makes the distance meaningful, Module 4 proves that it decides, and Module 5 measures it for every scheme worth using. If one sentence survives the term, it should be this one.'}
  ]}
]},

/* ---------------------------------------------------------------- 0.2 ---- */
{ id:'m0-why', module:'M0', nav:'Why digital', title:'Why send digits at all',
  objective:'Give the one reason digital transmission is used, and its price.',
  keywords:'why digital regeneration repeater noise accumulation bandwidth quantization',
  steps:2, blocks:[
  {t:'eyebrow', text:'Module 0 · The frame of the course'},
  {t:'title', text:'Why send digits at all'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>An analog signal that travels through a long link picks up noise at every stage, and there is nothing to be done about it: an amplifier cannot tell the signal from what has been added to it, so it amplifies both. After twenty hops the noise has been added twenty times.</p>'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'The one reason', html:'A digital receiver does not amplify what it receives — it <b>decides</b>. If the decision is right, the waveform it sends on is the original one, exactly, with no trace of the noise the last hop added. Twenty hops with a decision at each one are no worse than one hop, as long as every decision is right.'},
      {t:'body', html:'<p>That is the whole argument, and it is why the rest of the course is about how often a decision is wrong. A small error probability at each hop is what buys the perfect regeneration.</p>'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'And the price', html:'Sending digits costs <b>bandwidth</b>, because a sharp pulse needs more of it than the smooth signal it replaced, and it costs <b>accuracy</b>, because a continuous value has to be rounded to one of a finite set before it can be sent at all. Module 1 is the study of that rounding and Module 2 of that bandwidth.'}
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
      caption:'Noise power against the number of hops. An analog link adds it at every stage; a digital link that decides correctly at every stage carries none of it forward. The flat line is the whole reason for the course.'},
    {t:'small', html:'The flat line is not free and it is not exact — it is flat only while every decision is right. A link running at a bit error probability of $10^{-9}$ is flat for practical purposes; one running at $10^{-2}$ is not flat at all.'}
  ]}
]},

/* ---------------------------------------------------------------- 0.3 ---- */
{ id:'m0-map', module:'M0', nav:'The course map', title:'What is in the six modules',
  objective:'Give the shape of the course and how the modules depend on each other.',
  keywords:'course map modules overview structure dependencies sampling baseband signal space receiver modulation information',
  steps:2, blocks:[
  {t:'eyebrow', text:'Module 0 · The frame of the course'},
  {t:'title', text:'What is in the six modules'},
  {t:'cols', ratio:'c-5-7', vcenter:true, left:[
    {t:'fig', frame:true, svg:()=>figMap(),
      caption:'The six modules and the one question at the centre of them. Modules 3, 4 and 5 are one argument told three times: make the distance meaningful, prove it decides, then measure it.'}
  ], right:[
    {t:'grid', cols:2, gap:'16px', items:[
      [{t:'card', head:'1 · Analog to digital', items:[
        {t:'small', html:'Sampling, the reconstruction that follows from it, quantization and the noise it adds, and pulse-code modulation. Where the bits come from.'}]}],
      [{t:'card', head:'2 · Baseband', items:[
        {t:'small', html:'The matched filter, the demodulator, intersymbol interference, and the Nyquist condition that removes it. How a pulse train survives a channel.'}]}],
      [{t:'card', head:'3 · Signal space', items:[
        {t:'small', html:'A signal as a point. Energy becomes a squared length and difference becomes a distance, which is the move the rest of the course rests on.'}]}],
      [{t:'card', head:'4 · The receiver', items:[
        {t:'small', html:'The rule that makes the fewest mistakes, the regions it draws, and the union bound that turns geometry into a number.'}]}],
      [{t:'card', head:'5 · Modulation', items:[
        {t:'small', html:'PSK, PAM, QAM and FSK: place the points, measure the distance, read the error probability off Module 4. Nothing new is needed.'}]}],
      [{t:'card', head:'6 · Information theory', items:[
        {t:'small', html:'Entropy, the source-coding theorem, prefix codes and Huffman. How few bits the message needed in the first place.'}]}]
    ]},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'What depends on what', html:'Modules 1 and 2 stand on their own. Module 3 is needed for 4, and 4 for 5 — those three should be read in order and not sampled. Module 6 depends on nothing else here and can be read at any point.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Ten laboratories and a hundred and twenty questions', html:'Each module carries one or two laboratories, where every control changes the mathematics rather than the picture, and twenty practice questions whose solutions are worked rather than stated. The questions follow the shapes the papers actually set, and each module names those shapes before it starts.'}
    ]}
  ]}
]},

/* ---------------------------------------------------------------- 0.4 ---- */
{ id:'m0-how', module:'M0', nav:'How to read this', title:'How to read this, and where the numbers come from',
  objective:'Explain the reveal, the laboratories, the editions and the textbook anchor convention.',
  keywords:'how to read reveal steps laboratories editions anchors textbook convention notation',
  steps:3, blocks:[
  {t:'eyebrow', text:'Module 0 · The frame of the course'},
  {t:'title', text:'How to read this, and where the numbers come from'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'note', kind:'def', head:'Scenes build in steps', html:'Most scenes reveal themselves a piece at a time. Space or the right arrow takes the next step, and a scene with three steps says so at the bottom right. The point is to leave time to answer a question before its answer appears, so it is worth pausing at each step rather than pressing through.'},
    {t:'note', kind:'def', head:'The laboratories are live', html:'Every control in a laboratory changes the mathematics and not the drawing. The numbers beside a figure are computed from the definitions at the moment the control moves, so a reading taken from a laboratory is a reading of the same formulas the scenes derive.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Four ways to read it', html:'<b>Normal</b> shows everything. <b>Lecture</b> hides the practice questions. <b>Self-study</b> opens the solutions by default. <b>Student</b> and <b>instructor</b> differ in whether the teaching notes appear. The controls are along the top, and the choice is remembered.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'The conventions are fixed and stated once', html:'Noise is white and Gaussian with two-sided density $N_0/2$; $Q(x)=\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$; energy is normalised so that no resistance appears; $\\log$ without a base means base two. The notation panel along the top repeats all of them. Half the factor-of-two errors in this subject come from mixing two conventions in one line.'}
    ]}
  ], right:[
    {t:'reveal', at:3, items:[
      {t:'note', kind:'def', head:'Where the textbook is', html:'Most scenes carry a small chip beside their address pointing into the course textbook. The chip is a marker followed by a chapter and section, such as <b>PS CH8.4.1</b>, and the marker is there because this artifact numbers its own chapters the same way — without it a reader cannot tell which of the two an address belongs to.'},
      {t:'small', html:'A scene with no chip is one the textbook does not cover in that form, and a few scenes carry two addresses. The chip points at the section that states the same result, not at a page a figure came from — nothing here came from a page.'},
      {t:'note', kind:'ok', head:'And where the numbers come from', html:'Every number stated in a scene or a solution is recomputed by a separate program that reaches it a different way: constellations are rebuilt from their definitions rather than from the formula printed beside them, Huffman codes are built twice by two different algorithms, and every error probability is simulated against its formula. A number that appears here has survived that.'}
    ]}
  ]}
]}

];

window.SCENES_M0 = SC;
})();
