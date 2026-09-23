/* ==========================================================================
   Code for Module 1: programs in MATLAB and Python
   One entry a program, keyed by a short name. Each program draws a signal
   from the section and prints the number the section computes, with the same
   wording in both languages, so `out` is one text for both. MATLAB uses no
   toolbox; Python uses NumPy and Matplotlib only.
   `title`, `what` and `try` are student text and go through md(); the code
   is plain text. Each section closes with a code page (`CODE_BANKS_M1`) that
   pages through its programs.
   verify/code_check.py runs every entry in both languages and compares what
   it prints with `out`.
   ========================================================================== */
const CODE_BANKS_M1 = {
  'm1-code-sampling':    ['samp-nyquist', 'samp-alias', 'samp-spectrum'],
  'm1-code-reconstruct': ['recon-sinc', 'recon-zoh', 'recon-nyquist-ex'],
  'm1-code-quant':       ['quant-midrise', 'quant-midtread', 'quant-signal'],
  'm1-code-sqnr':        ['sqnr-cos', 'sqnr-uniform', 'sqnr-gauss', 'sqnr-perbit'],
  'm1-code-companding':  ['comp-laws', 'comp-sqnr'],
  'm1-code-pcm':         ['pcm-example', 'pcm-gray', 'pcm-linecode']
};

