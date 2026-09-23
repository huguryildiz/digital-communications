/* ==========================================================================
   The instrument — a live oscilloscope showing a Manchester-coded bit stream
   with noise on it, and a corner readout that says what the noise costs.

   Ported from the laboratory application that accompanies this course, with
   the framework taken out: one canvas, one interval, no dependencies.

   The point of it is that the numbers and the picture are the same statement.
   The signal-to-noise ratio drifts slowly between 7 and 11 dB; the noise drawn
   on the trace is scaled by that same ratio, and the bit error probability in
   the corner is computed from it by the formula this course spends four
   modules arriving at,

       P_b = Q(sqrt(2 E_b / N_0))   for antipodal signalling,

   so a reader who watches the trace get noisier and the error rate get worse
   is watching one quantity, not two decorations. The bits along the top are
   the bits the trace is drawing, not a different random string.
   ========================================================================== */
(function () {
  var canvas = document.getElementById('scope');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- the model --------------------------------------------------------- */

  var LINE_RATE_MBPS = 10;          /* the nominal rate on the readout */
  var BREATH_MS = 16000;            /* one full excursion of E_b/N_0 */
  var EBN0_LO_DB = 7;
  var EBN0_HI_DB = 11;
  var BIT_RATE = 2.4;               /* bit cells scrolled per second on screen */
  var BITS_ON_SCREEN = 8;
  var FEED_BITS = 12;

  /* A fixed pattern rather than a random one, so every reader of this page
     sees the same waveform and the same bits beside it. */
  var BITS = [0,1,1,0,1,0,1,1,0,1,0,1,1,1,0,0,1,0,0,1,1,0,1,0,0,0,1,1,0,1,1,0];

  /* Q(x) = ½ erfc(x/√2). The complementary error function is the Chebyshev
     form whose fractional error is below 1.2e-7 everywhere — far finer than a
     readout that prints two significant figures needs. */
  function erfc(x) {
    var z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    var ans = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 +
      t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 +
      t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? ans : 2 - ans;
  }
  function qfunc(x) { return 0.5 * erfc(x / Math.SQRT2); }

  function metrics(now) {
    /* raised cosine, so the ratio dwells at both ends instead of sweeping past */
    var phase = (now % BREATH_MS) / BREATH_MS;
    var s = 0.5 - 0.5 * Math.cos(phase * 2 * Math.PI);
    var ebn0Db = EBN0_LO_DB + (EBN0_HI_DB - EBN0_LO_DB) * s;
    var gamma = Math.pow(10, ebn0Db / 10);
    return {
      ebn0Db: ebn0Db,
      ber: qfunc(Math.sqrt(2 * gamma)),
      noisePx: Math.min(5, Math.max(1.5, 9 / Math.sqrt(gamma))),
      rate: LINE_RATE_MBPS + 0.5 * Math.sin(now / 1430) + 0.3 * Math.sin(now / 610)
    };
  }

  function bitAt(i) { return BITS[((i % BITS.length) + BITS.length) % BITS.length]; }
  function bitScroll(now) { return (now / 1000) * BIT_RATE; }

  /* Manchester, as IEEE 802.3 defines it: a 1 is a low-to-high transition in
     the middle of the cell, a 0 is high-to-low. The level is +1 or −1. */
  function manchester(pos) {
    var secondHalf = pos - Math.floor(pos) >= 0.5;
    var high = bitAt(Math.floor(pos)) === 1 ? secondHalf : !secondHalf;
    return high ? 1 : -1;
  }

  function gaussian() {
    var u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /* ---- the screen -------------------------------------------------------- */

  var W = 0, H = 0, dpr = 1, visible = false, looping = false;
  /* With motion reduced the whole instrument freezes at the middle of the
     excursion — 9 dB — so the still page still shows an honest reading. */
  var frozen = reduced ? BREATH_MS / 4 : 0;

  function now() { return reduced ? frozen : performance.now(); }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#04050f';
    ctx.fillRect(0, 0, W, H);
  }

  function paint(t) {
    /* phosphor persistence: the previous frame is dimmed, not erased, which is
       what gives the trace its tail */
    ctx.fillStyle = 'rgba(4, 5, 15, 0.22)';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(57, 255, 133, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    var gx = W / 12, gy = H / 6;
    for (var i = 1; i < 12; i++) { ctx.moveTo(i * gx, 0); ctx.lineTo(i * gx, H); }
    for (var j = 1; j < 6; j++) { ctx.moveTo(0, j * gy); ctx.lineTo(W, j * gy); }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(57, 255, 133, 0.14)';
    ctx.beginPath();
    ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2);
    ctx.stroke();

    /* the levels sit a little inside the screen so the corner readings keep
       clear air above and below the trace */
    var mid = H / 2, amp = H * 0.27;
    var m = metrics(now());
    var p0 = bitScroll(now());
    var cellPx = W / BITS_ON_SCREEN;

    /* the bit clock, one tick per cell boundary, scrolling with the code */
    ctx.strokeStyle = 'rgba(91, 140, 255, 0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (var b = Math.ceil(p0); (b - p0) * cellPx <= W; b++) {
      var x = (b - p0) * cellPx;
      ctx.moveTo(x, mid - 9); ctx.lineTo(x, mid + 9);
    }
    ctx.stroke();

    /* the trace, with noise whose spread is set by the ratio on the readout */
    ctx.shadowColor = '#39ff85';
    ctx.shadowBlur = 9;
    ctx.strokeStyle = '#39ff85';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var px = 0; px <= W; px += 2) {
      var y = mid - manchester(p0 + px / cellPx) * amp + gaussian() * m.noisePx;
      if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    /* the sweep */
    var sx = (t * 0.18) % W;
    var grd = ctx.createLinearGradient(sx - 40, 0, sx, 0);
    grd.addColorStop(0, 'rgba(57, 255, 133, 0)');
    grd.addColorStop(1, 'rgba(57, 255, 133, 0.32)');
    ctx.fillStyle = grd;
    ctx.fillRect(sx - 40, 0, 40, H);
    ctx.strokeStyle = 'rgba(57, 255, 133, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx, 0); ctx.lineTo(sx, H);
    ctx.stroke();
  }

  /* ---- the readout ------------------------------------------------------- */

  var elBits = document.getElementById('hud-bits');
  var elRate = document.getElementById('hud-rate');
  var elSnr = document.getElementById('hud-snr');
  var elBer = document.getElementById('hud-ber');

  function feed(n) {
    var start = Math.floor(bitScroll(n));
    var s = '';
    for (var i = 0; i < FEED_BITS; i++) s += bitAt(start + i);
    return s.replace(/(.{4})/g, '$1 ').trim();
  }

  function updateReadout() {
    var n = now();
    var m = metrics(n);
    if (elBits) elBits.textContent = feed(n);
    if (elRate) elRate.textContent = m.rate.toFixed(1) + ' Mb/s';
    if (elSnr) elSnr.textContent = m.ebn0Db.toFixed(1) + ' dB';
    if (elBer) elBer.textContent = m.ber.toExponential(1).replace('e-', 'e−');
  }

  /* ---- lifecycle --------------------------------------------------------- */

  var readoutTimer = 0;

  function frame(t) {
    if (!looping) return;
    paint(t);
    requestAnimationFrame(frame);
  }

  function start() {
    if (looping || reduced || document.hidden || !visible) return;
    looping = true;
    requestAnimationFrame(frame);
    readoutTimer = window.setInterval(updateReadout, 150);
  }
  function stop() {
    looping = false;
    if (readoutTimer) { window.clearInterval(readoutTimer); readoutTimer = 0; }
  }

  resize();
  paint(0);
  updateReadout();

  new ResizeObserver(function () { resize(); paint(0); }).observe(canvas);

  new IntersectionObserver(function (entries) {
    visible = entries[0] && entries[0].isIntersecting;
    if (visible) start(); else stop();
  }, { threshold: 0.01 }).observe(canvas);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });
})();
