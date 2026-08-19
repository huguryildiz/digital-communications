/* ==========================================================================
   Module 1 — Sampling, quantization and pulse code modulation.

   The chain that turns a continuous waveform into a bit stream, in the order
   the three operations are applied: sample, quantize, encode. Sampling is the
   only one of the three that is reversible, and the module is arranged so that
   the reader meets that fact rather than being told it.

   Colour, as everywhere in this course: cyan is the message, violet an
   intermediate quantity — a sampled or quantized value — amber a filter, green
   the recovered signal, red an error. Noise takes no colour of its own.
   ========================================================================== */
(function(){
const P = PLOT, C = P.COL;

/* ---- the shared shapes of this module -----------------------------------
   One triangular spectrum stands for "a signal bandlimited to W" throughout,
   so the reader recognises the same object in the sampled spectrum, in the
   three cases and in the reconstruction figure. */
const tri = (f,W,h) => Math.abs(f) < W ? h*(1-Math.abs(f)/W) : 0;

/* One copy of that spectrum in a sampled-spectrum figure, drawn from its own
   three corners instead of from tri() sampled across the whole axis. tri() is
   zero outside its band and curve() draws that zero, so every copy laid a
   coloured line along the axis and the axis of G_delta(f) came out in the
   colour of the signal. Drawn from its corners a copy stops where its band
   stops. Corners outside the view are clipped, so a partial copy at the edge
   still enters from the edge. */
const copy = (a, c, W, peak, opts) => a.poly([[c-W,0],[c,peak],[c+W,0]], opts);

/* The message used in every time-domain figure of the sampling sections. It is
   drawn from its own definition rather than from a table of points, so the
   samples in one figure and the curve in the next cannot drift apart. */
const g = t => 0.85*Math.sin(1.15*t) + 0.35*Math.sin(2.7*t + 0.8);

/* Sampling is a product of two signals, so it is drawn as three panels on one
   time axis: the message, the train that multiplies it, and the product. The
   panels share w, xr and pad.l, so a sample instant sits at the same place in
   all three and the reader can read straight down a column. Each panel names
   itself on its own axis, so no panel needs a label inside the drawing. */
function figSamplingStack(){
  const Ts = 1.0, N = 10;
  const common = {w:660, xr:[-0.4,10.4], xtarget:6, pad:{l:52,r:26,t:24,b:16}};
  const mute = f => Object.assign({}, common, f);

  /* 1 — the message */
  const a = P.Axes(mute({h:150, yr:[-1.45,1.55], ylabel:'g(t)', ytarget:4}));
  a.curve(g,{color:C.in});

  /* 2 — the sampling train. Every impulse has weight one: the train carries no
     information, it only marks the instants. */
  const b = P.Axes(mute({h:120, yr:[-0.45,1.60], ylabel:'p(t)', ytarget:2}));
  for(let n=0;n<=N;n++) b.impulse(n*Ts, 1, {color:C.h, label:false});
  b.span(4*Ts, 5*Ts, 1.28, 'T_s', {tex:true, fs:13, color:C.h});

  /* 3 — the product. The message is repeated as a dashed line, because the
     height of each impulse is read off it. */
  const c = P.Axes(mute({h:168, yr:[-1.45,1.55], xlabel:'t',
    ylabel:'g_\\delta(t)=g(t)\\,p(t)', ytarget:4, pad:{l:52,r:26,t:24,b:16}}));
  c.curve(g,{color:C.in, width:1.4, dash:'4 6', opacity:0.55});
  for(let n=0;n<=N;n++) c.impulse(n*Ts, g(n*Ts), {color:C.mid, label:false});

  return a.svg() + b.svg() + c.svg();
}

/* The pair drawn in the replication scene: the message spectrum, and the same
   spectrum after sampling. The two panels share w, xr and pad.l, so a frequency
   sits at the same place in both and the reader can read straight down and see
   which shape was copied. The sampled spectrum is one signal, so every copy in
   it takes one colour; and its axis is marked at f_s, because f_s is what sets
   where the copies land. */
function figSpectrumPair(){
  const W = 1, fs = 3, top = fs;
  const common = {w:640, xr:[-3.3*W,3.3*W], xlabel:'f', xtarget:6,
                  pad:{l:52,r:26,t:22,b:40}, ytickfmt:()=>''};
  const sgn = v => v<0 ? '-' : '';

  const a = P.Axes(Object.assign({}, common, {h:150, yr:[-0.12,1.34],
    ylabel:'G(f)', ytarget:2,
    xticksOverride:[-W,W], xtickfmt:v=>sgn(v)+'W'}));
  a.curve(f=>tri(f,W,1),{color:C.in,width:2.4});

  const b = P.Axes(Object.assign({}, common, {h:210, yr:[-0.12*top,1.28*top],
    ylabel:'G_\\delta(f)', ytarget:3,
    xticksOverride:[-fs,-W,W,fs],
    xtickfmt:v=>sgn(v)+(Math.abs(Math.abs(v)-fs)<1e-9 ? 'f\u209b' : 'W')}));
  for(let n=-3;n<=3;n++) copy(b, n*fs, W, fs, {color:C.mid,width:2.2});

  return {msg:a.svg(), sampled:b.svg()};
}

function figReplicas(fs, W, label){
  const h = 1.0, top = fs*h;
  const a = P.Axes({w:640,h:220,xr:[-3.3*W,3.3*W],yr:[-0.12*top,1.28*top],
    xlabel:'f',ylabel:'G_\\delta(f)',pad:{l:52,r:26,t:24,b:40},
    xtarget:6,ytarget:3,xtickfmt:v=>P.fmt(v/W,2)+'W',ytickfmt:()=>''});
  for(let n=-3;n<=3;n++)
    copy(a, n*fs, W, fs*h, {color:C.mid,width:2.2});
  if(label) a.note(0,1.12*top,label,{tex:true,fs:14,color:C.muted,anchor:'middle'});
  return a;
}

function figCase(kind){
  const W = 1;
  const fs = kind==='over' ? 3 : kind==='nyq' ? 2 : 1.5;
  const a = figReplicas(fs, W, null);
  if(kind==='over'){
    /* The gap between the edge of the message and the edge of the first
       replica is the guard band. It is a distance, not a signal, so the
       bracket takes the muted label tone and no signal colour. */
    for(const c of [-1,1])
      a.span(c*W, c*(fs-W), 0.14*fs, c>0?'\\text{guard band }(f_g)':null, {tex:true, fs:12, color:C.muted});
  }
  if(kind==='under'){
    /* The overlap is the error, so it takes the error colour and nothing else
       in the figure does. It is filled between the edges of the two triangles
       that actually meet, not across the whole replica: an area drawn over the
       full width runs along the axis wherever the smaller of the two is zero,
       and a red line under the whole spectrum says the wrong thing. */
    for(const c of [-1,1])
      a.area(f=>Math.min(fs*tri(f,W,1), fs*tri(f-c*fs,W,1)),
             Math.max(-W, c*fs-W), Math.min(W, c*fs+W),
             {color:C.dec.err, stroke:C.err});
    /* A ring around each overlap points at the aliasing the fill marks. The
       ring is drawn through raw() because the plot kit has no ellipse, so its
       radii are computed here from the same geometry as the fill: the overlap
       is centred at f_s/2 and its peak is the height of either triangle there. */
    const pk = fs*(1 - fs/(2*W));
    for(const c of [-1,1]){
      const cx = a.sx(c*fs/2), cy = a.sy(pk/2);
      const rx = a.sx(c*fs/2 + (W - fs/2) + 0.12) - cx;
      const ry = cy - a.sy(pk/2 + pk/2 + 0.08);
      a.raw(`<ellipse cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" rx="${Math.abs(rx).toFixed(2)}" ry="${Math.abs(ry).toFixed(2)}"
        fill="none" stroke="${C.err}" stroke-width="1.8"/>`);
    }
    /* One label for the pair, set at the height labels take in this figure
       family, where nothing is drawn, and joined to the right-hand ring by a
       leader. The leader stops above the point where the two triangles cross,
       so it stands in empty space and covers no curve. */
    a.note(fs/2, 1.12*fs, '\\text{aliasing}', {tex:true, fs:12, color:C.err, anchor:'middle'});
    a.poly([[fs/2, 1.05*fs],[fs/2, pk + 0.13]],
           {color:C.err, width:1, dash:'3 3'});
  }
  return a.svg();
}

function figLpf(){
  const W = 1, fs = 2, top = fs;
  const a = P.Axes({w:640,h:230,xr:[-3.3,3.3],yr:[-0.12*top,1.3*top],
    xlabel:'f',ylabel:'G_\\delta(f),\\;H_{\\mathrm{LPF}}(f)',pad:{l:56,r:26,t:26,b:40},
    xtarget:6,ytarget:3,xtickfmt:v=>P.fmt(v,2)+'W',ytickfmt:()=>''});
  for(let n=-1;n<=1;n++) copy(a, n*fs, W, fs, {color:C.mid,width:2.2});
  a.poly([[-3.2,0],[-W,0],[-W,1.12*fs],[W,1.12*fs],[W,0],[3.2,0]],{color:C.h,width:2.4});
  a.note(0,1.19*fs,'H_{\\mathrm{LPF}}(f)',{tex:true,fs:14,color:C.h,anchor:'middle'});
  return a.svg();
}

/* The impulse response of the reconstruction filter on its own time axis: one
   at the origin, zero at every non-zero multiple of 1/(2W). The filter keeps
   its colour — amber in frequency, amber in time — and the zeros are marked as
   points because they are the fact the interpolation scene uses next. The tick
   numbers are suppressed: the axis is graduated in 1/(2W), and the span names
   that unit the way the sampling stack names T_s. */
function figSinc(){
  const sinc = x => Math.abs(x)<1e-9 ? 1 : Math.sin(Math.PI*x)/(Math.PI*x);
  const a = P.Axes({w:640,h:210,xr:[-3.6,3.6],yr:[-0.42,1.30],
    xlabel:'t',ylabel:'h_{\\mathrm{LPF}}(t)',pad:{l:56,r:26,t:26,b:40},
    xticksOverride:[-3,-2,-1,1,2,3],xtickfmt:()=>'',ytarget:3,ytickfmt:()=>''});
  a.curve(t=>sinc(t),{color:C.h,width:2.4});
  for(let n=-3;n<=3;n++) if(n) a.point(n,0,{color:C.h,r:3});
  a.span(2,3,-0.30,'\\tfrac{1}{2W}',{tex:true,fs:13,color:C.h});
  a.note(0.14,1.14,'\\operatorname{sinc}(2Wt)',{tex:true,fs:14,color:C.h});
  return a.svg();
}

/* Interactive: each term is wrapped in a group carrying its sample index, so
   the style sheet can lift one sinc out of the crowd — the idle roll call and
   the pointer handling at the foot of this file drive the `on`/`pick`
   classes. While a term is lifted, its zeros at the other sampling instants
   are drawn, because those zeros are why the sum passes through every sample.
   The figure itself stays a plain string of SVG, rebuilt on every render. */
function figInterp(){
  const W = 0.5, Ts = 1/(2*W);          /* T_s = 1 s, so the picture reads directly */
  const a = P.Axes({w:660,h:260,xr:[-0.4,8.4],yr:[-1.5,1.6],
    xlabel:'t',ylabel:'g(t),\\;g_r(t)',pad:{l:50,r:26,t:24,b:40},xtarget:6,ytarget:4});
  const sinc = x => Math.abs(x)<1e-9 ? 1 : Math.sin(Math.PI*x)/(Math.PI*x);
  for(let n=0;n<=8;n++){
    a.raw(`<g class="st" data-st="${n}">`);
    a.curve(t=>g(n*Ts)*sinc((t-n*Ts)/Ts),{color:C.mid,width:1.1,opacity:0.55,dash:'3 3'});
    for(let k=0;k<=8;k++) if(k!==n)
      a.raw(`<circle class="st-z" cx="${a.sx(k*Ts).toFixed(2)}" cy="${a.sy(0).toFixed(2)}"
        r="3" fill="none" stroke="${C.mid}" stroke-width="1.5"/>`);
    a.raw('</g>');
  }
  a.curve(t=>{ let s=0; for(let n=-6;n<=14;n++) s += g(n*Ts)*sinc((t-n*Ts)/Ts); return s; },
          {color:C.out,width:2.6});
  for(let n=0;n<=8;n++){
    a.raw(`<g class="st-dot" data-st="${n}">`);
    a.point(n*Ts, g(n*Ts), {color:C.in, r:3.6});
    /* an invisible disc widens the pointer target to a finger's width */
    a.raw(`<circle cx="${a.sx(n*Ts).toFixed(2)}" cy="${a.sy(g(n*Ts)).toFixed(2)}"
      r="20" fill="transparent"/>`);
    a.raw('</g>');
  }
  /* One expression per term, all at the spot the resting caption occupies;
     the style sheet shows only the lifted term's line, so the reader sees
     the exact summand the highlighted curve draws. With T_s = 1 and 2W = 1
     the general term g(nT_s) sinc(2W(t-nT_s)) reads g(n) sinc(t-n), which is
     why the label can stay this short. The value is rounded, so it is joined
     with \approx and not an equals sign. */
  for(let n=0;n<=8;n++){
    const arg = n===0 ? 't' : `t-${n}`;
    a.raw(`<g class="st-eq" data-st="${n}">`);
    a.note(0.15,1.34,
      `g(${n})\\,\\operatorname{sinc}(${arg})\\approx ${P.fmt(g(n*Ts),2)}\\,\\operatorname{sinc}(${arg})`,
      {tex:true,fs:13,color:C.mid});
    a.raw('</g>');
  }
  a.raw('<g class="sp-note">');
  a.note(0.15,1.34,'\\text{one shifted }\\operatorname{sinc}\\text{ per sample}',{tex:true,fs:13,color:C.mid});
  a.raw('</g>');
  return a.svg().replace('<svg ','<svg class="sincpick" ');
}

function figQuantizer(kind){
  const L = 8, D = 1;                    /* eight levels, unit step */
  const half = L*D/2;
  const rise = m => Math.max(-half+D/2, Math.min(half-D/2, (Math.floor(m/D)+0.5)*D));
  const tread = m => Math.max(-half+D, Math.min(half-D, Math.round(m/D)*D));
  const q = kind==='midrise' ? rise : tread;
  const a = P.Axes({w:430,h:300,xr:[-half,half],yr:[-half,half],
    xlabel:'m',ylabel:'v=\\mathbb{Q}(m)',pad:{l:52,r:24,t:26,b:40},xtarget:4,ytarget:4});
  const pts=[];
  for(let i=0;i<=900;i++){ const m=-half+2*half*i/900; pts.push([m,q(m)]); }
  a.poly(pts,{color:C.mid,width:2.2});
  a.note(-half+0.25, half-0.7, kind==='midrise'?'mid-rise':'mid-tread',
         {fs:14,color:C.mid,weight:600});
  return a.svg();
}

function figQuantError(){
  const L = 8, mmax = 5, D = 2*mmax/L;
  const q = m => Math.max(-mmax+D/2, Math.min(mmax-D/2, (Math.floor(m/D)+0.5)*D));
  const m = t => mmax*Math.cos(t);
  const a = P.Axes({w:660,h:250,xr:[0,2*Math.PI],yr:[-6,6.4],
    xlabel:'t',ylabel:'m(t),\\;\\mathbb{Q}(m(t))',pad:{l:54,r:26,t:24,b:40},
    xtarget:5,ytarget:4});
  a.curve(m,{color:C.in});
  const pts=[]; for(let i=0;i<=900;i++){ const t=2*Math.PI*i/900; pts.push([t,q(m(t))]); }
  a.poly(pts,{color:C.mid,width:2.0});
  const b = P.Axes({w:660,h:170,xr:[0,2*Math.PI],yr:[-D,D],
    xlabel:'t',ylabel:'q(t)=m(t)-\\mathbb{Q}(m(t))',pad:{l:54,r:26,t:26,b:40},
    xtarget:5,ytarget:3});
  b.hline(D/2,{color:C.err,dash:'4 4'}); b.hline(-D/2,{color:C.err,dash:'4 4'});
  b.curve(t=>m(t)-q(m(t)),{color:C.err,width:1.7,n:1400});
  b.note(0.12, 0.72*D, '+\\Delta/2', {tex:true,fs:13,color:C.err});
  return {top:a.svg(), err:b.svg()};
}

function figCompanding(){
  const a = P.Axes({w:430,h:290,xr:[-1,1],yr:[-1,1],
    xlabel:'x/x_{\\max}',ylabel:'y',pad:{l:52,r:24,t:26,b:40},xtarget:4,ytarget:4});
  const mu = 255, A = 87.6;
  const sgn = x => x<0?-1:1;
  const mulaw = x => sgn(x)*Math.log(1+mu*Math.abs(x))/Math.log(1+mu);
  const alaw  = x => { const u=Math.abs(x);
    return sgn(x)*(u < 1/A ? A*u/(1+Math.log(A)) : (1+Math.log(A*u))/(1+Math.log(A))); };
  a.curve(x=>x,{color:C.muted,width:1.3,dash:'4 4'});
  a.curve(mulaw,{color:C.in,width:2.3});
  a.curve(alaw,{color:C.h,width:2.3,dash:'6 4'});
  a.note(-0.97,0.86,'\\mu\\text{-law}',{tex:true,fs:14,color:C.in});
  a.note(-0.97,0.62,'A\\text{-law}',{tex:true,fs:14,color:C.h});
  return a.svg();
}

/* One entry per code: the name the caption uses and the rule that maps a bit
   and a position inside it to a level. The figure is drawn per render rather
   than once at load, so it takes the palette of the theme in force. */
const LINE_CODES = [
  ['Unipolar NRZ', (b,u)=> b?1:0],
  ['Polar NRZ',    (b,u)=> b?1:-1],
  ['Unipolar RZ',  (b,u)=> (b && u<0.5)?1:0],
  ['Manchester',   (b,u)=> (u<0.5 ? (b?1:-1) : (b?-1:1))]
];

function figLineCode(i){
  const bits = [0,1,1,0,1,0,0,1];
  const f = LINE_CODES[i][1];
  const a = P.Axes({w:560,h:112,xr:[0,bits.length],yr:[-1.55,1.55],
    pad:{l:30,r:16,t:12,b:22},
    xticksOverride:[],yticksOverride:[-1,0,1],grid:false});
  const pts=[];
  for(let k=0;k<bits.length;k++)
    for(let j=0;j<=80;j++){ const u=j/80; pts.push([k+u, f(bits[k], u)]); }
  for(let k=1;k<bits.length;k++) a.vline(k,{color:C.rule,dash:'2 4',opacity:0.9});
  a.poly(pts,{color:C.in,width:2.0});
  return a.svg();
}

/* Every pair a two-sample block can take, with the pairs a smooth signal can
   actually produce shaded. Nothing is sampled or simulated: a cell is shaded
   when the two indices differ by at most one, which is the condition the scene
   states, so the count in the caption is the count the figure draws. */
function figPairLattice(L, shade){
  /* `shade` marks the near-diagonal cells; the scene turns it on at the step
     where the smooth-signal restriction is introduced, so the figure changes
     when the argument does. */
  const a = P.Axes({w:440,h:330,xr:[0,L],yr:[0,L],
    xlabel:'\\text{sample }n', ylabel:'\\text{sample }n+1',
    pad:{l:58,r:22,t:22,b:46}, xticksOverride:[0,4,8,12,16], yticksOverride:[0,4,8,12,16],
    grid:false});
  for(let i=0;i<L;i++) for(let j=0;j<L;j++){
    const near = shade && Math.abs(i-j) <= 1;
    a.rect(i, j, i+1, j+1,
      {fill: near ? C.dec.in : 'none', stroke: near ? C.in : C.rule});
  }
  return a.svg();
}

/* One row of a smooth gradient at two level counts. The coarse staircase is
   what a reader sees as banding: the step edges are boundaries the scene never
   had. Both curves are the same quantizer rule with a different L. */
function figBanding(){
  const a = P.Axes({w:470,h:300,xr:[0,1],yr:[-0.06,1.10],
    xlabel:'\\text{position across the image}', ylabel:'\\text{brightness}',
    pad:{l:62,r:22,t:22,b:46}, xtarget:5, ytarget:5});
  const q = (v,L) => (Math.min(L-1, Math.floor(v*L)) + 0.5)/L;
  a.curve(x => q(x, 256), {color:C.in, width:2.0, n:1400});
  a.curve(x => q(x, 8),   {color:C.mid, width:2.2, n:1400});
  a.note(0.06, 0.96, 'L=256', {tex:true, fs:12, color:C.in});
  a.note(0.62, 0.30, 'L=8', {tex:true, fs:12, color:C.mid});
  return a.svg();
}

function figPcmExample(){
  const sinc = x => Math.abs(x)<1e-9 ? 1 : Math.sin(Math.PI*x)/(Math.PI*x);
  const m = t => 8*Math.abs(sinc(t-2));
  const Ts = 0.6;
  const q = v => Math.min(7, Math.floor(v)) + 0.5;      /* eight levels, step 1 V */
  const a = P.Axes({w:700,h:280,xr:[-0.15,3.75],yr:[-0.5,9],
    xlabel:'t\\;(\\mathrm{s})',ylabel:'m(t)',pad:{l:52,r:26,t:26,b:44},xtarget:6,ytarget:4});
  for(let k=0;k<8;k++) a.hline(k+0.5,{color:C.rule,dash:'2 5',opacity:0.9});
  a.curve(m,{color:C.in});
  for(let n=0;n<=6;n++){
    const t=n*Ts, v=m(t);
    a.point(t, v, {color:C.in, r:4});
    a.point(t, q(v), {color:C.mid, r:4});
  }
  a.note(1.8, 8.35, '\\Delta=1\\ \\mathrm{V},\\;L=8', {tex:true,fs:14,color:C.muted,anchor:'middle'});
  return a.svg();
}

/* ---- summary-card miniatures ----
   Each recalls the key figure of its section, stripped to the shape alone:
   no ticks, no labels, one object a card. */
function mini(w,h,xr,yr){ return P.Axes({w:w,h:h,xr:xr,yr:yr,pad:{l:10,r:10,t:8,b:8},
  xticksOverride:[], yticksOverride:[], grid:false, zeroAxes:false, arrows:false}); }
function miniSampling(){
  const a = mini(520,96,[-3.4,3.4],[0,1.25]);
  for(let n=-1;n<=1;n++) copy(a, 2.2*n, 1, 1, {color:C.mid,width:2});
  return a.svg();
}
function miniSinc(){
  const a = mini(520,96,[-3,3],[-0.35,1.15]);
  a.curve(t=>{const x=2*t; return Math.abs(x)<1e-6?1:Math.sin(Math.PI*x)/(Math.PI*x);},{color:C.h,width:2});
  return a.svg();
}
function miniQuant(){
  const a = mini(520,96,[-1.15,1.15],[-1.25,1.25]);
  a.poly([[-1.1,-1.1],[1.1,1.1]],{color:C.rule,width:1.2,dash:'3 4'});
  for(let k=-3;k<3;k++) a.poly([[k/3,(k+0.5)/3*1.05],[(k+1)/3,(k+0.5)/3*1.05]],{color:C.mid,width:2.4});
  return a.svg();
}
function miniRate(){
  const a = mini(520,96,[0,4.4],[0,30]);
  const pts=[1,2,3,4].map(R=>[R,1.8+6.02*R]);
  a.poly(pts,{color:C.out,width:2});
  pts.forEach(p=>a.point(p[0],p[1],{color:C.out,r:3.5}));
  return a.svg();
}

const SC = [

/* ---------------------------------------------------------------- 1.0 ---- */
{ id:'m1-open', module:'M1', nav:'From waveform to bits', title:'From a waveform to a bit stream',
  objective:'Fix the three-stage chain and name which stage is reversible.',
  keywords:'sampling quantization encoding chain analog digital reversible',
  src:'CH7 s.3', steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Opening'},
  {t:'title', text:'From a waveform to a bit stream'},
  {t:'lede', text:'A continuous waveform becomes a bit stream in three steps. Each step discards something different, and only one of the three can be undone.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p><b>Sampling</b> makes the signal discrete in time. <b>Quantization</b> makes it discrete in amplitude. <b>Encoding</b> replaces each quantized amplitude by a word of $R$ bits.</p>'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'ok', head:'Sampling is reversible', html:'If the signal is bandlimited to $W$ and sampled fast enough, the samples carry <em>everything</em>. The original waveform can be rebuilt exactly. This is the sampling theorem, and it is the subject of the next four scenes.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Quantization is not', html:'Rounding an amplitude to one of $L$ levels throws information away and no later stage can recover it. What can be done is to make the loss small and to <em>quantify</em> it, which is what the signal-to-quantization-noise ratio does.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>P.blocks({w:620,h:280,items:[
      {t:'arrow',x1:30,y1:70,x2:110,y2:70},
      {t:'box',x:110,y:36,w:120,h:68,label:'Sampler'},
      {t:'arrow',x1:230,y1:70,x2:300,y2:70},
      {t:'box',x:300,y:36,w:120,h:68,label:'Quantizer'},
      {t:'arrow',x1:420,y1:70,x2:490,y2:70},
      {t:'box',x:490,y:36,w:110,h:68,label:'Encoder'},
      {t:'text',x:70,y:56,label:'x(t)',tex:true,fs:16},
      {t:'text',x:265,y:56,label:'x_n',tex:true,fs:16},
      {t:'text',x:455,y:56,label:'\\hat{x}_n',tex:true,fs:16},
      {t:'text',x:170,y:140,label:'discrete in time',fs:12.5},
      {t:'text',x:360,y:140,label:'discrete in amplitude',fs:12.5},
      {t:'text',x:545,y:140,label:'bits',fs:12.5},
      {t:'text',x:170,y:170,label:'reversible',fs:12.5},
      {t:'text',x:360,y:170,label:'not reversible',fs:12.5}
    ]}), caption:'The chain in the order it is applied. The bit rate leaving the encoder is $R_b = R f_s$ bits per second: bits per sample times samples per second.'}
  ]}
]},

