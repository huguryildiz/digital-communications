/* ==========================================================================
   Module 0 — The frame of the course.

   Written last. What stands here now is the cover and the one scene that opens
   the argument; the rest of the module is added once the course it introduces
   exists.
   ========================================================================== */
(function(){

const SC = [

/* The cover takes no address. It is the one scene in the artifact that does
   not, and the way that is marked is by leaving it out of `CONTENT.SECTIONS`
   entirely: an address is derived only for a scene that is declared there. */
{ id:'title', module:'M0', nav:'Title', title:'Digital Communications',
  keywords:'title cover version', steps:0, blocks:[
  {t:'stack', style:'justify-content:center;flex:1;align-items:flex-start', items:[
    {t:'eyebrow', text:'EE 413 · Communication Systems II'},
    {t:'title', level:1, text:'Digital Communications'},
    {t:'lede', text:'A digital communication system carries a finite alphabet of symbols across a channel that adds noise to everything it carries. The course is the study of how those symbols are chosen, how they are recovered, and how often the recovery is wrong.'}
  ]}
]},

{ id:'m0-open', module:'M0', nav:'What the course asks', title:'What the course asks',
  objective:'State the question the whole course answers before any machinery is introduced.',
  keywords:'opening digital communication noise decision error probability', steps:0, blocks:[
  {t:'eyebrow', text:'Module 0 · Orientation'},
  {t:'title', text:'One question, asked in seven ways'},
  {t:'lede', text:'A transmitter is given a symbol and sends a waveform. A channel adds noise to that waveform. A receiver observes the sum and decides which symbol was sent. Everything in this course is either a way of choosing the waveforms, a way of making the decision, or a way of working out how often the decision is wrong.'}
]}

];

window.SCENES_M0 = SC;
})();
