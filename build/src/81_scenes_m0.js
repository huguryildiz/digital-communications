/* ==========================================================================
   Module 0 — Orientation.

   The course opening, laid out as the Signals and Systems opening is: what a
   communication system is, what makes it digital, the problem the course
   solves, where it is met, the books, the map and the controls. It carries no
   examinable method and therefore no question section.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;
/* photographs live in 77_images.js as data URIs */
const photo = (k, alt) => `<img class="photo" src="${IMG[k]}" alt="${alt}">`;
const cover = (k, alt) => `<img class="cover" src="${IMG[k]}" alt="${alt}">`;

/* A seeded generator, so every noisy trace is the same on every build and the
   artifact stays byte-reproducible. */
function rng(seed){
  let a = seed>>>0;
  const u = () => { a = (a + 0x6D2B79F5)>>>0; let t = a;
    t = Math.imul(t ^ (t>>>15), t | 1); t ^= t + Math.imul(t ^ (t>>>7), t | 61);
    return ((t ^ (t>>>14))>>>0) / 4294967296; };
  return () => Math.sqrt(-2*Math.log(u()+1e-12)) * Math.cos(2*Math.PI*u());
}

/* The system every module takes a piece of, with its signals flowing through
   it: the bits go in, the transmitter sends a BPSK waveform, the channel hands
   on the same waveform with noise on it, and the receiver's bits come out, one
   of them wrong. Each wire shows a window onto one period of a repeating
   stream that slides to the right; the still frame is a complete figure, so
   reduced motion and print lose nothing but the movement. */
function figChain(){
  const bits = [1,0,1,1,0,1,0,0], bw = 30, L = bits.length*bw, A = 12, y0 = 80, g = rng(11);
  const it = [
    {t:'box',x:150,y:50,w:132,h:60,label:'Transmitter',fs:14},
    {t:'box',x:432,y:50,w:112,h:60,label:'Channel',fs:14},
    {t:'box',x:694,y:50,w:132,h:60,label:'Receiver',fs:14},
    {t:'text',x:357,y:40,label:'s_i(t)',tex:true,fs:15},
    {t:'text',x:619,y:40,label:'r(t)',tex:true,fs:15},
    {t:'text',x:216,y:144,label:'chooses the waveform',fs:12},
    {t:'text',x:488,y:144,label:'adds noise',fs:12},
    {t:'text',x:760,y:144,label:'names the symbol',fs:12}
  ], defs = [], extra = [];
  /* one period of noise, smoothed around the wrap so the stream repeats seamlessly */
  const raw = Array.from({length:L}, () => g());
  const w = raw.map((u,j) => 0.38*A*(u + raw[(j+L-1)%L] + raw[(j+1)%L])/1.8);
  const s = x => { const j = ((Math.floor(x)%L)+L)%L;
    return (bits[Math.floor(j/bw)] ? A : -A)*Math.sin(4*Math.PI*j/bw); };
  const wave = (x0, x1, val) => { let d = '';
    for(let x=x0; x<=x1; x+=1) d += (d?'L':'M')+x+','+(y0-val(x)).toFixed(1);
    return d; };
  const digits = (x0, x1, ks, col) => { let t = '';
    for(let x=x0; x<x1; x+=bw){ const k = (((x-x0)/bw)%bits.length);
      const [b,c] = ks(k); t += `<text x="${x+bw/2}" y="${y0+5}" font-family="KaTeX_Main,serif" font-size="16" fill="${c||col}" text-anchor="middle">${b}</text>`; }
    return t; };
  /* a wire from xa to xb: the stream is drawn from xa-L to xb, masked to the
     wire with soft ends, and slid right by one period per cycle */
  const wire = (id, xa, xb, body) => {
    it.push({t:'arrow',x1:xb-10,y1:y0,x2:xb,y2:y0});
    defs.push(`<mask id="tsig-${id}" maskUnits="userSpaceOnUse" x="${xa}" y="${y0-24}" width="${xb-xa-10}" height="48">
      <rect x="${xa}" y="${y0-24}" width="${xb-xa-10}" height="48" fill="url(#tsig-fade)"/></mask>`);
    extra.push(`<g mask="url(#tsig-${id})"><g class="tsig-flow">${body(xa-L, xb)}</g></g>`);
  };
  wire('in', 20, 150, (a,b) => digits(a, b, k => [bits[k]], C.in));
  wire('s', 282, 432, (a,b) => `<path d="${wave(a,b,s)}" fill="none" stroke="${C.in}" stroke-width="1.7" stroke-linejoin="round"/>`);
  wire('r', 544, 694, (a,b) => `<path d="${wave(a,b,x => s(x)+w[((x%L)+L)%L])}" fill="none" stroke="${C.out}" stroke-width="1.5" stroke-linejoin="round"/>`);
  /* the receiver's bits: the fourth is decided wrongly */
  wire('out', 826, 930, (a,b) => digits(a, b, k => k===3 ? [1-bits[k], C.err] : [bits[k]], C.out));
  defs.push(`<linearGradient id="tsig-fade"><stop offset="0" stop-color="#fff" stop-opacity="0"/>
    <stop offset=".18" stop-color="#fff"/><stop offset=".82" stop-color="#fff"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`);
  return P.blocks({w:940,h:170,items:it})
    .replace('>', `><defs>${defs.join('')}</defs>`)
    .replace('</svg>', extra.join('')+'</svg>');
}

