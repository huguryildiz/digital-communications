/* TEMPORARY, branch m6-code only: delete at integration (m6-int).
   Shows the six Module 6 code pages before the scene rewrite (87_scenes_m6.js,
   89_sections.js) lands. It appends the six code scenes to SCENES_M6 and lists
   each at the end of a section of the current Module 6 outline. On m6-int the
   real scenes and sections replace it. */
(function(){
  const pages = [
    ['m6-code-entropy',  'Entropy',                        'Entropy in code',                            '6.1'],
    ['m6-code-bound',    'Limits of compression',          'The limits of compression in code',          '6.3'],
    ['m6-code-huffman',  'Huffman and Lempel–Ziv',         'Huffman and Lempel–Ziv in code',             '6.4'],
    ['m6-code-channel',  'Channels',                       'Channels and mutual information in code',    '6.7'],
    ['m6-code-capacity', 'Capacity',                       'Channel capacity in code',                   '6.8'],
    ['m6-code-gauss',    'The Gaussian channel',           'The Gaussian channel in code',               '6.9']
  ];
  window.SCENES_M6 = (window.SCENES_M6 || []).concat(pages.map(([id, nav, title]) => ({
    id, module:'M6', nav:'Code · '+nav, title,
    objective:'Run the section in MATLAB or Python.', keywords:'code matlab python program run',
    slide:true, steps:0, budget:'a code page: the program draws its own figure', blocks:[
      {t:'eyebrow', text:'Module 6 · '+title},
      {t:'title', text:title},
      {t:'raw', html:()=>CODEBANK.page(id)}
    ]})));
  const secs = CONTENT.SECTIONS.M6;
  pages.forEach(([id, , , n]) => { const s = secs.find(x => x.n === n); if(s) s.ids.push(id); });
})();
