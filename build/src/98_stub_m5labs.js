/* ==========================================================================
   TEMPORARY STUB — branch m5-labs only. DELETE THIS FILE ON m5-int.

   It makes the Module 5 laboratories reachable before the rewritten scene
   file (86_scenes_m5.js) and the M5 block of 89_sections.js arrive from the
   scene branch. It appends the four new laboratory scenes to
   window.SCENES_M5, appends each to the end of its section's id list in
   CONTENT.SECTIONS.M5, and turns the existing m5-lab-h scene into a slide
   with a {lab} title so Laboratory H is seen in its converted form. The
   scene ids and laboratory keys are the ones the conversion plan fixes:
   m5-lab-iq (X), m5-lab-gray (Y), m5-lab-h (H), m5-lab-fsk (Z),
   m5-lab-plane (BW). It loads after 89_sections.js and before the scene
   list is assembled in 99_tail.html, so it edits nothing it does not own.
   ========================================================================== */
(function(){
  const S = window.SCENES_M5 || (window.SCENES_M5 = []);
  const lab = (id, key, name, eyebrow, lede) => ({
    id, module:'M5', nav:'Laboratory {lab} · ' + name, title:'Laboratory {lab} · ' + name,
    objective:lede, keywords:'laboratory interactive ' + name.toLowerCase(),
    slide:true, steps:0, blocks:[
      {t:'eyebrow', text:'Module 5 · ' + eyebrow},
      {t:'title', text:'Laboratory {lab} · ' + name},
      {t:'lede', text:lede},
      {t:'lab', id:key}
    ]});
  S.push(
    lab('m5-lab-iq', 'X', 'The IQ modulator', 'Putting bits on a carrier',
      'Step through the bits: each symbol becomes a point, two levels, then a burst of carrier.'),
    lab('m5-lab-gray', 'Y', 'Bit errors in the noise cloud', 'Phase-shift keying',
      'Grow the noise cloud batch by batch. Count the bits each wrong symbol costs.'),
    lab('m5-lab-fsk', 'Z', 'Orthogonal signals as M grows', 'Frequency-shift keying',
      'Add tones and watch the error curves move left, with and without the carrier phase.'),
    lab('m5-lab-plane', 'BW', 'The bandwidth–power plane', 'Bandwidth and the choice of scheme',
      'Place every family on the bandwidth–power plane, then let a link choose its scheme.')
  );
  const h = S.find(s => s.id === 'm5-lab-h');
  if(h){
    const name = 'Error probability against signal-to-noise ratio';
    h.slide = true; h.nav = 'Laboratory {lab} · ' + name; h.title = 'Laboratory {lab} · ' + name;
    h.blocks = [
      {t:'eyebrow', text:'Module 5 · Amplitude and quadrature'},
      {t:'title', text:'Laboratory {lab} · ' + name},
      {t:'lede', text:'Run the batches and compare the closed form with the count at every mark.'},
      {t:'lab', id:'H'}
    ];
  }
  /* each laboratory closes the section whose material it exercises; the
     bandwidth-power plane waits in 5.4 until the scene branch adds 5.5 */
  const sec = n => CONTENT.SECTIONS.M5.find(x => x.n === n).ids;
  sec('5.1').push('m5-lab-iq'); sec('5.2').push('m5-lab-gray'); sec('5.4').push('m5-lab-fsk', 'm5-lab-plane');
  Object.assign(CONTENT.BOOK, { 'm5-lab-iq':'8.6, 8.7', 'm5-lab-gray':'8.6.1, 8.6.3', 'm5-lab-fsk':'9.1, 9.5', 'm5-lab-plane':'9.7' });
})();