/* The same chain played in frames: the bits, the waveform the transmitter
   sends, the noise the channel adds, the sum the receiver sees, one sample
   per bit against a threshold at zero, and the decisions. Each trace sweeps
   in from the left as its frame plays; the block at work takes the colour of
   the signal it hands on. The noise is white, with a standard deviation of
   one tenth of the pulse height, so r(t) keeps the shape of s_i(t) and every
   bit is decided correctly. */
function figChainPlay(v){
  const f = v && v.frame!=null ? v.frame : 5, p = k => Math.min(Math.max(f-(k-1), 0), 1);
  const on = Math.round(f), col = [null, C.in, C.h, C.out, C.out, C.out][on];
  const bits = [1,0,1,1,0,0,1,0], N = bits.length, x0 = 92, x1 = 704, bs = (x1-x0)/N;
  const A = 24, yb = 188, ys = 248, yw = 322, yr = 404, yd = 470, sp = 80, g = rng(7);
  const it = [
    {t:'arrow',x1:24,y1:80,x2:100,y2:80},
    {t:'box',x:100,y:50,w:132,h:60,label:'Transmitter',fs:14,color:on===1?col:null},
    {t:'arrow',x1:232,y1:80,x2:316,y2:80},
    {t:'box',x:316,y:50,w:112,h:60,label:'Channel',fs:14,color:on===2?col:null},
    {t:'arrow',x1:372,y1:8,x2:372,y2:50},
    {t:'text',x:382,y:26,label:'w(t)',tex:true,fs:15,anchor:'start'},
    {t:'arrow',x1:428,y1:80,x2:512,y2:80},
    {t:'box',x:512,y:50,w:132,h:60,label:'Receiver',fs:14,color:on>=3?col:null},
    {t:'arrow',x1:644,y1:80,x2:706,y2:80},
    {t:'text',x:274,y:64,label:'s_i(t)',tex:true,fs:15},
    {t:'text',x:470,y:64,label:'r(t)',tex:true,fs:15},
    {t:'text',x:62,y:64,label:'b_k',tex:true,fs:15},
    {t:'text',x:675,y:64,label:'\\hat b_k',tex:true,fs:15},
    {t:'text',x:166,y:144,label:'chooses the waveform',fs:12},
    {t:'text',x:372,y:144,label:'adds noise',fs:12},
    {t:'text',x:578,y:144,label:'names the symbol',fs:12}
  ], extra = [];
  [[yb,'b_k'],[ys,'s_i(t)'],[yw,'w(t)'],[yr,'r(t)'],[yd,'\\hat b_k']].forEach(([y,s])=>
    it.push({t:'text',x:x0-18,y:y+4,label:s,tex:true,fs:15,anchor:'end'}));
  [ys,yw,yr].forEach(y => extra.push(`<path d="M${x0},${y}H${x1}" stroke="${C.rule}" stroke-width="1"/>`));
  /* noise: seeded white Gaussian samples, sigma = A/10, one per pixel */
  const w = Array.from({length:N*sp+1}, () => 0.1*A*g());
  const s = j => bits[Math.min(Math.floor(j/sp), N-1)] ? A : -A;
  const trace = (y, val, prog, c, sw) => {
    const n = Math.round(prog*N*sp); if(n<1) return;
    let d = '';
    for(let j=0;j<=n;j++){
      /* the pulse edges are vertical: repeat the point at each bit boundary */
      if(val===s && j>0 && j%sp===0 && j<N*sp) d += ` L${(x0+j*bs/sp).toFixed(1)},${(y-s(j-1)).toFixed(1)}`;
      d += (d?' L':'M')+(x0+j*bs/sp).toFixed(1)+','+(y-val(j)).toFixed(1);
    }
    extra.push(`<path d="${d}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linejoin="round"/>`);
  };
  bits.forEach((b,k) => it.push({t:'text',x:x0+bs*(k+0.5),y:yb+4,label:String(b),tex:true,fs:15,color:C.in}));
  trace(ys, s, p(1), C.in, 1.8);
  trace(yw, j => w[j], p(2), C.noise, 1.2);
  trace(yr, j => s(j)+w[j], p(3), C.out, 1.5);
  if(p(4)>0){
    extra.push(`<path d="M${x0},${yr}H${x1}" stroke="${C.noise}" stroke-width="1.2" stroke-dasharray="5 4"/>`);
    it.push({t:'text',x:x1+4,y:yr-8,label:'0',tex:true,fs:13,anchor:'start'});
  }
  bits.forEach((b,k) => {
    const j = k*sp+sp/2, rk = s(j)+w[j], dk = rk>0 ? 1 : 0, c = dk===b ? C.out : C.err, cx = x0+bs*(k+0.5);
    if(p(4) > k/N){
      extra.push(`<path d="M${cx},${yr}V${(yr-rk).toFixed(1)}" stroke="${c}" stroke-width="1.2" stroke-dasharray="2 2"/>`,
        P.stemTip(cx, yr-rk, 4, rk, c));
    }
    if(p(5) > k/N) it.push({t:'text',x:cx,y:yd+4,label:String(dk),tex:true,fs:15,color:c});
  });
  return P.blocks({w:720,h:492,items:it}).replace('</svg>', extra.join('')+'</svg>');
}

