/* ==========================================================================
   TEMPORARY STUB — branch m6-labs only. DELETE THIS FILE ON m6-int.

   It makes the Module 6 laboratories reachable before the rewritten scene
   file (87_scenes_m6.js) and the M6 block of 89_sections.js arrive from the
   scene branch. It appends the three new laboratory scenes to
   window.SCENES_M6, appends each to the end of a section of the current
   outline's CONTENT.SECTIONS.M6, adds their CONTENT.BOOK anchors, and turns
   the existing m6-lab-i, m6-lab-j and m6-lab-k scenes into slides with a
   {lab} title so Laboratories I, J and K are seen in their converted form.
   The scene ids and laboratory keys are the ones the conversion plan fixes:
   m6-lab-i (I), m6-lab-typical (TS), m6-lab-j (J), m6-lab-mi (MI),
   m6-lab-k (K), m6-lab-wf (WF). It loads after 89_sections.js and before
   the scene list is assembled in 99_tail.html, so it edits nothing it does
   not own.
   ========================================================================== */
(function(){
  const S = window.SCENES_M6 || (window.SCENES_M6 = []);
  const blocks = (key, name, eyebrow, lede) => [
    {t:'eyebrow', text:'Module 6 · ' + eyebrow},
    {t:'title', text:'Laboratory {lab} · ' + name},
    {t:'lede', text:lede},
    {t:'lab', id:key}
  ];
  const lab = (id, key, name, eyebrow, lede) => ({
    id, module:'M6', nav:'Laboratory {lab} · ' + name, title:'Laboratory {lab} · ' + name,
    objective:lede, keywords:'laboratory interactive ' + name.toLowerCase(),
    slide:true, steps:0, blocks:blocks(key, name, eyebrow, lede)});
  S.push(
    lab('m6-lab-typical', 'TS', 'Typical sequences', 'The limits of compression',
      'Grow the length and watch the probability pile up on the entropy.'),
    lab('m6-lab-mi', 'MI', 'Mutual information of a channel', 'Channels and mutual information',
      'Send symbols across a channel and count what gets through.'),
    lab('m6-lab-wf', 'WF', 'Sharing power over parallel channels', 'The Gaussian channel',
      'Pour power over the noise floors, then share it equally.')
  );
  const redo = (id, key, name, eyebrow, lede) => {
    const s = S.find(x => x.id === id);
    if(!s) return;
    s.slide = true; s.nav = 'Laboratory {lab} · ' + name; s.title = 'Laboratory {lab} · ' + name;
    s.blocks = blocks(key, name, eyebrow, lede);
  };
  redo('m6-lab-i', 'I', 'Entropy of a source', 'Information and entropy',
    'Move the probabilities and watch the entropy and its ceiling.');
  redo('m6-lab-j', 'J', 'Huffman code construction', 'Huffman and Lempel–Ziv coding',
    'Step through the merges, switch the tie rule, then code pairs.');
  redo('m6-lab-k', 'K', 'Channel capacity', 'Channel capacity',
    'Sweep the input of four channels and set a rate against the capacity.');
  /* each new laboratory closes a section of the current outline whose
     material it exercises, until the scene branch brings the new sections */
  const sec = n => CONTENT.SECTIONS.M6.find(x => x.n === n).ids;
  sec('6.3').push('m6-lab-typical'); sec('6.7').push('m6-lab-mi'); sec('6.9').push('m6-lab-wf');
  Object.assign(CONTENT.BOOK, { 'm6-lab-typical':'12.2', 'm6-lab-mi':'12.1.3, 12.4', 'm6-lab-wf':'12.5.1' });
})();
