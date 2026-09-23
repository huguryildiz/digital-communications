/* ==========================================================================
   web/fig.js — Figure 1 on the cover page, drawn from the scroll position.

   Section 2.3 of the course, the decision and its error, in three steps:
     1. twelve bits leave the transmitter as a Manchester waveform s(t)
        (IEEE 802.3: a 1 rises in the middle of its cell, a 0 falls);
     2. the channel adds white Gaussian noise, r(t) = s(t) + n(t), while
        Eb/N0 falls from 16 dB to 4 dB;
     3. the bit error probability of antipodal signalling,
        Pb = Q(sqrt(2 Eb/N0)), with the operating point moving from 4 dB
        (1.25e-2) to 10 dB (3.87e-6).
   Manchester is antipodal (the two cell waveforms are negatives of each
   other), so step 3 is the curve that step 2's waveform lives on.

   The noise is one fixed Gaussian realisation, seeded, so every reader sees
   the same trace. Its drawn standard deviation is 0.55/sqrt(Eb/N0) of the
   pulse height: proportional to the true one, scaled for the eye.

   The drawing is a pure function of how far the reader has scrolled through
   #track, so it never runs on its own and needs no reduced-motion branch.
   index.html styles the canvas with CSS custom properties (--cyan, --green,
   --red, --fig-axis, --fig-text, --fig-grid) and data attributes
   (data-pad="L,R,T,B", data-glow), and receives the state through
   window.onFig(state) to update the caption and the label.
   ========================================================================== */