/* The five blocks of a communication system, source to destination. */
function figSystem(){
  /* The sending end runs along the top, the receiving end back along the
     bottom, and the channel joins them on the right. Each block is named and
     glossed in one short muted line, and under it sits a sketch of the signal
     it hands on or takes in: the bits of m, the pulses of s(t), the noisy r(t)
     and the bits of the estimate, one of them wrong. The channel is drawn in
     the channel colour, the signals sent in the transmitted colour and the
     signals received in the received colour. */
  const bw = 160, bh = 88, top = 110, bot = 330, it = [], extra = [];
  const block = (x, y, w, h, name, gloss, color) => {
    it.push({t:'box',x,y,w,h,label:'',color});
    it.push({t:'text',x:x+w/2,y:y+h/2-2,label:name,fs:17,color:C.ink});
    it.push({t:'text',x:x+w/2,y:y+h/2+22,label:gloss,fs:13});
  };
  block(20, top-bh/2, bw, bh, 'Source', 'speech, text, data');
  block(250, top-bh/2, bw, bh, 'Transmitter', 'message to signal');
  block(480, top-bh/2, 144, bot-top+bh, 'Channel', 'cable, fibre, radio', C.h);
  block(250, bot-bh/2, bw, bh, 'Receiver', 'signal to estimate');
  block(20, bot-bh/2, bw, bh, 'Destination', 'person or machine');
  [[180,250,top,'m',C.in], [410,480,top,'s(t)',C.in],
   [480,410,bot,'r(t)',C.out], [250,180,bot,'\\hat m',C.out]].forEach(([a,b,y,s,col])=>{
    it.push({t:'arrow',x1:a,y1:y,x2:b,y2:y});
    it.push({t:'text',x:(a+b)/2,y:y-18,label:s,tex:true,fs:19,color:col});
  });
  /* the signal sketches: eight bits, 17.5 px each, on a hairline zero line */
  const bits = [1,0,1,1,0,0,1,0], A = 17, bx = x => x+10, bs = 17.5;
  const zero = (x, y) => extra.push(`<path d="M${bx(x)},${y}h${8*bs}" stroke="${C.rule}" stroke-width="1"/>`);
  const stems = (x, y, col, wrong) => { zero(x, y); bits.forEach((v,k)=>{
    const b = k===wrong ? 1-v : v, c = k===wrong ? C.err : col, cx = bx(x)+bs*(k+0.5), cy = y-(b?A:-A);
    extra.push(`<path d="M${cx},${y}V${cy}" stroke="${c}" stroke-width="1.8"/>`,
      P.stemTip(cx, cy, 3, b?1:-1, c)); }); };
  const pulses = (x, y, col, sd) => {
    const g = rng(sd||1); let d = '';
    for(let k=0;k<8;k++) for(let j=0;j<=7;j++){
      const px = bx(x)+bs*k+j*bs/7, py = y-(bits[k]?A:-A)+(sd?1.8*g():0);
      d += (d?' L':'M')+px.toFixed(1)+','+py.toFixed(1);
    }
    zero(x, y);
    extra.push(`<path d="${d}" fill="none" stroke="${col}" stroke-width="1.8" stroke-linejoin="round"/>`);
  };
  const gy = h => h+bh/2+44;
  stems(20, gy(top), C.in);          /* m */
  pulses(250, gy(top), C.in);        /* s(t) */
  pulses(250, gy(bot), C.out, 5);    /* r(t) */
  stems(20, gy(bot), C.out, 5);      /* the estimate, one bit wrong */
  /* noise: a short seeded trace in the hairline tone, fed into the channel */
  const g = rng(3), cy = (top+bot)/2, nx = 712;
  let d = `M${nx},${cy-46}`;
  for(let k=1;k<=46;k++) d += ` L${(nx+5*g()).toFixed(1)},${cy-46+2*k}`;
  it.push({t:'line',d,color:C.noise});
  it.push({t:'arrow',x1:nx-18,y1:cy,x2:624,y2:cy});
  it.push({t:'text',x:nx,y:cy+76,label:'noise',fs:15});
  return P.blocks({w:740,h:gy(bot)+A+16,items:it}).replace('</svg>', extra.join('')+'</svg>');
}

/* Every trace here crosses its zero line, so the time numbers are set under
   the data area instead of on the axis. */
function ticksBelow(a, xs, y){ xs.forEach(x => a.note(x, y, String(x), {dy:20, anchor:'middle', fs:13.5})); }

/* An analog message above, and the same message as a finite alphabet below. */
function figAnalogDigital(){
  const m = t => 0.8*Math.sin(2*Math.PI*0.9*t) + 0.35*Math.sin(2*Math.PI*2.1*t+0.7);
  const a = P.Axes({w:720,h:200,xr:[0,4],yr:[-1.4,1.4],xlabel:'t\\;(\\text{ms})',ylabel:'m(t)',
    pad:{l:56,r:26,t:20,b:38},xstep:1,ytarget:3,xtickfmt:()=>''});
  a.curve(m,{color:C.in});
  ticksBelow(a,[1,2,3],-1.4);
  const b = P.Axes({w:720,h:200,xr:[0,4],yr:[-1.4,1.4],xlabel:'t\\;(\\text{ms})',ylabel:'m_\\delta(t)',
    pad:{l:56,r:26,t:20,b:38},xstep:1,ytarget:3,xtickfmt:()=>''});
  ticksBelow(b,[1,2,3],-1.4);
  /* four levels, so every sample is one of four symbols, two bits each */
  const lv = [-1.05,-0.35,0.35,1.05], q = v => lv.reduce((p,c)=>Math.abs(c-v)<Math.abs(p-v)?c:p);
  lv.forEach(v=>b.hline(v,{color:C.grid,width:1}));
  const pts=[]; for(let n=0;n<=16;n++) pts.push([n*0.25, q(m(n*0.25))]);
  b.stem(pts,{color:C.mid});
  return {a:a.svg(), b:b.svg()};
}