/* ---------------------------------------------------------------- 1.1 ---- */
{ id:'m1-sampler', module:'M1', nav:'Impulse-train sampling', title:'Impulse-train sampling',
  objective:'Define the ideal sampled signal and reduce it to a weighted impulse train.',
  keywords:'impulse train sampling period sifting property ideal sampled signal',
  src:'CH7 s.4', steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · The sampling theorem'},
  {t:'title', text:'Impulse-train sampling'},
  {t:'lede', text:'Sampling is written as a multiplication, so that the Fourier transform can be applied to it.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'Sampling every $T_s$ seconds is multiplication by an impulse train:'},
    {t:'eq', tex:'p(t)=\\sum_{n=-\\infty}^{\\infty}\\delta(t-nT_s),\\qquad f_s=\\frac{1}{T_s}'},
    {t:'eq', key:true, tex:'g_\\delta(t)=g(t)\\,p(t)=\\sum_{n=-\\infty}^{\\infty}g(t)\\,\\delta(t-nT_s)'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'The sampling property of the impulse, $g(t)\\delta(t-t_0)=g(t_0)\\delta(t-t_0)$, turns the product under the sum into a number:'},
      {t:'eq', key:true, tex:'g_\\delta(t)=\\sum_{n=-\\infty}^{\\infty}g(nT_s)\\,\\delta(t-nT_s)'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'What this object is and is not', html:'$g_\\delta(t)$ is not a sequence of numbers. It is a continuous-time signal built from impulses, so it has a Fourier transform. We use this form because the next scene takes that transform and leads directly to the sampling theorem.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:figSamplingStack, caption:'The three signals on one time axis: the message, the sampling train, and their product. Each impulse of $g_\\delta(t)$ carries the value of $g$ at its own instant as its weight; between the instants the sampled signal is zero.'}
  ]}
]},

