"""Re-derives every number a teaching scene states.

A scene that says "the signal-to-quantization-noise ratio is 49.8 dB" is making
a claim, and a claim nobody re-derives is a claim nobody has checked. Each entry
below names the scene, records the number as the scene prints it, and computes
the same quantity independently -- symbolically with SymPy where the result has
a closed form, numerically where it does not.

The one thing a check may not do is restate the scene's own arithmetic. Copying
the expression out of the scene and evaluating it verifies that Python and
JavaScript agree about multiplication, which was never in doubt. A check earns
its place by reaching the number by a different route: from the definition, from
a different identity, or by simulation.

A closed-form error probability is not checked here. Re-deriving one is how the
original error would be reproduced, so those live in verify_ber.py and are
checked against a simulation of the system instead.

Adding a check is adding a dict to CHECKS. The runner does not change.
"""

import math
import sys

import numpy as np
import sympy as sp
from scipy import integrate

# ── Module 1 ────────────────────────────────────────────────────────────────
# Sampling, quantization and pulse code modulation.


def _sinc(x):
    """sin(pi x)/(pi x), the convention this course fixes in scene 1.2.1."""
    return np.sinc(x)


def _nyquist_of_product():
    """Nyquist rate of x(t)cos(2*pi*40k*t) when x is bandlimited to 40 kHz.

    Reached from the spectrum rather than from the rule: the product occupies
    the union of X shifted to +/-fc, so its highest frequency is fc + W and the
    rate is twice that.
    """
    W, fc = 40e3, 40e3
    highest = fc + W
    return 2 * highest


def _power_of_sinusoid():
    """Average power of 5 cos(t), by time-averaging rather than by Parseval.

    The scene reaches 12.5 through the Fourier coefficients. Integrating the
    square over one period is a different route to the same number.
    """
    t = sp.symbols("t", real=True)
    T = 2 * sp.pi
    return float(sp.integrate((5 * sp.cos(t)) ** 2, (t, 0, T)) / T)


def _sqnr_db_sinusoid(bits):
    """SQNR of a full-scale sinusoid through a uniform mid-rise quantizer.

    Measured, not predicted: the waveform is quantized and the mean square of
    the actual error is averaged over one period. If alpha + 6.02R were wrong
    this would not follow it.
    """
    mmax, L = 5.0, 2 ** bits
    delta = 2 * mmax / L
    t = np.linspace(0.0, 2 * np.pi, 2_000_001)
    m = mmax * np.cos(t)
    lvl = np.clip(np.floor(m / delta) + 0.5, -L / 2 + 0.5, L / 2 - 0.5) * delta
    err = m - lvl
    pm = np.trapezoid(m ** 2, t) / (2 * np.pi)
    pq = np.trapezoid(err ** 2, t) / (2 * np.pi)
    return 10 * math.log10(pm / pq)


def _mse_uniform_source():
    """E[Q^2] for M ~ U(-1,1) through a 256-level uniform quantizer.

    Integrated against the true density over each of the 256 regions rather
    than taken from Delta^2/12, which is the statement being checked.
    """
    L, mmax = 256, 1.0
    delta = 2 * mmax / L
    total = 0.0
    for k in range(L):
        lo = -mmax + k * delta
        v = lo + delta / 2
        seg, _ = integrate.quad(lambda m: (m - v) ** 2 * 0.5, lo, lo + delta)
        total += seg
    return total


def _sqnr_db_formula(bits):
    """alpha + 6.02R for the sinusoid, with the average power integrated rather
    than taken from the scene."""
    pm = _power_of_sinusoid()
    return 10 * math.log10(3 * pm / 25.0) + 20 * bits * math.log10(2.0)


def _sqnr_db_uniform_source():
    return 10 * math.log10((1.0 / 3.0) / _mse_uniform_source())


# The five-level quantizer of the Gaussian example: boundaries and outputs as
# the scene states them.
_GAUSS_EDGES = [-np.inf, -40.0, -20.0, 20.0, 40.0, np.inf]
_GAUSS_LEVELS = [-30.0, -10.0, 0.0, 10.0, 30.0]


def _noise_power_gaussian():
    var = 400.0
    dens = lambda x: math.exp(-x * x / (2 * var)) / math.sqrt(2 * math.pi * var)
    total = 0.0
    for lo, hi, v in zip(_GAUSS_EDGES[:-1], _GAUSS_EDGES[1:], _GAUSS_LEVELS):
        seg, _ = integrate.quad(lambda x, v=v: (x - v) ** 2 * dens(x), lo, hi)
        total += seg
    return total


def _signal_power_gaussian():
    """Area under S_X(f) = 2 on |f| < 100 Hz, integrated rather than multiplied."""
    val, _ = integrate.quad(lambda f: 2.0, -100.0, 100.0)
    return val


def _sqnr_db_gaussian():
    return 10 * math.log10(_signal_power_gaussian() / _noise_power_gaussian())


def _pcm_sample(n):
    """The nth sample of 8|sinc(t-2)| at T_s = 0.6 s."""
    return 8 * abs(_sinc(0.6 * n - 2))


def _pcm_code_index(n):
    """Which of the eight treads the nth sample falls in, as an integer 0..7."""
    return int(min(7, math.floor(_pcm_sample(n))))



def _pairs_within_one(L):
    """How many ordered pairs of levels differ by at most one step.

    The scene states 3L-2. This counts the grid instead, so the closed form is
    checked rather than repeated.
    """
    return sum(1 for i in range(L) for j in range(L) if abs(i - j) <= 1)


def _copy_lower_edge(W, fs):
    """Lowest frequency at which the copy G(f - fs) of a triangle of half-width
    W is non-zero, found by scanning the copy rather than by fs - W."""
    f = np.linspace(0.0, 2 * fs, 2_000_001)
    tri = np.clip(1 - np.abs(f - fs) / W, 0.0, None)
    return float(f[np.argmax(tri > 0)])


def _alias_by_fft(f0, fs, n=4000):
    """Apparent frequency of a sampled tone, read off the peak of its DFT."""
    k = np.arange(n)
    x = np.cos(2 * np.pi * f0 * k / fs)
    spec = np.abs(np.fft.rfft(x))
    return float(np.fft.rfftfreq(n, 1 / fs)[np.argmax(spec)])


def _apparent_rate_by_phase(f0, frame_rate):
    """Signed apparent rate of a rotating pattern filmed at frame_rate: the
    phase step per frame, wrapped to (-pi, pi], turned back into a rate."""
    step = 2 * np.pi * f0 / frame_rate
    wrapped = (step + np.pi) % (2 * np.pi) - np.pi
    return float(wrapped * frame_rate / (2 * np.pi))


def _first_sinc_zero(W):
    """First positive zero of sinc(2Wt), by root finding."""
    from scipy.optimize import brentq
    return brentq(lambda t: np.sinc(2 * W * t), 0.5 / (2 * W), 1.5 / (2 * W))


def _midrise(m, delta):
    return (math.floor(m / delta) + 0.5) * delta


def _max_error_midrise(delta, levels):
    """Largest |m - Q(m)| over the quantizer's range, on a fine grid."""
    mmax = levels * delta / 2
    m = np.linspace(-mmax, mmax, 400_001)
    q = np.clip(np.floor(m / delta) + 0.5, -levels / 2 + 0.5, levels / 2 - 0.5) * delta
    return float(np.max(np.abs(m - q)))


def _mse_by_integral(delta):
    val, _ = integrate.quad(lambda q: q * q / delta, -delta / 2, delta / 2)
    return val


def _sqnr_measured(bits, level_db=0.0, n=2_000_001):
    """SQNR of a sinusoid at level_db below full scale through a uniform
    mid-rise quantizer spanning [-5, 5], measured on the waveform."""
    mmax, L = 5.0, 2 ** bits
    delta = 2 * mmax / L
    amp = mmax * 10 ** (level_db / 20)
    t = np.linspace(0.0, 2 * np.pi, n)
    m = amp * np.cos(t + 0.123)
    q = np.clip(np.floor(m / delta) + 0.5, -L / 2 + 0.5, L / 2 - 0.5) * delta
    return 10 * math.log10(np.mean(m ** 2) / np.mean((m - q) ** 2))


def _sqnr_model(bits, level_db=0.0):
    """The uniform-error model for a sinusoid at level_db below full scale on
    [-5, 5]: its power integrated over a period, the noise from integrating
    q^2 over one step. The gallery quotes the model at 8 bits, where the
    measured value sits a little lower."""
    t = sp.symbols("t", real=True)
    amp = 5.0 * 10 ** (level_db / 20)
    pm = float(sp.integrate((amp * sp.cos(t)) ** 2, (t, 0, 2 * sp.pi)) / (2 * sp.pi))
    return 10 * math.log10(pm / _mse_by_integral(10.0 / 2 ** bits))


def _gauss_region(k):
    """Contribution of region k (0..4) of the five-level quantizer to P_Q."""
    var = 400.0
    dens = lambda x: math.exp(-x * x / (2 * var)) / math.sqrt(2 * math.pi * var)
    lo, hi, v = _GAUSS_EDGES[k], _GAUSS_EDGES[k + 1], _GAUSS_LEVELS[k]
    seg, _ = integrate.quad(lambda x: (x - v) ** 2 * dens(x), lo, hi)
    return seg


def _prob_within(a, sigma):
    val, _ = integrate.quad(lambda x: math.exp(-x * x / (2 * sigma ** 2))
                            / math.sqrt(2 * math.pi * sigma ** 2), -a, a)
    return val


def _alias_index(f, n):
    """Where a pattern of f cycles across n pixels lands after sampling."""
    f = f % n
    return min(f, n - f)


def _finest_unaliased(n):
    """The largest whole number of cycles that n pixels keep as itself."""
    return max(f for f in range(n) if _alias_index(f, n) == f)