/* --- the everyday digital signals of 0.5. One bit pattern runs through all
       four: sent as a pulse train, received with noise, sampled once a bit. */
const BITS = [1,0,1,1,0,0,1,0,1,1];
const sBits = t => { const k = Math.floor(t); return (k>=0 && k<BITS.length) ? (BITS[k]?1:-1) : 0; };
function signalExamples(){
  const opt=(o)=>Object.assign({w:520,h:250,pad:{l:56,r:26,t:24,b:40},ytarget:3,xtickfmt:()=>''},o);
  /* telephone speech, read 8000 times a second */
  const voice = t => 0.7*Math.sin(2*Math.PI*0.35*t) + 0.35*Math.sin(2*Math.PI*0.9*t+1) + 0.2*Math.sin(2*Math.PI*1.6*t+2);
  const a = P.Axes(opt({xr:[0,32],yr:[-1.4,1.4],xlabel:'n',ylabel:'x[n]',xstep:8}));
  const pa=[]; for(let n=0;n<=32;n++) pa.push([n, voice(n*0.125)]); a.stem(pa,{color:C.mid});
  ticksBelow(a,[8,16,24],-1.4);
  /* a pulse train on a cable, one bit a microsecond */
  const b = P.Axes(opt({xr:[0,10],yr:[-1.6,1.6],xlabel:'t\\;(\\mu\\text{s})',ylabel:'s(t)\\;(\\text{V})',xstep:2}));
  b.curve(sBits,{color:C.in,n:2000});
  ticksBelow(b,[2,4,6,8],-1.6);
  /* the same pulse train after the channel; the noise is drawn at a coarser
     step than the curve and joined by straight lines, as a scope shows it */
  const g = rng(7), N = 240, w = []; for(let i=0;i<=N;i++) w.push(0.24*g());
  const wAt = t => { const u = t/10*N, i = Math.min(N-1, Math.floor(u)); return w[i] + (u-i)*(w[i+1]-w[i]); };
  const c = P.Axes(opt({xr:[0,10],yr:[-1.9,1.9],xlabel:'t\\;(\\mu\\text{s})',ylabel:'r(t)\\;(\\text{V})',xstep:2}));
  c.curve(t => sBits(Math.min(t,9.999)) + wAt(t), {color:C.out,n:1600});
  ticksBelow(c,[2,4,6,8],-1.9);
  /* one sample a bit, at the middle of each pulse */
  const d = P.Axes(opt({xr:[-0.5,9.5],yr:[-1.9,1.9],xlabel:'k',ylabel:'y[k]',xstep:2}));
  const pd = BITS.map((_,k)=>[k, sBits(k+0.5) + wAt(k+0.5)]);
  d.stem(pd,{color:C.out});
  ticksBelow(d,[2,4,6,8],-1.9);
  return {a:a.svg(),b:b.svg(),c:c.svg(),d:d.svg()};
}

/* --- course concept map: the nodes form the teaching path, and selecting one
       names the prerequisite it uses and the next question it unlocks. --- */
const COURSE_PATH = CONTENT.COURSE_PATH = [
  {m:'M1', t:'Analog to digital', label:['Analog to','digital'], s:'sampling · quantization · PCM',
   dep:'Start here: a message from a microphone or a sensor is an analog signal.',
   add:'Sample it, round each sample to one of a finite set of levels, and write each level as bits.',
   next:'Module 2 sends those bits as pulses over a channel.'},
  {m:'M2', t:'Baseband transmission', label:['Baseband','transmission'], s:'matched filter · ISI · Nyquist',
   dep:'Use the bit stream that pulse-code modulation produces in Module 1.',
   add:'Detect a pulse in noise with the matched filter, and shape pulses so that neighbours do not interfere.',
   next:'Module 3 describes every waveform the receiver can see as a point in space.'},
  {m:'M3', t:'Geometric representation', label:['Geometric','representation'], s:'signal space · distance',
   dep:'Keep the energy and correlation ideas from the matched filter of Module 2.',
   add:'Write each waveform as a vector. Energy becomes a squared length, and difference becomes a distance.',
   next:'Module 4 uses that distance to make the best decision.'},
  {m:'M4', t:'The optimal receiver', label:['Optimal','receiver'], s:'MAP · ML · union bound',
   dep:'Use the signal points and distances from Module 3.',
   add:'Derive the decision rule that makes the fewest errors in white Gaussian noise, and bound its error probability.',
   next:'Module 5 applies the rule to the modulation methods used in practice.'},
  {m:'M5', t:'Digital modulation', label:['Digital','modulation'], s:'PAM · PSK · QAM · FSK',
   dep:'Take the receiver and the union bound of Module 4 without change.',
   add:'Place the points of each modulation method, measure their distances, and read the error probability.',
   next:'Module 6 asks how many bits the message needed in the first place.'},
  {m:'M6', t:'Information theory', label:['Information','theory'], s:'entropy · source coding · Huffman',
   dep:'Return to the source of Module 1 and look at the symbols it produces.',
   add:'Measure information with entropy, and build the shortest prefix code with Huffman coding.',
   next:'The path closes where it began: at the source that the whole system serves.'}
];

