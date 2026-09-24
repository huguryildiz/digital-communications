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
  'm2-code-matched':  ['mf-rect', 'mf-instant', 'mf-shapes'],
  'm2-code-demod':    ['dem-basis', 'dem-two', 'dem-var'],
  'm2-code-decision': ['dec-example', 'dec-curve', 'dec-scan'],
  'm2-code-isi':      ['isi-taps', 'isi-eye', 'isi-bandwidth'],
  'm2-code-nyquist':  ['nyq-tiling', 'nyq-zeros', 'nyq-bandwidth']
};

const CODE_M2 = {

/* -------------------------------------------------------------- 2.1 ---- */
'mf-rect': {
  title:'The matched filter output of a rectangular pulse',
  what:'Filters $s(t)=A$ on $0\\le t\\le T$ with its matched filter $h(t)=s(T-t)$ and prints the peak output and $(\\mathrm{SNR})_o=2E/N_0$.',
  try:'Double $A$. Predict the new energy $E$ and the new $(\\mathrm{SNR})_o$ in dB before you run it.',
  out:'E = 0.004000 J\ny(T) = 0.004000\n2E/N0 = 80.00 = 19.03 dB',
  m:`% s(t) = A on [0,T], matched filter h(t) = s(T-t): convolve on a fine grid
A = 2; T = 1e-3; N0 = 1e-4; N = 1000;
dt = T/N;
t  = (0:N-1)*dt;                            % N samples over [0,T)
s  = A*ones(size(t));
h  = A*ones(size(t));                       % s(T-t) is the same rectangle
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

# s(t) = A on [0,T], matched filter h(t) = s(T-t): convolve on a fine grid
A, T, N0, N = 2, 1e-3, 1e-4, 1000
dt = T/N
t = np.arange(N)*dt                         # N samples over [0,T)
s = A*np.ones_like(t)
h = A*np.ones_like(t)                       # s(T-t) is the same rectangle
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
  what:'Samples the same matched filter output before $t=T$ and prints the drop in $(\\mathrm{SNR})_o$ at each earlier instant.',
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
  what:'Scales a rectangle, a half sine, and a triangle to the same energy $E=0.004$ J and matches each: all three peak at $t=T$ with the same $(\\mathrm{SNR})_o$.',
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

/* -------------------------------------------------------------- 2.2 ---- */
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

/* -------------------------------------------------------------- 2.3 ---- */
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

/* -------------------------------------------------------------- 2.4 ---- */
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

/* -------------------------------------------------------------- 2.5 ---- */
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