const CODE_M1 = {

/* -------------------------------------------------------------- 1.1 ---- */
'samp-nyquist': {
  title:'The Nyquist rate of a tone',
  what:'Samples $g(t)=\\cos(2\\pi f_0 t)$ at three rates and prints the Nyquist rate $2f_0$.',
  try:'Set $f_0=500$ Hz. Predict the Nyquist rate before you run it.',
  out:'f0 = 200 Hz   Nyquist rate = 400 Hz\nfs =  150 Hz (below Nyquist)\nfs =  400 Hz (at Nyquist)\nfs = 1000 Hz (above Nyquist)',
  m:`% g(t) = cos(2*pi*f0*t): the tone this page samples at three rates
f0 = 200;                        % Hz
fprintf('f0 = %g Hz   Nyquist rate = %g Hz\\n', f0, 2*f0)

fs_list = [150 400 1000];
tag = {'(below Nyquist)', '(at Nyquist)', '(above Nyquist)'};
for k = 1:3
    fprintf('fs = %4g Hz %s\\n', fs_list(k), tag{k})
end

t  = 0:1/8000:0.02;
fs = 400;  n = 0:1/fs:0.02;
plot(t, cos(2*pi*f0*t), 'LineWidth', 1.2), hold on
stem(n, cos(2*pi*f0*n), 'filled'), hold off, grid on
xlabel('t (s)'), ylabel('g(t)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# g(t) = cos(2*pi*f0*t): the tone this page samples at three rates
f0 = 200                         # Hz
print(f'f0 = {f0:g} Hz   Nyquist rate = {2*f0:g} Hz')

fs_list = [150, 400, 1000]
tag = ['(below Nyquist)', '(at Nyquist)', '(above Nyquist)']
for fs, tg in zip(fs_list, tag):
    print(f'fs = {fs:4g} Hz {tg}')

t = np.arange(0, 0.02, 1/8000)
fs = 400
n = np.arange(0, 0.02, 1/fs)
plt.plot(t, np.cos(2*np.pi*f0*t), linewidth=1.2)
plt.stem(n, np.cos(2*np.pi*f0*n))
plt.xlabel(r'$t$ (s)')
plt.ylabel(r'$g(t)$')
plt.grid(True)
plt.show()`},

'samp-alias': {
  title:'The apparent frequency of several tones',
  what:'Samples four tones at one rate $f_s=1000$ Hz and prints the apparent (alias) frequency each one shows.',
  try:'Add a fifth tone at 1800 Hz. Predict its apparent frequency, then run it.',
  out:'f = 300 Hz   apparent = 300 Hz\nf = 700 Hz   apparent = 300 Hz\nf = 1300 Hz   apparent = 300 Hz\nf = 1700 Hz   apparent = 300 Hz',
  m:`% Sampling at fs folds every f to the band [-fs/2, fs/2]. The apparent
% frequency is f, reflected about multiples of fs, until it lands there.
fs = 1000;
f_list = [300 700 1300 1700];
for f = f_list
    k  = round(f/fs);
    fa = abs(f - k*fs);
    fprintf('f = %g Hz   apparent = %g Hz\\n', f, fa)
end

t = 0:1/fs:0.01;
plot(t, cos(2*pi*300*t), t, cos(2*pi*700*t), '--', 'LineWidth', 1.3), grid on
xlabel('t (s)'), legend('300 Hz', '700 Hz, same samples')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# Sampling at fs folds every f to the band [-fs/2, fs/2]. The apparent
# frequency is f, reflected about multiples of fs, until it lands there.
fs = 1000
f_list = [300, 700, 1300, 1700]
for f in f_list:
    k = round(f/fs)
    fa = abs(f - k*fs)
    print(f'f = {f:g} Hz   apparent = {fa:g} Hz')

t = np.arange(0, 0.01, 1/fs)
plt.plot(t, np.cos(2*np.pi*300*t), t, np.cos(2*np.pi*700*t), '--', linewidth=1.3)
plt.xlabel(r'$t$ (s)')
plt.legend(['300 Hz', '700 Hz, same samples'])
plt.grid(True)
plt.show()`},

'samp-spectrum': {
  title:'The spectrum of a sampled tone',
  what:'Samples a tone at $f_s=5f_0$ and takes the FFT. One period of the DFT shows the copy at $f_0$ and its image at $f_s-f_0$, the next replica down from $f_s+f_0$.',
  try:'Set $f_s=2.2f_0$, closer to the Nyquist rate. Predict how close the two peaks move together.',
  out:'f0 = 100 Hz   fs = 500 Hz\npeaks at = 100 400 Hz',
  m:`% g(t) = cos(2*pi*f0*t) sampled at fs = 5*f0: a replica sits at every n*fs +/- f0
f0 = 100; fs = 5*f0;
N  = 2000; n = 0:N-1;
g  = cos(2*pi*f0*n/fs);

G = abs(fft(g)) / N;
f = (0:N-1) * fs/N;
fprintf('f0 = %g Hz   fs = %g Hz\\n', f0, fs)

% the two peaks the DFT shows in one period [0, fs): f0 and its image fs - f0
peaks = f(G > 0.1);
fprintf('peaks at =%s Hz\\n', sprintf(' %g', peaks))

plot(f, G, 'LineWidth', 1.3), grid on
xlabel('f (Hz)'), ylabel('|G(f)|')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# g(t) = cos(2*pi*f0*t) sampled at fs = 5*f0: a replica sits at every n*fs +/- f0
f0, fs, N = 100, 500, 2000
n = np.arange(N)
g = np.cos(2*np.pi*f0*n/fs)
G = np.abs(np.fft.fft(g)) / N
f = np.arange(N) * fs/N
print(f'f0 = {f0:g} Hz   fs = {fs:g} Hz')

# the two peaks the DFT shows in one period [0, fs): f0 and its image fs - f0
peaks = f[G > 0.1]
print('peaks at =', *[f'{p:g}' for p in peaks], 'Hz')

plt.plot(f, G, linewidth=1.3)
plt.xlabel(r'$f$ (Hz)'); plt.ylabel(r'$|G(f)|$'); plt.grid(True)
plt.show()`},

/* -------------------------------------------------------------- 1.2 ---- */
'recon-sinc': {
  title:'Sinc interpolation and its error',
  what:'Reconstructs a message bandlimited to $W=0.5$ Hz from its samples with shifted sinc pulses. Prints the peak error over $-2\\le t\\le2$ as more terms are kept.',
  try:'Halve the sampling rate to $f_s=W$. Predict whether the error grows or shrinks.',
  out:'terms =   5   peak error = 0.1400\nterms =  21   peak error = 0.0266\nterms =  61   peak error = 0.0029',
  m:`% g(t) = 0.85 sin(1.15t) + 0.35 sin(2.7t+0.8), bandlimited to W = 0.5 Hz
g  = @(t) 0.85*sin(1.15*t) + 0.35*sin(2.7*t + 0.8);
W  = 0.5; Ts = 1/(2*W);                     % Nyquist interval
t  = linspace(-2, 2, 4001);

for Nt = [5 21 61]                          % odd term counts, centred at 0
    gr = zeros(size(t));
    for n = -(Nt-1)/2 : (Nt-1)/2
        gr = gr + g(n*Ts) * sinc_m(2*W*(t - n*Ts));
    end
    fprintf('terms = %3d   peak error = %.4f\\n', Nt, max(abs(g(t) - gr)))
end

function y = sinc_m(x)                      % sin(pi x)/(pi x), 1 at x = 0
    y = ones(size(x));
    k = x ~= 0;
    y(k) = sin(pi*x(k)) ./ (pi*x(k));
end

plot(t, g(t), 'LineWidth', 1.5), grid on
xlabel('t'), ylabel('g(t)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# g(t) = 0.85 sin(1.15t) + 0.35 sin(2.7t+0.8), bandlimited to W = 0.5 Hz
def g(t):
    return 0.85*np.sin(1.15*t) + 0.35*np.sin(2.7*t + 0.8)

W, Ts = 0.5, 1/(2*0.5)                      # Nyquist interval
t = np.linspace(-2, 2, 4001)

for Nt in [5, 21, 61]:                      # odd term counts, centred at 0
    gr = np.zeros_like(t)
    for n in range(-(Nt-1)//2, (Nt-1)//2 + 1):
        gr = gr + g(n*Ts) * np.sinc(2*W*(t - n*Ts))
    print(f'terms = {Nt:3d}   peak error = {np.max(np.abs(g(t) - gr)):.4f}')

plt.plot(t, g(t), linewidth=1.5)
plt.xlabel(r'$t$')
plt.ylabel(r'$g(t)$')
plt.grid(True)
plt.show()`},

'recon-zoh': {
  title:'Zero-order hold against sinc reconstruction',
  what:'Holds each sample flat until the next one (zero-order hold) and compares its error with sinc reconstruction from the same samples.',
  try:'Predict which method gives the larger peak error before you run it.',
  out:'peak error, zero-order hold = 0.8963\npeak error, sinc            = 0.0266',
  m:`% g(t) = 0.85 sin(1.15t) + 0.35 sin(2.7t+0.8), sampled at the Nyquist rate
g  = @(t) 0.85*sin(1.15*t) + 0.35*sin(2.7*t + 0.8);
sinc_m = @(x) sin(pi*x)./(pi*x + (x==0)) .* (x~=0) + (x==0);
W  = 0.5; Ts = 1/(2*W);
t  = linspace(-2, 2, 4001);
Nt = 21;

n_hold = floor(t/Ts + 0.5);                 % hold each sample until the next
zoh = g(n_hold*Ts);

gr = zeros(size(t));                        % sinc reconstruction, same samples
for n = -(Nt-1)/2 : (Nt-1)/2
    gr = gr + g(n*Ts) * sinc_m(2*W*(t - n*Ts));
end

fprintf('peak error, zero-order hold = %.4f\\n', max(abs(g(t) - zoh)))
fprintf('peak error, sinc            = %.4f\\n', max(abs(g(t) - gr)))

plot(t, g(t), t, zoh, '--', t, gr, 'LineWidth', 1.3), grid on
xlabel('t'), legend('g(t)', 'zero-order hold', 'sinc')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# g(t) = 0.85 sin(1.15t) + 0.35 sin(2.7t+0.8), sampled at the Nyquist rate
def g(t):
    return 0.85*np.sin(1.15*t) + 0.35*np.sin(2.7*t + 0.8)

W, Ts, Nt = 0.5, 1.0, 21
t = np.linspace(-2, 2, 4001)
n_hold = np.floor(t/Ts + 0.5)               # hold each sample until the next
zoh = g(n_hold*Ts)
gr = np.zeros_like(t)                       # sinc reconstruction, same samples
for n in range(-(Nt-1)//2, (Nt-1)//2 + 1):
    gr = gr + g(n*Ts) * np.sinc(2*W*(t - n*Ts))
print(f'peak error, zero-order hold = {np.max(np.abs(g(t) - zoh)):.4f}')
print(f'peak error, sinc            = {np.max(np.abs(g(t) - gr)):.4f}')

plt.plot(t, g(t), t, zoh, '--', t, gr, linewidth=1.3)
plt.xlabel(r'$t$'); plt.legend([r'$g(t)$', 'zero-order hold', 'sinc']); plt.grid(True)
plt.show()`},

'recon-nyquist-ex': {
  title:'Worked example: three sampling rates',
  what:'Reworks the guard-band example. A message is bandlimited to $W=40$ kHz. The program finds its Nyquist rate, a rate with a guard band, and the rate for $y(t)=x(t)\\cos(80000\\pi t)$.',
  try:'Change the guard band to 20 kHz. Predict the new rate for part (b).',
  out:'(a) Nyquist rate of x(t) = 80 kHz\n(b) rate with 10 kHz guard band = 90 kHz\n(c) Nyquist rate of y(t) = x(t) cos(80000*pi*t) = 160 kHz',
  m:`% x(t) bandlimited to W; y(t) = x(t)*cos(2*pi*fc*t) shifts the band to fc
W  = 40e3;  fg = 10e3;  fc = 40e3;

fs_a = 2*W;
fprintf('(a) Nyquist rate of x(t) = %g kHz\\n', fs_a/1e3)

fs_b = 2*W + fg;
fprintf('(b) rate with %g kHz guard band = %g kHz\\n', fg/1e3, fs_b/1e3)

% y(t) occupies |f| < fc + W, so its highest frequency is fc + W
fs_c = 2*(fc + W);
fprintf('(c) Nyquist rate of y(t) = x(t) cos(80000*pi*t) = %g kHz\\n', fs_c/1e3)

f = linspace(-150e3, 150e3, 601);
X = max(1 - abs(f)/W, 0);
plot(f/1e3, X, 'LineWidth', 1.5), grid on
xlabel('f (kHz)'), ylabel('X(f)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# x(t) bandlimited to W; y(t) = x(t)*cos(2*pi*fc*t) shifts the band to fc
W, fg, fc = 40e3, 10e3, 40e3
fs_a = 2*W
print(f'(a) Nyquist rate of x(t) = {fs_a/1e3:g} kHz')
fs_b = 2*W + fg
print(f'(b) rate with {fg/1e3:g} kHz guard band = {fs_b/1e3:g} kHz')

# y(t) occupies |f| < fc + W, so its highest frequency is fc + W
fs_c = 2*(fc + W)
print(f'(c) Nyquist rate of y(t) = x(t) cos(80000*pi*t) = {fs_c/1e3:g} kHz')

f = np.linspace(-150e3, 150e3, 601)
X = np.maximum(1 - np.abs(f)/W, 0)
plt.plot(f/1e3, X, linewidth=1.5)
plt.xlabel(r'$f$ (kHz)'); plt.ylabel(r'$X(f)$'); plt.grid(True)
plt.show()`},

/* -------------------------------------------------------------- 1.3 ---- */
'quant-midrise': {
  title:'A uniform mid-rise quantizer',
  what:'Builds an $L=8$ mid-rise quantizer with levels $\\pm\\Delta/2,\\pm3\\Delta/2,\\dots$ and prints the region, level, and error for four samples.',
  try:'Move the third sample to $m=4.2$, outside the range. Predict what the quantizer returns.',
  out:'m =  0.30   level =  0.50   error = -0.20\nm = -1.20   level = -1.50   error =  0.30\nm =  2.70   level =  2.50   error =  0.20\nm = -3.90   level = -3.50   error = -0.40',
  m:`% Mid-rise quantizer: L = 8 levels, step D = 1, so levels are D/2, 3D/2, ...
L = 8; D = 1; half = L*D/2;
q_midrise = @(m) max(-half+D/2, min(half-D/2, (floor(m/D)+0.5)*D));

for m = [0.30 -1.20 2.70 -3.90]
    v = q_midrise(m);
    fprintf('m = %5.2f   level = %5.2f   error = %5.2f\\n', m, v, m - v)
end

m = linspace(-half, half, 2000);
v = arrayfun(q_midrise, m);
plot(m, v, 'LineWidth', 1.8), grid on
xlabel('m'), ylabel('v = Q(m)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# Mid-rise quantizer: L = 8 levels, step D = 1, so levels are D/2, 3D/2, ...
L, D = 8, 1
half = L*D/2
def q_midrise(m):
    return max(-half+D/2, min(half-D/2, (np.floor(m/D)+0.5)*D))

for m in [0.30, -1.20, 2.70, -3.90]:
    v = q_midrise(m)
    print(f'm = {m:5.2f}   level = {v:5.2f}   error = {m - v:5.2f}')

m = np.linspace(-half, half, 2000)
v = np.array([q_midrise(mi) for mi in m])
plt.plot(m, v, linewidth=1.8)
plt.xlabel(r'$m$')
plt.ylabel(r'$v=\\mathbb{Q}(m)$')
plt.grid(True)
plt.show()`},

'quant-midtread': {
  title:'A uniform mid-tread quantizer',
  what:'Builds an $L=8$ mid-tread quantizer with a level at $0$ and compares it with the mid-rise quantizer on the same four samples.',
  try:'Set $m=0.4$, inside the zero tread. Predict the mid-rise and mid-tread levels before you run it.',
  out:'m =  0.30   midrise =  0.50   midtread =  0.00\nm = -1.20   midrise = -1.50   midtread = -1.00\nm =  2.70   midrise =  2.50   midtread =  3.00\nm = -3.90   midrise = -3.50   midtread = -3.00',
  m:`% Mid-tread quantizer: a level sits at zero, so a small input reads zero
L = 8; D = 1; half = L*D/2;
q_midrise = @(m) max(-half+D/2, min(half-D/2, (floor(m/D)+0.5)*D));
q_midtread = @(m) max(-half+D, min(half-D, round(m/D)*D));

for m = [0.30 -1.20 2.70 -3.90]
    fprintf('m = %5.2f   midrise = %5.2f   midtread = %5.2f\\n', ...
             m, q_midrise(m), q_midtread(m))
end

m = linspace(-half, half, 2000);
v = arrayfun(q_midtread, m);
plot(m, v, 'LineWidth', 1.8), grid on
xlabel('m'), ylabel('v = Q(m)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# Mid-tread quantizer: a level sits at zero, so a small input reads zero
L, D = 8, 1
half = L*D/2
def q_midrise(m):
    return max(-half+D/2, min(half-D/2, (np.floor(m/D)+0.5)*D))
def q_midtread(m):
    return max(-half+D, min(half-D, round(m/D)*D))

for m in [0.30, -1.20, 2.70, -3.90]:
    print(f'm = {m:5.2f}   midrise = {q_midrise(m):5.2f}   midtread = {q_midtread(m):5.2f}')

m = np.linspace(-half, half, 2000)
v = np.array([q_midtread(mi) for mi in m])
plt.plot(m, v, linewidth=1.8)
plt.xlabel(r'$m$')
plt.ylabel(r'$v=\\mathbb{Q}(m)$')
plt.grid(True)
plt.show()`},

'quant-signal': {
  title:'Quantizing samples of a signal',
  what:'Samples $m(t)=5\\cos t$ and passes each sample through a mid-rise quantizer with $L=8$, printing the region, level and error at four times.',
  try:'Change $L$ to 16. Predict whether the printed errors grow or shrink.',
  out:'t = 0.00   m =  5.00   level =  4.38   error =  0.62\nt = 1.00   m =  2.70   level =  3.12   error = -0.42\nt = 2.00   m = -2.08   level = -1.88   error = -0.21\nt = 3.00   m = -4.95   level = -4.38   error = -0.57',
  m:`% m(t) = 5 cos(t), quantized by a mid-rise quantizer with L = 8 over [-5, 5]
L = 8; mmax = 5; D = 2*mmax/L;
q = @(m) max(-mmax+D/2, min(mmax-D/2, (floor(m/D)+0.5)*D));

for t = [0 1 2 3]
    m = 5*cos(t);
    v = q(m);
    fprintf('t = %.2f   m = %5.2f   level = %5.2f   error = %5.2f\\n', t, m, v, m - v)
end

t = linspace(0, 2*pi, 900);
m = 5*cos(t);
v = arrayfun(q, m);
plot(t, m, t, v, 'LineWidth', 1.3), grid on
xlabel('t'), legend('m(t)', 'Q(m(t))')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# m(t) = 5 cos(t), quantized by a mid-rise quantizer with L = 8 over [-5, 5]
L, mmax = 8, 5
D = 2*mmax/L
def q(m):
    return max(-mmax+D/2, min(mmax-D/2, (np.floor(m/D)+0.5)*D))

for t in [0, 1, 2, 3]:
    m = 5*np.cos(t)
    v = q(m)
    print(f't = {t:.2f}   m = {m:5.2f}   level = {v:5.2f}   error = {m - v:5.2f}')

t = np.linspace(0, 2*np.pi, 900)
m = 5*np.cos(t)
v = np.array([q(mi) for mi in m])
plt.plot(t, m, t, v, linewidth=1.3)
plt.xlabel(r'$t$'); plt.legend([r'$m(t)$', r'$\\mathbb{Q}(m(t))$']); plt.grid(True)
plt.show()`},

/* -------------------------------------------------------------- 1.4 ---- */
'sqnr-cos': {
  title:'Measured SQNR of a quantized sinusoid',
  what:'Quantizes $m(t)=5\\cos t$ at $R=3$ and $R=4$ bits and measures the SQNR by averaging the actual error over one period.',
  try:'Predict the difference between the two SQNR values before you run it. It should be close to one number this section names.',
  out:'R = 3   delta = 1.2500 V   SQNR = 19.09 dB\nR = 4   delta = 0.6250 V   SQNR = 25.31 dB',
  m:`% m(t) = 5 cos(t): measure SQNR by quantizing the whole waveform
mmax = 5;
t = linspace(0, 2*pi, 200001);
m = mmax*cos(t);

for R = [3 4]
    L = 2^R; D = 2*mmax/L;
    v = max(-mmax+D/2, min(mmax-D/2, (floor(m/D)+0.5)*D));
    q = m - v;
    Pm = trapz(t, m.^2) / (2*pi);
    Pq = trapz(t, q.^2) / (2*pi);
    fprintf('R = %d   delta = %.4f V   SQNR = %.2f dB\\n', R, D, 10*log10(Pm/Pq))
end

plot(t, m, 'LineWidth', 1.3), grid on
xlabel('t'), ylabel('m(t)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# m(t) = 5 cos(t): measure SQNR by quantizing the whole waveform
mmax = 5
t = np.linspace(0, 2*np.pi, 200001)
m = mmax*np.cos(t)

for R in [3, 4]:
    L = 2**R
    D = 2*mmax/L
    v = np.clip((np.floor(m/D)+0.5)*D, -mmax+D/2, mmax-D/2)
    q = m - v
    Pm = np.trapezoid(m**2, t) / (2*np.pi)
    Pq = np.trapezoid(q**2, t) / (2*np.pi)
    print(f'R = {R}   delta = {D:.4f} V   SQNR = {10*np.log10(Pm/Pq):.2f} dB')

plt.plot(t, m, linewidth=1.3)
plt.xlabel(r'$t$'); plt.ylabel(r'$m(t)$'); plt.grid(True)
plt.show()`},

'sqnr-uniform': {
  title:'SQNR of a uniform source',
  what:'Quantizes $M\\sim U(-1,1)$ with $L=256$ levels and computes $E[Q^2]$ by integrating over each region, then the SQNR.',
  try:'Predict the SQNR from $R=\\log_2 256=8$ bits and $6.02$ dB a bit before you run it.',
  out:'E[Q^2] = 5.086e-06\nSQNR = 48.16 dB',
  m:`% M ~ U(-1,1), L = 256 levels: integrate the error over the density
L = 256; mmax = 1; D = 2*mmax/L;
m = linspace(-mmax, mmax, 2000001);
v = max(-mmax+D/2, min(mmax-D/2, (floor(m/D)+0.5)*D));
EQ2 = trapz(m, (m - v).^2 * 0.5);            % density 1/2 on (-1, 1)
Pm  = 1/3;                                   % E[M^2] for U(-1,1)
fprintf('E[Q^2] = %.3e\\n', EQ2)
fprintf('SQNR = %.2f dB\\n', 10*log10(Pm/EQ2))

mm = linspace(-mmax, mmax, 900);
vv = max(-mmax+D/2, min(mmax-D/2, (floor(mm/D)+0.5)*D));
plot(mm, vv, 'LineWidth', 1.5), grid on
xlabel('m'), ylabel('Q(m)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# M ~ U(-1,1), L = 256 levels: integrate the error over the density
L, mmax = 256, 1
D = 2*mmax/L
m = np.linspace(-mmax, mmax, 2_000_001)
v = np.clip((np.floor(m/D)+0.5)*D, -mmax+D/2, mmax-D/2)
EQ2 = np.trapezoid((m - v)**2 * 0.5, m)      # density 1/2 on (-1, 1)
Pm = 1/3                                     # E[M^2] for U(-1,1)
print(f'E[Q^2] = {EQ2:.3e}')
print(f'SQNR = {10*np.log10(Pm/EQ2):.2f} dB')

mm = np.linspace(-mmax, mmax, 900)
vv = np.clip((np.floor(mm/D)+0.5)*D, -mmax+D/2, mmax-D/2)
plt.plot(mm, vv, linewidth=1.5)
plt.xlabel(r'$m$')
plt.ylabel(r'$\\mathbb{Q}(m)$')
plt.grid(True)
plt.show()`},

'sqnr-gauss': {
  title:'A five-level quantizer on a Gaussian source',
  what:'Integrates the noise power of a five-level quantizer region by region against a Gaussian density with variance 400, and computes the SQNR.',
  try:'Predict which region contributes the most noise power before you run it: the centre region or an outer one.',
  out:'region powers = 7.98 46.36 79.50 46.36 7.98\nP_Q = 188.17\nSQNR = 3.28 dB',
  m:`% Zero-mean Gaussian, var = 400; five levels -30,-10,0,10,30; edges +/-40,+/-20
var = 400; sd = sqrt(var);
edges  = [-8*sd -40 -20 20 40 8*sd];         % +/- 8 sd stands in for +/- inf
levels = [-30 -10 0 10 30];
dens = @(x) exp(-x.^2/(2*var)) / sqrt(2*pi*var);

P = zeros(1,5);
for k = 1:5
    x = linspace(edges(k), edges(k+1), 400001);
    P(k) = trapz(x, (x - levels(k)).^2 .* dens(x));
end
fprintf('region powers =%s\\n', sprintf(' %.2f', P))
PQ = sum(P);
fprintf('P_Q = %.2f\\n', PQ)
fprintf('SQNR = %.2f dB\\n', 10*log10(400/PQ))

x = linspace(-80, 80, 900);
plot(x, dens(x), 'LineWidth', 1.5), grid on
xlabel('x'), ylabel('f_X(x)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# Zero-mean Gaussian, var = 400; five levels -30,-10,0,10,30; edges +/-40,+/-20
var, sd = 400, np.sqrt(400)
edges = [-8*sd, -40, -20, 20, 40, 8*sd]      # +/- 8 sd stands in for +/- inf
levels = [-30, -10, 0, 10, 30]
def dens(x): return np.exp(-x**2/(2*var)) / np.sqrt(2*np.pi*var)

P = []
for k in range(5):
    x = np.linspace(edges[k], edges[k+1], 400001)
    P.append(np.trapezoid((x - levels[k])**2 * dens(x), x))
print('region powers =', ' '.join(f'{p:.2f}' for p in P))
PQ = sum(P)
print(f'P_Q = {PQ:.2f}')
print(f'SQNR = {10*np.log10(400/PQ):.2f} dB')
x = np.linspace(-80, 80, 900)
plt.plot(x, dens(x), linewidth=1.5)
plt.xlabel(r'$x$'); plt.ylabel(r'$f_X(x)$'); plt.grid(True)
plt.show()`},

'sqnr-perbit': {
  title:'The 6.02 dB-per-bit rule',
  what:'Tabulates $\\mathrm{SQNR}=\\alpha+6.02R$ for $R=1,\\dots,8$ bits at a fixed $\\alpha$ and prints the gain from one extra bit.',
  try:'Predict the SQNR at $R=8$ before you run it, starting from the value at $R=1$.',
  out:'R =  1   SQNR =   7.78 dB\nR =  2   SQNR =  13.80 dB\nR =  3   SQNR =  19.82 dB\nR =  4   SQNR =  25.84 dB\nR =  5   SQNR =  31.86 dB\nR =  6   SQNR =  37.88 dB\nR =  7   SQNR =  43.90 dB\nR =  8   SQNR =  49.92 dB\ngain a bit = 6.02 dB',
  m:`% SQNR = alpha + 6.02R: alpha = 1.76 dB, the full-scale-sinusoid case
alpha = 1.76;
R = 1:8;
S = alpha + 6.02*R;
for k = 1:length(R)
    fprintf('R = %2d   SQNR = %6.2f dB\\n', R(k), S(k))
end
fprintf('gain a bit = %.2f dB\\n', S(2) - S(1))

plot(R, S, 'o-', 'LineWidth', 1.5), grid on
xlabel('R (bits per sample)'), ylabel('SQNR (dB)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# SQNR = alpha + 6.02R: alpha = 1.76 dB, the full-scale-sinusoid case
alpha = 1.76
R = np.arange(1, 9)
S = alpha + 6.02*R
for r, s in zip(R, S):
    print(f'R = {r:2d}   SQNR = {s:6.2f} dB')
print(f'gain a bit = {S[1] - S[0]:.2f} dB')

plt.plot(R, S, 'o-', linewidth=1.5)
plt.xlabel(r'$R$ (bits per sample)')
plt.ylabel(r'SQNR (dB)')
plt.grid(True)
plt.show()`},

/* -------------------------------------------------------------- 1.5 ---- */
'comp-laws': {
  title:'The $\\mu$-law and A-law compressors',
  what:'Builds the $\\mu=255$ and $A=87.6$ compressor curves and prints the compressed output at four input levels.',
  try:'Predict which curve gives the larger output at $x=0.01$, close to zero.',
  out:'x = 0.0100   mu-law = 0.2285   A-law = 0.1601\nx = 0.1000   mu-law = 0.5910   A-law = 0.5793\nx = 0.5000   mu-law = 0.8757   A-law = 0.8733\nx = 1.0000   mu-law = 1.0000   A-law = 1.0000',
  m:`% mu-law and A-law compressors on x in [-1, 1]
mu = 255; A = 87.6;
mulaw = @(x) sign(x) .* log(1 + mu*abs(x)) / log(1 + mu);
alaw  = @(x) sign(x) .* ( (abs(x) < 1/A) .* (A*abs(x)/(1+log(A))) + ...
             (abs(x) >= 1/A) .* ((1+log(A*max(abs(x),1/A)))/(1+log(A))) );

for x = [0.01 0.1 0.5 1.0]
    fprintf('x = %.4f   mu-law = %.4f   A-law = %.4f\\n', x, mulaw(x), alaw(x))
end

x = linspace(-1, 1, 900);
plot(x, x, '--', x, mulaw(x), x, alaw(x), 'LineWidth', 1.5), grid on
xlabel('x'), ylabel('y'), legend('identity', 'mu-law', 'A-law')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# mu-law and A-law compressors on x in [-1, 1]
mu, A = 255, 87.6
def mulaw(x):
    return np.sign(x) * np.log(1 + mu*np.abs(x)) / np.log(1 + mu)
def alaw(x):
    u = np.abs(x)
    return np.sign(x) * np.where(u < 1/A, A*u/(1+np.log(A)), (1+np.log(A*u))/(1+np.log(A)))

for x in [0.01, 0.1, 0.5, 1.0]:
    print(f'x = {x:.4f}   mu-law = {mulaw(x):.4f}   A-law = {alaw(x):.4f}')

x = np.linspace(-1, 1, 900)
plt.plot(x, x, '--', x, mulaw(x), x, alaw(x), linewidth=1.5)
plt.xlabel(r'$x$')
plt.ylabel(r'$y$')
plt.legend(['identity', r'$\\mu$-law', 'A-law'])
plt.grid(True)
plt.show()`},

'comp-sqnr': {
  title:'Uniform against $\\mu$-law SQNR',
  what:'Compares a uniform quantizer with a companded ($\\mu$-law, $\\mu=255$) quantizer at three input levels, both at $L=256$.',
  try:'Predict which quantizer keeps a flatter SQNR as the input level drops, before you run it.',
  out:'level = 1.00   uniform = 49.79 dB   mu-law = 37.42 dB\nlevel = 0.10   uniform = 30.22 dB   mu-law = 38.31 dB\nlevel = 0.01   uniform =  9.34 dB   mu-law = 34.04 dB',
  m:`% A sinusoid at three levels of full scale, quantized with L = 256
mu = 255; L = 256; D = 2/L;
mulaw = @(x) sign(x) .* log(1 + mu*abs(x)) / log(1 + mu);
mulaw_inv = @(y) sign(y) .* ((1+mu).^abs(y) - 1) / mu;
t = linspace(0, 2*pi, 400001);
for lev = [1.00 0.10 0.01]
    m = lev*cos(t);                          % uniform quantizer, L levels over [-1, 1]
    vu = max(-1+D/2, min(1-D/2, (floor(m/D)+0.5)*D));
    Pm = trapz(t, m.^2)/(2*pi);
    Su = 10*log10(Pm / (trapz(t, (m - vu).^2)/(2*pi)));
    y  = mulaw(m);                           % mu-law: compress, quantize, expand
    vy = max(-1+D/2, min(1-D/2, (floor(y/D)+0.5)*D));
    mhat = mulaw_inv(vy);
    Sc = 10*log10(Pm / (trapz(t, (m - mhat).^2)/(2*pi)));
    fprintf('level = %.2f   uniform = %5.2f dB   mu-law = %5.2f dB\\n', lev, Su, Sc)
end

plot(t, cos(t), 'LineWidth', 1.3), grid on
xlabel('t'), ylabel('m(t)/level')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# A sinusoid at three levels of full scale, quantized with L = 256
mu, L, D = 255, 256, 2/256
def mulaw(x): return np.sign(x) * np.log(1 + mu*np.abs(x)) / np.log(1 + mu)
def mulaw_inv(y): return np.sign(y) * ((1+mu)**np.abs(y) - 1) / mu
t = np.linspace(0, 2*np.pi, 400001)
for lev in [1.00, 0.10, 0.01]:
    m = lev*np.cos(t)
    vu = np.clip((np.floor(m/D)+0.5)*D, -1+D/2, 1-D/2)
    Pm = np.trapezoid(m**2, t)/(2*np.pi)
    Su = 10*np.log10(Pm / (np.trapezoid((m - vu)**2, t)/(2*np.pi)))
    y = mulaw(m)
    vy = np.clip((np.floor(y/D)+0.5)*D, -1+D/2, 1-D/2)
    mhat = mulaw_inv(vy)
    Sc = 10*np.log10(Pm / (np.trapezoid((m - mhat)**2, t)/(2*np.pi)))
    print(f'level = {lev:.2f}   uniform = {Su:5.2f} dB   mu-law = {Sc:5.2f} dB')
plt.plot(t, np.cos(t), linewidth=1.3)
plt.xlabel(r'$t$'); plt.ylabel(r'$m(t)/\\mathrm{level}$'); plt.grid(True)
plt.show()`},

/* -------------------------------------------------------------- 1.6 ---- */
'pcm-example': {
  title:'The PCM example, start to finish',
  what:'Samples $m(t)=8|\\operatorname{sinc}(t-2)|$ every $T_s=0.6$ s, quantizes with eight levels on $[0,8]$, and prints the samples, levels and code words.',
  try:'Change $T_s$ to 0.3 s. Predict whether the bit rate doubles.',
  out:'t = 0.0   sample = 0.00   level = 0.5   code = 000\nt = 0.6   sample = 1.73   level = 1.5   code = 001\nt = 1.2   sample = 1.87   level = 1.5   code = 001\nt = 1.8   sample = 7.48   level = 7.5   code = 111\nt = 2.4   sample = 6.05   level = 6.5   code = 110\nt = 3.0   sample = 0.00   level = 0.5   code = 000\nt = 3.6   sample = 1.51   level = 1.5   code = 001\nR_b = 5 bit/s',
  m:`% m(t) = 8|sinc(t-2)|, Ts = 0.6 s, eight levels on [0, 8]
sinc_m = @(x) sin(pi*x)./(pi*x + (x==0)) .* (x~=0) + (x==0);
m  = @(t) 8*abs(sinc_m(t - 2));
Ts = 0.6; L = 8; D = 8/L;

for n = 0:6
    t = n*Ts; v = m(t);
    idx = min(7, floor(v/D));                % code word 0..7
    lvl = idx + 0.5;
    fprintf('t = %.1f   sample = %.2f   level = %.1f   code = %s\\n', ...
             t, v, lvl, dec2bin(idx, 3))
end
fs = 1/Ts; R = log2(L);
fprintf('R_b = %g bit/s\\n', R*fs)

t = linspace(-0.2, 4, 900);
plot(t, m(t), 'LineWidth', 1.5), grid on
xlabel('t (s)'), ylabel('m(t)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# m(t) = 8|sinc(t-2)|, Ts = 0.6 s, eight levels on [0, 8]
def m(t): return 8*np.abs(np.sinc(t - 2))
Ts, L, D = 0.6, 8, 1.0

for n in range(7):
    t = n*Ts
    v = m(t)
    idx = min(7, int(np.floor(v/D)))         # code word 0..7
    lvl = idx + 0.5
    print(f't = {t:.1f}   sample = {v:.2f}   level = {lvl:.1f}   code = {idx:03b}')
fs = 1/Ts
R = np.log2(L)
print(f'R_b = {R*fs:g} bit/s')

t = np.linspace(-0.2, 4, 900)
plt.plot(t, m(t), linewidth=1.5)
plt.xlabel(r'$t$ (s)'); plt.ylabel(r'$m(t)$'); plt.grid(True)
plt.show()`},

'pcm-gray': {
  title:'Natural binary against Gray code',
  what:'Builds the natural-binary and Gray code words for eight levels and counts how many bits change between adjacent levels.',
  try:'Predict, before you run it, which coding never changes more than one bit between neighbours.',
  out:'level  natural  gray\n    0      000    000\n    1      001    001\n    2      010    011\n    3      011    010\n    4      100    110\n    5      101    111\n    6      110    101\n    7      111    100\nbit changes, natural = 1 2 1 3 1 2 1\nbit changes, gray    = 1 1 1 1 1 1 1',
  m:`% Eight levels: natural binary vs. Gray code, and bits that change next door
L = 8;
nat  = 0:L-1;
gray = bitxor(nat, floor(nat/2));

fprintf('level  natural  gray\\n')
for k = 1:L
    fprintf('%5d      %s    %s\\n', nat(k), dec2bin(nat(k),3), dec2bin(gray(k),3))
end

hamming = @(a,b) sum(dec2bin(bitxor(a,b),3) == '1');
dn = arrayfun(@(k) hamming(nat(k),nat(k+1)), 1:L-1);
dg = arrayfun(@(k) hamming(gray(k),gray(k+1)), 1:L-1);
fprintf('bit changes, natural =%s\\n', sprintf(' %d', dn))
fprintf('bit changes, gray    =%s\\n', sprintf(' %d', dg))

stem(nat, gray, 'filled'), grid on
xlabel('level'), ylabel('Gray code, as an integer')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# Eight levels: natural binary vs. Gray code, and bits that change next door
L = 8
nat = np.arange(L)
gray = nat ^ (nat // 2)

print('level  natural  gray')
for k in range(L):
    print(f'{nat[k]:5d}      {nat[k]:03b}    {gray[k]:03b}')

def hamming(a, b): return bin(a ^ b).count('1')
dn = [hamming(nat[k], nat[k+1]) for k in range(L-1)]
dg = [hamming(gray[k], gray[k+1]) for k in range(L-1)]
print('bit changes, natural =', *dn)
print('bit changes, gray    =', *dg)

plt.stem(nat, gray)
plt.xlabel(r'level'); plt.ylabel(r'Gray code, as an integer'); plt.grid(True)
plt.show()`},

'pcm-linecode': {
  title:'A line code and its DC component',
  what:'Draws unipolar NRZ and polar NRZ for one bit stream and prints the DC component (the time average) of each.',
  try:'Predict the DC component of polar NRZ for a stream with more ones than zeros.',
  out:'bits = 0 1 1 0 1 0 0 1\nDC, unipolar NRZ = 0.500\nDC, polar NRZ    = 0.000',
  m:`% One bit stream through two line codes; the DC term is the time average
bits = [0 1 1 0 1 0 0 1];
fprintf('bits =%s\\n', sprintf(' %d', bits))

unipolar = bits;               % 0 or 1
polar    = 2*bits - 1;         % -1 or 1
fprintf('DC, unipolar NRZ = %.3f\\n', mean(unipolar))
fprintf('DC, polar NRZ    = %.3f\\n', mean(polar))

t = 0:length(bits);
u = [unipolar unipolar(end)];
p = [polar polar(end)];
stairs(t, u, 'LineWidth', 1.5), hold on
stairs(t, p, 'LineWidth', 1.5), hold off, grid on
xlabel('bit interval'), legend('unipolar NRZ', 'polar NRZ')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# One bit stream through two line codes; the DC term is the time average
bits = np.array([0, 1, 1, 0, 1, 0, 0, 1])
print('bits =', *bits)

unipolar = bits                # 0 or 1
polar = 2*bits - 1             # -1 or 1
print(f'DC, unipolar NRZ = {np.mean(unipolar):.3f}')
print(f'DC, polar NRZ    = {np.mean(polar):.3f}')

t = np.arange(len(bits) + 1)
u = np.append(unipolar, unipolar[-1])
p = np.append(polar, polar[-1])
plt.step(t, u, where='post', linewidth=1.5)
plt.step(t, p, where='post', linewidth=1.5)
plt.xlabel(r'bit interval')
plt.legend(['unipolar NRZ', 'polar NRZ'])
plt.grid(True)
plt.show()`}

};