{ id:'m1-spectrum', module:'M1', nav:'The sampled spectrum', title:'Sampling replicates the spectrum',
  objective:'Derive the replication result that every later statement rests on.',
  keywords:'fourier transform replication convolution impulse train spectrum',
  src:'CH7 s.5–6', steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · The sampling theorem'},
  {t:'title', text:'Sampling replicates the spectrum'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'A product in time is a convolution in frequency, so $G_\\delta(f)=G(f)*P(f)$. The transform of the impulse train is another impulse train:'},
    {t:'eq', tex:'P(f)=\\frac{1}{T_s}\\sum_{n=-\\infty}^{\\infty}\\delta(f-nf_s)=f_s\\sum_{n=-\\infty}^{\\infty}\\delta(f-nf_s)'},
    {t:'reveal', at:1, items:[
      {t:'small', html:'The coefficient is the Fourier-series coefficient of $p(t)$: $a_k=\\frac{1}{T_s}\\int_{-T_s/2}^{T_s/2}\\delta(t)e^{-j2\\pi kf_0t}\\,dt=\\frac{1}{T_s}$ for every $k$, by the sifting property.'},
      {t:'eq', tex:'\\begin{aligned}G_\\delta(f)&=G(f)*\\Big[\\frac{1}{T_s}\\sum_{n=-\\infty}^{\\infty}\\delta(f-nf_s)\\Big]\\\\[2pt]&=\\frac{1}{T_s}\\sum_{n=-\\infty}^{\\infty}G(f)*\\delta(f-nf_s)\\end{aligned}'},
      {t:'small', html:'Write each convolution out, then use that the impulse is even, $\\delta(-u)=\\delta(u)$:'},
      {t:'eq', tex:'\\begin{aligned}G(f)*\\delta(f-nf_s)&=\\int G(\\theta)\\,\\delta(f-nf_s-\\theta)\\,d\\theta\\\\[2pt]&=\\int G(\\theta)\\,\\delta\\bigl(-[\\theta-(f-nf_s)]\\bigr)\\,d\\theta\\\\[2pt]&=\\int G(\\theta)\\,\\delta\\bigl(\\theta-(f-nf_s)\\bigr)\\,d\\theta\\\\[2pt]&=G(f-nf_s)\\end{aligned}'},
      {t:'small', html:'The last line is the sifting property. Each impulse shifts one copy of $G$ to its own $nf_s$.'},
      {t:'eq', key:true, tex:'G_\\delta(f)=f_s\\sum_{n=-\\infty}^{\\infty}G(f-nf_s)'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Read the result', html:'Sampling copies the spectrum to every multiple of $f_s$ and scales it by $f_s$. Nothing is lost <em>provided the copies do not overlap</em>. That proviso is the sampling theorem.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figSpectrumPair().msg, caption:'The message spectrum before sampling. It is zero outside $|f|<W$, which is what &ldquo;bandlimited to $W$&rdquo; means.'},
    {t:'fig', frame:true, svg:()=>figSpectrumPair().sampled, caption:'The same spectrum after sampling at $f_s=3W$. The shape above now sits at every multiple of $f_s$ and is $f_s$ times as tall. The copy at the origin is the message; the others are the replicas sampling has created.'}
  ]}
]},

