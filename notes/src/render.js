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

  const R = {
    page:   ()=>'</div><div class="page">',
    /* The mark comes from `build/src/icon.svg`, injected by whichever builder
       made this page. One drawing, three documents. */
    title:  b=>`<div class="title"><div class="mark">${window.ICON_SVG||''}</div><p class="kicker">${md(b.kicker)}</p>
       <h1 class="doc">${md(b.text)}</h1>${b.sub?`<p class="lead">${md(b.sub)}</p>`:''}
       ${b.meta?`<div class="meta">${b.meta.map(([k,v])=>`<div><b>${md(k)}</b>${md(v)}</div>`).join('')}</div>`:''}</div>`,
    h1:     b=>`<h1>${b.num?`<span class="num">${b.num}</span>`:''}${md(b.text)}</h1>${b.rule!==false?'<hr class="thick">':''}`,
    h2:     b=>`<h2>${b.num?`<span class="num">${b.num}</span>`:''}${md(b.text)}</h2>`,
    h3:     b=>`<h3>${md(b.text)}</h3>`,
    p:      b=>`<p${b.lead?' class="lead"':''}>${md(b.text)}</p>`,
    ul:     b=>`<ul>${b.items.map(i=>`<li>${md(i)}</li>`).join('')}</ul>`,
    ol:     b=>`<ol>${b.items.map(i=>`<li>${md(i)}</li>`).join('')}</ol>`,
    eq:     b=>`<div class="eq ${b.big?'big':''}">${T(b.tex,true)}</div>`,
    eqbox:  b=>`<div class="eqbox">${b.cap?`<div class="cap">${md(b.cap)}</div>`:''}
       ${(Array.isArray(b.tex)?b.tex:[b.tex]).map(t=>`<div class="eq ${b.big?'big':''}">${T(t,true)}</div>`).join('')}
       ${b.after?`<div class="after">${md(b.after)}</div>`:''}</div>`,
    box:    b=>`<div class="box ${b.kind||''}">${b.hd?`<span class="t">${md(b.hd)}</span>`:''}${md(b.html)}</div>`,
    ex:     b=>`<div class="ex"><div class="h">${md(b.hd||'Example')}</div><dl>${
       b.rows.map(([k,v])=>`<dt>${md(k)}</dt><dd>${md(v)}</dd>`).join('')}</dl></div>`,
    fig:    b=>`<figure>${typeof b.svg==='function'?b.svg():b.svg}
       ${b.cap?`<figcaption>${md(b.cap)}</figcaption>`:''}</figure>`,
    figrow: b=>`<div class="figrow ${b.n===3?'three':'two'}">${b.items.map(it=>
       `<figure>${typeof it.svg==='function'?it.svg():it.svg}${it.cap?`<figcaption>${md(it.cap)}</figcaption>`:''}</figure>`).join('')}</div>`,
    table:  b=>`<table>${b.head?`<tr>${b.head.map(h=>`<th>${md(h)}</th>`).join('')}</tr>`:''}
       ${b.rows.map(r=>`<tr>${r.map(c=>`<td>${md(c)}</td>`).join('')}</tr>`).join('')}</table>`,
    /* A contents row is number, title, summary and — where the same material is
       developed at length in the course textbook — an anchor into it. The anchor
       always carries its `OW` marker: these chapter numbers and the textbook's do
       not agree, and a bare section mark would read as one of these.
       The anchor is written before the summary so that grid auto-placement puts
       it on the title line; the summary then spans the two columns beneath. */
    toc:    b=>`<div class="toc">${b.items.map(([n,t,s,a])=>
       `<div class="c"><div class="n">${md(n)}</div><div class="t">${md(t)}</div>${
         `<div class="a">${a?md(a):''}</div>`}<div class="s">${md(s)}</div></div>`).join('')}</div>`,
    hr:     ()=>'<hr>',
    q:      b=>`<div class="q"><span class="n">${b.n}</span> ${md(b.text)}${
       b.ans?`<div class="ans">Answer: ${md(b.ans)}</div>`:''}</div>`,
    raw:    b=>b.html
  };

  /* The three document editions build their own blocks from CONTENT, so they need
     the same inline renderer the block types use. One renderer, one behaviour. */
  window.renderInline = md;

  window.renderNotes = function(blocks, host){
    host.innerHTML = '<div class="page">' + blocks.map(b=>{
      const f=R[b.t]; return f?f(b):'';
    }).join('') + '</div>';
  };
})();
