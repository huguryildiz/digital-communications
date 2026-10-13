/* ==========================================================================
   Code for Module 2: programs in MATLAB and Python
   One entry a program, keyed by a short name. Each program draws a signal
   from the section and prints the number the section computes, with the same
   wording in both languages, so `out` is one text for both. MATLAB uses no
   toolbox; Python uses NumPy and Matplotlib only.
   `title`, `what` and `try` are student text and go through md(); the code
   is plain text. Each section closes with a code page (`CODE_BANKS_M2`) that
   pages through its programs.
   verify/code_check.py runs every entry in both languages and compares what
   it prints with `out`.
   ========================================================================== */
const CODE_BANKS_M2 = {
  'm2-code-random':   ['rp-phase', 'rp-psd', 'rp-rc', 'rp-lpf'],
  'm2-code-matched':  ['mf-rect', 'mf-instant', 'mf-shapes'],
  'm2-code-demod':    ['dem-basis', 'dem-two', 'dem-var'],
  'm2-code-decision': ['dec-example', 'dec-curve', 'dec-scan'],
  'm2-code-isi':      ['isi-taps', 'isi-eye', 'isi-bandwidth'],
  'm2-code-nyquist':  ['nyq-tiling', 'nyq-zeros', 'nyq-bandwidth']
};