(function () {
  var cv = document.getElementById('plot'), ctx = cv.getContext('2d');
  var track = document.getElementById('track'), fig = document.getElementById('fig');
  var BITS = [0,1,1,0,1,0,1,1,0,1,0,0];   // the first twelve bits of the earlier scope's pattern
  var NB = BITS.length, SPB = 40;         // samples per bit for the noisy trace
  var DB_HI = 16, DB_LO = 4, DB_END = 10;
  var W = 0, H = 0, dpr = 1, C = {};
  var pad = (cv.dataset.pad || '40,16,24,40').split(',').map(Number);
  var L = pad[0], R = pad[1], T = pad[2], B = pad[3];
  var GLOW = cv.hasAttribute('data-glow');

  /* one fixed noise realisation: mulberry32 into Box-Muller */
  var NOISE = (function () {
    var a = 20260923, out = [];
    function rnd() {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    for (var i = 0; i <= NB * SPB; i++) {
      var u = rnd() || 1e-12, v = rnd();
      out.push(Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v));
    }
    return out;
  })();

  /* Q(x) = ½ erfc(x/√2), Chebyshev erfc, fractional error below 1.2e-7 */
  function erfc(x) {
    var z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    var ans = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 +
      t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 +
      t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? ans : 2 - ans;
  }
  function pb(db) { return 0.5 * erfc(Math.sqrt(2 * Math.pow(10, db / 10)) / Math.SQRT2); }

  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(v) { return v * v * (3 - 2 * v); }
  function css(n) { return getComputedStyle(cv).getPropertyValue(n).trim(); }

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = cv.getBoundingClientRect(); W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    C = { cyan: css('--cyan'), green: css('--green'), red: css('--red'),
          axis: css('--fig-axis'), text: css('--fig-text'), grid: css('--fig-grid') };
  }
  function progress() {
    var r = track.getBoundingClientRect();
    var st = parseFloat(getComputedStyle(fig).top) || 0;
    var span = r.height - fig.offsetHeight;
    return span > 0 ? clamp((st - r.top) / span) : 0;
  }
  function fx(u) { return L + u * (W - L - R); }
  function fy(v, lo, hi) { return T + (1 - (v - lo) / (hi - lo)) * (H - T - B); }

  function stroke(pts, color, width, alpha, glow, dash) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round';
    if (dash) ctx.setLineDash(dash);
    if (glow && GLOW) { ctx.shadowColor = color; ctx.shadowBlur = 10; }
    ctx.beginPath();
    for (var i = 0; i < pts.length; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]);
    ctx.stroke(); ctx.restore();
  }
  function text(txt, x, y, align, color, alpha, font) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.textAlign = align || 'left';
    ctx.font = font || 'italic 15px "Iowan Old Style", Palatino, Georgia, serif'; ctx.fillText(txt, x, y); ctx.restore();
  }

  /* Manchester: a 1 is low then high, a 0 is high then low */
  function level(pos) {
    var k = Math.min(NB - 1, Math.floor(pos)), second = pos - k >= 0.5;
    return (BITS[k] === 1 ? second : !second) ? 1 : -1;
  }
  function wavePts(upto, lo, hi) {        // exact edges, up to bit position `upto`
    var pts = [], k;
    for (k = 0; k < NB && k < upto; k++) {
      var halves = [[k, k + .5], [k + .5, k + 1]];
      for (var h = 0; h < 2; h++) {
        var a = halves[h][0], b = Math.min(halves[h][1], upto);
        if (a >= upto) break;
        var y = fy(level(a + .01), lo, hi);
        pts.push([fx(a / NB), y], [fx(b / NB), y]);
      }
    }
    return pts;
  }

  function drawTime(st, alpha) {
    var lo = -2, hi = 2.4, y0 = fy(0, lo, hi);
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(L, y0); ctx.lineTo(W - R, y0); ctx.moveTo(L, T); ctx.lineTo(L, H - B); ctx.stroke();
    ctx.setLineDash([2, 5]); ctx.beginPath();
    for (var k = 1; k < NB; k++) { var x = Math.round(fx(k / NB)) + .5; ctx.moveTo(x, fy(1.3, lo, hi)); ctx.lineTo(x, fy(-1.3, lo, hi)); }
    ctx.stroke(); ctx.restore();
    text('t', W - R, y0 + 20, 'right', C.text, alpha);

    var shown = st.stage === 0 ? st.upto : NB;
    for (var i = 0; i < NB && i < Math.ceil(shown); i++)
      text(String(BITS[i]), fx((i + .5) / NB), fy(2.15, lo, hi), 'center', C.text,
           alpha * clamp(shown - i), '500 13px Inter, -apple-system, sans-serif');

    if (st.stage === 0) {
      stroke(wavePts(st.upto, lo, hi), C.cyan, 2.2, alpha, true);
    } else {
      stroke(wavePts(NB, lo, hi), C.cyan, 1.3, .4 * alpha);
      var sig = 0.55 / Math.sqrt(Math.pow(10, st.db / 10)), pts = [];
      for (var j = 0; j <= NB * SPB; j++) {
        var pos = j / SPB;
        pts.push([fx(pos / NB), fy(level(Math.min(pos, NB - 1e-6)) + sig * NOISE[j], lo, hi)]);
      }
      stroke(pts, C.green, 1.6, alpha, true);
    }
  }

  function drawBer(sc, op, alpha) {
    var lo = -7, hi = 0, dbMax = 12;
    function ux(db) { return db / dbMax; }
    function ly(p) { return fy(Math.max(lo, Math.log10(p)), lo, hi); }
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.beginPath();
    for (var d = -1; d >= lo; d--) { var y = Math.round(fy(d, lo, hi)) + .5; ctx.moveTo(L, y); ctx.lineTo(W - R, y); }
    ctx.stroke();
    ctx.strokeStyle = C.axis; ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(L, H - B); ctx.lineTo(W - R, H - B); ctx.stroke();
    ctx.fillStyle = C.text; ctx.font = '12px Inter, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    for (var x = 0; x <= dbMax; x += 2) ctx.fillText(x, fx(ux(x)), H - B + 16);
    ctx.textAlign = 'right';
    var sup = { '-1': '⁻¹', '-3': '⁻³', '-5': '⁻⁵', '-7': '⁻⁷' };
    [-1, -3, -5, -7].forEach(function (e) { ctx.fillText('10' + sup[e], L - 8, fy(e, lo, hi) + 4); });
    ctx.restore();
    text('Eb/N₀ (dB)', W - R, H - B + 34, 'right', C.text, alpha);
    text('Pb', L + 8, T + 12, 'left', C.red, alpha);

    var draw = ease(clamp((sc - .2) / .45));
    if (draw > 0) {
      var pts = [];
      for (var i = 0; i <= 240; i++) { var db = dbMax * i / 240; if (pb(db) < 1e-7) break; pts.push([fx(ux(db)), ly(pb(db))]); }
      ctx.save(); ctx.beginPath(); ctx.rect(L, 0, (W - L - R) * draw + 1, H); ctx.clip();
      stroke(pts, C.red, 2.2, alpha, true);
      ctx.restore();
      text('Pb = Q(√(2Eb/N₀))', fx(ux(6.4)), ly(pb(6.4)) - 16, 'left', C.red, alpha * draw);
    }
    var g = clamp((sc - .45) / .1);
    if (g > 0) {
      var px = fx(ux(op)), py = ly(pb(op));
      ctx.save(); ctx.globalAlpha = alpha * g; ctx.strokeStyle = C.text; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, H - B); ctx.lineTo(px, py); ctx.lineTo(L, py); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = C.green;
      if (GLOW) { ctx.shadowColor = C.green; ctx.shadowBlur = 12; }
      ctx.beginPath(); ctx.arc(px, py, 5, 0, 7); ctx.fill(); ctx.restore();
    }
  }

  function render() {
    if (!W) size();
    var p = progress();
    var sa = clamp(p / .34), sb = clamp((p - .36) / .28), sc = clamp((p - .68) / .3);
    var s = p < .35 ? 0 : p < .67 ? 1 : 2;
    var upto = 1 + ease(sa) * (NB - 1);
    var db = DB_HI - (DB_HI - DB_LO) * ease(sb);
    var op = DB_LO + (DB_END - DB_LO) * ease(clamp((sc - .5) / .5));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    var tA = 1 - ease(clamp(sc / .3)), fA = ease(clamp((sc - .12) / .3));
    if (tA > 0) drawTime({ stage: s === 0 ? 0 : 1, upto: upto, db: db }, tA);
    if (fA > 0) drawBer(sc, op, fA);
    if (window.onFig) window.onFig({
      p: p, s: s, sa: sa, sb: sb, sc: sc,
      bits: Math.min(NB, Math.floor(upto + .001)), nbits: NB,
      db: s === 2 ? op : db, pb: pb(s === 2 ? op : db)
    });
  }

  var queued = false;
  function queue() { if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; render(); }); } }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', function () { size(); queue(); });
  size(); render();
})();