{ id:'m1-cases', module:'M1', nav:'Three sampling rates', title:'Three sampling rates',
  objective:'Separate oversampling, Nyquist sampling and aliasing by the geometry of the replicas.',
  keywords:'oversampling nyquist undersampling aliasing overlap guard band',
  src:'CH7 s.7–8', steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · The sampling theorem'},
  {t:'title', text:'Three sampling rates'},
  {t:'grid', cols:3, gap:'26px', items:[
    [{t:'fig', svg:()=>figCase('over'), caption:'<b>Oversampling: $f_s>2W$.</b> The replicas are separated by a gap — the <b>guard band</b>. The message can be filtered out unchanged.'}],
    [{t:'fig', svg:()=>figCase('nyq'), caption:'<b>Nyquist sampling: $f_s=2W$.</b> The replicas touch and do not overlap. This is the lowest rate that still works.'}],
    [{t:'fig', svg:()=>figCase('under'), caption:'<b>Undersampling: $f_s<2W$.</b> The replicas overlap. The sum in the overlap cannot be separated back into its parts.'}]
  ]},
  {t:'reveal', at:1, items:[
    {t:'note', kind:'err', head:'Aliasing', html:'In the third case a high frequency of the message has been added to a low frequency of a replica. No filter can undo the addition. The original signal cannot be recovered from its samples — not by a better filter, not by more computation.'}
  ]},
  {t:'reveal', at:2, items:[
    {t:'body', html:'In practice a real signal is never strictly bandlimited. A <b>guard band</b> $f_g$ is therefore left between the edge of the message and the edge of the first replica. The sampling rate becomes $f_s = 2W + f_g$, and an anti-aliasing filter removes whatever lies above $W$ before the sampler sees it.'}
  ]}
]},

{ id:'m1-theorem', module:'M1', nav:'The sampling theorem', title:'The sampling theorem',
  objective:'State the theorem and the reconstruction that proves it.',
  keywords:'sampling theorem nyquist rate bandlimited reconstruction statement',
  src:'CH7 s.12', steps:1, blocks:[
  {t:'eyebrow', text:'Module 1 · The sampling theorem'},
  {t:'title', text:'The sampling theorem'},
  {t:'note', kind:'def', head:'Sampling theorem', html:'If $G(f)=0$ for $|f|\\ge W$ and the sampling rate satisfies $f_s\\ge 2W$, then $g(t)$ is determined completely by its samples $g(nT_s)$ and can be recovered from them exactly. If $f_s<2W$, aliasing occurs and the recovery fails.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>The rate $2W$ is the <b>Nyquist rate</b>: twice the highest frequency present. The interval $T_s = 1/(2W)$ at that rate is the <b>Nyquist interval</b>.</p>'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'warn', head:'Twice the highest frequency, not twice the bandwidth', html:'For a lowpass signal the two coincide, and that is the only case treated here. For a signal whose band does not reach down to zero, the two are different numbers. The rate that matters is still set by the geometry of the replicas, not by either name.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figCase('nyq'),
      caption:'The theorem drawn: at $f_s=2W$ the replicas just touch. Any slower and they overlap; any faster and a gap opens.'},
    {t:'eq', label:'Nyquist rate', key:true, tex:'f_s^{\\min}=2W'},
    {t:'eq', label:'Nyquist interval', tex:'T_s^{\\max}=\\frac{1}{2W}'}
  ]}
]},

/* ---------------------------------------------------------------- 1.2 ---- */
{ id:'m1-lpf', module:'M1', nav:'The reconstruction filter', title:'The reconstruction filter',
  objective:'Give the ideal reconstruction filter and its impulse response.',
  keywords:'reconstruction lowpass filter impulse response sinc interpolation',
  src:'CH7 s.9–10', steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Reconstruction'},
  {t:'title', text:'The reconstruction filter'},
  {t:'lede', text:'One lowpass filter undoes the replication.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'Keeping the copy at the origin and rejecting every other one is a lowpass filter. At $f_s=2W$:'},
    {t:'eq', tex:'H_{\\mathrm{LPF}}(f)=\\begin{cases}\\dfrac{1}{2W}, & |f|\\le W\\\\[4pt] 0, & \\text{otherwise}\\end{cases}'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'Its impulse response is the inverse transform of a rectangle:'},
      {t:'eq', key:true, tex:'h_{\\mathrm{LPF}}(t)=\\int_{-W}^{W}\\frac{1}{2W}e^{j2\\pi ft}\\,df=\\frac{\\sin(2\\pi Wt)}{2\\pi Wt}=\\operatorname{sinc}(2Wt)'},
      {t:'small', html:'The convention fixed here and used for the rest of the course: $\\operatorname{sinc}(x)=\\dfrac{\\sin(\\pi x)}{\\pi x}$. This makes $\\operatorname{sinc}(x)$ one at $x=0$ and zero at every other integer.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Why the gain is $1/2W$', html:'Sampling multiplied the spectrum by $f_s=2W$. The filter has to divide it back. A reconstruction filter of unit gain returns a signal $2W$ times too large. That scaling error shows on no plot of the spectrum shape.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:figLpf, caption:'The filter passes the copy at the origin and rejects the replicas. At exactly the Nyquist rate the replicas touch the edge of the passband, which is why an ideal filter is needed there and a gentler one suffices when the rate is higher.'},
    {t:'reveal', at:1, items:[
      {t:'fig', frame:true, svg:figSinc, caption:'The same filter in time. The pulse is one at $t=0$ and zero at every non-zero multiple of $1/(2W)$ — exactly the sampling instants. The next scene builds the reconstruction out of shifted copies of this pulse.'}
    ]}
  ]}
]},

{ id:'m1-interp', module:'M1', nav:'Interpolation', title:'The interpolation formula',
  objective:'Show the interpolation formula as a sum of shifted sinc functions.',
  keywords:'interpolation formula sinc shifted samples reconstruction sum',
  src:'CH7 s.11–12', steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Reconstruction'},
  {t:'title', text:'The interpolation formula'},
  {t:'lede', text:'Every sample carries one sinc, and the sum of them is the message between the samples.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'Filtering in frequency is convolution in time. Convolving the impulse train with $h_{\\mathrm{LPF}}$ is one integral:'},
    {t:'eq', label:'Convolution integral', tex:'g_r(t)=\\int_{-\\infty}^{\\infty}\\overbrace{\\sum_{n=-\\infty}^{\\infty}g(nT_s)\\,\\delta(\\tau-nT_s)}^{=\\,g_\\delta(\\tau)}\\operatorname{sinc}\\!\\bigl(2W(t-\\tau)\\bigr)\\,d\\tau'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'The sum does not depend on $\\tau$, so it moves outside the integral. What is left inside is a sinc against a shifted impulse, and the sifting property replaces $\\tau$ by $nT_s$:'},
      {t:'eq', tex:'g_r(t)=\\sum_{n=-\\infty}^{\\infty}g(nT_s)\\underbrace{\\int_{-\\infty}^{\\infty}\\operatorname{sinc}\\!\\bigl(2W(t-\\tau)\\bigr)\\,\\delta(\\tau-nT_s)\\,d\\tau}_{=\\,\\operatorname{sinc}\\!\\bigl(2W(t-nT_s)\\bigr)}'},
      {t:'eq', key:true, tex:'g_r(t)=\\sum_{n=-\\infty}^{\\infty}g(nT_s)\\operatorname{sinc}\\!\\bigl(2W(t-nT_s)\\bigr)'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'body', html:'At the Nyquist rate $T_s=1/(2W)$ this reads'},
      {t:'eq', tex:'g_r(t)=\\sum_{n=-\\infty}^{\\infty}g\\!\\left(\\frac{n}{2W}\\right)\\operatorname{sinc}(2Wt-n)'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'note', kind:'ok', head:'Why the sum passes through the samples', html:'At $t=kT_s$ every term vanishes except the one with $n=k$, because $\\operatorname{sinc}$ is zero at every non-zero integer. So $g_r(kT_s)=g(kT_s)$ exactly, and the interpolation is not an approximation between the samples either — it is the message.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:figInterp, caption:'Each sample contributes one sinc scaled by its own value. Their sum is drawn heavy; it passes through every sample because each sinc is zero at all the other sampling instants. Point to a sample — or touch it — to see its own sinc alone, with those zeros marked.'}
  ]}
]},

{ id:'m1-ex-nyquist', module:'M1', nav:'Worked example: sampling rates', title:'Worked example: three sampling rates',
  objective:'Apply the Nyquist rate to a guard band and to a modulated signal.',
  keywords:'worked example nyquist rate guard band modulation bandwidth product',
  src:'CH7 s.13–14', steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Reconstruction'},
  {t:'title', text:'Worked example: three sampling rates'},
  {t:'wex', rows:[
    ['Given','A signal $x(t)$ bandlimited to $W=40$ kHz.'],
    ['Find','(a) the Nyquist rate; (b) the rate with a $10$ kHz guard band; (c) the Nyquist rate of $y(t)=x(t)\\cos(80000\\pi t)$.']
  ]},
  {t:'reveal', at:1, items:[
    {t:'wex', rows:[
      ['Method','For (a) and (b), read the rate off the geometry of the replicas. For (c), find the bandwidth of $y$ first — the rate follows from that, not from the bandwidth of $x$.'],
      ['Solution (a)','$f_s = 2W = 2(40\\ \\text{kHz}) = 80$ kHz.'],
      ['Solution (b)','A guard band $f_g$ widens the gap between replicas: $f_s = 2W + f_g = 80 + 10 = 90$ kHz.']
    ]}
  ]},
  {t:'reveal', at:2, items:[
    {t:'wex', rows:[
      ['Solution (c)','The carrier is $\\cos(2\\pi f_c t)$ with $f_c = 40$ kHz. Multiplication shifts the spectrum both ways and halves it: $Y(f)=\\tfrac12 X(f-40\\text{k})+\\tfrac12 X(f+40\\text{k})$. The result occupies $|f|<80$ kHz, so its bandwidth is $80$ kHz and $f_s = 2(80) = 160$ kHz.']
    ]}
  ]},
  {t:'reveal', at:3, items:[
    {t:'wex', rows:[
      ['Check','The bandwidth of $y$ is $f_c + W = 40+40 = 80$ kHz, and $2 \\times 80 = 160$ kHz. Doubling the carrier alone would double the rate again, which is the sanity check: the rate follows the highest frequency present, not the width of the message.']
    ]},
    {t:'note', kind:'warn', head:'The trap in part (c)', html:'Answering $80$ kHz is answering for $x$, not for $y$. Modulation moves the message up the frequency axis, and the sampler has to keep up with where it has moved to.'}
  ]}
]},