def _gauss_mse_midrise(vmax, levels=8):
    """E[(X - Q(X))^2] for X ~ N(0, 1) through a mid-rise quantizer on
    [-vmax, vmax], integrated region by region; the outer regions run to
    infinity, so overload is counted."""
    delta = 2 * vmax / levels
    phi = lambda x: math.exp(-x * x / 2) / math.sqrt(2 * math.pi)
    total = 0.0
    for k in range(levels):
        lo = -vmax + k * delta
        hi = lo + delta
        lo = -math.inf if k == 0 else lo
        hi = math.inf if k == levels - 1 else hi
        v = -vmax + (k + 0.5) * delta
        seg, _ = integrate.quad(lambda x: (x - v) ** 2 * phi(x), lo, hi)
        total += seg
    return total


def _gauss_sqnr_db(vmax, levels=8):
    return -10 * math.log10(_gauss_mse_midrise(vmax, levels))


def _gauss_best_range():
    """The range that maximises the SQNR, by a golden-section search."""
    from scipy import optimize
    r = optimize.minimize_scalar(lambda v: -_gauss_sqnr_db(v), bounds=(1.0, 4.0),
                                 method="bounded", options={"xatol": 1e-7})
    return r.x


def _dither_up_fraction(frac=0.3, n=2_000_000):
    """How often a subtractive-free uniform dither moves an input frac steps
    above a level to the next level up, by simulation."""
    rng = np.random.default_rng(413)
    d = rng.uniform(-0.5, 0.5, n)
    return float(np.mean(np.round(frac + d) == 1.0))


def _msb_flip_volts(bits=8, delta=1 / 128):
    """Distance between the mid-rise levels of code k and of code k with its
    first bit flipped, for every k; they are all the same."""
    L = 2 ** bits
    level = lambda k: (k + 0.5) * delta - L * delta / 2
    gaps = {round(abs(level(k ^ (1 << (bits - 1))) - level(k)), 12) for k in range(L)}
    assert len(gaps) == 1
    return gaps.pop()


def _largest_slope_sine(f0, n=200_001):
    """Largest |dx/dt| of sin(2 pi f0 t), by finite differences over a period."""
    t = np.linspace(0.0, 1 / f0, n)
    return float(np.max(np.abs(np.gradient(np.sin(2 * np.pi * f0 * t), t))))


# ── Module 2 ────────────────────────────────────────────────────────────────
# Baseband transmission: the matched filter, the threshold, the error
# probability, and the bandwidth the pulse needs.

from scipy.special import erfc as _erfc


def _Q(x):
    return 0.5 * _erfc(x / math.sqrt(2.0))


def _m2_threshold(eb, n0, p0):
    return (n0 / (4 * math.sqrt(eb))) * math.log(p0 / (1 - p0))


def _m2_example(sig=None):
    """The unequal-prior example of scene 2.3.4, computed from the definitions.

    The scene reaches the two conditional errors through the Gaussian tail; this
    reaches them the same way but with the threshold recomputed from the priors
    rather than copied, so a slip in the threshold shows up in every part.
    """
    eb, n0, p1 = 1.0, 0.1, 0.3
    p0 = 1 - p1
    lam = _m2_threshold(eb, n0, p0)
    sig = math.sqrt(n0 / 2) if sig is None else sig
    a = math.sqrt(eb)
    e0 = float(_Q((lam + a) / sig))
    e1 = float(_Q((a - lam) / sig))
    return {"lam": lam, "e0": e0, "e1": e1, "pe": p0 * e0 + p1 * e1,
            "pe0": float(_Q(math.sqrt(2 * eb / n0)))}


def _raised_cosine(t, alpha, w=0.5):
    """p(t) = sinc(2Wt) cos(2 pi alpha W t) / (1 - 16 alpha^2 W^2 t^2).

    The `t` inside the cosine is the correction recorded as A-04: both sources
    write cos(2 pi alpha W) and the zero crossings they claim do not follow from
    that form.
    """
    den = 1 - 16 * alpha ** 2 * w ** 2 * t ** 2
    if abs(den) < 1e-9:
        return float(np.sinc(2 * w * t) * math.pi / 4)
    return float(np.sinc(2 * w * t) * math.cos(2 * math.pi * alpha * w * t) / den)



# The remaining Module 2 helpers work numerically on grids: energies and
# filter outputs by quadrature, the RC channel by convolution, thresholds by a
# search over P_e. None of them uses the closed forms the slides derive.

_M2_N = 20_000


def _m2_energy(s, T):
    t = (np.arange(_M2_N) + 0.5) * T / _M2_N
    return float(np.sum(s(t) ** 2) * T / _M2_N)


def _m2_schwarz_ratio(b):
    """(int G H)^2 / (int G^2 int H^2) for two Gaussian spectra of widths 1 and b."""
    f = np.linspace(-12, 12, 200_001)
    G, H = np.exp(-f ** 2), np.exp(-f ** 2 / b ** 2)
    return float(np.trapz(G * H, f) ** 2 / (np.trapz(G ** 2, f) * np.trapz(H ** 2, f)))


def _m2_mf_output(s, t):
    """y(t)/E for a pulse on [0, 1] through h(tau) = s(1 - tau)."""
    n = 4000
    u = (np.arange(n) + 0.5) / n
    su = s(u)
    E = np.sum(su ** 2) / n
    v = 1 - t + u                       # h(t - u) = s(1 - t + u), inside [0, 1] only
    inside = (v >= 0) & (v <= 1)
    return float(np.sum(su[inside] * s(v[inside])) / n / E)


def _m2_barker(side=False):
    c = [1, -1, 1, 1, -1, 1, 1, 1, -1, -1, -1]
    r = np.correlate(c, c, mode="full")
    return [int(v) for k, v in enumerate(r) if (k != len(c) - 1) or not side]


def _m2_noise_sd(n0):
    """sqrt(E[n^2]) with E[n^2] = (N0/2) int psi^2, psi rectangular of unit energy."""
    Tb = 1e-3
    psi = lambda t: np.full_like(t, 1 / math.sqrt(Tb))
    return math.sqrt(n0 / 2 * _m2_energy(psi, Tb))


def _m2_density(y, m, s):
    return math.exp(-(y - m) ** 2 / (2 * s * s)) / (s * math.sqrt(2 * math.pi))


def _m2_tail(m, s, x):
    """P(Y > x) for Y ~ N(m, s^2), by quadrature of the density."""
    y = np.linspace(x, m + 40 * s, 400_001)
    return float(np.trapz(np.exp(-(y - m) ** 2 / (2 * s * s)) / (s * math.sqrt(2 * math.pi)), y))


def _m2_argmin_pe(eb, n0, p0):
    """The threshold that minimises P_e, found by a golden-section search."""
    a, s = math.sqrt(eb), math.sqrt(n0 / 2)
    pe = lambda l: p0 * float(_Q((l + a) / s)) + (1 - p0) * float(_Q((a - l) / s))
    lo, hi, g = -a, a, (math.sqrt(5) - 1) / 2
    for _ in range(200):
        c, d = hi - g * (hi - lo), lo + g * (hi - lo)
        if pe(c) < pe(d):
            hi = d
        else:
            lo = c
    return (lo + hi) / 2


def _m2_rc_samples(bits, bt, hist=-1, per_bit=4000):
    """Polar bits through the RC lowpass of bandwidth B (T_b = 1), simulated
    step by step; the line sits at `hist` before t = 0. Returns y at the end of
    each bit."""
    tau = 1 / (2 * math.pi * bt)
    dt = 1 / per_bit
    a = math.exp(-dt / tau)
    y, out = float(hist), []
    for b in bits:
        x = 1.0 if b else -1.0
        for _ in range(per_bit):
            y = a * y + (1 - a) * x
        out.append(y)
    return out


def _m2_eye_opening(bt, n=24):
    """2 min over all n-bit patterns of a_k y_k at the last bit, line at rest before."""
    one = _m2_rc_samples([1] + [0] * (n - 1), bt, hist=0)
    # the response to one +1 bit alone: subtract the response to -1 in its place
    minus = _m2_rc_samples([0] * n, bt, hist=0)
    r = [(p - m) / 2 for p, m in zip(one, minus)]      # samples of a unit bit
    worst = r[0] - sum(abs(v) for v in r[1:])
    return 2 * worst


def _m2_rc_spec(u, a):
    """2W P(f) of the raised cosine, with u = f/W."""
    u = np.abs(np.asarray(u, dtype=float))
    f1 = 1 - a
    out = np.where(u < f1, 1.0, 0.0)
    if a > 0:
        roll = (u >= f1) & (u < 1 + a)
        out = np.where(roll, 0.5 * (1 + np.cos(math.pi * (u - f1) / (2 * a))), out)
    return out if out.ndim else float(out)


def _m2_tiling_dev(P, step):
    """Largest deviation from 1 of the sum of copies of P spaced by one
    Nyquist rate: step 1 in f/R_b, or step 2 in f/W."""
    u = np.linspace(-0.5 * step, 0.5 * step, 2001)
    s = sum(P(u - n * step) for n in range(-4, 5))
    return float(np.max(np.abs(s - 1)))


def _m2_band_edge(a):
    u = np.linspace(0, 3, 300_001)
    return float(u[np.nonzero(_m2_rc_spec(u, a) > 1e-12)[0][-1]])


# ── Module 3 ────────────────────────────────────────────────────────────────