const CODE_M2 = {

/* -------------------------------------------------------------- 2.1 ---- */
'rp-phase': {
  title:'Ensemble averages of a random-phase sinusoid',
  what:'Averages $X(t)=A\\cos(2\\pi f_0t+\\Theta)$ over 360 equally spaced phases at one time $t$. It prints the mean, $R_X(\\tau)$ at three lags and the power.',
  try:'Change $t$ to 0.7 ms. Predict which printed numbers change before you run it.',
  out:'E[X(t)] = 0.0000 V\nR_X(0.00 ms) =  4.5000 V^2   theory  4.5000 V^2\nR_X(0.25 ms) =  0.0000 V^2   theory  0.0000 V^2\nR_X(0.50 ms) = -4.5000 V^2   theory -4.5000 V^2\nP_X = R_X(0) = 4.5000 V^2',
  m:`% X(t) = A cos(2 pi f0 t + Theta), Theta uniform: average over M equal phases
A = 3; f0 = 1e3; M = 360; t = 0.2e-3;
theta = 2*pi*(0:M-1)/M;                      % the ensemble of phases
X = @(t) A*cos(2*pi*f0*t + theta);           % one value per sample function
mX = mean(X(t));
if abs(mX) < 1e-9, mX = 0; end               % rounding error, not a mean
fprintf('E[X(t)] = %.4f V\\n', mX)
for tau = [0 0.25 0.5]*1e-3
    R = mean(X(t).*X(t+tau));
    if abs(R) < 1e-9, R = 0; end
    Rth = A^2/2*cos(2*pi*f0*tau);            % theory (A^2/2) cos(2 pi f0 tau)
    fprintf('R_X(%.2f ms) = %7.4f V^2   theory %7.4f V^2\\n', tau*1e3, R, Rth)
end
fprintf('P_X = R_X(0) = %.4f V^2\\n', mean(X(t).^2))

tt = linspace(0, 2e-3, 400)';
plot(tt*1e3, A*cos(2*pi*f0*tt + theta(1:72:end)), 'LineWidth', 1.2), grid on
xlabel('t (ms)'), ylabel('x(t) (V)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# X(t) = A cos(2 pi f0 t + Theta), Theta uniform: average over M equal phases
A, f0, M, t = 3, 1e3, 360, 0.2e-3
theta = 2*np.pi*np.arange(M)/M               # the ensemble of phases
X = lambda t: A*np.cos(2*np.pi*f0*t + theta) # one value per sample function
mX = np.mean(X(t))
if abs(mX) < 1e-9: mX = 0.0                  # rounding error, not a mean
print(f'E[X(t)] = {mX:.4f} V')
for tau in np.array([0, 0.25, 0.5])*1e-3:
    R = np.mean(X(t)*X(t+tau))
    if abs(R) < 1e-9: R = 0.0
    Rth = A**2/2*np.cos(2*np.pi*f0*tau)      # theory (A^2/2) cos(2 pi f0 tau)
    print(f'R_X({tau*1e3:.2f} ms) = {R:7.4f} V^2   theory {Rth:7.4f} V^2')
print(f'P_X = R_X(0) = {np.mean(X(t)**2):.4f} V^2')

tt = np.linspace(0, 2e-3, 400)[:, None]
plt.plot(tt*1e3, A*np.cos(2*np.pi*f0*tt + theta[::72]), linewidth=1.2)
plt.xlabel(r'$t$ (ms)'); plt.ylabel(r'$x(t)$ (V)'); plt.grid(True)
plt.show()`},

'rp-psd': {
  title:'The Wiener–Khinchin relation',
  what:'Transforms $R_X(\\tau)=e^{-|\\tau|/\\tau_c}$ numerically and prints $S_X(f)$ beside $2\\tau_c/(1+(2\\pi f\\tau_c)^2)$. The area under $S_X(f)$ gives back the power $R_X(0)$.',
  try:'Halve $\\tau_c$. Predict $S_X(0)$ and the half-power frequency before you run it.',
  out:'f =    0.0 Hz   S_X = 2.0000e-03 W/Hz   theory 2.0000e-03 W/Hz\nf =  159.2 Hz   S_X = 1.0000e-03 W/Hz   theory 1.0000e-03 W/Hz\nf = 1000.0 Hz   S_X = 4.9409e-05 W/Hz   theory 4.9409e-05 W/Hz\nP_X = sum of S_X df = 1.0000 W   R_X(0) = 1 W',
  m:`% R_X(tau) = exp(-|tau|/tauc); Wiener-Khinchin: S_X(f) is its Fourier transform
tauc = 1e-3; dtau = 1e-6;
tau = (-20000:20000)*dtau;                   % |tau| <= 20 ms, R_X is 2e-9 at the ends
R = exp(-abs(tau)/tauc);
for f = [0 1/(2*pi*tauc) 1e3]
    S = real(sum(R.*exp(-1j*2*pi*f*tau))*dtau);   % Riemann sum of the transform
    Sth = 2*tauc/(1 + (2*pi*f*tauc)^2);
    fprintf('f = %6.1f Hz   S_X = %.4e W/Hz   theory %.4e W/Hz\\n', f, S, Sth)
end
N = numel(tau); df = 1/(N*dtau);
Sall = fftshift(abs(fft(R)))*dtau;           % S_X on the DFT grid
fprintf('P_X = sum of S_X df = %.4f W   R_X(0) = 1 W\\n', sum(Sall)*df)

f = (-(N-1)/2:(N-1)/2)*df;
k = abs(f) <= 3e3;
plot(f(k), Sall(k), 'LineWidth', 1.5), grid on
xlabel('f (Hz)'), ylabel('S_X(f) (W/Hz)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# R_X(tau) = exp(-|tau|/tauc); Wiener-Khinchin: S_X(f) is its Fourier transform
tauc, dtau = 1e-3, 1e-6
tau = np.arange(-20000, 20001)*dtau          # |tau| <= 20 ms, R_X is 2e-9 at the ends
R = np.exp(-np.abs(tau)/tauc)
for f in [0, 1/(2*np.pi*tauc), 1e3]:
    S = np.real(np.sum(R*np.exp(-1j*2*np.pi*f*tau))*dtau)   # Riemann sum
    Sth = 2*tauc/(1 + (2*np.pi*f*tauc)**2)
    print(f'f = {f:6.1f} Hz   S_X = {S:.4e} W/Hz   theory {Sth:.4e} W/Hz')
N = len(tau); df = 1/(N*dtau)
Sall = np.fft.fftshift(np.abs(np.fft.fft(R)))*dtau  # S_X on the DFT grid
print(f'P_X = sum of S_X df = {np.sum(Sall)*df:.4f} W   R_X(0) = 1 W')

f = (np.arange(N) - (N-1)//2)*df
k = np.abs(f) <= 3e3
plt.plot(f[k], Sall[k], linewidth=1.5)
plt.xlabel(r'$f$ (Hz)'); plt.ylabel(r'$S_X(f)$ (W/Hz)'); plt.grid(True)
plt.show()`},

'rp-rc': {
  title:'White noise through an RC filter',
  what:'Integrates $S_Y(f)=(N_0/2)|H(f)|^2$ for an RC lowpass filter and prints the output power. It compares the noise-equivalent bandwidth with the 3 dB bandwidth.',
  try:'Double $RC$. Predict the new $P_Y$ and $B_{\\mathrm{neq}}$ before you run it.',
  out:'P_Y = 5.000e-06 W   theory N0/(4RC) = 5.000e-06 W\nB_neq = 250.0 Hz   f_3dB = 159.2 Hz\nN0*f_3dB = 3.18e-06 W, the wrong answer from the 3 dB bandwidth',
  m:`% White noise, N0/2 = 1e-8 W/Hz, through an RC lowpass filter, RC = 1 ms
N0 = 2e-8; RC = 1e-3;
H2 = @(f) 1./(1 + (2*pi*f*RC).^2);           % |H(f)|^2
df = 10; f = -1e7:df:1e7;                    % |f| <= 10 MHz, tail 1e-5 of P_Y
PY = sum(N0/2*H2(f))*df;
Bneq = PY/N0;                                % P_Y = N0*Bneq*|H(0)|^2
f3 = 1/(2*pi*RC);
fprintf('P_Y = %.3e W   theory N0/(4RC) = %.3e W\\n', PY, N0/(4*RC))
fprintf('B_neq = %.1f Hz   f_3dB = %.1f Hz\\n', Bneq, f3)
fprintf('N0*f_3dB = %.2e W, the wrong answer from the 3 dB bandwidth\\n', N0*f3)

fp = linspace(-1e3, 1e3, 801);
plot(fp, N0/2*H2(fp), fp, N0/2*(abs(fp) <= Bneq), '--', 'LineWidth', 1.5), grid on
xlabel('f (Hz)'), ylabel('S_Y(f) (W/Hz)'), legend('S_Y(f)', 'width 2B_{neq}')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# White noise, N0/2 = 1e-8 W/Hz, through an RC lowpass filter, RC = 1 ms
N0, RC = 2e-8, 1e-3
H2 = lambda f: 1/(1 + (2*np.pi*f*RC)**2)     # |H(f)|^2
df = 10; f = np.arange(-1e6, 1e6 + 1)*df     # |f| <= 10 MHz, tail 1e-5 of P_Y
PY = np.sum(N0/2*H2(f))*df
Bneq = PY/N0                                 # P_Y = N0*Bneq*|H(0)|^2
f3 = 1/(2*np.pi*RC)
print(f'P_Y = {PY:.3e} W   theory N0/(4RC) = {N0/(4*RC):.3e} W')
print(f'B_neq = {Bneq:.1f} Hz   f_3dB = {f3:.1f} Hz')
print(f'N0*f_3dB = {N0*f3:.2e} W, the wrong answer from the 3 dB bandwidth')

fp = np.linspace(-1e3, 1e3, 801)
plt.plot(fp, N0/2*H2(fp), fp, N0/2*(np.abs(fp) <= Bneq), '--', linewidth=1.5)
plt.xlabel(r'$f$ (Hz)'); plt.ylabel(r'$S_Y(f)$ (W/Hz)'); plt.grid(True)
plt.legend([r'$S_Y(f)$', r'width $2B_{\\mathrm{neq}}$'])
plt.show()`},

'rp-lpf': {
  title:'White noise through an ideal lowpass filter',
  what:'Takes the inverse transform of the flat band $|f|<B$ and prints $R_Y(\\tau)$ at four lags. Its zeros at $k/(2B)$ make samples $1/(2B)$ apart uncorrelated.',
  try:'Set $B=2$ MHz. Predict $P_Y$ and the first zero of $R_Y(\\tau)$ before you run it.',
  out:'P_Y = N0*B = 0.0200 W   1/(2B) = 0.50 us\nR_Y(0.00 us) = 0.020000 W   theory 0.020000 W\nR_Y(0.25 us) = 0.012732 W   theory 0.012732 W\nR_Y(0.50 us) = 0.000000 W   theory 0.000000 W\nR_Y(1.00 us) = 0.000000 W   theory 0.000000 W',
  m:`% White noise, N0/2 = 1e-8 W/Hz, through an ideal lowpass filter of bandwidth B
N0 = 2e-8; B = 1e6; df = B/1000;
f = -B+df/2 : df : B-df/2;                   % midpoints across the band |f| < B
sincf = @(x) (x == 0) + sin(pi*x)./(pi*x + (x == 0));
fprintf('P_Y = N0*B = %.4f W   1/(2B) = %.2f us\\n', N0*B, 1e6/(2*B))
for tau = [0 0.25 0.5 1]*1e-6
    RY = sum(N0/2*cos(2*pi*f*tau))*df;       % numerical inverse transform
    v = [RY, N0*B*sincf(2*B*tau)];
    v(abs(v) < 1e-12) = 0;                   % rounding error, not a value
    fprintf('R_Y(%.2f us) = %.6f W   theory %.6f W\\n', tau*1e6, v(1), v(2))
end

tt = linspace(-3e-6, 3e-6, 601);
RY = N0/2*df*sum(cos(2*pi*f'*tt), 1);        % inverse transform at every lag
plot(tt*1e6, RY, 'LineWidth', 1.5), grid on
xlabel('\\tau (\\mus)'), ylabel('R_Y(\\tau) (W)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# White noise, N0/2 = 1e-8 W/Hz, through an ideal lowpass filter of bandwidth B
N0, B = 2e-8, 1e6
df = B/1000
f = -B + df/2 + np.arange(2000)*df           # midpoints across the band |f| < B
print(f'P_Y = N0*B = {N0*B:.4f} W   1/(2B) = {1e6/(2*B):.2f} us')
for tau in np.array([0, 0.25, 0.5, 1])*1e-6:
    RY = np.sum(N0/2*np.cos(2*np.pi*f*tau))*df   # numerical inverse transform
    v = np.array([RY, N0*B*np.sinc(2*B*tau)])
    v[np.abs(v) < 1e-12] = 0                 # rounding error, not a value
    print(f'R_Y({tau*1e6:.2f} us) = {v[0]:.6f} W   theory {v[1]:.6f} W')

tt = np.linspace(-3e-6, 3e-6, 601)
RY = N0/2*df*np.sum(np.cos(2*np.pi*f[:, None]*tt), axis=0)   # every lag
plt.plot(tt*1e6, RY, linewidth=1.5)
plt.xlabel(r'$\\tau$ ($\\mu$s)'); plt.ylabel(r'$R_Y(\\tau)$ (W)'); plt.grid(True)
plt.show()`},

/* -------------------------------------------------------------- 2.2 ---- */
'mf-rect': {
  title:'The matched filter output of a rectangular pulse',
  what:'Filters $g(t)=A$ on $0\\le t\\le T$ with its matched filter $h(t)=g(T-t)$ and prints the peak output and $\\eta_{\\max}=2E/N_0$.',
  try:'Double $A$. Predict the new energy $E$ and the new $\\eta$ in dB before you run it.',
  out:'E = 0.004000 J\ny(T) = 0.004000\n2E/N0 = 80.00 = 19.03 dB',
  m:`% g(t) = A on [0,T], matched filter h(t) = g(T-t): convolve on a fine grid
A = 2; T = 1e-3; N0 = 1e-4; N = 1000;
dt = T/N;
t  = (0:N-1)*dt;                            % N samples over [0,T)
s  = A*ones(size(t));
h  = A*ones(size(t));                       % g(T-t) is the same rectangle
y  = conv(s, h)*dt;
ty = (0:length(y)-1)*dt;

E = A^2*T;
snr = 2*E/N0;
fprintf('E = %.6f J\\n', E)
fprintf('y(T) = %.6f\\n', max(y))
fprintf('2E/N0 = %.2f = %.2f dB\\n', snr, 10*log10(snr))

plot(ty/T, y, 'LineWidth', 1.5), grid on
xlabel('t/T'), ylabel('y(t)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# g(t) = A on [0,T], matched filter h(t) = g(T-t): convolve on a fine grid
A, T, N0, N = 2, 1e-3, 1e-4, 1000
dt = T/N
t = np.arange(N)*dt                         # N samples over [0,T)
s = A*np.ones_like(t)
h = A*np.ones_like(t)                       # g(T-t) is the same rectangle
y = np.convolve(s, h)*dt
ty = np.arange(len(y))*dt
E = A**2*T
snr = 2*E/N0
print(f'E = {E:.6f} J')
print(f'y(T) = {np.max(y):.6f}')
print(f'2E/N0 = {snr:.2f} = {10*np.log10(snr):.2f} dB')

plt.plot(ty/T, y, linewidth=1.5)
plt.xlabel(r'$t/T$'); plt.ylabel(r'$y(t)$'); plt.grid(True)
plt.show()`},

'mf-instant': {
  title:'Output SNR away from the matched instant',
  what:'Samples the same matched filter output before $t=T$ and prints the drop in $\\eta$ at each earlier instant.',
  try:'Predict the drop in dB at $t_0=0.5T$ before you run it. It should be a familiar number.',
  out:'t0/T = 0.25   SNR =  6.99 dB\nt0/T = 0.50   SNR = 13.01 dB\nt0/T = 0.75   SNR = 16.53 dB\nt0/T = 1.00   SNR = 19.03 dB',
  m:`% Rectangular pulse, matched filter: g0(t0) rises linearly, g0(t0) = A^2*t0
A = 2; T = 1e-3; N0 = 1e-4;
Eh = A^2*T;                                 % int h(t)^2 dt over [0,T]

t0_list = [0.25 0.5 0.75 1.00]*T;
for t0 = t0_list
    g0  = A^2*t0;
    snr = g0^2 / ((N0/2)*Eh);
    fprintf('t0/T = %.2f   SNR = %5.2f dB\\n', t0/T, 10*log10(snr))
end

tt = linspace(0.05, 1, 200)*T;
g0 = A^2*tt;
snr_db = 10*log10((g0.^2 / ((N0/2)*Eh)));
plot(tt/T, snr_db, 'LineWidth', 1.5), grid on
xlabel('t_0/T'), ylabel('SNR (dB)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# Rectangular pulse, matched filter: g0(t0) rises linearly, g0(t0) = A^2*t0
A, T, N0 = 2, 1e-3, 1e-4
Eh = A**2*T                                 # int h(t)^2 dt over [0,T]

t0_list = np.array([0.25, 0.5, 0.75, 1.00])*T
for t0 in t0_list:
    g0 = A**2*t0
    snr = g0**2 / ((N0/2)*Eh)
    print(f't0/T = {t0/T:.2f}   SNR = {10*np.log10(snr):5.2f} dB')

tt = np.linspace(0.05, 1, 200)*T
g0 = A**2*tt
snr_db = 10*np.log10(g0**2 / ((N0/2)*Eh))
plt.plot(tt/T, snr_db, linewidth=1.5)
plt.xlabel(r'$t_0/T$'); plt.ylabel(r'SNR (dB)'); plt.grid(True)
plt.show()`},

'mf-shapes': {
  title:'Three pulse shapes at equal energy',
  what:'Scales a rectangle, a half sine, and a triangle to the same energy $E=0.004$ J and matches each: all three peak at $t=T$ with the same $\\eta$.',
  try:'Predict, before you run it, whether the peak time changes with the pulse shape.',
  out:'rectangular   t/T = 1.000   SNR = 19.03 dB\nhalf sine     t/T = 1.000   SNR = 19.03 dB\ntriangle      t/T = 1.000   SNR = 19.03 dB',
  m:`% Three pulses on [0,T], each scaled to energy E = 0.004 J, matched filtered
T = 1e-3; N0 = 1e-4; E = 0.004;
dt = T/2000; t = 0:dt:T;

shapes = {'rectangular', 'half sine', 'triangle'};
raw = { ones(size(t)), sin(pi*t/T), min(t, T-t) };
for k = 1:3
    p  = raw{k};
    Ep = trapz(t, p.^2);
    s  = p * sqrt(E/Ep);                    % rescale to energy E
    h  = s(end:-1:1);
    y  = conv(s, h)*dt;
    ty = (0:length(y)-1)*dt;
    [ypk, ipk] = max(y);
    snr = 2*E/N0;
    fprintf('%-13s t/T = %.3f   SNR = %.2f dB\\n', shapes{k}, ty(ipk)/T, 10*log10(snr))
end

plot(t/T, raw{1}, t/T, raw{2}, t/T, raw{3}, 'LineWidth', 1.5), grid on
xlabel('t/T'), ylabel('pulse shape'), legend(shapes{:})`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# Three pulses on [0,T], each scaled to energy E = 0.004 J, matched filtered
T, N0, E = 1e-3, 1e-4, 0.004
dt = T/2000
t = np.arange(0, T+dt/2, dt)
shapes = ['rectangular', 'half sine', 'triangle']
raw = [np.ones_like(t), np.sin(np.pi*t/T), np.minimum(t, T-t)]
for name, p in zip(shapes, raw):
    s = p * np.sqrt(E/np.trapezoid(p**2, t))   # rescale to energy E
    h = s[::-1]
    y = np.convolve(s, h)*dt
    ty = np.arange(len(y))*dt
    ipk = np.argmax(y)
    print(f'{name:<13} t/T = {ty[ipk]/T:.3f}   SNR = {10*np.log10(2*E/N0):.2f} dB')

plt.plot(t/T, raw[0], t/T, raw[1], t/T, raw[2], linewidth=1.5)
plt.xlabel(r'$t/T$'); plt.ylabel(r'pulse shape'); plt.legend(shapes); plt.grid(True)
plt.show()`},

/* -------------------------------------------------------------- 2.3 ---- */
'dem-basis': {
  title:'The rectangular basis function',
  what:'Builds $\\psi(t)=1/\\sqrt{T_b}$ on $[0,T_b]$ and prints $\\int\\psi^2$, the bit energy $E_b$, and the two signal points $s_0,s_1=\\mp\\sqrt{E_b}$.',
  try:'Set $A=2$ V. Predict the new $E_b$ and the new $s_0,s_1$ before you run it.',
  out:'int psi^2 = 1.000\nEb = 0.001000 J\ns0 = -0.0316   s1 = 0.0316',
  m:`% psi(t) = 1/sqrt(Tb) on [0,Tb]: a unit-energy rectangular basis function
Tb = 1e-3; A = 1;
dt = Tb/2000; t = 0:dt:Tb;
psi = ones(size(t)) / sqrt(Tb);

Eb = A^2*Tb;
s0 = -sqrt(Eb); s1 = sqrt(Eb);
fprintf('int psi^2 = %.3f\\n', trapz(t, psi.^2))
fprintf('Eb = %.6f J\\n', Eb)
fprintf('s0 = %.4f   s1 = %.4f\\n', s0, s1)

plot(t/Tb, s0*psi, t/Tb, s1*psi, 'LineWidth', 1.5), grid on
xlabel('t/T_b'), legend('s_0(t)', 's_1(t)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# psi(t) = 1/sqrt(Tb) on [0,Tb]: a unit-energy rectangular basis function
Tb, A = 1e-3, 1
dt = Tb/2000
t = np.arange(0, Tb+dt/2, dt)
psi = np.ones_like(t) / np.sqrt(Tb)

Eb = A**2*Tb
s0, s1 = -np.sqrt(Eb), np.sqrt(Eb)
print(f'int psi^2 = {np.trapezoid(psi**2, t):.3f}')
print(f'Eb = {Eb:.6f} J')
print(f's0 = {s0:.4f}   s1 = {s1:.4f}')

plt.plot(t/Tb, s0*psi, t/Tb, s1*psi, linewidth=1.5)
plt.xlabel(r'$t/T_b$'); plt.legend([r'$s_0(t)$', r'$s_1(t)$']); plt.grid(True)
plt.show()`},

'dem-two': {
  title:'Correlator against matched filter, two basis shapes',
  what:'Runs one noiseless bit $s_m=+\\sqrt{E_b}$ through a correlator and a matched filter, for a rectangular and a half-sine $\\psi$, and prints both outputs at $T_b/2$ and $T_b$.',
  try:'Predict which basis shape gives a smaller filter output at $t=T_b/2$, before you run it.',
  out:'rectangular   corr(Tb/2) = 0.500   mf(Tb/2) = 0.500   corr(Tb) = 1.000   mf(Tb) = 1.000\nhalf sine     corr(Tb/2) = 0.500   mf(Tb/2) = 0.318   corr(Tb) = 1.000   mf(Tb) = 1.000',
  m:`% One isolated bit x(t) = psi(t), Eb = 1, Tb = 1: correlator vs. matched filter
Tb = 1; N = 4000; dt = Tb/N; t = (0:N-1)*dt + dt/2;
names = {'rectangular', 'half sine'};
psis  = { ones(size(t)), sqrt(2/Tb)*sin(pi*t/Tb) };

for k = 1:2
    psi = psis{k}; x = psi;
    c = cumsum(x .* psi) * dt;                          % correlator c(t)
    h = psi(end:-1:1);                                  % matched filter
    y = conv(x, h) * dt;
    half = round(N/2); full = N;
    fprintf('%-13s corr(Tb/2) = %.3f   mf(Tb/2) = %.3f   corr(Tb) = %.3f   mf(Tb) = %.3f\\n', ...
             names{k}, c(half), y(half), c(full), y(full))
end

plot(t, psis{2}.^2, 'LineWidth', 1.5), grid on
xlabel('t'), ylabel('\\psi(t)^2, half sine')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# One isolated bit x(t) = psi(t), Eb = 1, Tb = 1: correlator vs. matched filter
Tb, N = 1, 4000
dt = Tb/N
t = np.arange(N)*dt + dt/2
names = ['rectangular', 'half sine']
psis = [np.ones_like(t), np.sqrt(2/Tb)*np.sin(np.pi*t/Tb)]
for name, psi in zip(names, psis):
    c = np.cumsum(psi * psi) * dt                         # correlator c(t)
    y = np.convolve(psi, psi[::-1]) * dt                  # matched filter
    half, full = N//2 - 1, N - 1
    print(f'{name:<13} corr(Tb/2) = {c[half]:.3f}   mf(Tb/2) = {y[half]:.3f}   '
          f'corr(Tb) = {c[full]:.3f}   mf(Tb) = {y[full]:.3f}')

plt.plot(t, psis[1]**2, linewidth=1.5)
plt.xlabel(r'$t$'); plt.ylabel(r'$\\psi(t)^2$, half sine'); plt.grid(True)
plt.show()`},

'dem-var': {
  title:'The variance of the noise term',
  what:'Discretises the correlator noise $n=\\int_0^{T_b}w(t)\\psi(t)\\,dt$ and prints its variance $\\tfrac{N_0}{2}\\sum\\psi_k^2\\Delta t$ for both basis shapes.',
  try:'Halve $N_0$. Predict the new variance and the new $\\sigma$ before you run it.',
  out:'rectangular   Var(n) = 0.0500   sigma = 0.2236\nhalf sine     Var(n) = 0.0500   sigma = 0.2236',
  m:`% n = int w(t) psi(t) dt, white noise: Var(n) = (N0/2) sum psi_k^2 dt
N0 = 0.1; Tb = 1; N = 1000; dt = Tb/N; t = (0:N-1)*dt + dt/2;
names = {'rectangular', 'half sine'};
psis  = { ones(size(t)), sqrt(2/Tb)*sin(pi*t/Tb) };

for k = 1:2
    psi = psis{k};
    varn = (N0/2) * sum(psi.^2) * dt;
    fprintf('%-13s Var(n) = %.4f   sigma = %.4f\\n', names{k}, varn, sqrt(N0/2))
end

plot(t, psis{1}.^2, t, psis{2}.^2, 'LineWidth', 1.5), grid on
xlabel('t'), legend('rectangular', 'half sine')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# n = int w(t) psi(t) dt, white noise: Var(n) = (N0/2) sum psi_k^2 dt
N0, Tb, N = 0.1, 1, 1000
dt = Tb/N
t = np.arange(N)*dt + dt/2
names = ['rectangular', 'half sine']
psis = [np.ones_like(t), np.sqrt(2/Tb)*np.sin(np.pi*t/Tb)]

for name, psi in zip(names, psis):
    varn = (N0/2) * np.sum(psi**2) * dt
    print(f'{name:<13} Var(n) = {varn:.4f}   sigma = {np.sqrt(N0/2):.4f}')

plt.plot(t, psis[0]**2, t, psis[1]**2, linewidth=1.5)
plt.xlabel(r'$t$'); plt.legend(['rectangular', 'half sine']); plt.grid(True)
plt.show()`},

/* -------------------------------------------------------------- 2.4 ---- */
'dec-example': {
  title:'The optimal threshold with unequal priors',
  what:'Finds $\\lambda_{\\mathrm{opt}}=\\tfrac{N_0}{4\\sqrt{E_b}}\\ln\\tfrac{P(s_0)}{P(s_1)}$ and prints both error terms and $P_e$, against $P_e$ at $\\lambda=0$.',
  try:'Set $P(s_1)=0.5$. Predict whether $\\lambda_{\\mathrm{opt}}$ moves toward zero.',
  out:'lambda_opt = 0.0212\nP(err|s0) = 2.475e-06\nP(err|s1) = 6.005e-06\nPe = 3.534e-06\nPe at lambda=0 = 3.872e-06',
  m:`% Q(x) = 0.5 erfc(x/sqrt(2)); MAP threshold for unequal priors P(s0), P(s1)
Eb = 1; N0 = 0.1; P0 = 0.7; P1 = 0.3;
Q = @(x) 0.5*erfc(x/sqrt(2));
sigma = sqrt(N0/2);

lam = N0/(4*sqrt(Eb)) * log(P0/P1);
pe0 = Q((lam + sqrt(Eb))/sigma);
pe1 = Q((sqrt(Eb) - lam)/sigma);
Pe  = P0*pe0 + P1*pe1;
Pe0 = P0*Q(sqrt(Eb)/sigma) + P1*Q(sqrt(Eb)/sigma);
fprintf('lambda_opt = %.4f\\n', lam)
fprintf('P(err|s0) = %.3e\\n', pe0)
fprintf('P(err|s1) = %.3e\\n', pe1)
fprintf('Pe = %.3e\\n', Pe)
fprintf('Pe at lambda=0 = %.3e\\n', Pe0)

y = linspace(-2, 2, 900);
f0 = P0 * exp(-(y+sqrt(Eb)).^2/(2*sigma^2)) / sqrt(2*pi*sigma^2);
f1 = P1 * exp(-(y-sqrt(Eb)).^2/(2*sigma^2)) / sqrt(2*pi*sigma^2);
plot(y, f0, y, f1, 'LineWidth', 1.5), grid on
xlabel('y'), legend('P(s_0) f(y|s_0)', 'P(s_1) f(y|s_1)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt
from math import erfc, sqrt, log

# Q(x) = 0.5 erfc(x/sqrt(2)); MAP threshold for unequal priors P(s0), P(s1)
Eb, N0, P0, P1 = 1, 0.1, 0.7, 0.3
def Qf(x): return 0.5*erfc(x/sqrt(2))
sigma = sqrt(N0/2)
lam = N0/(4*sqrt(Eb)) * log(P0/P1)
pe0, pe1 = Qf((lam+sqrt(Eb))/sigma), Qf((sqrt(Eb)-lam)/sigma)
print(f'lambda_opt = {lam:.4f}')
print(f'P(err|s0) = {pe0:.3e}')
print(f'P(err|s1) = {pe1:.3e}')
print(f'Pe = {P0*pe0 + P1*pe1:.3e}')
print(f'Pe at lambda=0 = {Qf(sqrt(Eb)/sigma):.3e}')
y = np.linspace(-2, 2, 900)
f0 = P0 * np.exp(-(y+sqrt(Eb))**2/(2*sigma**2)) / np.sqrt(2*np.pi*sigma**2)
f1 = P1 * np.exp(-(y-sqrt(Eb))**2/(2*sigma**2)) / np.sqrt(2*np.pi*sigma**2)
plt.plot(y, f0, y, f1, linewidth=1.5)
plt.xlabel(r'$y$'); plt.legend([r'$P(s_0)f(y|s_0)$', r'$P(s_1)f(y|s_1)$']); plt.grid(True)
plt.show()`},

'dec-curve': {
  title:'The bit-error probability curve',
  what:'Tabulates $P_b=Q(\\sqrt{2E_b/N_0})$ at $E_b/N_0=0,2,\\dots,12$ dB, the antipodal error probability against SNR per bit.',
  try:'Predict $P_b$ at 14 dB before you run it, continuing the trend.',
  out:'Eb/N0 =  0 dB   Pb = 7.865e-02\nEb/N0 =  2 dB   Pb = 3.751e-02\nEb/N0 =  4 dB   Pb = 1.250e-02\nEb/N0 =  6 dB   Pb = 2.388e-03\nEb/N0 =  8 dB   Pb = 1.909e-04\nEb/N0 = 10 dB   Pb = 3.872e-06\nEb/N0 = 12 dB   Pb = 9.006e-09',
  m:`% Pb = Q(sqrt(2 Eb/N0)) for antipodal signalling, Eb/N0 in dB
Q = @(x) 0.5*erfc(x/sqrt(2));
ebn0_db = 0:2:12;
Pb = zeros(size(ebn0_db));
for k = 1:length(ebn0_db)
    ebn0 = 10^(ebn0_db(k)/10);
    Pb(k) = Q(sqrt(2*ebn0));
    fprintf('Eb/N0 = %2d dB   Pb = %.3e\\n', ebn0_db(k), Pb(k))
end

semilogy(ebn0_db, Pb, 'o-', 'LineWidth', 1.5), grid on
xlabel('E_b/N_0 (dB)'), ylabel('P_b')`,
  py:`import numpy as np
import matplotlib.pyplot as plt
from math import erfc, sqrt

# Pb = Q(sqrt(2 Eb/N0)) for antipodal signalling, Eb/N0 in dB
def Qf(x): return 0.5*erfc(x/sqrt(2))
ebn0_db = range(0, 13, 2)
Pb = []
for db in ebn0_db:
    ebn0 = 10**(db/10)
    p = Qf(sqrt(2*ebn0))
    Pb.append(p)
    print(f'Eb/N0 = {db:2d} dB   Pb = {p:.3e}')

plt.semilogy(list(ebn0_db), Pb, 'o-', linewidth=1.5)
plt.xlabel(r'$E_b/N_0$ (dB)'); plt.ylabel(r'$P_b$'); plt.grid(True)
plt.show()`},

'dec-scan': {
  title:'Scanning the threshold for the minimum error',
  what:'Scans $\\lambda$ from $-0.2$ to $0.2$ and prints the $\\lambda$ that minimizes $P_e(\\lambda)$, next to $P_e$ at $\\lambda=0$.',
  try:'Predict, before you run it, whether the scanned minimum lands close to the formula value from the worked example.',
  out:'lambda at minimum = 0.0212\nminimum Pe = 3.534e-06\nPe(0)/Pe(lambda_opt) = 1.096',
  m:`% Scan lambda in steps of 1e-4 and find where Pe(lambda) is smallest
Eb = 1; N0 = 0.1; P0 = 0.7; P1 = 0.3;
Q = @(x) 0.5*erfc(x/sqrt(2));
sigma = sqrt(N0/2);
Pe_fn = @(lam) P0*Q((lam+sqrt(Eb))/sigma) + P1*Q((sqrt(Eb)-lam)/sigma);

lam = -0.2:1e-4:0.2;
Pe = arrayfun(Pe_fn, lam);
[Pemin, k] = min(Pe);
fprintf('lambda at minimum = %.4f\\n', lam(k))
fprintf('minimum Pe = %.3e\\n', Pemin)
fprintf('Pe(0)/Pe(lambda_opt) = %.3f\\n', Pe_fn(0)/Pemin)

plot(lam, log10(Pe), 'LineWidth', 1.5), grid on
xlabel('\\lambda'), ylabel('log_{10} P_e')`,
  py:`import numpy as np
import matplotlib.pyplot as plt
from math import erfc, sqrt

# Scan lambda in steps of 1e-4 and find where Pe(lambda) is smallest
Eb, N0, P0, P1 = 1, 0.1, 0.7, 0.3
def Qf(x): return 0.5*erfc(x/sqrt(2))
sigma = sqrt(N0/2)
def Pe_fn(lam): return P0*Qf((lam+sqrt(Eb))/sigma) + P1*Qf((sqrt(Eb)-lam)/sigma)

lam = np.arange(-0.2, 0.2+1e-9, 1e-4)
Pe = np.array([Pe_fn(l) for l in lam])
k = np.argmin(Pe)
print(f'lambda at minimum = {lam[k]:.4f}')
print(f'minimum Pe = {Pe[k]:.3e}')
print(f'Pe(0)/Pe(lambda_opt) = {Pe_fn(0)/Pe[k]:.3f}')

plt.plot(lam, np.log10(Pe), linewidth=1.5)
plt.xlabel(r'$\\lambda$'); plt.ylabel(r'$\\log_{10}P_e$'); plt.grid(True)
plt.show()`},

/* -------------------------------------------------------------- 2.5 ---- */
'isi-taps': {
  title:'Interference taps of an RC channel',
  what:'Passes polar NRZ through a first-order RC lowpass and prints the wanted sample $r(T_b)$ and the first three interference taps.',
  try:'Predict, before you run it, whether widening $B$ shrinks the interference taps.',
  out:'r(Tb) = 0.7921\nr(2Tb) = 0.1647\nr(3Tb) = 0.0342\nr(4Tb) = 0.0071\nsum m=1..50 = 0.2079',
  m:`% Single-pulse response of an RC channel, sampled at multiples of Tb
Tb = 1; BTb = 0.25; tau = 1/(2*pi*BTb);
r = @(t) (t<0).*0 + (t>=0 & t<=Tb).*(1-exp(-t/tau)) + ...
         (t>Tb).*((1-exp(-Tb/tau)).*exp(-(t-Tb)/tau));

fprintf('r(Tb) = %.4f\\n', r(Tb))
fprintf('r(2Tb) = %.4f\\n', r(2*Tb))
fprintf('r(3Tb) = %.4f\\n', r(3*Tb))
fprintf('r(4Tb) = %.4f\\n', r(4*Tb))
m = 1:50;
fprintf('sum m=1..50 = %.4f\\n', sum(r((m+1)*Tb)))

t = linspace(0, 5*Tb, 900);
n = 0:5;
plot(t, r(t), 'LineWidth', 1.5), hold on
plot(n*Tb, r(n*Tb), 'o'), hold off, grid on
xlabel('t/T_b'), ylabel('r(t)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# Single-pulse response of an RC channel, sampled at multiples of Tb
Tb, BTb = 1, 0.25
tau = 1/(2*np.pi*BTb)
def r(t):
    t = np.asarray(t, dtype=float)
    y = np.where(t > Tb, (1-np.exp(-Tb/tau))*np.exp(-(t-Tb)/tau), 1-np.exp(-t/tau))
    return np.where(t < 0, 0.0, y)

for k, tag in enumerate(['r(Tb)', 'r(2Tb)', 'r(3Tb)', 'r(4Tb)'], start=1):
    print(f'{tag} = {r([k*Tb])[0]:.4f}')
m = np.arange(1, 51)
print(f'sum m=1..50 = {np.sum(r((m+1)*Tb)):.4f}')
t = np.linspace(0, 5*Tb, 900)
n = np.arange(6)
plt.plot(t, r(t), linewidth=1.5)
plt.plot(n*Tb, r(n*Tb), 'o')
plt.xlabel(r'$t/T_b$'); plt.ylabel(r'$r(t)$'); plt.grid(True)
plt.show()`},

'isi-eye': {
  title:'The eye opening from every bit pattern',
  what:'Builds the sample at $t=T_b$ of the last bit for every 8-bit polar pattern and prints the smallest and largest sample landing on a \'1\'.',
  try:'Predict, before you run it, which pattern gives the smallest sample of a \'1\'.',
  out:'smallest sample of a 1 = 0.5842\nlargest sample of a 1 = 1.0000',
  m:`% Eight bits, polar NRZ through an RC channel: sample at t = Tb of the last bit
Tb = 1; BTb = 0.25; tau = 1/(2*pi*BTb); Nb = 8;
r1 = 1 - exp(-Tb/tau);                       % wanted sample r(Tb)
taps = r1 * exp(-2*pi*BTb*(1:Nb-1));         % interference taps r(2Tb)..r(NbTb)

smallest = r1 - sum(taps);                   % all Nb-1 earlier bits at -1
largest  = r1 + sum(taps);                   % all Nb-1 earlier bits at +1
fprintf('smallest sample of a 1 = %.4f\\n', smallest)
fprintf('largest sample of a 1 = %.4f\\n', largest)

t = linspace(0, Tb, 200);
r = @(t) (t>=0 & t<=Tb).*(1-exp(-t/tau));
plot(t, r(t), 'LineWidth', 1.5), grid on
xlabel('t'), ylabel('r(t), last-bit interval')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# Eight bits, polar NRZ through an RC channel: sample at t = Tb of the last bit
Tb, BTb, Nb = 1, 0.25, 8
tau = 1/(2*np.pi*BTb)
r1 = 1 - np.exp(-Tb/tau)                     # wanted sample r(Tb)
taps = r1 * np.exp(-2*np.pi*BTb*np.arange(1, Nb))   # interference taps r(2Tb)..r(NbTb)

smallest = r1 - np.sum(taps)                 # all Nb-1 earlier bits at -1
largest = r1 + np.sum(taps)                  # all Nb-1 earlier bits at +1
print(f'smallest sample of a 1 = {smallest:.4f}')
print(f'largest sample of a 1 = {largest:.4f}')

t = np.linspace(0, Tb, 200)
plt.plot(t, 1 - np.exp(-t/tau), linewidth=1.5)
plt.xlabel(r'$t$'); plt.ylabel(r'$r(t)$, last-bit interval'); plt.grid(True)
plt.show()`},

'isi-bandwidth': {
  title:'Eye opening against channel bandwidth',
  what:'Prints the eye half-opening $1-2e^{-2\\pi BT_b}$ over five values of $BT_b$ and the value where the eye closes.',
  try:'Predict the sign of the opening at $BT_b=0.1$ before you run it.',
  out:'BTb = 0.1   opening = -0.0670\nBTb = 0.2   opening =  0.4308\nBTb = 0.3   opening =  0.6963\nBTb = 0.5   opening =  0.9136\nBTb = 1.0   opening =  0.9963\nBTb at closure = 0.1103',
  m:`% Eye half-opening for polar NRZ through an RC channel: 1 - 2*exp(-2*pi*BTb)
BTb_list = [0.1 0.2 0.3 0.5 1.0];
for BTb = BTb_list
    opening = 1 - 2*exp(-2*pi*BTb);
    fprintf('BTb = %.1f   opening = %7.4f\\n', BTb, opening)
end
fprintf('BTb at closure = %.4f\\n', log(2)/(2*pi))

BTb = linspace(0.05, 1.2, 300);
plot(BTb, 1 - 2*exp(-2*pi*BTb), 'LineWidth', 1.5), grid on
xlabel('BT_b'), ylabel('eye half-opening')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# Eye half-opening for polar NRZ through an RC channel: 1 - 2*exp(-2*pi*BTb)
BTb_list = [0.1, 0.2, 0.3, 0.5, 1.0]
for BTb in BTb_list:
    opening = 1 - 2*np.exp(-2*np.pi*BTb)
    print(f'BTb = {BTb:.1f}   opening = {opening:7.4f}')
print(f'BTb at closure = {np.log(2)/(2*np.pi):.4f}')

BTb = np.linspace(0.05, 1.2, 300)
plt.plot(BTb, 1 - 2*np.exp(-2*np.pi*BTb), linewidth=1.5)
plt.xlabel(r'$BT_b$'); plt.ylabel(r'eye half-opening'); plt.grid(True)
plt.show()`},

/* -------------------------------------------------------------- 2.6 ---- */
'nyq-tiling': {
  title:'The Nyquist tiling test',
  what:'Sums shifted copies $R_b\\sum_n P(f-nR_b)$ of the raised-cosine spectrum for three roll-offs and prints the largest deviation from 1.',
  try:'Predict, before you run it, whether $\\alpha=1$ gives a larger or smaller deviation than $\\alpha=0.5$.',
  out:'alpha = 0.0   max deviation = 0.000\nalpha = 0.5   max deviation = 0.000\nalpha = 1.0   max deviation = 0.000',
  m:`% Raised-cosine spectrum, one lobe: flat inside f1, a raised-cosine roll-off outside
Rb = 1; W = Rb/2; f = linspace(-0.499, 0.499, 999);
rc = @(f, a) (abs(f)<=(1-a)*W)/(2*W) + (abs(f)>(1-a)*W & abs(f)<(1+a)*W) .* ...
      (1/(4*W)) .* (1 - sin(pi*(abs(f)-W)./max(2*a*W,eps)));

for a = [0 0.5 1.0]
    s = zeros(size(f));
    for n = -3:3, s = s + rc(f - n*Rb, a); end
    fprintf('alpha = %.1f   max deviation = %.3f\\n', a, max(abs(s*Rb - 1)))
end

a = 0.5;
P1 = rc(f, a); P2 = rc(f - Rb, a); P3 = rc(f + Rb, a);
plot(f, P1, f, P2, f, P3, f, P1+P2+P3, '--', 'LineWidth', 1.3), grid on
xlabel('f/R_b')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# Raised-cosine spectrum, one lobe: flat inside f1, a raised-cosine roll-off outside
Rb, W = 1, 0.5
def rc(f, a):
    f1 = (1-a)*W; af = np.abs(f)
    flat = (af <= f1) / (2*W)
    roll = ((af > f1) & (af < 2*W - f1)) * (1/(4*W)) * (1 - np.sin(np.pi*(af-W)/max(2*a*W, 1e-300)))
    return flat + roll

f = np.linspace(-0.499, 0.499, 999)
for a in [0, 0.5, 1.0]:
    s = sum(rc(f - n*Rb, a) for n in range(-3, 4))
    print(f'alpha = {a:.1f}   max deviation = {np.max(np.abs(s*Rb - 1)):.3f}')

a = 0.5
P1, P2, P3 = rc(f, a), rc(f - Rb, a), rc(f + Rb, a)
plt.plot(f, P1, f, P2, f, P3, f, P1+P2+P3, '--', linewidth=1.3)
plt.xlabel(r'$f/R_b$'); plt.grid(True)
plt.show()`},

'nyq-zeros': {
  title:'Zero crossings and decay of the raised-cosine pulse',
  what:'Prints $p(kT_b)$ for $k=0,\\dots,4$ at $\\alpha=0.5$, then $|p(3.5T_b)|$ at three roll-offs to show the faster decay a larger $\\alpha$ gives.',
  try:'Predict, before you run it, which roll-off gives the smallest $|p(3.5T_b)|$.',
  out:'p(0Tb) = 1.000\np(1Tb) = 0.000\np(2Tb) = 0.000\np(3Tb) = 0.000\np(4Tb) = 0.000\n|p(3.5Tb)|, alpha=0.0 = 0.0909\n|p(3.5Tb)|, alpha=0.5 = 0.0057\n|p(3.5Tb)|, alpha=1.0 = 0.0000',
  m:`% Raised-cosine pulse p(t); away from its singular points t = +/-Tb/(2a)
Tb = 1; W = 1/(2*Tb);
denfix = @(d) d + (abs(d)<1e-9)*1e-9;        % keeps sign, only nudges near-zero
p = @(t, a) sinc_m(2*W*t) .* cos(2*pi*a*W*t) ./ denfix(1 - 16*a^2*W^2*t.^2);
for k = 0:4
    v = abs(p(k*Tb, 0.5));
    if v < 5e-4, v = 0; end
    fprintf('p(%dTb) = %.3f\\n', k, v)
end
for a = [0 0.5 1.0]
    fprintf('|p(3.5Tb)|, alpha=%.1f = %.4f\\n', a, abs(p(3.5*Tb, a)))
end
t = linspace(-4, 4, 900)*Tb;
plot(t/Tb, p(t,0), t/Tb, p(t,0.5), t/Tb, p(t,1.0), 'LineWidth', 1.3), grid on
xlabel('t/T_b'), legend('\\alpha=0', '\\alpha=0.5', '\\alpha=1')

function y = sinc_m(x)
    y = ones(size(x)); k = x ~= 0;
    y(k) = sin(pi*x(k)) ./ (pi*x(k));
end`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# Raised-cosine pulse p(t); away from its singular points t = +/-Tb/(2a)
Tb, W = 1, 0.5
def p(t, a):
    t = np.asarray(t, dtype=float)
    d = 1 - 16*a**2*W**2*t**2
    return np.sinc(2*W*t) * np.cos(2*np.pi*a*W*t) / np.where(np.abs(d) < 1e-9, 1e-9, d)

for k in range(5):
    v = abs(p([k*Tb], 0.5)[0])
    if v < 5e-4: v = 0.0
    print(f'p({k}Tb) = {v:.3f}')
for a in [0, 0.5, 1.0]:
    print(f'|p(3.5Tb)|, alpha={a:.1f} = {abs(p([3.5*Tb], a)[0]):.4f}')

t = np.linspace(-4, 4, 900)*Tb
plt.plot(t/Tb, p(t,0), t/Tb, p(t,0.5), t/Tb, p(t,1.0), linewidth=1.3)
plt.xlabel(r'$t/T_b$'); plt.legend([r'$\\alpha=0$', r'$\\alpha=0.5$', r'$\\alpha=1$']); plt.grid(True)
plt.show()`},

'nyq-bandwidth': {
  title:'Transmission bandwidth and the fastest rate in a fixed channel',
  what:'Prints $W=R_b/2$ and $B_T=(1+\\alpha)W$ at four roll-offs for $R_b=20$ kb/s, then the fastest rate a 12 kHz channel carries at $\\alpha=0.2$.',
  try:'Predict, before you run it, the bit rate at $\\alpha=0$ in a 12 kHz channel.',
  out:'W = 10.0 kHz\nBT, alpha=0.00 = 10.0 kHz\nBT, alpha=0.25 = 12.5 kHz\nBT, alpha=0.50 = 15.0 kHz\nBT, alpha=1.00 = 20.0 kHz\nfastest Rb in 12 kHz channel, alpha=0.2 = 20.0 kb/s',
  m:`% BT = (1+alpha)*W is the transmission bandwidth of a raised-cosine system
Rb = 20e3; W = Rb/2;
fprintf('W = %.1f kHz\\n', W/1e3)
alphas = [0 0.25 0.5 1.0];
for a = alphas
    fprintf('BT, alpha=%.2f = %.1f kHz\\n', a, (1+a)*W/1e3)
end

a = 0.2; BT = 12e3;
Rb2 = 2*BT/(1+a);
fprintf('fastest Rb in 12 kHz channel, alpha=0.2 = %.1f kb/s\\n', Rb2/1e3)

plot(alphas, (1+alphas)*W/1e3, 'o-', 'LineWidth', 1.5), grid on
xlabel('\\alpha'), ylabel('B_T (kHz)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# BT = (1+alpha)*W is the transmission bandwidth of a raised-cosine system
Rb = 20e3
W = Rb/2
print(f'W = {W/1e3:.1f} kHz')
alphas = [0, 0.25, 0.5, 1.0]
for a in alphas:
    print(f'BT, alpha={a:.2f} = {(1+a)*W/1e3:.1f} kHz')

a, BT = 0.2, 12e3
Rb2 = 2*BT/(1+a)
print(f'fastest Rb in 12 kHz channel, alpha=0.2 = {Rb2/1e3:.1f} kb/s')

alphas_a = np.array(alphas)
plt.plot(alphas_a, (1+alphas_a)*W/1e3, 'o-', linewidth=1.5)
plt.xlabel(r'$\\alpha$'); plt.ylabel(r'$B_T$ (kHz)'); plt.grid(True)
plt.show()`}

};