/* ---------------------------------------------------------------- 1.3 ---- */
{ id:'m1-quant', module:'M1', nav:'Quantization', title:'Uniform quantization',
  objective:'Define quantization and separate mid-rise from mid-tread.',
  keywords:'quantization levels midrise midtread uniform nonuniform step size',
  src:'CH7 s.15–16', steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization'},
  {t:'title', text:'Uniform quantization'},
  {t:'lede', text:'Rounding each sample to the nearest of a finite set of levels. The two standard families differ only at zero.'},
  {t:'cols', ratio:'c-5-7', vcenter:true, left:[
    {t:'note', kind:'def', head:'Definition', html:'<b>Quantization</b> replaces a sample amplitude by the nearest member of a finite set of $L$ <b>representation levels</b>. In a <b>uniform</b> quantizer the spacing $\\Delta$ between consecutive levels is the same everywhere.'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>The two families differ in what happens at zero. A <b>mid-rise</b> quantizer puts a decision boundary at zero, so no output level is zero. A <b>mid-tread</b> quantizer puts a level at zero, so a small input is quantized to exactly zero.</p>'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'warn', head:'Which one a question means', html:'A silent input is reproduced as silence by a mid-tread quantizer and as a $\\pm\\Delta/2$ chatter by a mid-rise one. Speech coders use mid-tread for that reason. Read the level list before assuming: with $L$ even and levels at $\\pm\\Delta/2, \\pm3\\Delta/2,\\ldots$ the quantizer is mid-rise.'}
    ]}
  ], right:[
    {t:'grid', cols:2, gap:'26px', items:[
      [{t:'fig', frame:true, svg:()=>figQuantizer('midrise'), caption:'<b>Mid-rise</b>, $L=8$. A boundary at the origin; the output steps up through $\\pm\\Delta/2$.'}],
      [{t:'fig', frame:true, svg:()=>figQuantizer('midtread'), caption:'<b>Mid-tread</b>, $L=8$. A level at the origin; the tread through zero is one step wide.'}]
    ]}
  ]}
]},

{ id:'m1-lloydmax', module:'M1', nav:'Levels and boundaries', title:'The quantizer as a function',
  objective:'State the quantizer function and the two optimality conditions.',
  keywords:'quantizer function boundaries lloyd max midpoint centroid step size',
  src:'CH7 s.17', steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization'},
  {t:'title', text:'The quantizer as a function'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'A quantizer is a staircase: a partition of the input range into $L$ regions $\\mathcal{J}_k$, and one output value $v_k$ per region.'},
    {t:'eq', tex:'v=\\mathbb{Q}(m)=v_k \\quad\\text{for}\\quad m\\in\\mathcal{J}_k=\\{m_k< m\\le m_{k+1}\\}'},
    {t:'eq', label:'uniform, symmetric range', key:true, tex:'\\Delta=\\frac{2m_{\\max}}{L}'},
    {t:'reveal', at:1, items:[
      {t:'note', kind:'def', head:'The two optimality conditions', html:'<ol><li>Each boundary is the <b>midpoint</b> of the two levels it separates: $m_k=\\tfrac12(v_{k-1}+v_k)$. Given the levels, this is the rule that minimises the error, because it sends every input to the nearer level.</li><li>Each level is the <b>centroid</b> of its own region: $v_k=E[M\\mid M\\in\\mathcal{J}_k]$. Given the boundaries, this is the value that minimises the mean square error inside the region.</li></ol>'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'body', html:'The two conditions refer to each other, which is why they are applied by turns rather than solved at once. A uniform quantizer satisfies the first by construction; it satisfies the second only when the input is uniformly distributed.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figQuantizer('midrise'), caption:'A uniform mid-rise quantizer with $L=8$ over $[-4,4]$, so $\\Delta = 8/8 = 1$. Each tread is $\\Delta$ wide. Its output lies at the middle of the tread, as the midpoint condition requires.'}
  ]}
]},

{ id:'m1-lab-a', module:'M1', nav:'Laboratory A', title:'Laboratory A · Quantization and SQNR',
  objective:'Let the reader move the level count and the amplitude and watch the error follow.',
  keywords:'laboratory quantization sqnr levels step size amplitude interactive',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization'},
  {t:'title', text:'Laboratory A · Quantization and SQNR'},
  {t:'body', html:'Set the number of levels and the amplitude of the input, and read the step size, the mean-square error and the signal-to-quantization-noise ratio. The measured ratio is computed from the waveform itself; the predicted one comes from $\\alpha + 6.02R$. Where they part company is the interesting part.'},
  {t:'lab', id:'A'}
]},

/* ---------------------------------------------------------------- 1.4 ---- */
{ id:'m1-qnoise', module:'M1', nav:'Quantization noise', title:'Quantization noise',
  objective:'Model the quantization error and derive its mean-square value.',
  keywords:'quantization noise error uniform distribution mean square delta squared twelve',
  src:'CH7 s.18–20', steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization noise'},
  {t:'title', text:'Quantization noise'},
  {t:'lede', text:'The rounding error behaves like a small noise, and its power can be computed exactly.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'The quantization error is the difference between what went in and what came out:'},
    {t:'eq', tex:'Q=M-V=M-\\mathbb{Q}(M)'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'Because every input is sent to the nearer level, the error can never exceed half a step:'},
      {t:'eq', tex:'-\\frac{\\Delta}{2}\\le q\\le\\frac{\\Delta}{2}'},
      {t:'body', html:'If $\\Delta$ is small enough, the density of $M$ is nearly flat across one region. The error is then as likely to fall anywhere in that interval as anywhere else, so $Q\\sim U(-\\Delta/2,\\Delta/2)$.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'eq', key:true, tex:'E[Q^{2}]=\\int_{-\\Delta/2}^{\\Delta/2}q^{2}\\,\\frac{1}{\\Delta}\\,dq=\\frac{\\Delta^{2}}{12}'},
      {t:'small', html:'With a zero-mean input the error has zero mean as well, so this mean square is also the variance. The power of the quantization noise <em>is</em> its variance.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'body', html:'Substituting $\\Delta=2m_{\\max}/L$ and $L=2^{R}$ gives the form used for the rest of the module:'},
      {t:'eq', key:true, tex:'E[Q^{2}]=\\frac{1}{12}\\left(\\frac{2m_{\\max}}{L}\\right)^{2}=\\frac{1}{3}\\frac{m_{\\max}^{2}}{L^{2}}=\\frac{m_{\\max}^{2}}{3\\cdot 2^{2R}}'},
      {t:'note', kind:'def', head:'What this says, in plain words', html:'Rounding to the nearest level adds a small random amount to every sample, and that amount is never more than half a step. Its power is one twelfth of the step squared. The last form says the same thing about bits: every extra bit halves the step, so it divides the noise power by four. That factor of four is the $6$ dB the next scene is about.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figQuantError().top, caption:'A sinusoid of amplitude $5$ through an eight-level uniform quantizer, so $\\Delta=1.25$.'},
    {t:'fig', frame:true, svg:()=>figQuantError().err, caption:'The error. It is bounded by $\\pm\\Delta/2$ everywhere and sweeps that interval as the input crosses the treads — which is the picture the uniform model is drawn from.'}
  ]}
]},

{ id:'m1-sqnr', module:'M1', nav:'Signal-to-noise ratio', title:'Signal-to-quantization-noise ratio',
  objective:'Derive the SQNR expression and the per-bit rule that follows from it.',
  keywords:'sqnr signal to quantization noise ratio decibel six per bit',
  src:'CH7 s.21–22', steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization noise'},
  {t:'title', text:'Signal-to-quantization-noise ratio'},
  {t:'lede', text:'Six decibels a bit.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'eq', label:'definition', tex:'\\mathrm{SQNR}=\\frac{P_M}{E[Q^{2}]}=\\frac{E[M^{2}]}{E\\bigl[(M-\\mathbb{Q}(M))^{2}\\bigr]}'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'For the uniform quantizer of the previous scene:'},
      {t:'eq', key:true, tex:'\\mathrm{SQNR}=\\frac{3P_M}{m_{\\max}^{2}}\\,2^{2R}'},
      {t:'eq', key:true, tex:'\\mathrm{SQNR}\\;[\\mathrm{dB}]=\\underbrace{10\\log_{10}\\frac{3P_M}{m_{\\max}^{2}}}_{\\alpha}+\\;6.02R'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'The rule worth remembering', html:'Every extra bit per sample adds $20\\log_{10}2 = 6.02$ dB. Doubling the number of levels halves the step size, which quarters the error power — and a factor of four is $6.02$ dB.'},
      {t:'note', kind:'warn', head:'What $\\alpha$ costs', html:'The first term is negative for every signal that does not fill the quantizer range. A sinusoid of amplitude $m_{\\max}$ has $P_M=m_{\\max}^2/2$, so $\\alpha=10\\log_{10}1.5\\approx 1.76$ dB. A signal using a tenth of the range loses $20$ dB of it, and no number of bits buys that back cheaply.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const a = P.Axes({w:600,h:320,xr:[1,12],yr:[0,80],
        xlabel:'R\\;(\\text{bits per sample})',ylabel:'\\mathrm{SQNR}\\;(\\mathrm{dB})',
        pad:{l:60,r:26,t:28,b:46},xtarget:6,ytarget:5});
      const line = (alphaLin,col)=>a.curve(R=>10*Math.log10(alphaLin)+6.02*R,{color:col,width:2.3});
      line(1.5, C.in);          /* full-scale sinusoid */
      line(1.0, C.mid);         /* uniform over the range */
      line(0.03, C.err);        /* a signal using a fifth of the range */
      return a.svg();
    }, caption:'Three signals, three values of $\\alpha$, one slope. The slope is $6.02$ dB per bit for all of them; what the signal does is set the intercept.'},
    {t:'legend', items:[['in','sinusoid at full scale'],['mid','uniform over the range'],
                        ['err','using a fifth of the range']]}
  ]}
]},