/* A node label is drawn over its own disc, with the orbit and a spoke behind it,
   so it carries the halo every figure label carries. */
const MAPHALO = 'paint-order="stroke" stroke="var(--fig-halo,#FFFFFF)"'
  + ' stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"';

function conceptMap(){
  const cx=500, cy=300, R=222, nodeR=78;
  const g=[];
  /* The orbit is cut into one arc between neighbours, each stopping clear of
     the disc it runs into, so nothing drawn crosses a label. */
  const N=COURSE_PATH.length, ang=i=>(-90+i*360/N)*Math.PI/180;
  const gap=Math.asin(Math.min(1,(nodeR+6)/R));
  for(let i=0;i<N;i++){
    const a0=ang(i)+gap, a1=ang(i+1)-gap;
    if(a1<=a0) continue;
    const p0=[cx+R*Math.cos(a0), cy+R*Math.sin(a0)], p1=[cx+R*Math.cos(a1), cy+R*Math.sin(a1)];
    g.push(`<path class="course-orbit" d="M${p0[0].toFixed(1)},${p0[1].toFixed(1)} A${R},${R} 0 0 1 ${p1[0].toFixed(1)},${p1[1].toFixed(1)}"/>`);
  }
  g.push(`<circle class="course-core" cx="${cx}" cy="${cy}" r="92"/>`);
  g.push(`<text class="course-core-k" x="${cx}" y="${cy-12}" text-anchor="middle">M0</text>`);
  g.push(`<text class="course-core-t" x="${cx}" y="${cy+20}" text-anchor="middle">orientation</text>`);
  COURSE_PATH.forEach((n,i)=>{
    const a=ang(i);
    const x=cx+R*Math.cos(a), y=cy+R*Math.sin(a);
    const x0=cx+94*Math.cos(a), y0=cy+94*Math.sin(a);
    const x1=cx+(R-nodeR-4)*Math.cos(a), y1=cy+(R-nodeR-4)*Math.sin(a);
    g.push(`<line class="course-spoke" style="--i:${i}" x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}"/>`);
    const lines=n.label||[n.t];
    const title=lines.map((line,j)=>`<text class="course-node-title" ${MAPHALO} x="${x.toFixed(1)}" y="${(y-(lines.length===1?4:17)+j*26).toFixed(1)}" text-anchor="middle">${line}</text>`).join('');
    const idY=y+(lines.length===1?25:40);
    g.push(`<g class="course-node${i===0?' is-active':''}" style="--i:${i}" data-course-node="${n.m}" role="button" tabindex="0" aria-label="${n.m}: ${n.t}" aria-pressed="${i===0?'true':'false'}">
      <circle class="course-node-disc" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${nodeR}"/>
      ${title}
      <text class="course-node-id" ${MAPHALO} x="${x.toFixed(1)}" y="${idY.toFixed(1)}" text-anchor="middle">${n.m}</text>
    </g>`);
  });
  return `<svg class="course-map-svg" viewBox="190 -10 620 620" xmlns="http://www.w3.org/2000/svg" aria-label="Interactive course map. Select a module to read its place in the course." font-family="var(--sans)">${g.join('')}</svg>`;
}

function courseMapPanel(){
  const buttons = COURSE_PATH.map((n,i)=>`<button class="course-path-btn${i===0?' is-active':''}" data-course-node="${n.m}" aria-pressed="${i===0?'true':'false'}">${n.m}</button>`).join('');
  return `<section class="course-map-panel" data-course-map-panel aria-live="polite">
    <p class="course-map-kicker">THE LEARNING PATH <span>01 / ${String(COURSE_PATH.length).padStart(2,'0')}</span></p>
    <h3>${COURSE_PATH[0].t}</h3>
    <p class="course-map-topic">${COURSE_PATH[0].s}</p>
    <div class="course-map-copy"><p><b>Uses.</b> ${COURSE_PATH[0].dep}</p><p><b>Adds.</b> ${COURSE_PATH[0].add}</p><p><b>Leads to.</b> ${COURSE_PATH[0].next}</p></div>
    <div class="course-map-controls" aria-label="Choose a module">${buttons}</div>
    <p class="course-map-hint">Select a node or module label to follow the dependency chain.</p>
  </section>`;
}

const SC = [

/* The cover takes no address. It is left out of `CONTENT.SECTIONS`, and an
   address is derived only for a scene that is declared there. */
{ id:'title', module:'M0', nav:'Title', title:'Digital Communications',
  keywords:'title cover version', steps:0, blocks:[
  {t:'stack', style:'justify-content:center;flex:1;align-items:flex-start', items:[
    {t:'eyebrow', text:'Interactive learning artifact · Modules 0–6'},
    {t:'title', level:1, text:'Digital Communications'},
    {t:'lede', text:'A digital communication system carries a finite alphabet of symbols across a channel that adds noise to everything it carries. The course studies how those symbols are chosen, how they are recovered, and how often the recovery is wrong.'},
    {t:'raw', html:()=>`<div style="margin:22px 0 26px;width:1100px;max-width:100%">${figChain()}</div>`}
  ]}
]},

{ id:'m0-system', module:'M0', nav:'A communication system', title:'A communication system',
  objective:'Name the five blocks of a communication system before any mathematics.',
  keywords:'communication system source transmitter channel receiver destination message noise',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 0 · Orientation'},
  {t:'title', text:'A Communication System'},
  {t:'cols', ratio:'c-7-5', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figSystem,
      caption:'The source produces a message $m$. The receiver gives an estimate $\\hat m$ of it to the destination.'}
  ], right:[
    {t:'note', kind:'def', head:'Definition', html:'A communication system carries a <b>message</b> from a <b>source</b> to a <b>destination</b> that is somewhere else.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Three working blocks', html:'The <b>transmitter</b> turns the message into a signal $s(t)$ the channel can carry. The <b>channel</b> is the cable, fibre or radio path. The <b>receiver</b> recovers the message from $r(t)$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'The channel is given', html:'We design the transmitter and the receiver. The channel and its noise are given to us, so $\\hat m$ can differ from $m$.'}]}
  ]}
]},

