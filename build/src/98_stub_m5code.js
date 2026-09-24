/* TEMPORARY, branch m5-code only: delete at integration (m5-int).
   Shows the five Module 5 code pages before the scene rewrite (86_scenes_m5.js,
   89_sections.js) lands. It appends the five code scenes to SCENES_M5 and lists
   each at the end of a section of the current Module 5 outline; the fifth goes
   into a section of its own. On m5-int the real scenes and sections replace it. */
(function(){
  const pages = [
    ['m5-code-binary',  'Binary keying',            '5.1'],
    ['m5-code-psk',     'Phase-shift keying',       '5.2'],
    ['m5-code-qam',     'Amplitude and quadrature', '5.3'],
    ['m5-code-fsk',     'Frequency-shift keying',   '5.4'],
    ['m5-code-compare', 'Comparing schemes',        null]
  ];
  window.SCENES_M5 = (window.SCENES_M5 || []).concat(pages.map(([id, name]) => ({
    id, module:'M5', nav:'Code · '+name, title:name+' in code',
    objective:'Run the section in MATLAB or Python.', keywords:'code matlab python program run',
    slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
      {t:'eyebrow', text:'Module 5 · '+name+' in code'},
      {t:'title', text:name+' in code'},
      {t:'raw', html:()=>CODEBANK.page(id)}
    ]})));
  const secs = CONTENT.SECTIONS.M5;
  pages.forEach(([id, , n]) => { const s = n && secs.find(x => x.n === n); if(s) s.ids.push(id); });
  secs.push({ n:'5.9', title:'Comparing schemes', ids:['m5-code-compare'] });
})();