{ id:'m1-ex-cos', module:'M1', nav:'Worked example: a sinusoid', title:'Worked example: quantizing a sinusoid',
  objective:'Compute the SQNR of a full-scale sinusoid at two resolutions.',
  keywords:'worked example sinusoid parseval average power sqnr three four bits',
  src:'CH7 s.23–24', steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization noise'},
  {t:'title', text:'Worked example: quantizing a sinusoid'},
  {t:'wex', rows:[
    ['Given','$m(t)=5\\cos t$, quantized by a uniform quantizer that spans the full range of the signal.'],
    ['Find','The step size and the SQNR in decibels for $R=3$ and for $R=4$ bits per sample.']
  ]},
  {t:'reveal', at:1, items:[
    {t:'wex', rows:[
      ['Method','Average power from Parseval, step size from $\\Delta = 2m_{\\max}/L$, then $\\alpha + 6.02R$.'],
      ['Solution','The Fourier-series coefficients of $5\\cos t$ are $a_{1}=a_{-1}=5/2$, so $P_M=\\sum_k|a_k|^{2}=2(5/2)^{2}=12.5$. The peak is $m_{\\max}=5$.']
    ]}
  ]},
  {t:'reveal', at:2, items:[
    {t:'wex', rows:[
      ['$R=3$','$L=8$, so $\\Delta = 2(5)/8 = 1.25$ V. $\\ \\alpha = 10\\log_{10}\\dfrac{3(12.5)}{25}=10\\log_{10}1.5=1.76$ dB, and $\\mathrm{SQNR} = 1.76 + 6.02(3) = 19.82$ dB.'],
      ['$R=4$','$L=16$, so $\\Delta = 2(5)/16 = 0.625$ V, and $\\mathrm{SQNR} = 1.76 + 6.02(4) = 25.84$ dB.']
    ]}
  ]},
  {t:'reveal', at:3, items:[
    {t:'wex', rows:[
      ['Check','The two answers differ by $6.02$ dB, which is one bit. Independently: $E[Q^{2}]=\\Delta^{2}/12 = 1.25^{2}/12 = 0.1302$, and $10\\log_{10}(12.5/0.1302) = 19.82$ dB. Two routes, one number.']
    ]},
    {t:'note', kind:'warn', head:'What the formula does not know', html:'Quantize this waveform and measure the error it actually makes, and the answers are $19.09$ dB and $25.31$ dB. That is about $0.7$ dB and $0.5$ dB below what the formula gives. The uniform error model assumes the error is equally likely anywhere in $(-\\Delta/2,\\Delta/2)$. A sinusoid spends most of its time near its peaks, where the error is largest. The gap halves with every extra bit — $0.27$ dB at $R=6$, $0.14$ dB at $R=8$. That is what "$\\Delta$ small enough" means. At the resolutions used in practice the formula is exact for every purpose. At eight levels it is optimistic. Knowing by how much is the difference between using a model and believing it.'},
    {t:'note', kind:'warn', head:'The factor of two in the step size', html:'The range spanned is $2m_{\\max}=10$ V, not $m_{\\max}$. Writing $\\Delta = m_{\\max}/L$ halves every step size and is the commonest slip in this calculation. It leaves the SQNR in decibels untouched when that is computed from $\\alpha+6.02R$, so the error survives until someone asks for $\\Delta$ itself.'}
  ]}
]},

{ id:'m1-ex-unif', module:'M1', nav:'Worked example: a uniform source', title:'Worked example: a uniform source',
  objective:'Compute the SQNR from the definitions when the input is uniform.',
  keywords:'worked example uniform distribution 256 levels sqnr integration',
  src:'CH7 s.25–26', steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization noise'},
  {t:'title', text:'Worked example: a uniform source'},
  {t:'wex', rows:[
    ['Given','$M\\sim U(-1,1)$, quantized by a uniform quantizer with $L=256$ levels.'],
    ['Find','The SQNR of this scheme.']
  ]},
  {t:'reveal', at:1, items:[
    {t:'wex', rows:[
      ['Method','Take $P_M$ from the density, $\\Delta$ from the range and the level count, and $E[Q^{2}]$ from $\\Delta^{2}/12$.'],
      ['Solution','$P_M=E[M^{2}]=\\int_{-1}^{1}m^{2}\\tfrac12\\,dm=\\tfrac13$. With $m_{\\max}=1$, $\\ \\Delta = 2(1)/256 = 1/128$, so $E[Q^{2}] = \\Delta^{2}/12 = 5.086\\times10^{-6}$.'],
      ['','$\\mathrm{SQNR} = \\dfrac{1/3}{5.086\\times10^{-6}} = 65536$, which is $10\\log_{10}65536 = 48.16$ dB.']
    ]}
  ]},
  {t:'reveal', at:2, items:[
    {t:'wex', rows:[
      ['Check','$R=\\log_2 256 = 8$ bits. Here $\\alpha = 10\\log_{10}\\dfrac{3(1/3)}{1}=0$ dB exactly, so $\\mathrm{SQNR}=6.02(8)=48.16$ dB. The two agree, and the reason $\\alpha$ vanishes is that a uniform source over the full range is the one case in which the uniform quantizer is also the optimal one.']
    ]},
    {t:'note', kind:'ok', head:'Why the uniform model is exact here', html:'For every other input distribution, $E[Q^{2}]=\\Delta^{2}/12$ is an approximation that holds when $\\Delta$ is small. For a uniform input spanning the range it is not an approximation at all: the error really is uniform on $(-\\Delta/2,\\Delta/2)$.'}
  ]}
]},

{ id:'m1-ex-gauss', module:'M1', nav:'Worked example: a Gaussian source', title:'Worked example: a Gaussian source',
  objective:'Compute the SQNR by integration when the uniform-error model does not apply.',
  keywords:'worked example gaussian source overload distortion coarse quantizer psd',
  src:'CH7 s.27–28', steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Quantization noise'},
  {t:'title', text:'Worked example: a Gaussian source'},
  {t:'wex', rows:[
    ['Given','A zero-mean stationary Gaussian source with $S_X(f)=2$ for $|f|<100$ Hz and zero elsewhere, sampled at the Nyquist rate. Each sample goes through a five-level quantizer with outputs $-30,-10,0,10,30$ and boundaries at $-40,-20,20,40$.'],
    ['Find','The SQNR of this scheme.']
  ]},
  {t:'reveal', at:1, items:[
    {t:'wex', rows:[
      ['Method','The signal power is the area under the spectral density. The noise power has to be integrated region by region, because this quantizer is neither uniform nor fine.'],
      ['Solution','$P_X=\\int_{-100}^{100}2\\,df=400$, and since the source is zero-mean this is also $\\sigma_X^{2}$. Each sample is $N(0,400)$.']
    ]}
  ]},
  {t:'reveal', at:2, items:[
    {t:'wex', rows:[
      ['','$P_Q=\\displaystyle\\int_{-\\infty}^{\\infty}\\bigl(x-\\mathbb{Q}(x)\\bigr)^{2}f_X(x)\\,dx$, split at the four boundaries. The five contributions are $7.98$, $46.36$, $79.50$, $46.36$ and $7.98$, so $P_Q = 188.18$.'],
      ['','$\\mathrm{SQNR}\\;[\\mathrm{dB}] = 10\\log_{10}\\dfrac{400}{188.18} = 3.27$ dB.']
    ]}
  ]},
  {t:'reveal', at:3, items:[
    {t:'note', kind:'err', head:'Why $\\Delta^{2}/12$ would have lied', html:'The quantizer is coarse and its outer regions are unbounded, so the error there is not bounded by half a step at all. A sample at $x=120$ is quantized to $30$, and the error is $90$. Applying the uniform model with $\\Delta=20$ would predict $E[Q^{2}]=33.3$ and an SQNR of $10.8$ dB, three times too optimistic. The model is a small-step model, and this is what its failure looks like.'},
    {t:'wex', rows:[
      ['Check','The central region alone contributes $79.50$ of the $188.18$, and it holds $P(|X|<20) = 68\\%$ of the probability mass with an error of up to $20$. That is where a five-level quantizer spends its error, and it is why the answer is a few decibels rather than a few tens.']
    ]}
  ]}
]},

/* ---------------------------------------------------------------- 1.5 ---- */
{ id:'m1-nonuniform', module:'M1', nav:'Non-uniform quantization', title:'Non-uniform quantization',
  objective:'Motivate non-uniform quantization from the statistics of speech.',
  keywords:'non uniform quantization speech small amplitudes companding compressor expander',
  src:'CH7 s.29–30', steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Non-uniform quantization'},
  {t:'title', text:'Non-uniform quantization'},
  {t:'lede', text:'When equal steps are the wrong steps: spend the levels where the signal spends its time.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Speech spends most of its time at small amplitudes and only occasionally reaches the peak. A uniform quantizer gives the same absolute step to a whisper and to a shout. The whisper is therefore quantized far more coarsely <em>in proportion to itself</em>.</p>'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'Drop the requirement that the regions have equal length, and the distortion falls at the same level count. Make the regions narrow where the density is high, and wide where it is low. This is what the centroid condition asks for and what a uniform quantizer cannot give.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'Companding', html:'Rather than build a non-uniform quantizer, compress the signal with a memoryless non-linearity and quantize the result <em>uniformly</em>. At the receiver, expand with the inverse. <b>Comp</b>ressing plus exp<b>anding</b> is companding, and it is how the non-uniform quantizer is built out of a uniform one.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>P.blocks({w:700,h:230,items:[
      {t:'arrow',x1:20,y1:70,x2:90,y2:70},
      {t:'box',x:90,y:36,w:120,h:68,label:'Compress'},
      {t:'arrow',x1:210,y1:70,x2:270,y2:70},
      {t:'box',x:270,y:36,w:150,h:68,label:'Uniform quantizer'},
      {t:'arrow',x1:420,y1:70,x2:480,y2:70},
      {t:'box',x:480,y:36,w:110,h:68,label:'Expand'},
      {t:'text',x:55,y:56,label:'m(t)',tex:true,fs:15},
      {t:'text',x:635,y:56,label:'\\hat{m}(t)',tex:true,fs:15},
      {t:'text',x:150,y:145,label:'large amplitudes compressed',fs:12},
      {t:'text',x:560,y:145,label:'levels restored',fs:12}
    ]}), caption:'The compressor gives high gain to weak signals and low gain to strong ones; the expander undoes it exactly, so the pair is transparent and only the quantizer in the middle loses anything.'}
  ]}
]},