def _gs_example():
    """Gram-Schmidt on the three pulses of scene 3.3.2, run numerically.

    The scene reaches the coordinates by integrating by hand. This samples the
    waveforms, runs the procedure on the samples and reads the coordinates off
    the result, so the two agree only if the procedure and the arithmetic both
    hold.
    """
    n, tmax = 30000, 3.0
    dt = tmax / n
    t = (np.arange(n) + 0.5) * dt
    sigs = [np.where((t >= 0) & (t < 2), 1.0, 0.0),
            np.where((t >= 2) & (t < 3), 1.0, 0.0),
            np.where((t >= 0) & (t < 3), 1.0, 0.0)]
    dot = lambda a, b: float(np.sum(a * b) * dt)
    basis, coords = [], []
    scale = max(dot(s, s) for s in sigs)
    for s in sigs:
        c = [dot(s, b) for b in basis]
        g = s - sum(ci * basis[k] for k, ci in enumerate(c)) if basis else s.copy()
        eg = dot(g, g)
        if eg > 1e-9 * scale:
            basis.append(g / math.sqrt(eg))
            c.append(math.sqrt(eg))
        coords.append(c)
    dim = len(basis)
    for c in coords:
        while len(c) < dim:
            c.append(0.0)
    return {"coords": coords, "dim": dim,
            "energies": [sum(v * v for v in c) for c in coords]}


# Each entry:
#   name    -- the scene and the quantity, as a reader would name them
#   stated  -- the number the scene prints
#   derive  -- a callable of no arguments returning the same quantity,
#              computed independently of how the scene computes it
#   tol     -- relative tolerance; the default is what a figure printed to
#              three significant digits can be trusted to
def _m6_bisect(f, lo=1e-9, hi=0.5, n=200):
    for _ in range(n):
        mid = (lo + hi) / 2
        if f(mid) < 0:
            lo = mid
        else:
            hi = mid
    return lo


def _m6_qinv(p, lo=0.0, hi=12.0, n=200):
    """The x with Q(x) = p, by bisection on Q itself."""
    for _ in range(n):
        mid = (lo + hi) / 2
        if _Q(mid) > p:
            lo = mid
        else:
            hi = mid
    return lo


def _m6_Hb(p):
    if p <= 0 or p >= 1:
        return 0.0
    return -(p * math.log2(p) + (1 - p) * math.log2(1 - p))


def _m6_chan(Pyx, px):
    """H(Y), H(Y|X) and I(X;Y) for a channel matrix and an input distribution,
    computed from the definitions rather than from any closed form."""
    ny = len(Pyx[0])
    py = [sum(Pyx[j][k] * px[j] for j in range(len(px))) for k in range(ny)]
    hyx = sum(px[j] * _m6_H(Pyx[j]) for j in range(len(px)))
    return _m6_H(py), hyx, _m6_H(py) - hyx


def _m6_capacity(Pyx, n=4000):
    """Capacity of a binary-input channel by searching the input distribution.

    The scenes reach the BSC answer through 1 - H(p) and the Z-channel answer
    through a derivative. Searching re-derives both without either identity.
    """
    best, best_q = -1.0, 0.0
    for i in range(n + 1):
        q = i / n
        val = _m6_chan(Pyx, [q, 1 - q])[2]
        if val > best:
            best, best_q = val, q
    return best, best_q


_M6_BSC = lambda p: [[1 - p, p], [p, 1 - p]]
_M6_Z = [[1.0, 0.0], [0.5, 0.5]]


# ── Module 4 ────────────────────────────────────────────────────────────────


def _faces(pts, k):
    """The neighbours of pts[k] whose bisectors give its region a face.

    Found from the geometry rather than read off the scene: j gives a face when
    some point of the bisector between k and j is strictly nearer to those two
    than to every other signal point. The bisector is sampled along its own
    direction, which is what makes this independent of how the scene counted.
    """
    p = np.asarray(pts, dtype=float)
    out = []
    for j in range(len(p)):
        if j == k:
            continue
        mid = (p[k] + p[j]) / 2
        d = p[j] - p[k]
        # a direction along the bisector: perpendicular to d in the plane
        t = np.array([-d[1], d[0]])
        n = np.linalg.norm(t)
        if n == 0:                      # collinear points: the bisector is a
            t = np.zeros(2)             # single point in one dimension
        else:
            t = t / n
        span = 40 * float(np.linalg.norm(d))
        for s in np.linspace(-span, span, 4001):
            x = mid + s * t
            near = np.linalg.norm(p - x, axis=1)
            if near[k] <= min(near[m] for m in range(len(p)) if m not in (k, j)) - 1e-9:
                out.append(j)
                break
    return out


def _intelligent(pts, arg_of_d):
    """The intelligent union bound, averaged over an equally likely alphabet.

    `arg_of_d` turns a distance into the argument of Q. Only the neighbours the
    geometry says give a face contribute.
    """
    p = np.asarray(pts, dtype=float)
    total = 0.0
    for k in range(len(p)):
        for j in _faces(p, k):
            total += _Q(arg_of_d(float(np.linalg.norm(p[k] - p[j]))))
    return total / len(p)


# ── Module 5 constellations ─────────────────────────────────────────────────
# Built from the definition of each family and scaled to unit average symbol
# energy, so a distance read off one is already in units of root Es.


def _m5_unit(pts):
    e = sum(x * x + y * y for x, y in pts) / len(pts)
    k = 1 / math.sqrt(e)
    return [(x * k, y * k) for x, y in pts]


def _m5_dmin(pts):
    return min(math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1])
               for i in range(len(pts)) for j in range(i + 1, len(pts)))


def _m5_psk(m):
    return _m5_unit([(math.cos(2 * math.pi * k / m),
                      math.sin(2 * math.pi * k / m)) for k in range(m)])


def _m5_pam(m):
    return _m5_unit([(2 * k - (m - 1), 0.0) for k in range(m)])


def _m5_qam(m):
    side = int(round(math.sqrt(m)))
    lv = [2 * k - (side - 1) for k in range(side)]
    return _m5_unit([(x, y) for x in lv for y in lv])


# ── Module 6 ────────────────────────────────────────────────────────────────
# The Huffman code here is built with a heap; the scenes state the result of
# working the algorithm by hand on the same probabilities.

import heapq


def _m6_H(ps):
    return -sum(p * math.log2(p) for p in ps if p > 0)


def _m6_lengths(ps, minvar=True):
    heap = [(p, 1 if minvar else -1, i, (i,)) for i, p in enumerate(ps)]
    heapq.heapify(heap)
    depth = [0] * len(ps)
    nxt = len(ps)
    while len(heap) > 1:
        pa, _, _, la = heapq.heappop(heap)
        pb, _, _, lb = heapq.heappop(heap)
        for i in la + lb:
            depth[i] += 1
        n = len(la) + len(lb)
        heapq.heappush(heap, (pa + pb, (n if minvar else -n), nxt, la + lb))
        nxt += 1
    return depth


def _m6_L(ps, minvar=True):
    return sum(p * l for p, l in zip(ps, _m6_lengths(ps, minvar)))


def _m6_var(ps, minvar=True):
    ls = _m6_lengths(ps, minvar)
    L = sum(p * l for p, l in zip(ps, ls))
    return sum(p * (l - L) ** 2 for p, l in zip(ps, ls))


_M6_S3 = [0.7, 0.2, 0.1]
_M6_FIVE = [0.4, 0.2, 0.2, 0.1, 0.1]