{ id:'m0-digital', module:'M0', nav:'Analog and digital messages', title:'Analog and digital messages',
  objective:'Separate an analog message from a digital one: a finite alphabet of symbols.',
  keywords:'analog digital message finite alphabet symbol bit sampling quantization levels',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 0 · Orientation'},
  {t:'title', text:'Analog and Digital Messages'},
  {t:'cols', ratio:'c-7-5', fill:true, left:[
    {t:'fig', frame:true, svg:()=>figAnalogDigital().a,
      caption:'An analog message $m(t)$ takes any value at any time.'},
    {t:'fig', frame:true, svg:()=>figAnalogDigital().b,
      caption:'The same message read every $0.25\\ \\text{ms}$ and rounded to one of four levels. Each level is one of $M=4$ symbols.'}
  ], right:[
    {t:'note', kind:'def', head:'Analog message', html:'An <b>analog</b> message, such as a voice or a temperature, can take any value in a range.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Digital message', html:'A <b>digital</b> message is a sequence of symbols from a finite set of $M$ symbols. With $M=4$, each symbol carries $\\log_2 4=2$ bits.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'The waveform is still continuous', html:'A digital message is sent as a continuous-time waveform. "Digital" describes the message, not the signal on the wire.'}]}
  ]}
]},

{ id:'m0-open', module:'M0', nav:'The communication problem', title:'The communication problem',
  objective:'State the question the whole course answers before any machinery is introduced.',
  keywords:'opening digital communication noise decision error probability transmitter receiver',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 0 · Orientation'},
  {t:'title', text:'The Communication Problem'},
  {t:'cols', ratio:'c-7-5', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:figChainPlay,
      frames:{labels:['bits $b_k$','$s_i(t)$','$w(t)$','$r(t)=s_i(t)+w(t)$','sample at $t_k$','decide $\\hat b_k$']},
      caption:'Step through the frames. The transmitter sends one pulse per bit, and the channel adds noise. The receiver samples $r(t)$ once per bit and decides $1$ above zero and $0$ below. At this noise level every bit is decided correctly.'}
  ], right:[
    {t:'note', kind:'def', head:'The problem', html:'The receiver sees $r(t)=s_i(t)+w(t)$, where $w(t)$ is noise. It must decide which of the $M$ symbols was sent.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'White Gaussian noise', html:'The noise $w(t)$ is white and Gaussian with two-sided power spectral density $N_0/2$. The best decision then picks the nearest signal point.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Main result', html:'The distance between signal points controls the error probability. Almost every error probability in the course has the form $Q(\\text{distance}/\\sqrt{2N_0})$.'}]}
  ]}
]},