{ id:'m1-companding', module:'M1', nav:'A-law and µ-law', title:'A-law and µ-law companding',
  objective:'Give the two companding laws and where each is used.',
  keywords:'mu law a law compander 255 87.6 speech telephony logarithmic',
  src:'CH7 s.31–33', steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Non-uniform quantization'},
  {t:'title', text:'A-law and µ-law companding'},
  {t:'lede', text:'Two laws, one shape.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'eq', label:'mu-law', tex:'y=\\frac{\\ln(1+\\mu|x|)}{\\ln(1+\\mu)}\\operatorname{sgn}(x),\\qquad |x|\\le 1'},
    {t:'eq', label:'A-law', tex:'y=\\begin{cases}\\dfrac{A|x|}{1+\\ln A}\\operatorname{sgn}(x), & 0\\le|x|\\le\\dfrac{1}{A}\\\\[8pt] \\dfrac{1+\\ln(A|x|)}{1+\\ln A}\\operatorname{sgn}(x), & \\dfrac{1}{A}<|x|\\le 1\\end{cases}'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'Both are normalised so that $x=\\pm1$ maps to $y=\\pm1$: the compressor rescales the amplitude distribution without changing the range the quantizer has to cover. The standard parameters are $\\mu=255$ and $A=87.6$.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'They perform alike', html:'On the same speech and the same eight-bit uniform quantizer the two give signal-to-noise ratios within a hundredth of a decibel of one another. The difference between them is regional, not technical: $\\mu$-law in North America and Japan, $A$-law in most of the rest of the world.'},
      {t:'body', html:'The one place the difference shows is near zero, where the $A$-law is exactly linear and the $\\mu$-law is not. That makes $A$-law slightly better behaved on very small signals and slightly worse on the ones just above them.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:figCompanding, caption:'The two compressor characteristics against the identity, which is what no companding would give. Both spend most of their output range on the smallest tenth of the input.'}
  ]}
]},

/* ---------------------------------------------------------------- 1.6 ---- */
{ id:'m1-encode', module:'M1', nav:'Encoding and bit rate', title:'Encoding and the bit rate',
  objective:'Fix the bit rate relation and contrast natural binary with Gray coding.',
  keywords:'encoding bit rate natural binary gray code adjacent levels one bit',
  src:'CH7 s.34', steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Pulse code modulation'},
  {t:'title', text:'Encoding and the bit rate'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'With $L=2^{R}$ levels, each sample needs $R$ bits. At $f_s$ samples per second:'},
    {t:'eq', key:true, tex:'R_b = R\\,f_s\\quad\\left(\\frac{\\text{bits}}{\\text{sample}}\\right)\\left(\\frac{\\text{samples}}{\\text{s}}\\right)=\\frac{\\text{bits}}{\\text{s}}'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p><b>Natural binary coding</b> assigns $0$ to $L-1$ to the levels in increasing order. <b>Gray coding</b> assigns the words so that adjacent levels differ in exactly one bit.</p>'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'Why Gray coding is worth the trouble', html:'When a channel error does occur it almost always moves the decision to a <em>neighbouring</em> level. Under natural binary that can flip several bits at once — level $7$ is $0111$ and level $8$ is $1000$, four bits apart. Under Gray coding a neighbouring level is one bit away by construction, so the same channel error costs one bit instead of four.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>{
      const rows = [['0','000','000'],['1','001','001'],['2','010','011'],['3','011','010'],
                    ['4','100','110'],['5','101','111'],['6','110','101'],['7','111','100']];
      const a = P.Axes({w:420,h:300,xr:[0,3],yr:[-0.6,8],pad:{l:20,r:16,t:22,b:24},
        grid:false,zeroAxes:false,arrows:false,xticksOverride:[],yticksOverride:[]});
      const head = ['level','natural','Gray'];
      head.forEach((h,i)=>a.note(0.5+i, 7.5, h, {fs:13.5, color:C.muted, anchor:'middle', weight:600}));
      rows.forEach((r,k)=>{
        const y = 6.7 - k*0.86;
        r.forEach((cell,i)=>a.note(0.5+i, y, cell,
          {fs:14, color:(i===2 && k>0 && k<8)?C.out:C.ink, anchor:'middle'}));
      });
      return a.svg();
    }, caption:'Eight levels in both codes. Reading down the Gray column, exactly one digit changes at every step; reading down the natural column, three change between $011$ and $100$.'}
  ]}
]},

{ id:'m1-linecodes', module:'M1', nav:'Line codes', title:'Line codes',
  objective:'Present the line-code families and the property that separates them.',
  keywords:'line codes unipolar polar nrz rz manchester dc component synchronization',
  src:'CH7 s.35', steps:2, blocks:[
  {t:'eyebrow', text:'Module 1 · Pulse code modulation'},
  {t:'title', text:'Line codes'},
  {t:'body', html:'A line code is the rule that turns the bits of a PCM stream into a waveform. The four below all carry the same eight bits, $0\\,1\\,1\\,0\\,1\\,0\\,0\\,1$.'},
  {t:'grid', cols:2, gap:'20px', items:
    LINE_CODES.map((c,i)=>[{t:'fig', svg:()=>figLineCode(i), caption:'<b>'+c[0]+'.</b>'}])
  },
  {t:'reveal', at:1, items:[
    {t:'body', html:'<p><b>Unipolar NRZ</b> is on-off signalling: it is the simplest, and it carries a DC level that causes the waveform to droop through any AC-coupled stage. <b>Polar NRZ</b> is antipodal signalling and has no DC component for balanced data, which is why it is the shape Module 2 analyses.</p>'}
  ]},
  {t:'reveal', at:2, items:[
    {t:'note', kind:'warn', head:'What a long run of one symbol costs', html:'Both NRZ codes go quiet during a long run of identical bits. A receiver that recovers its clock from the waveform then has nothing to lock to. <b>Manchester</b> forces a transition in the middle of every bit, so the clock is always recoverable and there is never a DC component. The price is twice the bandwidth.'}
  ]}
]},

{ id:'m1-ex-pcm', module:'M1', nav:'Worked example: a PCM stream', title:'Worked example: sample, quantize, encode',
  objective:'Take one signal through all three stages and produce the bit stream.',
  keywords:'worked example pcm sinc sampling quantizing encoding bit rate polar nrz',
  src:'CH7 s.36', steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Pulse code modulation'},
  {t:'title', text:'Worked example: sample, quantize, encode'},
  {t:'cols', ratio:'c-6-6', vcenter:false, left:[
    {t:'wex', rows:[
      ['Given','$m(t)=8\\,|\\operatorname{sinc}(t-2)|$, so $0\\le m(t)\\le 8$. It is sampled every $T_s=0.6$ s and quantized by an eight-level uniform quantizer covering $[0,8]$.'],
      ['Find','The step size, the quantized values and the code words for the samples at $t=0,0.6,\\ldots,3.6$, and the bit rate.']
    ]},
    {t:'reveal', at:1, items:[
      {t:'wex', rows:[
        ['Method','$\\Delta$ from the range and the level count; each sample by direct evaluation; each code word by which of the eight treads the sample falls in.'],
        ['Solution','$\\Delta = (8-0)/8 = 1$ V, and the levels sit at the middle of each tread: $0.5, 1.5, \\ldots, 7.5$.']
      ]}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:figPcmExample, caption:'The message, its samples and the level each is rounded to. The two disagree by less than half a step everywhere, which is the bound of the previous section drawn out.'}
  ]},
  {t:'reveal', at:2, items:[
    {t:'wex', rows:[
      ['Samples','$0,\\;1.73,\\;1.87,\\;7.48,\\;6.05,\\;0,\\;1.51$'],
      ['Levels','$0.5,\\;1.5,\\;1.5,\\;7.5,\\;6.5,\\;0.5,\\;1.5$'],
      ['Code words','$000\\;\\,001\\;\\,001\\;\\,111\\;\\,110\\;\\,000\\;\\,001$']
    ]}
  ]},
  {t:'reveal', at:3, items:[
    {t:'wex', rows:[
      ['Bit rate','$R=\\log_2 8 = 3$ bits per sample and $f_s = 1/0.6 = 1.667$ samples per second, so $R_b = 3(1.667) = 5$ bits per second, and one bit lasts $T_b = T_s/3 = 0.2$ s.'],
      ['Check','The sample at $t=1.8$ is $8|\\operatorname{sinc}(-0.2)| = 8(0.9355) = 7.48$, which lies in the top tread $[7,8]$ and so encodes as $111$. The sample at $t=3$ is $8|\\operatorname{sinc}(1)| = 0$ exactly, because $\\operatorname{sinc}$ vanishes at every non-zero integer — the same fact the interpolation formula rests on, met again here.']
    ]}
  ]}
]},

{ id:'m1-lab-b', module:'M1', nav:'Laboratory B', title:'Laboratory B · PCM, DPCM and delta modulation',
  objective:'Compare three waveform coders on the same source at the same bit rate.',
  keywords:'laboratory pcm dpcm delta modulation slope overload granular noise',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 1 · Pulse code modulation'},
  {t:'title', text:'Laboratory B · PCM, DPCM and delta modulation'},
  {t:'body', html:'PCM sends each sample. Differential PCM sends the difference between the sample and a prediction of it. Delta modulation sends one bit: whether the signal went up or down. Choose the method and the step size, and watch where each one fails.'},
  {t:'lab', id:'B'}
]},

