/* Lecture notes — block renderer */
(function(){
  /* Mathematics that does not parse is reported to the console before it falls
     back, so that a broken formula shows up in the build instead of on the page. */
  const OPT={strict:false,macros:{'\\d':'\\mathrm{d}','\\Ev':'\\mathcal{E}\\mathrm{v}','\\Od':'\\mathcal{O}\\mathrm{d}'}};
  const T=(s,d)=>{ try{ return katex.renderToString(s,Object.assign({displayMode:!!d,throwOnError:true},OPT)); }
      catch(e){ console.error('NOTES: mathematics is not valid TeX: '+s+' — '+e.message);
                try{ return katex.renderToString(s,Object.assign({displayMode:!!d,throwOnError:false},OPT)); }
                catch(e2){ return '<code>'+s+'</code>'; } } };
  const md = t => String(t==null?'':t)
      .replace(/\$\$([^$]+)\$\$/g,(m,a)=>T(a,true))
      .replace(/\$([^$]+)\$/g,(m,a)=>T(a,false));

  /* One version history for every printed document, newest first. It is set as
     a table on the last page of each. Add a row here for each new release. */
  window.DOC_HISTORY = [
    ['v0', '24 September 2026', 'First edition.']
  ];

  /* Cover artwork in page millimetres (210 x 297), drawn from what the course
     does to a bit stream. Left: a bit sequence as raised-cosine pulses (teal),
     the same waveform after the channel adds noise (amber), and the samples
     the receiver takes at each symbol instant with the bit it decides. Right:
     a 16-QAM constellation with its decision boundaries and, around every
     point, the cloud of received values that noise scatters it into.
     Everything is plain vector with constant-opacity strokes and fills, so PDF
     viewers draw the cover at once: fades are stepped opacities, not masks. */
  const COVER_ART = ()=>{
    const f=v=>v.toFixed(2), f3=v=>v.toFixed(3);
    /* fixed pseudo-random numbers, so every build draws the same noise */
    const hash=i=>{ const s=Math.sin(i*12.9898+78.233)*43758.5453; return s-Math.floor(s); };
    const gauss=i=>Math.sqrt(-2*Math.log(1-hash(2*i)*0.999))*Math.cos(2*Math.PI*hash(2*i+1));
    const lerp=(st,t)=>{ for(let i=1;i<st.length;i++) if(t<=st[i][0]){ const [t0,v0]=st[i-1],[t1,v1]=st[i];
      return v0+(v1-v0)*(t-t0)/(t1-t0); } return st[st.length-1][1]; };
    const vw=y=>lerp([[0,.25],[148.5,.6],[237.6,1],[297,.2]],y);                 /* grid fade */

    /* ---- the waveform: bits -> raised-cosine pulses, baseline y0, period T */
    const bits=[1,0,1,1,0,0,1,0,1,1,0,1], T=8.8, x0=6, y0=206, A=14, beta=.5;
    const rc=t=>{ const u=t/T; if(Math.abs(u)<1e-9) return 1;
      const den=1-(2*beta*u)**2; const s=Math.sin(Math.PI*u)/(Math.PI*u);
      return Math.abs(den)<1e-6 ? s*Math.PI/4 : s*Math.cos(Math.PI*beta*u)/den; };
    const sx=k=>x0+T*(k+1);
    const tx=x=>{ let v=0; bits.forEach((b,k)=>{ v+=(b?1:-1)*rc(x-sx(k)); }); return y0-A*v; };
    const nz=x=>1.6*Math.sin(x*1.1+.4)+1.0*Math.sin(x*2.3+1.1)+.55*Math.sin(x*4.1+2.3);
    const rx=x=>tx(x)+nz(x);
    const xEnd=sx(bits.length-1)+T;
    const hw=x=>lerp([[0,0],[18,1],[xEnd-26,1],[xEnd,0]],x);                   /* side fade */
    const seg=(g,c,o,w)=>{ let s=''; for(let a=0;a<xEnd-1e-6;a+=2){ const z=Math.min(xEnd,a+2); let d='';
        for(let x=a;x<=z+1e-6;x+=.4) d+=(d?'L':'M')+f(x)+' '+f(g(x));
        s+=`<path d="${d}" stroke="${c}" stroke-opacity="${f3(o*hw(a+1))}" stroke-width="${w}"/>`; } return s; };
    let samples='', labels='';
    bits.forEach((b,k)=>{ const x=sx(k), y=rx(x), h=hw(x); if(h<.05) return;
      samples+=`<line x1="${f(x)}" y1="${y0}" x2="${f(x)}" y2="${f(y)}" stroke-opacity="${f3(.7*h)}"/>`+
               `<circle cx="${f(x)}" cy="${f(y)}" r="0.95" fill-opacity="${f3(h)}"/>`;
      labels+=`<text x="${f(x)}" y="${y0-A-15}" fill-opacity="${f3(.85*h)}">${b}</text>`; });

    /* ---- the constellation: 16-QAM at spacing d, centred (cx,cy) */
    const cx=165, cy=y0, d=14, lv=[-1.5,-.5,.5,1.5];
    let bounds='', clouds='', pts='';
    [-1,0,1].forEach(k=>{
      bounds+=`<line x1="${f(cx+k*d)}" y1="${f(cy-2.2*d)}" x2="${f(cx+k*d)}" y2="${f(cy+2.2*d)}"/>`+
              `<line x1="${f(cx-2.2*d)}" y1="${f(cy+k*d)}" x2="${f(cx+2.2*d)}" y2="${f(cy+k*d)}"/>`; });
    let n=0;
    lv.forEach(i=>lv.forEach(q=>{ const px=cx+i*d, py=cy-q*d;
      for(let m=0;m<40;m++,n++) clouds+=`<circle cx="${f(px+2.1*gauss(n))}" cy="${f(py+2.1*gauss(n+5000))}" r=".34"/>`;
      pts+=`<circle cx="${f(px)}" cy="${f(py)}" r="1.05"/>`; }));

    let grid='';
    for(let x=0;x<=210;x+=7.5) for(let y=0;y<297;y+=15)
      grid+=`<line x1="${x}" y1="${y}" x2="${x}" y2="${Math.min(297,y+15)}" stroke-opacity="${f3(.07*vw(y+7.5))}"/>`;
    for(let y=y0%7.5;y<=297;y+=7.5) grid+=`<line x1="0" y1="${f(y)}" x2="210" y2="${f(y)}" stroke-opacity="${f3(.07*vw(y))}"/>`;

    return `<svg class="cv-art" viewBox="0 0 210 297" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<defs>
<radialGradient id="cv-bg" cx="55%" cy="70%" r="78%"><stop offset="0" stop-color="#15384F"/><stop offset=".55" stop-color="#0D2337"/><stop offset="1" stop-color="#07111C"/></radialGradient>
</defs>
<rect width="210" height="297" fill="url(#cv-bg)"/>
<g stroke="#9FB6CC" stroke-width=".18">${grid}</g>
<g fill="none" stroke-linejoin="round" stroke-linecap="round">
${seg(()=>y0,'#C9D4DE',.3,.25)}
${seg(tx,'#6FC3CF',.16,2.2)}
${seg(tx,'#8AD6E0',1,.55)}
${seg(rx,'#E0B070',.75,.35)}
</g>
<g stroke="#E09A6A" stroke-width=".35" fill="#F2B48A">${samples}</g>
<g font-family="ui-monospace,'SF Mono',Menlo,Consolas,monospace" font-size="3.6" fill="#C9D4DE" text-anchor="middle">${labels}</g>
<g stroke="#C9D4DE" stroke-opacity=".28" stroke-width=".22" stroke-dasharray="1.2 1.2">${bounds}</g>
<g fill="#E0B070" fill-opacity=".5">${clouds}</g>
<g fill="#07111C" stroke="#8AD6E0" stroke-width=".5">${pts}</g>
</svg>`;
  };

  /* State of one renderNotes call: the open chapter and section, the sections
     of each chapter for the contents, and the numbered figures and tables. */
  let S = null;
  const pg = id => `<span class="pg" data-target="${id}"></span>`;
  /* A list entry is the caption's first sentence: the caption explains the
     figure, the list only names it. The cut is made in the source text and
     never inside $...$, so no formula is split. `short` overrides it. */
  const firstSentence = s => { s=String(s); let m=false;
    for(let i=0;i<s.length;i++){ if(s[i]==='$') m=!m;
      else if(!m && s[i]==='.' && (i===s.length-1 || s[i+1]===' ')) return s.slice(0,i+1); }
    return s; };
  const caption = (it, kind) => {
    if(!S || !S.captions || !S.ch) return {id:'', html:it.cap?`<figcaption>${md(it.cap)}</figcaption>`:''};
    const L = kind==='Figure' ? S.lof : S.lot, n = L.filter(e=>e.ch===S.ch).length + 1,
          num = S.ch+'.'+n, id = (kind==='Figure'?'fig-':'tab-')+S.ch+'-'+n;
    if(!it.cap) console.warn('NOTES: '+kind+' '+num+' has no caption');
    L.push({ch:S.ch, num, id, text: it.short || (it.cap ? firstSentence(it.cap) : S.sec)});
    return {id:` id="${id}"`, html:`<figcaption><span class="fl">${kind} ${num}</span>${it.cap?' '+md(it.cap):''}</figcaption>`};
  };
  /* Callout and worked-example icons: one 24-unit stroke set, drawn in the
     colour of the title they sit in. */
  const ICONS = {
    note: '<circle cx="12" cy="12" r="9.5"/><path d="M12 11v6M12 7.6v.01"/>',
    warn: '<path d="M12 3.6 2.6 20h18.8z"/><path d="M12 10v4.6M12 17.4v.01"/>',
    err:  '<circle cx="12" cy="12" r="9.5"/><path d="m8.6 8.6 6.8 6.8m0-6.8-6.8 6.8"/>',
    ok:   '<circle cx="12" cy="12" r="9.5"/><path d="m7.6 12.4 3 3 5.8-6.2"/>',
    ex:   '<path d="M4 20h4L19.2 8.8l-4-4L4 16z"/><path d="m13.4 6.6 4 4"/>'
  };
  const ico = k => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;

  const R = {
    page:   ()=>'</div><div class="page">',
    /* The mark comes from `build/src/icon.svg`, injected by whichever builder
       made this page. One drawing, three documents. */
    title:  b=>`<div class="title"><div class="mark">${window.ICON_SVG||''}</div><p class="kicker">${md(b.kicker)}</p>
       <h1 class="doc">${md(b.text)}</h1>${b.sub?`<p class="lead">${md(b.sub)}</p>`:''}
       ${b.meta?`<div class="meta">${b.meta.map(([k,v])=>`<div><b>${md(k)}</b>${md(v)}</div>`).join('')}</div>`:''}</div>`,
    /* The front cover is a full-bleed page of its own (named page `cover`, no
       margins, so no running footer). Its artwork is drawn from the functions it
       shows: a sinc pulse, its samples, and a damped cosine behind them. */
    cover:  b=>`<div class="cover">${COVER_ART()}
       <div class="cv-top"><div class="mark">${window.ICON_SVG||''}</div><p class="kicker">${md(b.kicker)}</p></div>
       <div class="cv-title"><h1 class="doc">${md(b.text)}</h1><div class="cv-rule"></div>
       ${b.sub?`<p class="cv-sub">${md(b.sub)}</p>`:''}</div>
       <div class="cv-foot">${b.foot?`<div class="cv-ed">${md(b.foot)}</div>`:''}
       <div class="cv-credit">© 2026 <a href="https://huguryildiz.com/">huguryildiz.com</a> · Course content: <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a></div></div></div>`,
    /* Last-page colophon: document name, version, licence. */
    colophon: b=>`<div class="colophon"><div class="mark">${window.ICON_SVG||''}</div>
       <p class="cl-doc">Digital Communications &middot; ${md(b.doc)}</p>
       <table class="cl-hist"><tr><th>Version</th><th>Date</th><th>Changes</th></tr>${
         window.DOC_HISTORY.map(([v,d,c])=>`<tr><td>${md(v)}</td><td>${md(d)}</td><td>${md(c)}</td></tr>`).join('')}</table>
       <p>© 2026 <a href="https://huguryildiz.com/">huguryildiz.com</a> · Course content: <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a></p></div>`,
    /* A numbered heading opens a chapter: its key is the last word of `num`
       (CHAPTER 1 -> 1, APPENDIX A -> A), its id is `ch-<key>`, and the figure
       and table counters restart. A numbered h2 gets the id `sec-<num>`. The
       contents rows, the lists and the PDF bookmarks all point at these ids. */
    h1:     b=>{ let num='', id='';
       if(b.num){ const w=String(b.num).trim().split(/\s+/), k=w.pop();
         if(S){ S.ch=k; S.sec=b.text; S.secs[k]=[]; S.chs.push({k,w:w.join(' '),text:b.text}); }
         id=` id="ch-${k}"`; num=`<span class="num"><span class="w">${md(w.join(' '))}</span><span class="k">${md(k)}</span></span>`; }
       return `<h1${b.num?' class="ch"':''}${id}>${num}${md(b.text)}</h1>${b.rule!==false?'<hr class="thick">':''}`; },
    h2:     b=>{ if(S){ S.sec=b.text; if(b.num&&S.ch) S.secs[S.ch].push({num:b.num,text:b.text}); }
       return `<h2${b.num?` id="sec-${b.num}"`:''}>${b.num?`<span class="num">${b.num}</span>`:''}${md(b.text)}</h2>`; },
    h3:     b=>`<h3>${md(b.text)}</h3>`,
    p:      b=>`<p${b.lead?' class="lead"':''}>${md(b.text)}</p>`,
    ul:     b=>`<ul>${b.items.map(i=>`<li>${md(i)}</li>`).join('')}</ul>`,
    ol:     b=>`<ol>${b.items.map(i=>`<li>${md(i)}</li>`).join('')}</ol>`,
    eq:     b=>`<div class="eq ${b.big?'big':''}">${T(b.tex,true)}</div>`,
    eqbox:  b=>`<div class="eqbox">${b.cap?`<div class="cap">${md(b.cap)}</div>`:''}
       ${(Array.isArray(b.tex)?b.tex:[b.tex]).map(t=>`<div class="eq ${b.big?'big':''}">${T(t,true)}</div>`).join('')}
       ${b.after?`<div class="after">${md(b.after)}</div>`:''}</div>`,
    box:    b=>{ const i=ico(ICONS[b.kind]?b.kind:'note'), body=md(b.html);
       return `<div class="box ${b.kind||''}">${b.hd?`<span class="t">${i}${md(b.hd)}</span>${body}`:body.replace('<span class="t">','<span class="t">'+i)}</div>`; },
    ex:     b=>`<div class="ex"><div class="h">${ico('ex')}${md(b.hd||'Example')}</div><dl>${
       b.rows.map(([k,v])=>`<dt>${md(k)}</dt><dd>${md(v)}</dd>`).join('')}</dl></div>`,
    fig:    b=>{ const c=caption(b,'Figure');
       return `<figure${c.id}>${typeof b.svg==='function'?b.svg():b.svg}
       ${c.html}</figure>`; },
    figrow: b=>`<div class="figrow ${b.n===3?'three':'two'}">${b.items.map(it=>{ const c=caption(it,'Figure');
       return `<figure${c.id}>${typeof it.svg==='function'?it.svg():it.svg}${c.html}</figure>`; }).join('')}</div>`,
    /* A table's caption sits above it, as a table's caption does in print. */
    table:  b=>{ const c=caption(b,'Table'), t=`<table>${b.head?`<tr>${b.head.map(h=>`<th>${md(h)}</th>`).join('')}</tr>`:''}
       ${b.rows.map(r=>`<tr>${r.map(c=>`<td>${md(c)}</td>`).join('')}</tr>`).join('')}</table>`;
       return c.html?`<figure class="tbl"${c.id}>${c.html}${t}</figure>`:t; },
    /* A contents row is number, title, summary and — where the same material is
       developed at length in the course textbook — an anchor into it. The anchor
       always carries its `OW` marker: these chapter numbers and the textbook's do
       not agree, and a bare section mark would read as one of these.
       The anchor is written before the summary so that grid auto-placement puts
       it on the title line; the summary then spans the two columns beneath.
       Each row links to its chapter and carries an empty page-number slot that
       notes/topdf.js fills when it prints; the sections of the chapter are
       listed under it once the whole document has been rendered. */
    toc:    b=>`<div class="toc"><!--TOCFRONT-->${b.items.map(([n,t,s,a])=>{ const k=String(n).trim();
       return `<div class="c"><div class="n">${md(n)}</div><a class="t" href="#ch-${k}">${md(t)}</a>${
         `<div class="a">${a?md(a):''}</div>`}${pg('ch-'+k)}<div class="s">${md(s)}</div><!--TOCSEC:${k}--></div>`; }).join('')}</div>`,
    lists:  ()=>'<!--LISTS-->',
    hr:     ()=>'<hr>',
    q:      b=>`<div class="q"><span class="n">${b.n}</span> ${md(b.text)}${
       b.ans?`<div class="ans">Answer: ${md(b.ans)}</div>`:''}</div>`,
    raw:    b=>b.html
  };

  /* The three document editions build their own blocks from CONTENT, so they need
     the same inline renderer the block types use. One renderer, one behaviour. */
  window.renderInline = md;

  /* With `captions` on (the lecture notes), every figure and table inside a
     chapter is numbered by chapter, and a List of Figures and a List of Tables
     are set on their own pages between the contents and Chapter 1. */
  window.renderNotes = function(blocks, host, opts){
    opts = opts || {};
    S = {captions:!!opts.captions, ch:null, sec:'', chs:[], secs:{}, lof:[], lot:[]};
    const first = blocks.findIndex(b=>b.t==='h1' && b.num);
    if(S.captions && first>0) blocks = blocks.slice(0,first).concat([{t:'lists'},{t:'page'}], blocks.slice(first));
    let html = '<div class="page">' + blocks.map(b=>{
      const f=R[b.t]; return f?f(b):'';
    }).join('') + '</div>';
    const row = (cls,n,text,id) => `<a class="${cls}" href="#${id}"><span class="ln">${n}</span><span class="lt">${md(text)}</span><span class="ld"></span>${pg(id)}</a>`;
    const list = (L,id,title) => `<h1 id="${id}">${title}</h1><hr class="thick"><div class="lol">${S.chs.map(c=>{
      const e=L.filter(x=>x.ch===c.k); return e.length?`<div class="lg">${md(c.w)} ${md(c.k)} &middot; ${md(c.text)}</div>`+
        e.map(x=>row('lr',x.num,x.text,x.id)).join(''):''; }).join('')}</div>`;
    const front = [S.lof.length&&['lof','List of Figures'], S.lot.length&&['lot','List of Tables']].filter(Boolean);
    html = html
      .replace(/<!--TOCSEC:([^>]*?)-->/g, (m,k)=>(S.secs[k]||[]).map(x=>row('sr',x.num,x.text,'sec-'+x.num)).join(''))
      .replace('<!--TOCFRONT-->', S.captions ? front.map(([id,t])=>
        `<div class="c fm"><div class="n"></div><a class="t" href="#${id}">${t}</a><div class="a"></div>${pg(id)}</div>`).join('') : '')
      .replace('<!--LISTS-->', front.map(([id,t])=>list(id==='lof'?S.lof:S.lot,id,t)).join(R.page()));
    host.innerHTML = html;
    S = null;
  };
})();