{ id:'m0-why', module:'M0', nav:'Digital transmission', title:'Digital transmission',
  objective:'Give the one reason digital transmission is used, and its price.',
  keywords:'why digital regeneration repeater noise accumulation bandwidth quantization',
  slide:true, steps:2, blocks:[
  {t:'eyebrow', text:'Module 0 · Orientation'},
  {t:'title', text:'Digital Transmission'},
  {t:'cols', ratio:'c-7-5', fill:true, left:[
    {t:'fig', frame:true, grow:true, svg:()=>{
      const a = P.Axes({w:600,h:380,xr:[0,20],yr:[0,21],
        xlabel:'\\text{hops}', ylabel:'\\text{accumulated noise}',
        pad:{l:64,r:22,t:24,b:44}, xtarget:5, ytarget:5});
      a.curve(n=>n, {color:C.err, width:2.2});
      a.hline(1, {color:C.in, width:2.2});
      a.note(12.6, 15.4, 'analog', {fs:13, color:C.err});
      a.note(18.6, 3.0, 'digital, regenerated', {fs:13, color:C.in, anchor:'end'});
      return a.svg();
    },
      caption:'Noise power against the number of hops. An analog link adds noise at each hop. A digital link starts clean after each correct decision.'}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      /* three hops: two repeaters between the two ends. Each station is a
         sphere in its own colour, lit from the upper left, with its name and
         its job under it; the hop number rides on a pill above the span. */
      const r = 25, step = 182, cy = 62, it = [], extra = [];
      const nodes = [['Transmitter','sends','in'], ['Repeater','regenerates','h'],
                     ['Repeater','regenerates','h'], ['Receiver','decides','out']];
      nodes.forEach(([name,gloss,k],i)=>{
        const x = 62+i*step;
        extra.push(`<ellipse cx="${x}" cy="${cy+r+5}" rx="${r*0.8}" ry="4" fill="#000" opacity=".22"/>`,
          `<circle cx="${x}" cy="${cy}" r="${r}" fill="${C[k]}"/>`,
          `<circle cx="${x}" cy="${cy}" r="${r}" fill="url(#hopshade)"/>`,
          `<circle cx="${x}" cy="${cy}" r="${r}" fill="url(#hophi)"/>`);
        it.push({t:'text',x,y:cy+r+26,label:name,fs:14,color:C.ink});
        it.push({t:'text',x,y:cy+r+43,label:gloss,fs:11.5});
        if(i<3){
          const a = x+r, b = x+step-r, m = (a+b)/2;
          it.push({t:'arrow',x1:a+6,y1:cy,x2:b-6,y2:cy,color:C.muted});
          extra.push(`<rect x="${m-23}" y="${cy-34}" width="46" height="20" rx="10" fill="${C.plate}" stroke="${C.ruleStrong}" stroke-width="1"/>`);
          it.push({t:'text',x:m,y:cy-20,label:'hop '+(i+1),fs:12,color:C.h});
        }
      });
      const svg = P.blocks({w:668,h:cy+r+52,items:it});
      const at = svg.indexOf('>')+1;
      return svg.slice(0,at)
        + `<defs><radialGradient id="hophi" cx=".36" cy=".3" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`
        + `<radialGradient id="hopshade" cx=".4" cy=".35" r=".7"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></radialGradient></defs>`
        + extra.join('') + svg.slice(at);
    },
      caption:'A long link is cut into hops. At the end of each hop a repeater restores the signal and sends it on.'},
    {t:'note', kind:'def', head:'Analog repeaters', html:'An amplifier cannot tell the signal from the noise, so it amplifies both. After twenty hops the noise has been added twenty times.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Regeneration', html:'A digital repeater decides which symbol was sent and sends a clean copy. The flat line holds only while decisions are correct, so a bit error probability of $10^{-9}$ is needed, not $10^{-2}$.'}]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Costs', html:'Sharp pulses need more <b>bandwidth</b>. Rounding a sample to a level loses <b>accuracy</b>. Module 1 studies the rounding and Module 2 the bandwidth.'}]}
  ]}
]},

{ id:'m0-examples', module:'M0', nav:'Digital signals around us', title:'Digital signals around us',
  objective:'Connect the words symbol, pulse, noise and sample to signals students already know.',
  keywords:'examples telephone speech samples pulse train cable noise received samples bits',
  budget:'A gallery of four everyday signals, two continuous and two discrete. Each figure is one example.',
  slide:true, steps:1, blocks:[
  {t:'eyebrow', text:'Module 0 · Orientation'},
  {t:'title', text:'Digital Signals Around Us'},
  {t:'cols', ratio:'c-8-4', fill:true, left:[
    {t:'grid', cols:2, gap:'18px 22px', items:[
      [{t:'fig', frame:true, svg:()=>signalExamples().a, caption:'Telephone speech read $8000$ times a second: $x[n]=x(nT_s)$ with $T_s=125\\ \\mu\\text{s}$.'}],
      [{t:'fig', frame:true, svg:()=>signalExamples().b, caption:'Bits on a cable, one pulse each: $s(t)=\\sum_k a_k\\,p(t-kT_b)$ with $a_k=\\pm1\\ \\text{V}$.'}],
      [{t:'fig', frame:true, svg:()=>signalExamples().c, caption:'The same pulses at the far end of the cable: $r(t)=s(t)+w(t)$.'}],
      [{t:'fig', frame:true, svg:()=>signalExamples().d, caption:'One sample in the middle of each pulse: $y[k]=a_k+w_k$. Its sign gives the bit.'}]
    ]}
  ], right:[
    {t:'note', kind:'def', head:'Continuous time', html:'The pulse train $s(t)$ and the received signal $r(t)$ exist at every instant. They are the waveforms in the channel.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'Discrete time', html:'Speech samples $x[n]$ and receiver samples $y[k]$ hold one value per step. The receiver decides each bit from one number $y[k]$.'}]}
  ]}
]},

{ id:'m0-apps', module:'M0', nav:'Digital communications in daily life', title:'Digital communications in daily life',
  objective:'Show the systems where the methods of the course are used every day.',
  keywords:'applications mobile phone cellular wifi router gps navigation optical fibre satellite television bluetooth earbuds',
  budget:'A gallery of six photographs, one system each. Each caption names what is sent and how.',
  slide:true, steps:1, blocks:[
  {t:'eyebrow', text:'Module 0 · Orientation'},
  {t:'title', text:'Digital Communications in Daily Life'},
  {t:'cols', ratio:'c-8-4', fill:true, left:[
    {t:'grid', cols:3, gap:'16px 20px', items:[
      [{t:'fig', svg:()=>photo('phone','A hand holding a smartphone on a city street with a cellular mast behind'), caption:'Mobile phones: speech and data travel as QAM symbols between the phone and a base station.'}],
      [{t:'fig', svg:()=>photo('wifi','A home wireless router on a shelf with a laptop nearby'), caption:'Wi-Fi: the router uses more QAM points when the signal is strong and fewer when it is weak.'}],
      [{t:'fig', svg:()=>photo('gps','A phone on a car dashboard showing a route on a map'), caption:'Navigation: GPS satellites send BPSK signals that arrive weaker than the noise.'}],
      [{t:'fig', svg:()=>photo('fibre','Fibre-optic cables plugged into a data-centre panel'), caption:'Optical fibre: many links send bits as pulses of light, on for 1 and off for 0.'}],
      [{t:'fig', svg:()=>photo('satellite','A satellite dish on a rooftop at dusk'), caption:'Satellite television: the dish receives PSK symbols from a satellite far above the equator.'}],
      [{t:'fig', svg:()=>photo('bluetooth','Wireless earbuds in a charging case beside a phone'), caption:'Bluetooth: earbuds receive audio as frequency-shift keying, one frequency for each symbol.'}]
    ]}
  ], right:[
    {t:'note', kind:'def', head:'One picture for all', html:'Each photograph hides the same diagram: a transmitter, a noisy channel and a receiver that decides.'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'One set of tools', html:'Signal space, the optimal receiver and the error probability describe all six systems. Modules 3 to 5 build these tools.'}]}
  ]}
]},