/* ---------------------------------------------------------------- 1.7 ---- */
{ id:'m1-vq', module:'M1', nav:'Vector quantization', title:'Vector quantization',
  objective:'Show why quantizing a block of samples beats quantizing each one alone.',
  keywords:'vector quantization scalar codebook block image compression jpeg lossy levels',
  src:'CH7 s.37', steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Vector quantization'},
  {t:'title', text:'Vector quantization'},
  {t:'lede', text:'Quantizing a block of samples together, instead of one at a time.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>Every quantizer so far has rounded one sample on its own. That is <b>scalar</b> quantization, and it throws something away before it starts. Real signals do not jump about from one sample to the next. A quantizer that sees one sample at a time cannot know that.</p>'},
    {t:'note', kind:'def', head:'What vector quantization is', html:'Take $n$ samples at a time and treat them as one point in $n$ dimensions. Choose a <b>codebook</b> of allowed points, and round the whole block to the nearest one. With $n=1$ this is the quantizer of section 1.3. With $n=2$ the allowed points are places in a plane, and they can be put wherever the signal actually goes.'},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>Here is the whole argument, in a case small enough to count. Take $L=16$ levels and look at <em>pairs</em> of neighbouring samples. A scalar quantizer allows every combination:</p>'},
      {t:'eq', tex:'L^{2}=16^{2}=256\\ \\text{pairs},\\qquad \\log_2 256 = 8\\ \\text{bits a pair}=4\\ \\text{bits a sample}'},
      {t:'body', html:'<p>Now suppose the signal is smooth enough that a sample never moves by more than one step from the one before it. Then only the pairs on and beside the diagonal can ever occur:</p>'},
      {t:'eq', key:true, tex:'3L-2=46\\ \\text{pairs},\\qquad \\lceil\\log_2 46\\rceil = 6\\ \\text{bits a pair}=3\\ \\text{bits a sample}'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'ok', head:'A quarter of the rate, at the same distortion', html:'The cells did not change size, so the rounding error did not change. The code now omits the $210$ combinations that this signal model never produces. Vector quantization uses its codebook only in regions that the signal can reach.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'small', html:'The next scene takes the case this is actually used on. There the samples are the pixels of an image, and there are a quarter of a million of them.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figPairLattice(16, APP.state.step>=1),
      caption:'Every pair of neighbouring samples a $16$-level quantizer can produce: $256$ squares, and a scalar quantizer pays for all of them. Once the smooth-signal restriction arrives, only the $46$ near-diagonal squares ever occur, and the codebook needs $6$ bits a pair instead of $8$.'},
    {t:'small', html:'A small gain survives even for independent samples, because better-shaped cells pack the space more efficiently than squares — but it is under a quarter of a bit a sample, and this course does not pursue it.'}
  ]}
]},

{ id:'m1-vq-image', module:'M1', nav:'Quantizing an image', title:'Quantizing an image',
  objective:'Work the bit rate of a quantized image and name what is lost.',
  keywords:'image quantization bits per pixel compression ratio banding contouring jpeg lossy',
  src:'CH7 s.37', steps:3, blocks:[
  {t:'eyebrow', text:'Module 1 · Vector quantization'},
  {t:'title', text:'Quantizing an image'},
  {t:'lede', text:'What quantization saves, and what it costs.'},
  {t:'cols', ratio:'c-6-6', vcenter:true, left:[
    {t:'body', html:'<p>An image is the case where this matters, because there are so many samples. Each pixel is one sample of brightness, and the arithmetic of section 1.6 applies to it unchanged.</p>'},
    {t:'wex', head:'A greyscale image, quantized', rows:[
      ['Given','$512\\times512$ pixels at $8$ bits a pixel, so $L=256$ levels.'],
      ['Uncoded','$512^{2}(8)=2\\,097\\,152$ bits, which is $256$ KiB.'],
      ['At $L=32$','$R=\\log_2 32=5$ bits a pixel: $1\\,310\\,720$ bits, or $160$ KiB.'],
      ['Saved','$3$ bits of every $8$, so $37.5\\%$ of the file.']
    ]},
    {t:'reveal', at:1, items:[
      {t:'body', html:'<p>What that costs is the same number section 1.4 gives, and it is large:</p>'},
      {t:'eq', key:true, tex:'\\Delta\\mathrm{SQNR}=6.02(8-5)=18.06\\ \\text{dB}'},
      {t:'note', kind:'warn', head:'And it is visible, not just measurable', html:'A smooth gradient — a sky, a shadow across a wall — is a slow ramp in brightness. Quantize it coarsely and the ramp becomes a staircase. The picture then shows <b>bands</b> of flat tone, with hard edges between them where the scene had no edge. The eye finds those invented edges easily, which is why an image tolerates far fewer bits in a noisy region than in a smooth one.'}
    ]},
    {t:'reveal', at:2, items:[
      {t:'note', kind:'def', head:'This is lossy compression', html:'The removed information is not recoverable. The omitted bits described where the pixel lay inside its quantization interval. A decoder cannot recover that position. This loss is why the method is called <b>lossy</b>. JPEG also uses quantization, but it quantizes transformed image blocks rather than individual pixels.'}
    ]},
    {t:'reveal', at:3, items:[
      {t:'small', html:'<b>Where the chapter ends:</b> sampling is reversible when the sampling-theorem conditions hold; quantization is not. An image makes the second fact visible, and later chapters start with the resulting bit stream.'}
    ]}
  ], right:[
    {t:'fig', frame:true, svg:()=>figBanding(),
      caption:'One row of a smooth gradient, quantized at $256$ levels and at $8$. The fine quantizer follows the ramp so closely that the two cannot be told apart; the coarse one replaces it with flat steps, and each step edge is a band boundary the eye sees as a line that is not in the scene.'},
    {t:'small', html:'The step height here is $\\Delta=2m_{\\max}/L$, exactly as in section 1.3. An image is not a new kind of quantizer, only a great many samples of one.'}
  ]}
]},

/* ---------------------------------------------------------------- 1.8 ---- */
{ id:'m1-synth', module:'M1', nav:'Summary', title:'What Module 1 established',
  objective:'Collect the results this module contributes to the rest of the course.',
  keywords:'summary sampling quantization pcm results bit rate sqnr',
  steps:0, blocks:[
  {t:'eyebrow', text:'Module 1 · Summary'},
  {t:'title', text:'What Module 1 established'},
  {t:'grid', cols:2, gap:'26px', items:[
    [{t:'card', head:'Sampling', items:[
      {t:'fig', svg:miniSampling},
      {t:'eq', plain:true, tex:'G_\\delta(f)=f_s\\sum_n G(f-nf_s)'},
      {t:'small', html:'Replicas every $f_s$. With $f_s\\ge 2W$ they do not overlap and the message survives exactly.'}
    ]}],
    [{t:'card', head:'Reconstruction', items:[
      {t:'fig', svg:miniSinc},
      {t:'eq', plain:true, tex:'g_r(t)=\\sum_n g(nT_s)\\operatorname{sinc}(2Wt-n)'},
      {t:'small', html:'One lowpass filter recovers the message; its impulse response interpolates between the samples.'}
    ]}],
    [{t:'card', head:'Quantization', items:[
      {t:'fig', svg:miniQuant},
      {t:'eq', plain:true, tex:'E[Q^{2}]=\\Delta^{2}/12,\\quad \\Delta=2m_{\\max}/L'},
      {t:'small', html:'Rounding to $L=2^{R}$ levels costs a mean-square error set by the step size alone.'}
    ]}],
    [{t:'card', head:'The rate that follows', items:[
      {t:'fig', svg:miniRate},
      {t:'eq', plain:true, tex:'\\mathrm{SQNR}=\\alpha+6.02R,\\qquad R_b=Rf_s'},
      {t:'small', html:'Every bit per sample buys $6.02$ dB and costs $f_s$ bits per second.'}
    ]}]
  ]},
  {t:'note', kind:'ok', head:'The module in one sentence', html:'Turning a signal into bits costs two things and nothing else. You must sample fast enough, or the spectrum folds and cannot be unfolded. And you must round, which adds a small noise whose power falls by a factor of four with every extra bit.'}
]}

];

/* ---- the interpolation figure comes alive -------------------------------
   A slow roll call lifts each sample's sinc in turn, so the crowd of dashed
   terms reads as nine individuals rather than a blur. Pointing at a sample
   pins its sinc; on a touch screen a tap pins it and a second tap on the
   same sample releases it. Leaving the figure lets the roll call continue.
   The state lives here, not in the SVG, because the scene is re-rendered on
   every step and theme change and the figure string is rebuilt from scratch.
   The roll call defers to the course's own motion switch (body[data-motion]),
   which is initialised from prefers-reduced-motion; the pointer interaction
   stays live either way. */
const SP = { n:null, held:false, i:-1 };
const spRoot  = () => document.querySelector('svg.sincpick');
function spApply(sv){
  if(!sv) return;
  sv.classList.toggle('pick', SP.n!=null);
  sv.querySelectorAll('[data-st]').forEach(el=>
    el.classList.toggle('on', el.dataset.st===String(SP.n)));
}
setInterval(()=>{
  if(document.hidden || SP.held) return;
  if(document.body.dataset.motion==='reduced') return;
  const sv = spRoot();
  if(!sv){ SP.n=null; SP.i=-1; return; }
  SP.i=(SP.i+1)%9; SP.n=SP.i; spApply(sv);
}, 1700);
document.addEventListener('pointerover', e=>{
  if(e.pointerType!=='mouse' || !(e.target instanceof Element)) return;
  const d = e.target.closest('svg.sincpick .st-dot');
  if(!d) return;
  SP.held=true; SP.n=+d.dataset.st; spApply(spRoot());
});
document.addEventListener('pointerout', e=>{
  if(!SP.held || e.pointerType!=='mouse' || !(e.target instanceof Element)) return;
  const sv = e.target.closest('svg.sincpick');
  if(sv && !(e.relatedTarget instanceof Element && sv.contains(e.relatedTarget)))
    SP.held=false;      /* the roll call takes over on its next tick */
});
document.addEventListener('click', e=>{
  /* a mouse pins by pointing; its click must not immediately release the pin */
  if(e.pointerType==='mouse' || !(e.target instanceof Element)) return;
  const d = e.target.closest('svg.sincpick .st-dot');
  if(!d) return;
  const n=+d.dataset.st;
  if(SP.held && SP.n===n){ SP.held=false; SP.n=null; }
  else { SP.held=true; SP.n=n; }
  spApply(spRoot());
});

window.SCENES_M1 = SC;
})();