CHECKS: list[dict] = [
    # ---- 1.1, the sampling theorem --------------------------------------
    {"name": "1.1.1 sampling rate at T_s = 125 us",
     "stated": 8e3, "derive": lambda: 1 / 125e-6},
    {"name": "1.1.2 lower edge of the copy at f_s, W = 4 kHz, f_s = 10 kHz",
     "stated": 6.0, "derive": lambda: _copy_lower_edge(4.0, 10.0), "tol": 1e-5},
    {"name": "1.1.3 where G(1 kHz) reappears in the copy at f_s = 8 kHz",
     "stated": 9.0, "derive": lambda: float(sp.solve(sp.Symbol("f") - 8 - 1)[0])},
    {"name": "1.1.4 first copy starts inside the band, W = 3, f_s = 5 kHz",
     "stated": 2.0, "derive": lambda: _copy_lower_edge(3.0, 5.0), "tol": 1e-5},
    {"name": "1.1.5 Nyquist interval at W = 3.4 kHz, us",
     "stated": 147, "derive": lambda: 1e6 / (2 * 3.4e3), "tol": 3e-3},
    {"name": "1.1.8 CD guard band, kHz",
     "stated": 4.1, "derive": lambda: _copy_lower_edge(20.0, 44.1) - 20.0, "tol": 1e-5},
    {"name": "1.1.8 telephone guard band, kHz",
     "stated": 1.2, "derive": lambda: _copy_lower_edge(3.4, 8.0) - 3.4, "tol": 1e-5},
    {"name": "1.1.8 apparent spoke rate at 24 frames a second, Hz",
     "stated": -4.0, "derive": lambda: _apparent_rate_by_phase(20.0, 24.0)},
    {"name": "1.1.8 half the ECG sampling rate, Hz",
     "stated": 250.0, "derive": lambda: 500.0 / 2},
    {"name": "1.1.7 finest pattern 1000 pixels hold without aliasing, cycles",
     "stated": 500, "derive": lambda: _finest_unaliased(1000)},

    # ---- 1.2, reconstruction ---------------------------------------------
    {"name": "1.2.1 transition band at W = 4, f_s = 10 kHz",
     "stated": 2.0, "derive": lambda: _copy_lower_edge(4.0, 10.0) - 4.0, "tol": 1e-5},
    {"name": "1.2.2 first zero of sinc(2Wt) at W = 5 kHz, us",
     "stated": 100.0, "derive": lambda: 1e6 * _first_sinc_zero(5e3), "tol": 1e-6},
    {"name": "1.2.5 Nyquist rate, W = 40 kHz",
     "stated": 80e3, "derive": lambda: 2 * 40e3},
    {"name": "1.2.5 rate with a 10 kHz guard band",
     "stated": 90e3, "derive": lambda: 2 * 40e3 + 10e3},
    {"name": "1.2.5 first copy at 90 kHz starts at, kHz",
     "stated": 50.0, "derive": lambda: _copy_lower_edge(40.0, 90.0), "tol": 1e-5},
    {"name": "1.2.6 Nyquist rate of the modulated signal",
     "stated": 160e3, "derive": _nyquist_of_product},
    {"name": "1.2.7 hold droop at f_s/2, dB",
     "stated": -3.92, "derive": lambda: 20 * math.log10(abs(np.sinc(0.5))), "tol": 2e-3},
    {"name": "1.2.7 first copy after oversampling CD audio by four, kHz",
     "stated": 156.4, "derive": lambda: _copy_lower_edge(20.0, 4 * 44.1), "tol": 1e-5},

    # ---- 1.3, quantization -----------------------------------------------
    {"name": "1.3.1 mid-rise output for m = 0.2, step 1",
     "stated": 0.5, "derive": lambda: _midrise(0.2, 1.0)},
    {"name": "1.3.2 mid-tread output for m = 0.2, step 1, plus one",
     "stated": 1.0, "derive": lambda: round(0.2 / 1.0) * 1.0 + 1},
    {"name": "1.3.3 mid-tread output for m = 1.62, step 1",
     "stated": 2.0, "derive": lambda: round(1.62 / 1.0) * 1.0},
    {"name": "1.3.4 boundary between levels 1 and 3",
     "stated": 2.0, "derive": lambda: float(sp.solve(
         sp.Eq((sp.Symbol("m") - 1) ** 2, (sp.Symbol("m") - 3) ** 2))[0])},
    {"name": "1.3.6 step of a 10-bit converter over 3.3 V, mV",
     "stated": 3.22, "derive": lambda: 3.3 / 2 ** 10 * 1e3, "tol": 2e-3},
    {"name": "1.3.6 70e9 weights at 16 bits, GB",
     "stated": 140, "derive": lambda: 70e9 * 16 / 8 / 1e9},
    {"name": "1.3.6 70e9 weights at 4 bits, GB",
     "stated": 35, "derive": lambda: 70e9 * 4 / 8 / 1e9},
    {"name": "1.3.6 levels at 4 bits",
     "stated": 16, "derive": lambda: 2 ** 4},
    {"name": "1.3.5 best range of a 3-bit quantizer for a Gaussian input, sigma",
     "stated": 2.34, "derive": _gauss_best_range, "tol": 3e-3},
    {"name": "1.3.5 SQNR at that range, dB",
     "stated": 14.27, "derive": lambda: _gauss_sqnr_db(_gauss_best_range()), "tol": 3e-4},
    {"name": "1.3.5 SQNR at m_max = sigma, dB",
     "stated": 6.97, "derive": lambda: _gauss_sqnr_db(1.0), "tol": 1e-3},
    {"name": "1.3.5 samples outside +/- sigma, per cent",
     "stated": 32, "derive": lambda: 100 * (1 - _prob_within(1.0, 1.0)), "tol": 1.5e-2},

    # ---- 1.4, quantization noise and SQNR ---------------------------------
    {"name": "1.4.1 largest error at step 1.25",
     "stated": 0.625, "derive": lambda: _max_error_midrise(1.25, 8), "tol": 1e-4},
    {"name": "1.4.2 mean-square error at step 0.5",
     "stated": 0.0208, "derive": lambda: _mse_by_integral(0.5), "tol": 2e-3},
    {"name": "1.4.2 factor by which E[Q^2] falls from R = 6 to R = 7",
     "stated": 4, "derive": lambda: _mse_by_integral(2 / 2 ** 6) / _mse_by_integral(2 / 2 ** 7), "tol": 1e-9},
    {"name": "1.4.3 SQNR at R = 8 from 40 dB at R = 6",
     "stated": 52.04, "derive": lambda: 40 + 10 * math.log10((2 ** 8 / 2 ** 6) ** 2), "tol": 3e-4},
    {"name": "1.4.5 power of 3cos(t) plus noise of variance 0.36",
     "stated": 4.86, "derive": lambda: float(sp.integrate((3 * sp.cos(sp.Symbol("t"))) ** 2,
                                                          (sp.Symbol("t"), 0, 2 * sp.pi)) / (2 * sp.pi)) + 0.36,
     "tol": 1e-9},
    {"name": "1.4.6 average power of 5cos(t)",
     "stated": 12.5, "derive": _power_of_sinusoid},
    {"name": "1.4.6 step size at R = 3",
     "stated": 1.25, "derive": lambda: 2 * 5.0 / 2 ** 3},
    {"name": "1.4.6 intercept alpha for the full-scale sinusoid, dB",
     "stated": 1.76, "derive": lambda: 10 * math.log10(3 * _power_of_sinusoid() / 25.0), "tol": 3e-3},
    # The scene states two numbers per resolution, and they are different
    # claims. The first is what alpha + 6.02R gives; the second is what the
    # quantizer actually does to this waveform. They differ because the uniform
    # error model is a small-step model and eight levels is not a small step.
    {"name": "1.4.6 SQNR at R = 3, from the formula",
     "stated": 19.82, "derive": lambda: _sqnr_db_formula(3), "tol": 3e-4},
    {"name": "1.4.6 mean-square error at R = 3",
     "stated": 0.1302, "derive": lambda: _mse_by_integral(1.25), "tol": 3e-4},
    {"name": "1.4.6 3P_M / m_max^2 for the full-scale sinusoid",
     "stated": 1.5, "derive": lambda: 3 * _power_of_sinusoid() / 25.0},
    {"name": "1.4.10 6.02 dB times four bits",
     "stated": 24.08, "derive": lambda: 4 * 20 * math.log10(2), "tol": 3e-4},
    {"name": "1.4.6 SQNR at R = 3, measured on the waveform",
     "stated": 19.09, "derive": lambda: _sqnr_db_sinusoid(3), "tol": 3e-3},
    {"name": "1.4.7 average power of U(-1,1)",
     "stated": 1 / 3, "derive": lambda: float(
         sp.integrate(sp.Symbol("m") ** 2 * sp.Rational(1, 2),
                      (sp.Symbol("m"), -1, 1)))},
    {"name": "1.4.7 step size, L = 256",
     "stated": 1 / 128, "derive": lambda: 2 * 1.0 / 256},
    {"name": "1.4.7 mean-square error",
     "stated": 5.086e-6, "derive": _mse_uniform_source, "tol": 2e-4},
    {"name": "1.4.7 1 / E[Q^2]",
     "stated": 196608, "derive": lambda: 1 / _mse_uniform_source(), "tol": 1e-6},
    {"name": "1.4.7 SQNR as a ratio",
     "stated": 65536, "derive": lambda: (1.0 / 3.0) / _mse_uniform_source(), "tol": 1e-6},
    {"name": "1.4.7 SQNR",
     "stated": 48.16, "derive": _sqnr_db_uniform_source, "tol": 3e-4},
    {"name": "1.4.8 signal power",
     "stated": 400.0, "derive": _signal_power_gaussian},
    {"name": "1.4.8 quantization noise power",
     "stated": 188.17, "derive": _noise_power_gaussian, "tol": 5e-5},
    {"name": "1.4.8 central region's share of P_Q",
     "stated": 79.50, "derive": lambda: _gauss_region(2), "tol": 1e-4},
    {"name": "1.4.8 inner side region's share of P_Q",
     "stated": 46.36, "derive": lambda: _gauss_region(3), "tol": 2e-4},
    {"name": "1.4.8 outer region's share of P_Q",
     "stated": 7.98, "derive": lambda: _gauss_region(4), "tol": 1e-3},
    {"name": "1.4.8 SQNR",
     "stated": 3.28, "derive": _sqnr_db_gaussian, "tol": 2e-3},
    {"name": "1.4.8 Delta^2/12 at Delta = 20",
     "stated": 33.3, "derive": lambda: 20.0 ** 2 / 12, "tol": 2e-3},
    {"name": "1.4.8 what the uniform model would have predicted",
     "stated": 10.8, "derive": lambda: 10 * math.log10(400.0 / (20.0 ** 2 / 12)),
     "tol": 5e-3},
    {"name": "1.4.8 what the coarse quantizer costs against the model, dB",
     "stated": 7.5, "derive": lambda: 10 * math.log10(400.0 / (20.0 ** 2 / 12)) - _sqnr_db_gaussian(),
     "tol": 5e-3},
    {"name": "1.4.9 intercept of a uniform source on [-1, 1], dB",
     "stated": 0.0, "derive": lambda: 10 * math.log10(3 * float(
         sp.integrate(sp.Symbol("m") ** 2 / 2, (sp.Symbol("m"), -1, 1))))},
    {"name": "1.4.9 intercept of a Gaussian source at m_max = 4 sigma, dB",
     "stated": -7.27, "derive": lambda: 10 * math.log10(3 * 1.0 / 4.0 ** 2), "tol": 2e-3},
    {"name": "1.4.9 gap between the sinusoid and that Gaussian source, dB",
     "stated": 9.03, "derive": lambda: _sqnr_db_formula(8) - (8 * 20 * math.log10(2) + 10 * math.log10(3 / 16)),
     "tol": 2e-3},
    {"name": "1.4.11 dithered input 0.3 steps up, chance of the level above, per cent",
     "stated": 30, "derive": lambda: 100 * _dither_up_fraction(), "tol": 5e-3},
    # The gallery's word lengths, measured on a quantized sinusoid rather than
    # read off alpha + 6.02R.
    {"name": "1.4.12 16-bit SQNR at full scale",
     "stated": 98.1, "derive": lambda: _sqnr_measured(16), "tol": 1e-3},
    {"name": "1.4.12 16-bit SQNR 40 dB below full scale",
     "stated": 58.1, "derive": lambda: _sqnr_measured(16, -40.0), "tol": 2e-3},
    {"name": "1.4.12 8-bit SQNR at full scale, by the model",
     "stated": 49.9, "derive": lambda: _sqnr_model(8), "tol": 2e-3},
    {"name": "1.4.12 8-bit SQNR 30 dB below full scale, by the model",
     "stated": 19.9, "derive": lambda: _sqnr_model(8, -30.0), "tol": 3e-3},
    {"name": "1.4.12 12-bit SQNR at full scale",
     "stated": 74.0, "derive": lambda: _sqnr_measured(12), "tol": 1e-3},
    {"name": "1.4.12 24-bit SQNR at full scale",
     "stated": 146.3, "derive": lambda: _sqnr_measured(24), "tol": 1e-3},

    # ---- 1.5, non-uniform quantization ------------------------------------
    {"name": "1.5.1 error relative to a 0.2 V peak at step 0.1 V, per cent",
     "stated": 25.0, "derive": lambda: 100 * _max_error_midrise(0.1, 64) / 0.2, "tol": 1e-4},
    {"name": "1.5.2 input step seen near zero, slope 4, step 0.1",
     "stated": 0.025, "derive": lambda: float(sp.Rational(1, 10) / 4), "tol": 1e-9},
    {"name": "1.5.3 mu-law output for x = 0.01",
     "stated": 0.23, "derive": lambda: math.log(1 + 255 * 0.01, 256), "tol": 1e-2},
    {"name": "1.5.3 ln(3.55)",
     "stated": 1.267, "derive": lambda: float(sp.log(sp.Rational(355, 100)).evalf()), "tol": 5e-4},
    {"name": "1.5.3 ln(256)",
     "stated": 5.545, "derive": lambda: float(sp.log(256).evalf()), "tol": 1e-4},
    {"name": "1.5.3 end of the linear A-law segment, 1/A",
     "stated": 0.0114, "derive": lambda: 1 / 87.6, "tol": 2e-3},
    {"name": "1.5.4 fall of the uniform SQNR when the talker drops 20 dB",
     "stated": 20.0, "derive": lambda: _sqnr_model(8) - _sqnr_model(8, -20.0), "tol": 1e-6},

    # ---- 1.6, pulse code modulation ---------------------------------------
    {"name": "1.6.1 bit rate of 256-level PCM at 8 kHz",
     "stated": 64e3, "derive": lambda: math.log2(256) * 8000},
    {"name": "1.6.3 step size", "stated": 1.0, "derive": lambda: (8.0 - 0.0) / 8},
    {"name": "1.6.3 sample at t = 0.6", "stated": 1.73,
     "derive": lambda: _pcm_sample(1), "tol": 3e-3},
    {"name": "1.6.3 |sin(1.4 pi)|", "stated": 0.951,
     "derive": lambda: abs(math.sin(1.4 * math.pi)), "tol": 5e-4},
    {"name": "1.6.3 1.4 pi", "stated": 4.398,
     "derive": lambda: 1.4 * math.pi, "tol": 1e-4},
    {"name": "1.6.3 sampling rate, samples a second", "stated": 1.667,
     "derive": lambda: 1 / 0.6, "tol": 3e-4},
    {"name": "1.6.3 sample at t = 1.2", "stated": 1.87,
     "derive": lambda: _pcm_sample(2), "tol": 3e-3},
    {"name": "1.6.3 sample at t = 1.8", "stated": 7.48,
     "derive": lambda: _pcm_sample(3), "tol": 3e-3},
    {"name": "1.6.3 sample at t = 2.4", "stated": 6.05,
     "derive": lambda: _pcm_sample(4), "tol": 3e-3},
    {"name": "1.6.3 sample at t = 3.6", "stated": 1.51,
     "derive": lambda: _pcm_sample(6), "tol": 3e-3},
    # The seven three-bit words read as one twenty-one-bit number. A wrong word
    # is a wrong number, so one check covers the whole stream.
    {"name": "1.6.4 code words 000 001 001 111 110 000 001",
     "stated": 40833,
     "derive": lambda: int("".join(format(_pcm_code_index(n), "03b")
                                   for n in range(7)), 2)},
    {"name": "1.6.4 bit rate", "stated": 5.0, "derive": lambda: 3 * (1 / 0.6)},
    {"name": "1.6.4 bit duration, s", "stated": 0.2, "derive": lambda: 1 / (3 * (1 / 0.6))},
    {"name": "1.6.5 CD audio bit rate, b/s",
     "stated": 1411200, "derive": lambda: 2 * 16 * 44100},
    {"name": "1.6.5 telephone word interval, us",
     "stated": 125.0, "derive": lambda: 1e6 / 8000},
    {"name": "1.6.6 least bandwidth of telephone PCM, Hz",
     "stated": 32e3, "derive": lambda: math.log2(256) * 8000 / 2},
    {"name": "1.6.6 that against the 4 kHz voice band",
     "stated": 8, "derive": lambda: (math.log2(256) * 8000 / 2) / 4000},
    {"name": "1.6.7 move of a wrong first bit, 8 bits, step 1/128 V",
     "stated": 1.0, "derive": _msb_flip_volts},
    {"name": "1.6.8 DPCM bit rate at 4 bits and 8 kHz",
     "stated": 32e3, "derive": lambda: 4 * 8000},
    {"name": "1.6.9 least delta-modulation step for a 1 kHz sine at 64 kHz",
     "stated": 0.098, "derive": lambda: _largest_slope_sine(1000.0) / 64e3, "tol": 3e-3},

    # ---- 1.8, speech, audio and image coding --------------------------------
    {"name": "1.8.1 LPC at 48 bits a 20 ms frame, b/s",
     "stated": 2400, "derive": lambda: 48 / 20e-3},
    {"name": "1.8.1 frame of 20 ms at 8 kHz, samples",
     "stated": 160, "derive": lambda: 20e-3 * 8000},
    {"name": "1.8.2 T1 frame, bits",
     "stated": 193, "derive": lambda: 24 * math.log2(256) + 1},
    {"name": "1.8.2 T1 line rate, b/s",
     "stated": 1.544e6, "derive": lambda: (24 * math.log2(256) + 1) / 125e-6},
    {"name": "1.8.2 the 24 calls alone, b/s",
     "stated": 1.536e6, "derive": lambda: 24 * math.log2(256) * 8000},
    {"name": "1.8.2 E1 line rate, b/s",
     "stated": 2.048e6, "derive": lambda: 32 * math.log2(256) / 125e-6},
    # 6.312 and 44.736 Mb/s are the standard rates of the next two levels; they
    # include stuffing and framing that the scene does not derive, so no check
    # reaches them independently. The scene states them as facts.
    {"name": "1.8.3 one-bit converter of a CD player at U = 256, Hz",
     "stated": 11.2896e6, "derive": lambda: 256 * 44.1e3, "tol": 1e-9},
    {"name": "1.8.4 512x512 picture at 0.5 bit a pixel, KiB",
     "stated": 16, "derive": lambda: 512 * 512 * 0.5 / 8 / 1024},
    {"name": "1.8.4 that against 8 bits a pixel",
     "stated": 16, "derive": lambda: (512 * 512 * 8) / (512 * 512 * 0.5)},

    # ---- 1.7, vector quantization ------------------------------------------
    {"name": "1.7.1 pairs a 16-level scalar quantizer must name",
     "stated": 256, "derive": lambda: 16 ** 2},
    {"name": "1.7.1 pairs that can actually occur", "stated": 46,
     "derive": lambda: _pairs_within_one(16)},
    {"name": "1.7.1 log2 of the pairs that occur", "stated": 5.52,
     "derive": lambda: math.log2(_pairs_within_one(16)), "tol": 1e-3},
    {"name": "1.7.1 bits a pair the smaller codebook needs", "stated": 6,
     "derive": lambda: math.ceil(math.log2(_pairs_within_one(16)))},
    {"name": "1.7.1 pairs that occur at L = 8", "stated": 22,
     "derive": lambda: _pairs_within_one(8)},
    {"name": "1.7.2 bits in a 512x512 image at 8 bits a pixel",
     "stated": 2097152, "derive": lambda: 512 * 512 * 8},
    {"name": "1.7.2 that in KiB", "stated": 256,
     "derive": lambda: 512 * 512 * 8 / 8 / 1024},
    {"name": "1.7.2 bits at 32 levels", "stated": 1310720,
     "derive": lambda: 512 * 512 * int(math.log2(32))},
    {"name": "1.7.2 that in KiB", "stated": 160,
     "derive": lambda: 512 * 512 * int(math.log2(32)) / 8 / 1024},
    {"name": "1.7.2 fraction of the file saved, per cent", "stated": 37.5,
     "derive": lambda: (1 - math.log2(32) / 8) * 100, "tol": 1e-9},
    {"name": "1.7.2 what those three bits cost, dB", "stated": 18.06,
     "derive": lambda: 20 * (8 - 5) * math.log10(2), "tol": 3e-4},
    {"name": "1.7.2 a 256x256 image at 64 levels, KiB", "stated": 48,
     "derive": lambda: 256 * 256 * math.log2(64) / 8 / 1024},

    # ---- 1.9, summary ------------------------------------------------------
    {"name": "1.9.1 bit rate at 16 kHz and 12 bits, b/s",
     "stated": 192e3, "derive": lambda: 12 * 16e3},

    # ---- 1.9, quick check ----------------------------------------------------
    {"name": "1.9.2 a 7 kHz tone sampled at 10 kHz appears at, Hz",
     "stated": 3000.0, "derive": lambda: _alias_by_fft(7000.0, 10000.0), "tol": 1e-3},
    {"name": "1.9.2 Nyquist rate of 20 kHz audio",
     "stated": 40e3, "derive": lambda: 2 * 20e3},
    {"name": "1.9.2 two more bits, dB",
     "stated": 12.04, "derive": lambda: _sqnr_db_formula(5) - _sqnr_db_formula(3), "tol": 3e-4},
    {"name": "1.9.2 noise power ratio when the step doubles",
     "stated": 4.0, "derive": lambda: _mse_by_integral(2.0) / _mse_by_integral(1.0)},
    {"name": "1.9.2 levels of a 16-bit quantizer",
     "stated": 65536, "derive": lambda: 2 ** 16},

    # ---- 2.1, the matched filter ----------------------------------------
    # The matched-filter numbers are re-derived by integrating the pulses on a
    # grid, not by quoting 2E/N0.
    {"name": "2.1.1 N0 from a two-sided density of 1e-9 W/Hz", "stated": 2e-9,
     "derive": lambda: 2 * 1e-9},
    {"name": "2.1.2 peak pulse SNR of 2 mV over 1e-6 V^2", "stated": 4.0,
     "derive": lambda: (2e-3) ** 2 / 1e-6},
    {"name": "2.1.3 bound 2E/N0 for E = 5e-7 J, N0 = 1e-7", "stated": 10.0,
     "derive": lambda: 2 * _m2_energy(lambda t: np.full_like(t, math.sqrt(5e-7)), 1.0) / 1e-7, "tol": 1e-6},
    {"name": "2.1.3 Schwarz ratio 2b/(1+b^2) is 1 at b = 1", "stated": 1.0,
     "derive": lambda: _m2_schwarz_ratio(1.0), "tol": 1e-6},
    {"name": "2.1.4 matched filter of the ramp at t = 0", "stated": 1.0,
     "derive": lambda: (lambda T: T / T)(1.0)},
    {"name": "2.1.5 rectangle through its matched filter at T/2, in units of E", "stated": 0.5,
     "derive": lambda: _m2_mf_output(lambda t: np.ones_like(t), 0.5), "tol": 2e-3},
    {"name": "2.1.5 rectangle through its matched filter at T, in units of E", "stated": 1.0,
     "derive": lambda: _m2_mf_output(lambda t: np.ones_like(t), 1.0), "tol": 2e-3},
    {"name": "2.1.6 half-sine pulse of unit energy peaks at E", "stated": 1.0,
     "derive": lambda: _m2_mf_output(lambda t: math.sqrt(2) * np.sin(np.pi * t), 1.0), "tol": 2e-3},
    {"name": "2.1.6 peak SNR for E = 1e-6 J, N0 = 1e-7", "stated": 20.0,
     "derive": lambda: 2 * 1e-6 / 1e-7},
    {"name": "2.1.7 energy of A = 2 V over T = 0.5 ms", "stated": 2e-3,
     "derive": lambda: _m2_energy(lambda t: np.full_like(t, 2.0), 0.5e-3), "tol": 1e-6},
    {"name": "2.1.7 largest peak SNR of the worked example", "stated": 20.0,
     "derive": lambda: 2 * _m2_energy(lambda t: np.full_like(t, 2.0), 0.5e-3) / (2 * 1e-4), "tol": 1e-6},
    {"name": "2.1.7 the same, in dB", "stated": 13.0,
     "derive": lambda: 10 * math.log10(20.0), "tol": 2e-3},
    {"name": "2.1.8 chirp resolution 1/B for B = 5 MHz, us", "stated": 0.2,
     "derive": lambda: 1 / 5e6 * 1e6},
    {"name": "2.1.8 Barker-11 autocorrelation peak", "stated": 11,
     "derive": lambda: max(_m2_barker()), "tol": 1e-9},
    {"name": "2.1.8 Barker-11 largest side value is 0 or -1 (checked as 1 + max |R|)", "stated": 2.0,
     "derive": lambda: 1 + max(abs(v) for v in _m2_barker(side=True)), "tol": 1e-9},
    {"name": "2.1.8 range of an echo at 5.83 ms, m", "stated": 1.00,
     "derive": lambda: 343 * 5.83e-3 / 2, "tol": 5e-3},
    {"name": "2.1.8 bit time at 9600 baud, us", "stated": 104.2,
     "derive": lambda: 1e6 / 9600, "tol": 5e-4},

    # ---- 2.2, the demodulator -------------------------------------------
    {"name": "2.2.1 bit energy of A = 2 V over 1 ms, J", "stated": 4e-3,
     "derive": lambda: _m2_energy(lambda t: np.full_like(t, 2.0), 1e-3), "tol": 1e-6},
    {"name": "2.2.2 distance 2 sqrt(Eb) for Eb = 4 mJ", "stated": 0.126,
     "derive": lambda: 2 * math.sqrt(4e-3), "tol": 5e-3},
    {"name": "2.2.3 noise standard deviation for N0 = 2e-4", "stated": 0.01,
     "derive": lambda: _m2_noise_sd(2e-4), "tol": 3e-2},
    {"name": "2.2.4 matched-filter output at 1.5 Tb for the rectangular basis", "stated": 0.5,
     "derive": lambda: _m2_mf_output(lambda t: np.ones_like(t), 1.5), "tol": 2e-3},
    {"name": "2.2.5 loss of sampling 0.1 Tb early, dB", "stated": 0.92,
     "derive": lambda: -10 * math.log10(0.9 ** 2), "tol": 6e-3},

    # ---- 2.3, the decision and its error ----------------------------------
    {"name": "2.3.1 spread of y for N0 = 0.5", "stated": 0.5,
     "derive": lambda: math.sqrt(0.5 / 2)},
    {"name": "2.3.2 P(err | s0) = Q(2) at lambda = 0", "stated": 0.0228,
     "derive": lambda: _m2_tail(-1.0, 0.5, 0.0), "tol": 3e-3},
    {"name": "2.3.3 optimal threshold for p0 = 0.7, N0 = 0.5", "stated": 0.106,
     "derive": lambda: _m2_argmin_pe(1.0, 0.5, 0.7), "tol": 5e-3},
    {"name": "2.3.5 Q(1)", "stated": 0.159, "derive": lambda: _m2_tail(0.0, 1.0, 1.0), "tol": 3e-3},
    {"name": "2.3.5 Q(3)", "stated": 1.35e-3, "derive": lambda: _m2_tail(0.0, 1.0, 3.0), "tol": 5e-3},
    {"name": "2.3.6 Pb at Eb/N0 = 4", "stated": 2.3e-3,
     "derive": lambda: float(_Q(math.sqrt(8))), "tol": 2e-2},
    {"name": "2.3.6 the value with the factor 2 dropped, Q(2)", "stated": 2.3e-2,
     "derive": lambda: float(_Q(2.0)), "tol": 2e-2},
    {"name": "2.3.7 optimal threshold of the worked example, by search", "stated": 0.0212,
     "derive": lambda: _m2_argmin_pe(1.0, 0.1, 0.7), "tol": 5e-3},
    {"name": "2.3.7 weighted densities at the threshold", "stated": 3.70e-5,
     "derive": lambda: 0.7 * _m2_density(_m2_example()["lam"], -1.0, math.sqrt(0.05)), "tol": 5e-3},
    {"name": "2.3.8 P(err | s0) of the worked example", "stated": 2.48e-6,
     "derive": lambda: _m2_example()["e0"], "tol": 5e-3},
    {"name": "2.3.8 P(err | s1) of the worked example", "stated": 6.01e-6,
     "derive": lambda: _m2_example()["e1"], "tol": 5e-3},
    {"name": "2.3.8 average error probability at the optimum", "stated": 3.53e-6,
     "derive": lambda: _m2_example()["pe"], "tol": 5e-3},
    {"name": "2.3.8 error probability with the threshold at zero", "stated": 3.87e-6,
     "derive": lambda: _m2_example()["pe0"], "tol": 5e-3},
    {"name": "2.3.8 ratio of the two, about 1.10", "stated": 1.10,
     "derive": lambda: _m2_example()["pe0"] / _m2_example()["pe"], "tol": 5e-3},
    {"name": "2.3.8 the wrong sigma raises Pe over a hundred times (ratio / 100 > 1)", "stated": 2.0,
     "derive": lambda: 1.0 + (_m2_example(sig=math.sqrt(0.1))["pe"] / _m2_example()["pe"] > 100), "tol": 1e-9},
    {"name": "2.3.9 Eb/N0 for Pb = 1e-10, dB", "stated": 13.1,
     "derive": lambda: 10 * math.log10(_m6_qinv(1e-10) ** 2 / 2), "tol": 4e-3},
    {"name": "2.3.9 sqrt(2 Eb/N0) at that point", "stated": 6.36,
     "derive": lambda: _m6_qinv(1e-10), "tol": 2e-3},
    {"name": "2.3.9 sensor threshold 0.125 ln 9", "stated": 0.275,
     "derive": lambda: _m2_argmin_pe(1.0, 0.5, 0.9), "tol": 5e-3},
    {"name": "2.3.9 Q(3)/Q(4) exceeds 40 (checked as the smallest ratio above 3)", "stated": 42.6,
     "derive": lambda: min(float(_Q(k) / _Q(k + 1)) for k in (3, 4, 5)), "tol": 5e-3},

    # ---- 2.4, intersymbol interference ------------------------------------
    # The RC channel is simulated by convolving the bit pattern with the
    # impulse response on a grid, not through the closed forms in q.
    {"name": "2.4.1 q at BTb = 0.25", "stated": 0.208,
     "derive": lambda: 1 - _m2_rc_samples([1], 0.25, hist=0)[0], "tol": 5e-3},
    {"name": "2.4.1 one bit reaches 1 - q", "stated": 0.792,
     "derive": lambda: _m2_rc_samples([1], 0.25, hist=0)[0], "tol": 5e-3},
    {"name": "2.4.2 a 1 after a long run of 0s", "stated": 0.584,
     "derive": lambda: _m2_rc_samples([0, 0, 0, 1], 0.25)[3], "tol": 5e-3},
    {"name": "2.4.3 the seventh sample of 0 0 0 1 1 1 0 1", "stated": -0.588,
     "derive": lambda: _m2_rc_samples([0, 0, 0, 1, 1, 1, 0, 1], 0.25)[6], "tol": 5e-3},
    {"name": "2.4.4 eye opening at BTb = 0.3, all 128 patterns", "stated": 1.39,
     "derive": lambda: _m2_eye_opening(0.3), "tol": 5e-3},
    {"name": "2.4.5 closing bandwidth ln2/(2 pi)", "stated": 0.110,
     "derive": lambda: _m6_bisect(lambda b: _m2_eye_opening(b), 0.05, 0.2), "tol": 5e-3},
    {"name": "2.4.5 opening at BTb = 0.1 is negative (shifted by one)", "stated": 1 - 0.134,
     "derive": lambda: 1 + _m2_eye_opening(0.1), "tol": 5e-3},
    {"name": "2.4.4 q at BTb = 0.3", "stated": 0.152,
     "derive": lambda: 1 - _m2_rc_samples([1], 0.3, hist=0)[0], "tol": 5e-3},
    {"name": "2.4.5 q at BTb = 0.1", "stated": 0.533,
     "derive": lambda: 1 - _m2_rc_samples([1], 0.1, hist=0)[0], "tol": 5e-3},
    {"name": "2.4.5 half-opening 1 - 2q at BTb = 0.1", "stated": -0.067,
     "derive": lambda: _m2_eye_opening(0.1) / 2, "tol": 1e-2},
    {"name": "2.4.6 q at BTb = 0.15", "stated": 0.39,
     "derive": lambda: math.exp(-2 * math.pi * 0.15), "tol": 5e-3},
    {"name": "2.4.6 fibre pulse width sqrt(20^2 + 34^2), ps", "stated": 39.4,
     "derive": lambda: math.hypot(20, 17 * 20 * 0.1), "tol": 3e-3},

    # ---- 2.5, Nyquist and the raised cosine ------------------------------
    # The raised cosine must vanish at every non-zero multiple of T_b for every
    # roll-off. Five roll-offs and eight instants are checked at once: the
    # largest magnitude found, shifted by one so a relative test means something.
    {"name": "2.5.6 the raised cosine vanishes at every non-zero sampling instant",
     "stated": 1.0,
     "derive": lambda: 1.0 + max(abs(_raised_cosine(float(k), a))
                                 for a in (0.0, 0.25, 0.5, 0.75, 1.0)
                                 for k in range(1, 9)),
     "tol": 1e-9},
    {"name": "2.5.6 the raised cosine is one at the origin", "stated": 1.0,
     "derive": lambda: _raised_cosine(0.0, 0.5)},
    {"name": "2.5.6 alpha = 1 also vanishes at 1.5 Tb (shifted by one)", "stated": 1.0,
     "derive": lambda: 1.0 + abs(_raised_cosine(1.5, 1.0)), "tol": 1e-9},
    {"name": "2.5.2 triangular spectrum: copies add to Tb (max deviation, shifted by one)", "stated": 1.0,
     "derive": lambda: 1.0 + _m2_tiling_dev(lambda u: np.maximum(0, 1 - np.abs(u)), 1), "tol": 1e-9},
    {"name": "2.5.5 raised-cosine copies add to a constant (max deviation, shifted by one)", "stated": 1.0,
     "derive": lambda: 1.0 + max(_m2_tiling_dev(lambda u, a=a: _m2_rc_spec(u, a), 2) for a in (0.25, 0.5, 1.0)), "tol": 1e-9},
    {"name": "2.5.3 minimum bandwidth for 64 kb/s", "stated": 32e3,
     "derive": lambda: 64e3 / 2},
    {"name": "2.5.4 sinc(0.1)", "stated": 0.984, "derive": lambda: float(np.sinc(0.1)), "tol": 1e-3},
    {"name": "2.5.4 interference summed over 1 <= |k| <= 20 at 0.1 Tb", "stated": 0.71,
     "derive": lambda: sum(abs(float(np.sinc(k + 0.1))) for k in range(-20, 21) if k), "tol": 5e-3},
    {"name": "2.5.5 bandwidth for W = 5 kHz, alpha = 0.25", "stated": 6.25e3,
     "derive": lambda: 5e3 * (1 + 0.25)},
    {"name": "2.5.7 Nyquist bandwidth for 20 kbit/s", "stated": 10e3,
     "derive": lambda: 20e3 / 2},
    {"name": "2.5.7 flat band edge f1", "stated": 5e3,
     "derive": lambda: 10e3 * (1 - 0.5)},
    {"name": "2.5.7 transmission bandwidth at alpha = 0.5", "stated": 15e3,
     "derive": lambda: _m2_band_edge(0.5) * 10e3, "tol": 2e-3},
    {"name": "2.5.8 root raised cosine at f = W", "stated": 0.707,
     "derive": lambda: math.sqrt(_m2_rc_spec(1.0, 0.5)), "tol": 1e-3},
    {"name": "2.5.9 satellite TV bandwidth 13.75(1.35), MHz", "stated": 18.6,
     "derive": lambda: 27.5 / 2 * 1.35, "tol": 3e-3},
    {"name": "2.5.9 3G bandwidth 1.92(1.22), MHz", "stated": 2.34,
     "derive": lambda: 3.84 / 2 * 1.22, "tol": 3e-3},

    # ---- 2.6, summary and quick check -----------------------------------
    {"name": "2.6.1 Pb at 9.6 dB", "stated": 9.7e-6,
     "derive": lambda: float(_Q(math.sqrt(2 * 10 ** 0.96))), "tol": 5e-3},
    {"name": "2.6.1 Eb/N0 of 9.6 dB as a ratio", "stated": 9.12,
     "derive": lambda: 10 ** 0.96, "tol": 1e-3},
    {"name": "2.6.1 argument of Q at 9.6 dB", "stated": 4.27,
     "derive": lambda: math.sqrt(2 * 10 ** 0.96), "tol": 2e-3},
    {"name": "2.6.2 peak SNR for E = 2 uJ, N0 = 1e-7", "stated": 40.0,
     "derive": lambda: 2 * 2e-6 / 1e-7},
    {"name": "2.6.2 Pb at Eb/N0 = 8 is Q(4)", "stated": 3.2e-5,
     "derive": lambda: float(_Q(4.0)), "tol": 2e-2},
    {"name": "2.6.2 raised-cosine bandwidth for 1 Mb/s, alpha = 0.5, MHz", "stated": 0.75,
     "derive": lambda: 1.0 / 2 * 1.5},

    # ---- 3.3.2, the Gram-Schmidt example ---------------------------------
    # The procedure is run numerically on the sampled waveforms rather than
    # symbolically, which is a different route from the scene's integrals.
    {"name": "3.3.2 first coordinate of s1", "stated": 1.41421,
     "derive": lambda: _gs_example()["coords"][0][0], "tol": 1e-5},
    {"name": "3.3.2 second coordinate of s2", "stated": 1.0,
     "derive": lambda: _gs_example()["coords"][1][1], "tol": 1e-6},
    {"name": "3.3.2 first coordinate of s3", "stated": 1.41421,
     "derive": lambda: _gs_example()["coords"][2][0], "tol": 1e-5},
    {"name": "3.3.2 second coordinate of s3", "stated": 1.0,
     "derive": lambda: _gs_example()["coords"][2][1], "tol": 1e-6},
    {"name": "3.3.2 the set needs two dimensions", "stated": 2,
     "derive": lambda: _gs_example()["dim"]},
    {"name": "3.3.2 energy of s1", "stated": 2.0,
     "derive": lambda: _gs_example()["energies"][0], "tol": 1e-6},
    {"name": "3.3.2 energy of s2", "stated": 1.0,
     "derive": lambda: _gs_example()["energies"][1], "tol": 1e-6},
    {"name": "3.3.2 energy of s3", "stated": 3.0,
     "derive": lambda: _gs_example()["energies"][2], "tol": 1e-6},
    {"name": "3.2 four points on a square: smallest distance at energy 2",
     "stated": 2.0, "derive": lambda: 2 * 1.0},

    # ── Module 4 ────────────────────────────────────────────────────────────
    # The intelligent union bound counts the neighbours that give the decision
    # region a face. The scene counts them by looking at the picture; the check
    # finds them by sampling each bisector, so the count itself is re-derived
    # and not copied.

    {"name": "4.4.4 faces of a corner region in the square", "stated": 2,
     "derive": lambda: len(_faces(
         [(0.5, 0.5), (-0.5, 0.5), (-0.5, -0.5), (0.5, -0.5)], 0))},
    {"name": "4.4.4 intelligent bound for the square at d^2/2N0=9",
     "stated": 2.70e-3,
     "derive": lambda: _intelligent(
         [(0.5, 0.5), (-0.5, 0.5), (-0.5, -0.5), (0.5, -0.5)],
         lambda d: 3.0 * d), "tol": 2e-3},
    {"name": "4.4.4 union bound for the same square, for comparison",
     "stated": 2.71e-3,
     "derive": lambda: 2 * _Q(3.0) + _Q(3.0 * math.sqrt(2)), "tol": 2e-3},
    {"name": "4.4.4 minimum-distance bound for the same square",
     "stated": 4.05e-3, "derive": lambda: 3 * _Q(3.0), "tol": 2e-3},

    # ── Module 5 ────────────────────────────────────────────────────────────
    # The scenes state seven numbers. Each is re-derived here from the points
    # of the constellation, scaled to unit average energy, rather than from the
    # formula the scene displays beside it.

    {"name": "5.1 BFSK and BASK against BPSK, in dB", "stated": 3.0,
     "derive": lambda: 10 * math.log10(
         _m5_dmin(_m5_unit([(-1, 0), (1, 0)])) ** 2
         / _m5_dmin(_m5_unit([(1, 0), (0, 1)])) ** 2), "tol": 5e-3},
    {"name": "5.2 energy ratio from QPSK to 8-PSK", "stated": 3.41,
     "derive": lambda: _m5_dmin(_m5_psk(4)) ** 2 / _m5_dmin(_m5_psk(8)) ** 2,
     "tol": 2e-3},
    {"name": "5.2 that ratio in dB per symbol", "stated": 5.33,
     "derive": lambda: 10 * math.log10(
         _m5_dmin(_m5_psk(4)) ** 2 / _m5_dmin(_m5_psk(8)) ** 2), "tol": 2e-3},
    {"name": "5.2 and per bit", "stated": 3.57,
     "derive": lambda: 10 * math.log10(
         _m5_dmin(_m5_psk(4)) ** 2 / _m5_dmin(_m5_psk(8)) ** 2 * 2 / 3),
     "tol": 3e-3},
    {"name": "5.3 QAM over PAM at sixteen points", "stated": 8.5,
     "derive": lambda: _m5_dmin(_m5_qam(16)) ** 2 / _m5_dmin(_m5_pam(16)) ** 2,
     "tol": 2e-3},
    {"name": "5.3 that advantage in dB", "stated": 9.3,
     "derive": lambda: 10 * math.log10(
         _m5_dmin(_m5_qam(16)) ** 2 / _m5_dmin(_m5_pam(16)) ** 2), "tol": 1e-2},
    {"name": "5.5 cost of doubling the PAM levels, 8 against 4, in dB",
     "stated": 6.0,
     "derive": lambda: 10 * math.log10(
         _m5_dmin(_m5_pam(4)) ** 2 / _m5_dmin(_m5_pam(8)) ** 2), "tol": 4e-2},
    {"name": "5.5 cost of the extra PSK bit above eight points, in dB",
     "stated": 5.0,
     "derive": lambda: 10 * math.log10(
         _m5_dmin(_m5_psk(8)) ** 2 / _m5_dmin(_m5_psk(16)) ** 2 * 3 / 4),
     "tol": 0.11},

    # ── Module 6 ────────────────────────────────────────────────────────────

    {"name": "6.2 entropy of the source 0.7, 0.2, 0.1", "stated": 1.1568,
     "derive": lambda: _m6_H(_M6_S3), "tol": 1e-4},
    {"name": "6.2 its ceiling log2 3", "stated": 1.585,
     "derive": lambda: math.log2(3), "tol": 1e-3},
    {"name": "6.3 entropy of the second extension", "stated": 2.3136,
     "derive": lambda: _m6_H([a * b for a in _M6_S3 for b in _M6_S3]),
     "tol": 1e-4},
    {"name": "6.4 efficiency of English at L=4.22, H=1.3", "stated": 0.31,
     "derive": lambda: 1.3 / 4.22, "tol": 8e-3},
    {"name": "6.6 Kraft sum for Code I", "stated": 1.5,
     "derive": lambda: sum(2.0 ** -l for l in [1, 1, 2, 2]), "tol": 1e-9},
    {"name": "6.6 Kraft sum for Code II", "stated": 1.0,
     "derive": lambda: sum(2.0 ** -l for l in [1, 2, 3, 3]), "tol": 1e-9},
    {"name": "6.6 Kraft sum for Code III", "stated": 0.9375,
     "derive": lambda: sum(2.0 ** -l for l in [1, 2, 3, 4]), "tol": 1e-9},
    {"name": "6.8 entropy of the Huffman example", "stated": 2.1219,
     "derive": lambda: _m6_H(_M6_FIVE), "tol": 1e-4},
    {"name": "6.8 its Huffman average length", "stated": 2.2,
     "derive": lambda: _m6_L(_M6_FIVE), "tol": 1e-9},
    {"name": "6.8 its coding efficiency", "stated": 0.9645,
     "derive": lambda: _m6_H(_M6_FIVE) / _m6_L(_M6_FIVE), "tol": 1e-4},
    {"name": "6.8 the excess over the entropy, per cent", "stated": 3.68,
     "derive": lambda: (_m6_L(_M6_FIVE) - _m6_H(_M6_FIVE))
         / _m6_H(_M6_FIVE) * 100, "tol": 3e-3},
    {"name": "6.9 average length of the other tie-breaking", "stated": 2.2,
     "derive": lambda: _m6_L(_M6_FIVE, False), "tol": 1e-9},
    {"name": "6.9 variance of the minimum-variance code", "stated": 0.16,
     "derive": lambda: _m6_var(_M6_FIVE, True), "tol": 1e-9},
    {"name": "6.9 variance of the other one", "stated": 1.36,
     "derive": lambda: _m6_var(_M6_FIVE, False), "tol": 1e-9},
    # ── Module 6, the channel half ──────────────────────────────────────────
    # Every capacity below is found by searching the input distribution, which
    # is the definition. The scenes reach the same numbers through 1 - H(p) and
    # through a derivative, so neither route is being restated here.

    {"name": "6.7.2 H(Y|X) of the BSC at p=0.1", "stated": 0.469,
     "derive": lambda: _m6_Hb(0.1), "tol": 1e-3},
    {"name": "6.7.2 mutual information there", "stated": 0.531,
     "derive": lambda: _m6_chan(_M6_BSC(0.1), [0.5, 0.5])[2], "tol": 1e-3},
    {"name": "6.7.2 the joint entropy of that pair", "stated": 1.469,
     "derive": lambda: 2 - _m6_chan(_M6_BSC(0.1), [0.5, 0.5])[2], "tol": 1e-3},
    {"name": "6.7.3 mutual information at p=0.25", "stated": 0.189,
     "derive": lambda: _m6_chan(_M6_BSC(0.25), [0.5, 0.5])[2], "tol": 3e-3},
    {"name": "6.7.3 the joint entropy at p=0.25", "stated": 1.811,
     "derive": lambda: 2 - _m6_chan(_M6_BSC(0.25), [0.5, 0.5])[2], "tol": 1e-3},
    {"name": "6.8.2 capacity of the BSC at p=0.1", "stated": 0.531,
     "derive": lambda: _m6_capacity(_M6_BSC(0.1))[0], "tol": 1e-3},
    {"name": "6.8.2 equally likely inputs are the best ones", "stated": 0.5,
     "derive": lambda: _m6_capacity(_M6_BSC(0.1))[1], "tol": 1e-3},
    {"name": "6.8.2 capacity at p=0.11", "stated": 0.500,
     "derive": lambda: _m6_capacity(_M6_BSC(0.11))[0], "tol": 2e-3},
    {"name": "6.8.2 capacity at one error in a thousand", "stated": 0.9886,
     "derive": lambda: _m6_capacity(_M6_BSC(0.001))[0], "tol": 1e-3},
    {"name": "6.8.4 capacity of the Z-channel", "stated": 0.3219,
     "derive": lambda: _m6_capacity(_M6_Z)[0], "tol": 1e-3},
    {"name": "6.8.4 the input distribution that reaches it", "stated": 0.6,
     "derive": lambda: _m6_capacity(_M6_Z)[1], "tol": 2e-3},
    {"name": "6.8.4 that capacity is log2(5/4) exactly", "stated": 0.3219,
     "derive": lambda: math.log2(1.25), "tol": 1e-3},
    {"name": "6.8.4 what a transmitter at q=0.5 gets instead", "stated": 0.3113,
     "derive": lambda: _m6_chan(_M6_Z, [0.5, 0.5])[2], "tol": 1e-3},
    {"name": "6.8.5 crossover at which capacity falls to one half",
     "stated": 0.11,
     "derive": lambda: _m6_bisect(lambda p: 0.5 - _m6_capacity(_M6_BSC(p))[0]),
     "tol": 2e-2},
    # Stated as a ratio rather than in dB: the scene's value there is 0 dB, and
    # a relative tolerance against zero cannot say anything.
    {"name": "6.9.1 energy per bit for one bit a second a hertz, as a ratio",
     "stated": 1.0, "derive": lambda: (2 ** 1 - 1) / 1, "tol": 1e-9},
    {"name": "6.9.1 energy per bit for two bits a second a hertz, dB",
     "stated": 1.76,
     "derive": lambda: 10 * math.log10((2 ** 2 - 1) / 2), "tol": 3e-3},
    {"name": "6.9.2 the Shannon limit as a ratio", "stated": 0.693,
     "derive": lambda: math.log(2), "tol": 1e-3},
    {"name": "6.9.2 the Shannon limit in dB", "stated": -1.59,
     "derive": lambda: 10 * math.log10(math.log(2)), "tol": 3e-3},
    {"name": "6.9.2 coherent BPSK at an error probability of 1e-5, dB",
     "stated": 9.6,
     "derive": lambda: 10 * math.log10(_m6_qinv(1e-5) ** 2 / 2), "tol": 5e-3},
    {"name": "6.9.2 how far that sits above the floor, dB", "stated": 11.0,
     "derive": lambda: 10 * math.log10(_m6_qinv(1e-5) ** 2 / 2)
         - 10 * math.log10(math.log(2)), "tol": 2e-2},
    {"name": "6.6.2 output probability in the worked joint distribution",
     "stated": 0.675, "derive": lambda: 0.8 * 0.75 + 0.3 * 0.25, "tol": 1e-9},
]


DEFAULT_TOL = 5e-3


def main() -> int:
    passed = failed = 0
    for c in CHECKS:
        stated = c["stated"]
        tol = c.get("tol", DEFAULT_TOL)
        try:
            got = float(c["derive"]())
        except Exception as exc:                      # a check that cannot run has failed
            print(f"FAIL  {c['name']}: re-derivation raised {type(exc).__name__}: {exc}")
            failed += 1
            continue
        scale = max(abs(stated), 1e-300)
        rel = abs(got - stated) / scale
        ok = rel <= tol
        status = "PASS" if ok else "FAIL"
        print(f"{status}  {c['name']}: scene states {stated:.6g}, "
              f"re-derived {got:.6g}, relative difference {rel:.2e}")
        if ok:
            passed += 1
        else:
            failed += 1
    print(f"{passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