{ id:'m0-books', module:'M0', nav:'Course textbooks', title:'Course textbooks',
  objective:'Name the main textbook and two books for further reading.',
  keywords:'textbook book reference Haykin Moher Proakis Salehi communication systems reading',
  budget:'Three book covers with their full references.',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 0 · Orientation'},
  {t:'title', text:'Course Textbooks'},
  {t:'grid', cols:3, gap:'28px 40px', style:'flex:1;min-height:0;align-items:start;', items:[
    [{t:'fig', svg:()=>cover('book-haykin-moher','Cover of Communication Systems, fifth edition, by Simon Haykin and Michael Moher'),
      caption:'<b>Main textbook.</b> S. Haykin and M. Moher, <i>Communication Systems</i>, 5th ed., International Student Version. Hoboken, NJ: Wiley, 2010.'}],
    [{t:'fig', svg:()=>cover('book-proakis-salehi','Cover of Fundamentals of Communication Systems, second edition, by John G. Proakis and Masoud Salehi'),
      caption:'<b>Further reading.</b> J. G. Proakis and M. Salehi, <i>Fundamentals of Communication Systems</i>, 2nd ed., Global Edition. Harlow: Pearson, 2015.'}],
    [{t:'fig', svg:()=>cover('book-haykin-digital','Cover of Digital Communication Systems by Simon Haykin'),
      caption:'<b>Further reading.</b> S. Haykin, <i>Digital Communication Systems</i>. Hoboken, NJ: Wiley, 2014.'}]
  ]}
]},

{ id:'m0-map', module:'M0', nav:'Course concept map', title:'Course concept map',
  objective:'Give a single mental picture of the dependency structure.',
  keywords:'course map modules overview structure dependencies sampling baseband signal space receiver modulation information',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 0 · Orientation'},
  {t:'title', text:'Course Structure'},
  {t:'cols', ratio:'c-7-5', vcenter:true, left:[
    {t:'fig', svg:conceptMap}
  ], right:[
    {t:'raw', html:courseMapPanel}
  ]}
]},

{ id:'m0-howto', module:'M0', nav:'Using the course artifact', title:'Using the course artifact',
  objective:'Explain modes, controls, the textbook anchors and the fixed conventions.',
  keywords:'help navigation modes instructor student reduced motion privacy conventions anchors textbook',
  slide:true, steps:0, blocks:[
  {t:'eyebrow', text:'Module 0 · Orientation'},
  {t:'title', text:'Using the Course Artifact'},
  {t:'grid', cols:3, gap:'30px 28px', style:'flex:1;min-height:0;grid-auto-rows:1fr;', items:[
    [{t:'note', kind:'def', head:'Navigation', html:'<kbd>→</kbd> or <kbd>space</kbd> gives the next state, and <kbd>←</kbd> goes back one. <kbd>↑</kbd> and <kbd>↓</kbd> move a whole scene, and <kbd>Home</kbd> returns to the title.'}],
    [{t:'note', kind:'def', head:'Keys', html:'<kbd>M</kbd> map, <kbd>/</kbd> search, <kbd>G</kbd> glossary, <kbd>?</kbd> help. <kbd>L</kbd> study mode, <kbd>I</kbd> edition, <kbd>R</kbd> reduced motion.'}],
    [{t:'note', kind:'def', head:'Two modes', html:'<b>Lecture mode</b> returns to the last state of the previous scene, so a finished derivation stays finished. <b>Self-study mode</b> returns to the first state, so you can work through it again.'}],
    [{t:'note', kind:'def', head:'Two editions', html:'The <b>student edition</b> hides solutions until you ask for them. The <b>instructor edition</b> shows presenter notes, error warnings and every solution.'}],
    [{t:'note', kind:'warn', head:'Textbook anchors', html:'The band above the title gives the course address. An open book and a number such as <b>PS CH8.4.1</b> give the matching section in Proakis and Salehi, <em>Fundamentals of Communication Systems</em>, 2nd edition.'}],
    [{t:'note', kind:'warn', head:'Conventions', html:'Noise is white and Gaussian with two-sided density $N_0/2$. $Q(x)=\\tfrac12\\operatorname{erfc}(x/\\sqrt2)$, and $\\log$ means base two unless a base is written.'}]
  ]},
  {t:'note', kind:'ok', head:'Privacy and offline use', html:'The artifact is one file. It uses no network and keeps your progress only on this device. <button class="btn" data-act="reset" style="margin-left:14px">Reset all local progress</button>'}
]}

];

window.SCENES_M0 = SC;
})();
