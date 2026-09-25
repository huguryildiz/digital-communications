/* ==========================================================================
   Code for Module 5: programs in MATLAB and Python
   One entry a program, keyed by a short name. Each program draws a figure
   from the section (a waveform, a constellation, a set of curves) and prints
   the number the section computes, with the same wording in both languages,
   so `out` is one text for both. MATLAB uses no toolbox; Python uses NumPy
   and Matplotlib only.
   Noise is drawn from `rand` with seed 1 (MATLAB `rng(1,'twister')`, NumPy
   `np.random.seed(1)`), which gives the same uniform numbers in both
   languages, and turned into Gaussian samples by the Box-Muller formula, so
   a random program prints the same text in both.
   The keys carry an `m5-` prefix because CODE_LIB is one flat object and
   Modules 1 and 3 already use names such as `pcm-gray` and `con-psk`.
   `title`, `what` and `try` are student text and go through md(); the code
   is plain text. Each section closes with a code page (`CODE_BANKS_M5`) that
   pages through its programs.
   verify/code_check.py runs every entry in both languages and compares what
   it prints with `out`.
   ========================================================================== */
const CODE_BANKS_M5 = {
  'm5-code-binary':  ['m5-bin-wave', 'm5-bin-iq', 'm5-bin-pe', 'm5-bin-mc'],
  'm5-code-psk':     ['m5-psk-dmin', 'm5-psk-gray', 'm5-psk-mc', 'm5-psk-dpsk'],
  'm5-code-qam':     ['m5-qam-energy', 'm5-qam-exact', 'm5-qam-mc', 'm5-qam-vs-psk'],
  'm5-code-fsk':     ['m5-fsk-rho', 'm5-fsk-bank', 'm5-fsk-orth', 'm5-fsk-noncoh'],
  'm5-code-compare': ['m5-cmp-bw', 'm5-cmp-plane', 'm5-cmp-psd', 'm5-cmp-adaptive', 'm5-cmp-link']
};

const CODE_M5 = {

/* -------------------------------------------------------------- 5.1 ---- */
'm5-bin-wave': {
  title:'Three binary waveforms for the same bits',
  what:'Keys the bits $1\\,0\\,1\\,1$ onto a $4$ Hz carrier by amplitude, by phase and by frequency, one bit a second. It prints the energy in each bit and the average energy per bit $E_b$ when $0$ and $1$ are equally likely.',
  try:'Raise the BASK amplitude from $2$ to $2\\sqrt2$. Predict its $E_b$ before you run it.',
  out:'bit       1      0      1      1     Eb\nBASK  2.000  0.000  2.000  2.000  1.000\nBPSK  1.000  1.000  1.000  1.000  1.000\nBFSK  1.000  1.000  1.000  1.000  1.000',
  m:`% Bits 1 0 1 1, one bit a second (T = 1), carrier 4 Hz
b = [1 0 1 1]; K = 400; dt = 1/K; t = ((1:4*K) - 0.5)*dt;
bt = b(ceil(t));                                 % the bit sent at time t
ask = 2*bt.*cos(2*pi*4*t);                       % on-off: a 1 has energy 2
psk = sqrt(2)*(2*bt - 1).*cos(2*pi*4*t);         % the sign of the carrier
fsk = sqrt(2)*cos(2*pi*(4 + 0.5*bt).*t);         % 4 Hz or 4.5 Hz
W = [ask; psk; fsk]; name = {'BASK', 'BPSK', 'BFSK'};
fprintf('bit       1      0      1      1     Eb\\n')
for k = 1:3
    E = sum(reshape(W(k,:).^2, K, 4))*dt;        % energy in each bit
    fprintf('%s %6.3f %6.3f %6.3f %6.3f %6.3f\\n', name{k}, E, mean(E(1:2)))
    subplot(3, 1, k), plot(t, W(k,:)), ylabel(name{k}), grid on
end
xlabel('t (s)')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Bits 1 0 1 1, one bit a second (T = 1), carrier 4 Hz
b = np.array([1, 0, 1, 1]); K = 400; dt = 1/K
t = (np.arange(1, 4*K+1) - 0.5)*dt
bt = b[np.ceil(t).astype(int) - 1]                # the bit sent at time t
ask = 2*bt*np.cos(2*np.pi*4*t)                    # on-off: a 1 has energy 2
psk = np.sqrt(2)*(2*bt - 1)*np.cos(2*np.pi*4*t)   # the sign of the carrier
fsk = np.sqrt(2)*np.cos(2*np.pi*(4 + 0.5*bt)*t)   # 4 Hz or 4.5 Hz
W = [ask, psk, fsk]; name = ['BASK', 'BPSK', 'BFSK']
print('bit       1      0      1      1     Eb')
fig, ax = plt.subplots(3, 1)
for k in range(3):
    E = np.sum(W[k].reshape(4, K)**2, axis=1)*dt  # energy in each bit
    print(name[k], ' '.join(f'{e:6.3f}' for e in E), f'{np.mean(E[:2]):6.3f}')
    ax[k].plot(t, W[k]); ax[k].set_ylabel(name[k]); ax[k].grid(True)
ax[2].set_xlabel(r'$t$ (s)')
plt.show()`},

'm5-bin-iq': {
  title:'QPSK through the IQ modulator',
  what:'Sends the pairs $00,01,11,10$ as $s(t)=I\\,\\psi_1(t)+Q\\,\\psi_2(t)$ with $\\psi_1=\\sqrt2\\cos 2\\pi f_ct$ and $\\psi_2=-\\sqrt2\\sin 2\\pi f_ct$. Two correlators take $I$ and $Q$ back out of each symbol, and the angle of $(I,Q)$ is the carrier phase.',
  try:'Change the pair $10$ to $(I,Q)=(-1,0)$. Predict the phase and the new length of that point before you run it.',
  out:'bits 00: r = ( 1.000,  1.000)   phase  45 deg\nbits 01: r = ( 1.000, -1.000)   phase 315 deg\nbits 11: r = (-1.000, -1.000)   phase 225 deg\nbits 10: r = (-1.000,  1.000)   phase 135 deg',
  m:`% QPSK: bit 0 -> +1, bit 1 -> -1 on each axis; T = 1, carrier 3 Hz
b = {'00', '01', '11', '10'}; I = [1 1 -1 -1]; Q = [1 -1 -1 1];
K = 400; dt = 1/K; t = ((1:4*K) - 0.5)*dt; n = ceil(t);   % n: symbol at t
psi1 = sqrt(2)*cos(2*pi*3*t); psi2 = -sqrt(2)*sin(2*pi*3*t);
s = I(n).*psi1 + Q(n).*psi2;                 % the IQ modulator
for m = 1:4
    on = n == m;                             % the samples of symbol m
    r1 = sum(s(on).*psi1(on))*dt; r2 = sum(s(on).*psi2(on))*dt;
    ph = mod(atan2(r2, r1)*180/pi, 360);     % the angle of (r1, r2)
    fprintf('bits %s: r = (%6.3f, %6.3f)   phase %3.0f deg\\n', b{m}, r1, r2, ph)
end
subplot(1, 3, [1 2]), plot(t, s), grid on, xlabel('t (s)'), ylabel('s(t)')
subplot(1, 3, 3), plot(I, Q, 'o', 'MarkerSize', 8), text(I + 0.15, Q, b)
axis([-2 2 -2 2]), axis square, grid on, xlabel('I'), ylabel('Q')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# QPSK: bit 0 -> +1, bit 1 -> -1 on each axis; T = 1, carrier 3 Hz
b = ['00', '01', '11', '10']
I, Q = np.array([1, 1, -1, -1]), np.array([1, -1, -1, 1])
K = 400; dt = 1/K; t = (np.arange(1, 4*K+1) - 0.5)*dt
n = np.ceil(t).astype(int) - 1                # the symbol sent at time t
psi1, psi2 = np.sqrt(2)*np.cos(2*np.pi*3*t), -np.sqrt(2)*np.sin(2*np.pi*3*t)
s = I[n]*psi1 + Q[n]*psi2                     # the IQ modulator
for m in range(4):
    on = n == m                               # the samples of symbol m
    r1, r2 = np.sum(s[on]*psi1[on])*dt, np.sum(s[on]*psi2[on])*dt
    ph = np.degrees(np.arctan2(r2, r1)) % 360 # the angle of (r1, r2)
    print(f'bits {b[m]}: r = ({r1:6.3f}, {r2:6.3f})   phase {ph:3.0f} deg')
plt.subplot(1, 3, (1, 2)); plt.plot(t, s); plt.grid(True)
plt.xlabel(r'$t$ (s)'); plt.ylabel(r'$s(t)$')
plt.subplot(1, 3, 3); plt.plot(I, Q, 'o', markersize=8)
for m in range(4): plt.text(I[m] + 0.15, Q[m], b[m])
plt.axis([-2, 2, -2, 2]); plt.gca().set_aspect('equal'); plt.grid(True)
plt.xlabel(r'$I$'); plt.ylabel(r'$Q$')
plt.show()`},

'm5-bin-pe': {
  title:'Bit error probability of BPSK and BFSK',
  what:'Prints $P_b=Q\\big(\\sqrt{2E_b/N_0}\\big)$ for BPSK and $P_b=Q\\big(\\sqrt{E_b/N_0}\\big)$ for coherent BFSK, then finds the $E_b/N_0$ at which each reaches $10^{-5}$. BASK has the same distance as BFSK, so it shares the BFSK curve.',
  try:'Change the target from $10^{-5}$ to $10^{-3}$. Predict whether the gap between the two schemes changes before you run it.',
  out:'Eb/N0 (dB)   BPSK       BFSK\n     0       7.86e-02   1.59e-01\n     3       2.29e-02   7.89e-02\n     6       2.39e-03   2.30e-02\n     9       3.36e-05   2.41e-03\n    12       9.01e-09   3.43e-05\nPb = 1e-5 at 9.59 dB (BPSK) and 12.60 dB (BFSK): 3.01 dB apart',
  m:`% Bit error probability of BPSK and of coherent BFSK against Eb/N0
Q = @(x) 0.5*erfc(x/sqrt(2));                % the Gaussian tail
fprintf('Eb/N0 (dB)   BPSK       BFSK\\n')
for db = 0:3:12
    g = 10^(db/10);                          % Eb/N0 as a ratio
    fprintf('%6d       %.2e   %.2e\\n', db, Q(sqrt(2*g)), Q(sqrt(g)))
end
d = (0:15000)/1000; g = 10.^(d/10);          % a fine grid, 0 to 15 dB
i = find(Q(sqrt(2*g)) <= 1e-5, 1); j = find(Q(sqrt(g)) <= 1e-5, 1);
fprintf('Pb = 1e-5 at %.2f dB (BPSK) and %.2f dB (BFSK): %.2f dB apart\\n', ...
        d(i), d(j), d(j) - d(i))
semilogy(d, Q(sqrt(2*g)), d, Q(sqrt(g)), 'LineWidth', 1.5), grid on
yline(1e-5, '--'), ylim([1e-8 1]), xlabel('E_b/N_0 (dB)'), ylabel('P_b')
legend('BPSK', 'BFSK and BASK')`,
  py:`import numpy as np, matplotlib.pyplot as plt
from math import erfc
# Bit error probability of BPSK and of coherent BFSK against Eb/N0
Q = np.vectorize(lambda x: 0.5*erfc(x/np.sqrt(2)))   # the Gaussian tail
print('Eb/N0 (dB)   BPSK       BFSK')
for db in range(0, 13, 3):
    g = 10**(db/10)                                  # Eb/N0 as a ratio
    print(f'{db:6d}       {Q(np.sqrt(2*g)):.2e}   {Q(np.sqrt(g)):.2e}')
d = np.arange(15001)/1000; g = 10**(d/10)            # a fine grid, 0 to 15 dB
pb, pf = Q(np.sqrt(2*g)), Q(np.sqrt(g))
i, j = np.argmax(pb <= 1e-5), np.argmax(pf <= 1e-5)  # the first grid point below
print(f'Pb = 1e-5 at {d[i]:.2f} dB (BPSK) and {d[j]:.2f} dB (BFSK):',
      f'{d[j] - d[i]:.2f} dB apart')
plt.semilogy(d, pb, d, pf, linewidth=1.5); plt.axhline(1e-5, linestyle='--')
plt.ylim(1e-8, 1); plt.grid(True)
plt.xlabel(r'$E_b/N_0$ (dB)'); plt.ylabel(r'$P_b$')
plt.legend(['BPSK', 'BFSK and BASK'])
plt.show()`},

'm5-bin-mc': {
  title:'Counting BPSK errors in noise',
  what:'Sends $100\\,000$ BPSK bits, $\\pm1$ with $E_b=1$, through white noise at $E_b/N_0=6$ dB. It decides each bit by the sign of $r$, counts the wrong ones, and prints the count next to $Q\\big(\\sqrt{2E_b/N_0}\\big)$.',
  try:'Set $E_b/N_0=8$ dB. Predict roughly how many errors are left in $100\\,000$ bits before you run it.',
  out:'bit errors counted: 235 of 100000\nPb counted           = 2.35e-03\nPb = Q(sqrt(2Eb/N0)) = 2.39e-03',
  m:`% 100000 BPSK bits (+1 or -1, Eb = 1) at Eb/N0 = 6 dB
L = 100000; g = 10^(6/10); sigma = sqrt(1/(2*g));   % noise variance N0/2
Q = @(x) 0.5*erfc(x/sqrt(2));
rng(1, 'twister'); u = rand(1, 3*L);  % the same numbers as NumPy seed 1
b = u(1:L) > 0.5;                                   % the bits
n = sigma*sqrt(-2*log(u(L+1:2*L))).*cos(2*pi*u(2*L+1:end));   % Gaussian noise
r = (2*b - 1) + n;                                  % what the correlator gives
e = (r > 0) ~= b;                                   % r on the wrong side of 0
fprintf('bit errors counted: %d of %d\\n', sum(e), L)
fprintf('Pb counted           = %.2e\\n', mean(e))
fprintf('Pb = Q(sqrt(2Eb/N0)) = %.2e\\n', Q(sqrt(2*g)))
histogram(r(b), 80), hold on, histogram(r(~b), 80), xline(0, '--'), hold off
xlabel('r'), legend('bit 1 sent', 'bit 0 sent')`,
  py:`import numpy as np, matplotlib.pyplot as plt
from math import erfc, sqrt
# 100000 BPSK bits (+1 or -1, Eb = 1) at Eb/N0 = 6 dB
L = 100000; g = 10**(6/10); sigma = sqrt(1/(2*g))   # noise variance N0/2
def Q(x): return 0.5*erfc(x/sqrt(2))
np.random.seed(1); u = np.random.rand(3*L)  # the same numbers as MATLAB rng(1)
b = u[:L] > 0.5                                     # the bits
n = sigma*np.sqrt(-2*np.log(u[L:2*L]))*np.cos(2*np.pi*u[2*L:])   # Gaussian noise
r = (2*b - 1) + n                                   # what the correlator gives
e = (r > 0) != b                                    # r on the wrong side of 0
print(f'bit errors counted: {np.sum(e)} of {L}')
print(f'Pb counted           = {np.mean(e):.2e}')
print(f'Pb = Q(sqrt(2Eb/N0)) = {Q(sqrt(2*g)):.2e}')
plt.hist(r[b], 80, alpha=0.7, label='bit 1 sent')
plt.hist(r[~b], 80, alpha=0.7, label='bit 0 sent')
plt.axvline(0, linestyle='--'); plt.xlabel(r'$r$'); plt.legend()
plt.show()`},

/* -------------------------------------------------------------- 5.2 ---- */
'm5-psk-dmin': {
  title:'Minimum distance of M-PSK',
  what:'Puts $M$ points on a circle of energy $E_s=1$ and prints $d_{\\min}=2\\sin(\\pi/M)$ for $M=2$ to $32$. The last column is the extra $E_b/N_0$ that each doubling of $M$ costs at the same error probability.',
  try:'Predict, before you run it, whether going from $32$ to $64$ points costs more or less than $5$ dB.',
  out:' M   dmin    extra Eb/N0\n 2   2.000\n 4   1.414   0.00 dB\n 8   0.765   3.57 dB\n16   0.390   4.60 dB\n32   0.196   5.01 dB',
  m:`% M points on a circle of energy Es = 1; each doubling of M shrinks dmin
fprintf(' M   dmin    extra Eb/N0\\n')
for M = [2 4 8 16 32]
    d = 2*sin(pi/M); k = log2(M);              % dmin, and bits a symbol
    if M == 2
        fprintf('%2d   %.3f\\n', M, d)
    else                                       % same dmin needs Eb/N0 ~ 1/(k d^2)
        fprintf('%2d   %.3f   %.2f dB\\n', M, d, 10*log10(k0*d0^2/(k*d^2)))
    end
    d0 = d; k0 = k;
end
th = 2*pi*(0:7)/8; c = linspace(0, 2*pi, 200);
plot(cos(c), sin(c), ':', cos(th), sin(th), 'o', 'LineWidth', 1.5), hold on
plot(cos(th(1:2)), sin(th(1:2)), '-', 'LineWidth', 2), hold off
axis equal, grid on, xlabel('I'), ylabel('Q'), title('8-PSK and its d_{min}')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# M points on a circle of energy Es = 1; each doubling of M shrinks dmin
print(' M   dmin    extra Eb/N0')
for M in [2, 4, 8, 16, 32]:
    d, k = 2*np.sin(np.pi/M), np.log2(M)       # dmin, and bits a symbol
    if M == 2:
        print(f'{M:2d}   {d:.3f}')
    else:                                      # same dmin needs Eb/N0 ~ 1/(k d^2)
        print(f'{M:2d}   {d:.3f}   {10*np.log10(k0*d0**2/(k*d**2)):.2f} dB')
    d0, k0 = d, k
th = 2*np.pi*np.arange(8)/8; c = np.linspace(0, 2*np.pi, 200)
plt.plot(np.cos(c), np.sin(c), ':', np.cos(th), np.sin(th), 'o', linewidth=1.5)
plt.plot(np.cos(th[:2]), np.sin(th[:2]), '-', linewidth=2)
plt.gca().set_aspect('equal'); plt.grid(True)
plt.xlabel(r'$I$'); plt.ylabel(r'$Q$'); plt.title(r'8-PSK and its $d_{\\min}$')
plt.show()`},

'm5-psk-gray': {
  title:'Natural and Gray labels on 8-PSK',
  what:'Labels the eight points of 8-PSK in counting order and with the Gray code $i\\oplus(i\\gg1)$. It counts the bits that change between each point and the next one round the circle, where a symbol error almost always lands.',
  try:'Swap the Gray labels of points $2$ and $3$. Predict the new total before you run it.',
  out:'point      0    1    2    3    4    5    6    7\nnatural  000  001  010  011  100  101  110  111\nGray     000  001  011  010  110  111  101  100\nbits changed to the next point:\nnatural  1 2 1 3 1 2 1 3   total 14\nGray     1 1 1 1 1 1 1 1   total 8',
  m:`% 8-PSK: point i at angle 2*pi*i/8, natural label i, Gray label i XOR (i >> 1)
i = 0:7; g = bitxor(i, bitshift(i, -1));
ones3 = @(x) sum(dec2bin(x, 3) == '1', 2);           % how many 1s in each label
cn = ones3(bitxor(i, i([2:8 1])));                    % bits changed to the next point
cg = ones3(bitxor(g, g([2:8 1])));
fprintf('point  %s\\n', sprintf('%5d', i))
fprintf('natural  %s\\n', strjoin(cellstr(dec2bin(i, 3)), '  '))
fprintf('Gray     %s\\n', strjoin(cellstr(dec2bin(g, 3)), '  '))
fprintf('bits changed to the next point:\\n')
fprintf('natural  %s  total %d\\n', sprintf('%d ', cn), sum(cn))
fprintf('Gray     %s  total %d\\n', sprintf('%d ', cg), sum(cg))
x = cos(2*pi*i/8); y = sin(2*pi*i/8);
subplot(1, 2, 1), plot(x, y, 'o'), text(1.3*x - 0.15, 1.3*y, cellstr(dec2bin(i, 3)))
axis([-1.5 1.5 -1.5 1.5]), axis square, title('natural')
subplot(1, 2, 2), plot(x, y, 'o'), text(1.3*x - 0.15, 1.3*y, cellstr(dec2bin(g, 3)))
axis([-1.5 1.5 -1.5 1.5]), axis square, title('Gray')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# 8-PSK: point i at angle 2*pi*i/8, natural label i, Gray label i XOR (i >> 1)
i = np.arange(8); g = i ^ (i >> 1)
def ones3(x): return np.array([bin(v).count('1') for v in x])  # 1s in each label
cn = ones3(i ^ np.roll(i, -1))                        # bits changed to the next point
cg = ones3(g ^ np.roll(g, -1))
print('point  ' + ''.join(f'{v:5d}' for v in i))
print('natural  ' + '  '.join(f'{v:03b}' for v in i))
print('Gray     ' + '  '.join(f'{v:03b}' for v in g))
print('bits changed to the next point:')
print('natural ', *cn, '  total', cn.sum())
print('Gray    ', *cg, '  total', cg.sum())
x, y = np.cos(2*np.pi*i/8), np.sin(2*np.pi*i/8)
fig, ax = plt.subplots(1, 2)
for a, lab, name in [(ax[0], i, 'natural'), (ax[1], g, 'Gray')]:
    a.plot(x, y, 'o'); a.set_title(name); a.set_aspect('equal')
    for m in range(8): a.text(1.3*x[m] - 0.15, 1.3*y[m], f'{lab[m]:03b}')
    a.axis([-1.5, 1.5, -1.5, 1.5])
plt.show()`},

'm5-psk-mc': {
  title:'8-PSK in noise: symbol and bit errors',
  what:'Sends $100\\,000$ Gray-labelled 8-PSK symbols at $E_b/N_0=10$ dB and decides each by its angle. It prints the counted symbol and bit error rates next to $P_e\\approx2Q\\big(\\sqrt{2E_s/N_0}\\sin\\frac{\\pi}{8}\\big)$ and $P_b\\approx P_e/3$.',
  try:'Replace the Gray labels by natural ones, $e=m\\oplus d$. Predict whether the bit error rate rises or falls before you run it.',
  out:'symbol errors: 297 of 100000   bit errors: 297 of 300000\nSER counted = 2.97e-03   2Q(sqrt(2Es/N0) sin(pi/8)) = 3.03e-03\nBER counted = 9.90e-04   SER/3 = 1.01e-03',
  m:`% 8-PSK with Gray labels at Eb/N0 = 10 dB; Es = 1, so Es/N0 = 3 Eb/N0
M = 8; L = 100000; EsN0 = 3*10^(10/10); sigma = sqrt(1/(2*EsN0));
Q = @(x) 0.5*erfc(x/sqrt(2));
rng(1, 'twister'); u = rand(1, 3*L);  % the same numbers as NumPy seed 1
m = floor(M*u(1:L));                                  % symbol index 0 to 7
a = sqrt(-2*log(u(L+1:2*L))); c = 2*pi*u(2*L+1:end);  % Box-Muller
r = exp(1j*2*pi*m/M) + sigma*a.*(cos(c) + 1j*sin(c)); % received point, I + jQ
d = mod(round(angle(r)/(2*pi/M)), M);                 % the nearest angle wins
e = bitxor(bitxor(m, bitshift(m, -1)), bitxor(d, bitshift(d, -1)));  % Gray labels
nb = bitand(e, 1) + bitand(bitshift(e, -1), 1) + bitshift(e, -2);   % bits wrong
Pe = 2*Q(sqrt(2*EsN0)*sin(pi/M));
fprintf('symbol errors: %d of %d   bit errors: %d of %d\\n', ...
        sum(d ~= m), L, sum(nb), 3*L)
fprintf('SER counted = %.2e   2Q(sqrt(2Es/N0) sin(pi/8)) = %.2e\\n', mean(d ~= m), Pe)
fprintf('BER counted = %.2e   SER/3 = %.2e\\n', sum(nb)/(3*L), Pe/3)
w = d ~= m; plot(r(1:5000), '.'), hold on, plot(r(w), '.r'), hold off
axis equal, grid on, xlabel('I'), ylabel('Q'), legend('received', 'wrong symbol')`,
  py:`import numpy as np, matplotlib.pyplot as plt
from math import erfc, sqrt
# 8-PSK with Gray labels at Eb/N0 = 10 dB; Es = 1, so Es/N0 = 3 Eb/N0
M, L = 8, 100000; EsN0 = 3*10**(10/10); sigma = sqrt(1/(2*EsN0))
def Q(x): return 0.5*erfc(x/sqrt(2))
np.random.seed(1); u = np.random.rand(3*L)  # the same numbers as MATLAB rng(1)
m = np.floor(M*u[:L]).astype(int)                     # symbol index 0 to 7
a, c = np.sqrt(-2*np.log(u[L:2*L])), 2*np.pi*u[2*L:]  # Box-Muller
r = np.exp(1j*2*np.pi*m/M) + sigma*a*(np.cos(c) + 1j*np.sin(c))  # received point
d = np.round(np.angle(r)/(2*np.pi/M)).astype(int) % M  # the nearest angle wins
e = (m ^ (m >> 1)) ^ (d ^ (d >> 1))                   # Gray labels
nb = (e & 1) + ((e >> 1) & 1) + (e >> 2)              # bits wrong
Pe = 2*Q(sqrt(2*EsN0)*np.sin(np.pi/M))
print(f'symbol errors: {np.sum(d != m)} of {L}   bit errors: {np.sum(nb)} of {3*L}')
print(f'SER counted = {np.mean(d != m):.2e}   2Q(sqrt(2Es/N0) sin(pi/8)) = {Pe:.2e}')
print(f'BER counted = {np.sum(nb)/(3*L):.2e}   SER/3 = {Pe/3:.2e}')
w = d != m; plt.plot(r[:5000].real, r[:5000].imag, '.')
plt.plot(r[w].real, r[w].imag, '.r'); plt.gca().set_aspect('equal'); plt.grid(True)
plt.xlabel(r'$I$'); plt.ylabel(r'$Q$'); plt.legend(['received', 'wrong symbol'])
plt.show()`},

'm5-psk-dpsk': {
  title:'Differential encoding and a phase turn',
  what:'A bit $1$ turns the carrier phase by $\\pi$ and a bit $0$ keeps it. The channel then turns every symbol by $\\pi$, the ambiguity a receiver cannot see. Comparing each symbol with the one before still gives the bits. The last line compares DPSK, $P_b=\\tfrac12e^{-E_b/N_0}$, with coherent BPSK.',
  try:'Turn the channel by $\\pi/2$ instead, $y=jx$. Predict whether the comparison of neighbours still returns the bits before you run it.',
  out:'bits sent:        1  0  1  1  0  1  0  0\nsymbols sent:   +1 -1 -1 +1 -1 -1 +1 +1 +1\nafter the turn: -1 +1 +1 -1 +1 +1 -1 -1 -1\nbits decoded:     1  0  1  1  0  1  0  0\nEb/N0 = 10 dB: DPSK Pb = 2.27e-05   BPSK Pb = 3.87e-06',
  m:`% Differential BPSK: bit 1 turns the phase by pi, bit 0 keeps it
Q = @(x) 0.5*erfc(x/sqrt(2));
b = [1 0 1 1 0 1 0 0];
x = cumprod([1, 1 - 2*b]);               % +1 or -1, after a reference symbol +1
y = -x;                                  % the channel turns every phase by pi
z = y(2:end).*y(1:end-1) < 0;            % a sign change between neighbours is a 1
fprintf('bits sent:      %s\\n', sprintf('%3d', b))
fprintf('symbols sent:  %s\\n', sprintf('%+3d', x))
fprintf('after the turn:%s\\n', sprintf('%+3d', y))
fprintf('bits decoded:   %s\\n', sprintf('%3d', z))
g = 10^(10/10);
fprintf('Eb/N0 = 10 dB: DPSK Pb = %.2e   BPSK Pb = %.2e\\n', 0.5*exp(-g), Q(sqrt(2*g)))
subplot(1, 2, 1), stairs(0:8, pi*(x < 0), 'LineWidth', 1.5), hold on
stairs(0:8, pi*(y < 0), '--', 'LineWidth', 1.5), hold off, ylim([-0.5 4])
xlabel('symbol'), ylabel('phase (rad)'), legend('sent', 'received')
db = 0:0.1:12; g = 10.^(db/10);
subplot(1, 2, 2), semilogy(db, 0.5*exp(-g), db, Q(sqrt(2*g)), 'LineWidth', 1.5)
grid on, xlabel('E_b/N_0 (dB)'), ylabel('P_b'), legend('DPSK', 'BPSK')`,
  py:`import numpy as np, matplotlib.pyplot as plt
from math import erfc, exp
# Differential BPSK: bit 1 turns the phase by pi, bit 0 keeps it
Q = np.vectorize(lambda v: 0.5*erfc(v/np.sqrt(2)))
b = np.array([1, 0, 1, 1, 0, 1, 0, 0])
x = np.cumprod(np.r_[1, 1 - 2*b])        # +1 or -1, after a reference symbol +1
y = -x                                   # the channel turns every phase by pi
z = (y[1:]*y[:-1] < 0).astype(int)       # a sign change between neighbours is a 1
print('bits sent:      ' + ''.join(f'{v:3d}' for v in b))
print('symbols sent:  ' + ''.join(f'{v:+3d}' for v in x))
print('after the turn:' + ''.join(f'{v:+3d}' for v in y))
print('bits decoded:   ' + ''.join(f'{v:3d}' for v in z))
g = 10**(10/10)
print(f'Eb/N0 = 10 dB: DPSK Pb = {0.5*exp(-g):.2e}   BPSK Pb = {Q(np.sqrt(2*g)):.2e}')
plt.subplot(1, 2, 1); plt.step(range(9), np.pi*(x < 0), where='post')
plt.step(range(9), np.pi*(y < 0), '--', where='post')
plt.xlabel('symbol'); plt.ylabel('phase (rad)'); plt.legend(['sent', 'received'])
db = np.arange(0, 12.05, 0.1); g = 10**(db/10); plt.subplot(1, 2, 2)
plt.semilogy(db, 0.5*np.exp(-g), db, Q(np.sqrt(2*g))); plt.grid(True)
plt.xlabel(r'$E_b/N_0$ (dB)'); plt.ylabel(r'$P_b$'); plt.legend(['DPSK', 'BPSK'])
plt.show()`},

/* -------------------------------------------------------------- 5.3 ---- */
'm5-qam-energy': {
  title:'Average energy of PAM and square QAM',
  what:'Places points at the odd integers, so neighbours are $d=2$ apart, on one line (M-PAM) and on a square grid (M-QAM). It prints the average energy of each next to $(M^2-1)/3$ and $2(M-1)/3$.',
  try:'Predict the average energy of 256-QAM before you run it with $M=256$ added.',
  out:' M    PAM Es  (M^2-1)/3   QAM Es  2(M-1)/3\n 4      5.00       5.00     2.00      2.00\n16     85.00      85.00    10.00     10.00\n64   1365.00    1365.00    42.00     42.00\n16-QAM needs 9.29 dB less energy than 16-PAM',
  m:`% Points at the odd integers (d = 2): M-PAM on a line, M-QAM on a square grid
fprintf(' M    PAM Es  (M^2-1)/3   QAM Es  2(M-1)/3\\n')
for M = [4 16 64]
    p = -(M-1):2:(M-1); P = mean(p.^2);         % M-PAM and its energy
    a = -(sqrt(M)-1):2:(sqrt(M)-1);             % one axis of M-QAM
    [I, Q] = meshgrid(a); E = mean(I(:).^2 + Q(:).^2);
    fprintf('%2d  %8.2f   %8.2f %8.2f  %8.2f\\n', M, P, (M^2-1)/3, E, 2*(M-1)/3)
end
fprintf('16-QAM needs %.2f dB less energy than 16-PAM\\n', 10*log10(85/10))
p = -15:2:15; [I, Q] = meshgrid(-3:2:3);
plot(I(:), Q(:), 'o', p, -6*ones(size(p)), 's', 'MarkerSize', 7), grid on
axis equal, xlabel('I'), ylabel('Q'), legend('16-QAM', '16-PAM (drawn at Q = -6)')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Points at the odd integers (d = 2): M-PAM on a line, M-QAM on a square grid
print(' M    PAM Es  (M^2-1)/3   QAM Es  2(M-1)/3')
for M in [4, 16, 64]:
    p = np.arange(-(M-1), M, 2); P = np.mean(p**2)   # M-PAM and its energy
    s = int(np.sqrt(M)); a = np.arange(-(s-1), s, 2)   # one axis of M-QAM
    I, Q = np.meshgrid(a, a); E = np.mean(I**2 + Q**2)
    print(f'{M:2d}  {P:8.2f}   {(M**2-1)/3:8.2f} {E:8.2f}  {2*(M-1)/3:8.2f}')
print(f'16-QAM needs {10*np.log10(85/10):.2f} dB less energy than 16-PAM')
p = np.arange(-15, 16, 2); a = np.arange(-3, 4, 2); I, Q = np.meshgrid(a, a)
plt.plot(I.ravel(), Q.ravel(), 'o', markersize=7)
plt.plot(p, -6*np.ones(len(p)), 's', markersize=7)
plt.gca().set_aspect('equal'); plt.grid(True); plt.xlabel(r'$I$'); plt.ylabel(r'$Q$')
plt.legend(['16-QAM', '16-PAM (drawn at Q = -6)'])
plt.show()`},

'm5-qam-exact': {
  title:'16-QAM: the exact error and its approximation',
  what:'16-QAM decides $I$ and $Q$ separately, each a 4-PAM decision with error $P_4=\\tfrac32Q\\big(\\sqrt{E_s/5N_0}\\big)$. A symbol is right only when both are right, so $P_e=1-(1-P_4)^2$. The program prints this next to the nearest-neighbour form $3Q\\big(\\sqrt{E_s/5N_0}\\big)$.',
  try:'Predict, before you run it, at which $E_s/N_0$ the two columns first agree to two digits.',
  out:'Es/N0 (dB)   exact      3Q(sqrt(Es/5N0))\n     8       3.535e-01   3.919e-01\n    12       1.094e-01   1.125e-01\n    16       7.152e-03   7.165e-03\n    20       1.162e-05   1.162e-05',
  m:`% 16-QAM: each axis is a 4-PAM decision; g = Es/N0, and 3/(M-1) = 1/5
Q = @(x) 0.5*erfc(x/sqrt(2));
P4 = @(g) 1.5*Q(sqrt(g/5));                  % error on one axis
fprintf('Es/N0 (dB)   exact      3Q(sqrt(Es/5N0))\\n')
for db = [8 12 16 20]
    g = 10^(db/10);
    fprintf('%6d       %.3e   %.3e\\n', db, 1 - (1 - P4(g))^2, 2*P4(g))
end
db = 0:0.1:24; g = 10.^(db/10);
semilogy(db, 1 - (1 - P4(g)).^2, db, 2*P4(g), '--', 'LineWidth', 1.5), grid on
ylim([1e-7 1]), xlabel('E_s/N_0 (dB)'), ylabel('P_e')
legend('exact', 'nearest neighbour')`,
  py:`import numpy as np, matplotlib.pyplot as plt
from math import erfc
# 16-QAM: each axis is a 4-PAM decision; g = Es/N0, and 3/(M-1) = 1/5
Q = np.vectorize(lambda x: 0.5*erfc(x/np.sqrt(2)))
def P4(g): return 1.5*Q(np.sqrt(g/5))        # error on one axis
print('Es/N0 (dB)   exact      3Q(sqrt(Es/5N0))')
for db in [8, 12, 16, 20]:
    g = 10**(db/10)
    print(f'{db:6d}       {1 - (1 - P4(g))**2:.3e}   {2*P4(g):.3e}')
db = np.arange(0, 24.05, 0.1); g = 10**(db/10)
plt.semilogy(db, 1 - (1 - P4(g))**2, db, 2*P4(g), '--', linewidth=1.5)
plt.ylim(1e-7, 1); plt.grid(True)
plt.xlabel(r'$E_s/N_0$ (dB)'); plt.ylabel(r'$P_e$')
plt.legend(['exact', 'nearest neighbour'])
plt.show()`},

'm5-qam-mc': {
  title:'16-QAM in noise: symbol and bit errors',
  what:'Sends $100\\,000$ 16-QAM symbols on the grid $\\{\\pm1,\\pm3\\}^2$, Gray-labelled on each axis, at $E_b/N_0=10$ dB. Each axis is decided on its own, and the program counts symbol and bit errors against $3Q\\big(\\sqrt{E_s/5N_0}\\big)$ and $P_e/4$.',
  try:'Set $E_b/N_0=12$ dB. Predict whether the ratio of bit errors to symbol errors stays near $1/4$ before you run it.',
  out:'symbol errors: 658 of 100000   bit errors: 658 of 400000\nSER counted = 6.58e-03   3Q(sqrt(Es/5N0)) = 7.02e-03\nBER counted = 1.64e-03   SER/4 = 1.75e-03',
  m:`% 16-QAM on {-3,-1,1,3}^2 (Es = 10) at Eb/N0 = 10 dB, so Es/N0 = 40
L = 100000; EsN0 = 4*10^(10/10); sigma = sqrt(10/(2*EsN0));   % sigma^2 = N0/2
Q = @(x) 0.5*erfc(x/sqrt(2));
rng(1, 'twister'); u = rand(1, 4*L);  % the same numbers as NumPy seed 1
iI = floor(4*u(1:L)); iQ = floor(4*u(L+1:2*L));       % level 0 to 3 on each axis
a = sqrt(-2*log(u(2*L+1:3*L))); c = 2*pi*u(3*L+1:end);
rI = 2*iI - 3 + sigma*a.*cos(c); rQ = 2*iQ - 3 + sigma*a.*sin(c);
dI = min(max(round((rI + 3)/2), 0), 3);               % the nearest level on each axis
dQ = min(max(round((rQ + 3)/2), 0), 3);
gr = @(v) bitxor(v, bitshift(v, -1));                 % Gray label of a level
nb = @(x) bitand(x, 1) + bitshift(x, -1);             % bits set in a 2-bit label
bits = nb(bitxor(gr(iI), gr(dI))) + nb(bitxor(gr(iQ), gr(dQ)));
s = (dI ~= iI) | (dQ ~= iQ); Pe = 3*Q(sqrt(EsN0/5));
fprintf('symbol errors: %d of %d   bit errors: %d of %d\\n', sum(s), L, sum(bits), 4*L)
fprintf('SER counted = %.2e   3Q(sqrt(Es/5N0)) = %.2e\\n', mean(s), Pe)
fprintf('BER counted = %.2e   SER/4 = %.2e\\n', sum(bits)/(4*L), Pe/4)
plot(rI(1:5000), rQ(1:5000), '.', rI(s), rQ(s), '.r'), axis equal, grid on
xlabel('I'), ylabel('Q'), legend('received', 'wrong symbol')`,
  py:`import numpy as np, matplotlib.pyplot as plt
from math import erfc, sqrt
# 16-QAM on {-3,-1,1,3}^2 (Es = 10) at Eb/N0 = 10 dB, so Es/N0 = 40
L = 100000; EsN0 = 4*10**(10/10); sigma = sqrt(10/(2*EsN0))   # sigma^2 = N0/2
def Q(x): return 0.5*erfc(x/sqrt(2))
np.random.seed(1); u = np.random.rand(4*L)  # the same numbers as MATLAB rng(1)
iI, iQ = np.floor(4*u[:L]).astype(int), np.floor(4*u[L:2*L]).astype(int)  # 0 to 3
a, c = np.sqrt(-2*np.log(u[2*L:3*L])), 2*np.pi*u[3*L:]
rI, rQ = 2*iI - 3 + sigma*a*np.cos(c), 2*iQ - 3 + sigma*a*np.sin(c)
dI, dQ = [np.clip(np.round((v + 3)/2), 0, 3).astype(int) for v in (rI, rQ)]  # nearest
def gr(v): return v ^ (v >> 1)                        # Gray label of a level
def nb(x): return (x & 1) + (x >> 1)                  # bits set in a 2-bit label
bits = nb(gr(iI) ^ gr(dI)) + nb(gr(iQ) ^ gr(dQ))
s = (dI != iI) | (dQ != iQ); Pe = 3*Q(sqrt(EsN0/5))
print(f'symbol errors: {np.sum(s)} of {L}   bit errors: {np.sum(bits)} of {4*L}')
print(f'SER counted = {np.mean(s):.2e}   3Q(sqrt(Es/5N0)) = {Pe:.2e}')
print(f'BER counted = {np.sum(bits)/(4*L):.2e}   SER/4 = {Pe/4:.2e}')
plt.plot(rI[:5000], rQ[:5000], '.', rI[s], rQ[s], '.r'); plt.gca().set_aspect('equal')
plt.grid(True); plt.xlabel(r'$I$'); plt.ylabel(r'$Q$')
plt.legend(['received', 'wrong symbol'])
plt.show()`},

'm5-qam-vs-psk': {
  title:'QAM against PSK at the same energy',
  what:'At the same average energy $E_s=1$, prints $d_{\\min}=2\\sin(\\pi/M)$ for M-PSK and $d_{\\min}=\\sqrt{6/(M-1)}$ for M-QAM. The last column is the energy PSK must add to reach the QAM distance.',
  try:'Predict, before you run it, whether QAM also wins at $M=4$.',
  out:' M   PSK dmin   QAM dmin   QAM advantage\n 8    0.765      0.926       1.65 dB\n16    0.390      0.632       4.20 dB\n32    0.196      0.440       7.02 dB\n64    0.098      0.309       9.95 dB',
  m:`% Equal average energy Es = 1: dmin of M-PSK against dmin of M-QAM
fprintf(' M   PSK dmin   QAM dmin   QAM advantage\\n')
for M = [8 16 32 64]
    dp = 2*sin(pi/M); dq = sqrt(6/(M-1));
    fprintf('%2d    %.3f      %.3f      %5.2f dB\\n', M, dp, dq, 20*log10(dq/dp))
end
th = 2*pi*(0:15)/16; c = linspace(0, 2*pi, 200);
[I, Q] = meshgrid((-3:2:3)/sqrt(10));            % 16-QAM scaled to Es = 1
r = sqrt(max(I(:).^2 + Q(:).^2));
plot(cos(th), sin(th), 'o', I(:), Q(:), 's', 'MarkerSize', 7), hold on
plot(cos(c), sin(c), ':', r*cos(c), r*sin(c), ':'), hold off
axis equal, grid on, xlabel('I'), ylabel('Q'), legend('16-PSK', '16-QAM')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Equal average energy Es = 1: dmin of M-PSK against dmin of M-QAM
print(' M   PSK dmin   QAM dmin   QAM advantage')
for M in [8, 16, 32, 64]:
    dp, dq = 2*np.sin(np.pi/M), np.sqrt(6/(M-1))
    print(f'{M:2d}    {dp:.3f}      {dq:.3f}      {20*np.log10(dq/dp):5.2f} dB')
th = 2*np.pi*np.arange(16)/16; c = np.linspace(0, 2*np.pi, 200)
a = np.arange(-3, 4, 2)/np.sqrt(10); I, Q = np.meshgrid(a, a)  # 16-QAM at Es = 1
r = np.sqrt(np.max(I**2 + Q**2))
plt.plot(np.cos(th), np.sin(th), 'o', I.ravel(), Q.ravel(), 's', markersize=7)
plt.plot(np.cos(c), np.sin(c), ':', r*np.cos(c), r*np.sin(c), ':')
plt.gca().set_aspect('equal'); plt.grid(True)
plt.xlabel(r'$I$'); plt.ylabel(r'$Q$'); plt.legend(['16-PSK', '16-QAM'])
plt.show()`},

/* -------------------------------------------------------------- 5.4 ---- */
'm5-fsk-rho': {
  title:'Orthogonal tone spacing',
  what:'Correlates a $50$ Hz tone with a second tone $\\Delta f$ higher over one bit, $T=1$ s, for $\\Delta f\\,T$ from $0$ to $2$. The correlation $\\rho$ first reaches zero at $\\Delta f=1/(2T)$, the closest orthogonal spacing.',
  try:'Shorten the bit to $T=0.5$ s. Predict the smallest orthogonal spacing in hertz before you run it.',
  out:'df T = 0.25   rho = 0.638\ndf T = 0.50   rho = 0.000\ndf T = 1.00   rho = 0.000',
  m:`% Two tones over one bit, T = 1: f1 = 50 Hz and f1 + df
K = 2000; dt = 1/K; t = ((1:K) - 0.5)*dt; f1 = 50;
df = (0:400)/200;                                % df T from 0 to 2
rho = zeros(size(df));
for k = 1:length(df)
    rho(k) = 2*sum(cos(2*pi*f1*t).*cos(2*pi*(f1 + df(k))*t))*dt;
end
rho(abs(rho) < 1e-9) = 0;                        % rounding error counts as zero
for x = [0.25 0.5 1]
    fprintf('df T = %.2f   rho = %.3f\\n', x, rho(200*x + 1))
end
plot(df, rho, 'LineWidth', 1.5), hold on
plot([0.5 1 1.5 2], [0 0 0 0], 'o'), hold off, grid on
xlabel('df T'), ylabel('correlation rho')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Two tones over one bit, T = 1: f1 = 50 Hz and f1 + df
K = 2000; dt = 1/K; t = (np.arange(1, K+1) - 0.5)*dt; f1 = 50
df = np.arange(401)/200                          # df T from 0 to 2
rho = np.zeros(len(df))
for k in range(len(df)):
    rho[k] = 2*np.sum(np.cos(2*np.pi*f1*t)*np.cos(2*np.pi*(f1 + df[k])*t))*dt
rho[np.abs(rho) < 1e-9] = 0                      # rounding error counts as zero
for x in [0.25, 0.5, 1]:
    print(f'df T = {x:.2f}   rho = {rho[round(200*x)]:.3f}')
plt.plot(df, rho, linewidth=1.5)
plt.plot([0.5, 1, 1.5, 2], [0, 0, 0, 0], 'o'); plt.grid(True)
plt.xlabel(r'$\\Delta f\\,T$'); plt.ylabel(r'correlation $\\rho$')
plt.show()`},

'm5-fsk-bank': {
  title:'4-FSK: the tones and the correlator bank',
  what:'Four tones $4,4.5,5,5.5$ Hz, spaced $1/(2T)$ with $T=1$ s, carry two bits a symbol. The third tone is sent in white noise with $N_0=0.05$. A bank of four correlators, one a tone, measures each tone. The largest output names the tone.',
  try:'Set $N_0=0.5$. Predict whether the third output is still the largest before you run it.',
  out:'without noise:    0.000   0.000   1.000   0.000\nwith noise:      -0.166   0.188   0.637   0.142\ndecision: tone 3 (5.0 Hz)',
  m:`% 4-FSK, T = 1: tones 4, 4.5, 5, 5.5 Hz; tone 3 is sent, white noise N0 = 0.05
K = 400; dt = 1/K; t = ((1:K) - 0.5)*dt; N0 = 0.05;
f = 4 + 0.5*(0:3);
psi = sqrt(2)*cos(2*pi*f(:)*t);                  % one tone a row, energy 1
y0 = sum(psi(3,:).*psi, 2)*dt;                   % the bank with no noise
y0(abs(y0) < 1e-9) = 0;                          % rounding error counts as zero
rng(1, 'twister'); u = rand(1, 2*K);  % the same numbers as NumPy seed 1
w = sqrt(-2*log(u(1:K))).*cos(2*pi*u(K+1:end));  % Gaussian samples, variance 1
r = psi(3,:) + sqrt(N0/(2*dt))*w;                % r(t) = tone 3 + n(t)
y = sum(r.*psi, 2)*dt;                           % the correlator bank
[~, m] = max(y);
fprintf('without noise: %s\\n', sprintf('%8.3f', y0))
fprintf('with noise:    %s\\n', sprintf('%8.3f', y))
fprintf('decision: tone %d (%.1f Hz)\\n', m, f(m))
subplot(1, 2, 1), plot(t, psi + [0; 3; 6; 9]), xlabel('t (s)'), yticks([])
subplot(1, 2, 2), bar(f, y), grid on, xlabel('tone (Hz)'), ylabel('correlator output')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# 4-FSK, T = 1: tones 4, 4.5, 5, 5.5 Hz; tone 3 is sent, white noise N0 = 0.05
K = 400; dt = 1/K; t = (np.arange(1, K+1) - 0.5)*dt; N0 = 0.05
f = 4 + 0.5*np.arange(4)
psi = np.sqrt(2)*np.cos(2*np.pi*np.outer(f, t))  # one tone a row, energy 1
y0 = np.sum(psi[2]*psi, axis=1)*dt               # the bank with no noise
y0[np.abs(y0) < 1e-9] = 0                        # rounding error counts as zero
np.random.seed(1); u = np.random.rand(2*K)  # the same numbers as MATLAB rng(1)
w = np.sqrt(-2*np.log(u[:K]))*np.cos(2*np.pi*u[K:])  # Gaussian samples, variance 1
r = psi[2] + np.sqrt(N0/(2*dt))*w                # r(t) = tone 3 + n(t)
y = np.sum(r*psi, axis=1)*dt                     # the correlator bank
m = np.argmax(y)
print('without noise: ' + ''.join(f'{v:8.3f}' for v in y0))
print('with noise:    ' + ''.join(f'{v:8.3f}' for v in y))
print(f'decision: tone {m+1} ({f[m]:.1f} Hz)')
fig, ax = plt.subplots(1, 2)
ax[0].plot(t, (psi + 3*np.arange(4)[:, None]).T)   # the four tones, stacked
ax[0].set_xlabel(r'$t$ (s)'); ax[0].set_yticks([])
ax[1].bar(f, y, width=0.3); ax[1].grid(True); ax[1].set_xlabel('tone (Hz)')
ax[1].set_ylabel('correlator output')
plt.show()`},

'm5-fsk-orth': {
  title:'Energy per bit of M orthogonal tones',
  what:'For $M$ orthogonal tones the union bound gives $P_e\\le(M-1)\\,Q\\big(\\sqrt{E_s/N_0}\\big)$ with $E_s=E_b\\log_2M$. The program finds, by halving an interval, the $E_b/N_0$ that brings the bound to $10^{-5}$ for $M=2$ to $64$.',
  try:'Predict, before you run it with $M=128$ added, whether the next step saves more or less than $0.5$ dB.',
  out:' M   bits   Eb/N0 for Pe = 1e-5\n 2    1     12.60 dB\n 4    2     10.06 dB\n 8    3      8.64 dB\n16    4      7.67 dB\n32    5      6.95 dB\n64    6      6.39 dB',
  m:`% M orthogonal tones: union bound Pe <= (M-1) Q(sqrt(k Eb/N0)), k = log2(M)
Q = @(x) 0.5*erfc(x/sqrt(2));
db = 0:0.1:16;
fprintf(' M   bits   Eb/N0 for Pe = 1e-5\\n')
for M = 2.^(1:6)
    k = log2(M); lo = 0; hi = 20;                % the answer lies in [0, 20] dB
    for it = 1:50                                % halve the interval 50 times
        mid = (lo + hi)/2;
        if (M-1)*Q(sqrt(k*10^(mid/10))) > 1e-5, lo = mid; else, hi = mid; end
    end
    fprintf('%2d    %d     %5.2f dB\\n', M, k, mid)
    semilogy(db, min((M-1)*Q(sqrt(k*10.^(db/10))), 1), 'LineWidth', 1.5), hold on
end
hold off, grid on, ylim([1e-7 1]), xlabel('E_b/N_0 (dB)'), ylabel('P_e (union bound)')
legend('M = 2', 'M = 4', 'M = 8', 'M = 16', 'M = 32', 'M = 64')`,
  py:`import numpy as np, matplotlib.pyplot as plt
from math import erfc
# M orthogonal tones: union bound Pe <= (M-1) Q(sqrt(k Eb/N0)), k = log2(M)
Q = np.vectorize(lambda x: 0.5*erfc(x/np.sqrt(2)))
db = np.arange(0, 16.05, 0.1)
print(' M   bits   Eb/N0 for Pe = 1e-5')
for k in range(1, 7):
    M = 2**k; lo, hi = 0, 20                     # the answer lies in [0, 20] dB
    for it in range(50):                         # halve the interval 50 times
        mid = (lo + hi)/2
        if (M-1)*Q(np.sqrt(k*10**(mid/10))) > 1e-5: lo = mid
        else: hi = mid
    print(f'{M:2d}    {k}     {mid:5.2f} dB')
    plt.semilogy(db, np.minimum((M-1)*Q(np.sqrt(k*10**(db/10))), 1), linewidth=1.5)
plt.grid(True); plt.ylim(1e-7, 1)
plt.xlabel(r'$E_b/N_0$ (dB)'); plt.ylabel(r'$P_e$ (union bound)')
plt.legend([f'M = {2**k}' for k in range(1, 7)])
plt.show()`},

'm5-fsk-noncoh': {
  title:'Noncoherent BFSK by the envelope',
  what:'Sends tone 1 of a BFSK pair $100\\,000$ times with a random carrier phase, at $E_b/N_0=10$ dB. The receiver does not know the phase, so it compares the envelopes $\\sqrt{r_c^2+r_s^2}$ of the two tones. The count is printed next to $\\tfrac12e^{-E_b/2N_0}$ and coherent $Q\\big(\\sqrt{E_b/N_0}\\big)$.',
  try:'Set $E_b/N_0=13$ dB. Predict how many errors are left before you run it.',
  out:'bit errors counted: 381 of 100000\nPb counted               = 3.81e-03\nPb = (1/2)exp(-Eb/2N0)   = 3.37e-03\ncoherent Q(sqrt(Eb/N0))  = 7.83e-04',
  m:`% Noncoherent BFSK at Eb/N0 = 10 dB (Eb = 1); tone 1 is sent with a random phase
L = 100000; g = 10^(10/10); sd = sqrt(1/(2*g));   % noise std on each correlator
Q = @(x) 0.5*erfc(x/sqrt(2));
rng(1, 'twister'); u = rand(1, 5*L);  % the same numbers as NumPy seed 1
ph = 2*pi*u(1:L);                                 % the carrier phase, not known
a1 = sqrt(-2*log(u(L+1:2*L)));   b1 = 2*pi*u(2*L+1:3*L);
a2 = sqrt(-2*log(u(3*L+1:4*L))); b2 = 2*pi*u(4*L+1:end);
c1 = cos(ph) + sd*a1.*cos(b1); s1 = sin(ph) + sd*a1.*sin(b1);  % tone 1: cos, sin
c2 = sd*a2.*cos(b2);           s2 = sd*a2.*sin(b2);            % tone 2: noise only
e1 = sqrt(c1.^2 + s1.^2); e2 = sqrt(c2.^2 + s2.^2);            % the two envelopes
err = e2 > e1;                                    % the wrong tone looks larger
fprintf('bit errors counted: %d of %d\\n', sum(err), L)
fprintf('Pb counted               = %.2e\\n', mean(err))
fprintf('Pb = (1/2)exp(-Eb/2N0)   = %.2e\\n', 0.5*exp(-g/2))
fprintf('coherent Q(sqrt(Eb/N0))  = %.2e\\n', Q(sqrt(g)))
histogram(e1, 80), hold on, histogram(e2, 80), hold off
xlabel('envelope'), legend('tone sent', 'other tone')`,
  py:`import numpy as np, matplotlib.pyplot as plt
from math import erfc, sqrt, exp
# Noncoherent BFSK at Eb/N0 = 10 dB (Eb = 1); tone 1 is sent with a random phase
L = 100000; g = 10**(10/10); sd = sqrt(1/(2*g))   # noise std on each correlator
def Q(x): return 0.5*erfc(x/sqrt(2))
np.random.seed(1); u = np.random.rand(5*L)  # the same numbers as MATLAB rng(1)
ph = 2*np.pi*u[:L]                                # the carrier phase, not known
a1, b1 = np.sqrt(-2*np.log(u[L:2*L])), 2*np.pi*u[2*L:3*L]
a2, b2 = np.sqrt(-2*np.log(u[3*L:4*L])), 2*np.pi*u[4*L:]
c1, s1 = np.cos(ph) + sd*a1*np.cos(b1), np.sin(ph) + sd*a1*np.sin(b1)  # tone 1
c2, s2 = sd*a2*np.cos(b2), sd*a2*np.sin(b2)                            # tone 2
e1, e2 = np.sqrt(c1**2 + s1**2), np.sqrt(c2**2 + s2**2)  # the two envelopes
err = e2 > e1                                     # the wrong tone looks larger
print(f'bit errors counted: {np.sum(err)} of {L}')
print(f'Pb counted               = {np.mean(err):.2e}')
print(f'Pb = (1/2)exp(-Eb/2N0)   = {0.5*exp(-g/2):.2e}')
print(f'coherent Q(sqrt(Eb/N0))  = {Q(sqrt(g)):.2e}')
plt.hist(e1, 80, alpha=0.7); plt.hist(e2, 80, alpha=0.7)
plt.xlabel('envelope'); plt.legend(['tone sent', 'other tone'])
plt.show()`},

/* -------------------------------------------------------------- 5.5 ---- */
'm5-cmp-bw': {
  title:'Bandwidth of each family',
  what:'A scheme with $N$ dimensions and $M$ points needs about $W=N R_b/(2\\log_2M)$. PAM has $N=1$, PSK and QAM $N=2$ (BPSK $N=1$), and orthogonal FSK $N=M$. The program prints $W$ for $R_b=1$ Mb/s and plots $R_b/W$.',
  try:'Predict, before you run it, the bandwidth of 256-QAM at $R_b=1$ Mb/s.',
  out:'W in kHz for Rb = 1 Mb/s\n M      PAM   PSK, QAM   orthogonal FSK\n 2    500.0      500.0           1000.0\n 4    250.0      500.0           1000.0\n 8    166.7      333.3           1333.3\n16    125.0      250.0           2000.0\n32    100.0      200.0           3200.0\n64     83.3      166.7           5333.3',
  m:`% W = N Rb / (2 log2 M) for Rb = 1 Mb/s, N = dimensions of the signal set
Rb = 1e6; M = 2.^(1:6); k = log2(M);
N = [ones(1, 6); 2 - (M == 2); M];            % PAM; PSK and QAM (BPSK N = 1); FSK
W = N*Rb./(2*k);                              % one family a row, in Hz
fprintf('W in kHz for Rb = 1 Mb/s\\n')
fprintf(' M      PAM   PSK, QAM   orthogonal FSK\\n')
for j = 1:6
    fprintf('%2d   %6.1f     %6.1f           %6.1f\\n', M(j), W(:, j)/1e3)
end
semilogy(k, Rb./W, '-o', 'LineWidth', 1.5), grid on
xlabel('bits a symbol, log_2 M'), ylabel('R_b/W (b/s/Hz)')
legend('PAM', 'PSK and QAM', 'orthogonal FSK', 'Location', 'southwest')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# W = N Rb / (2 log2 M) for Rb = 1 Mb/s, N = dimensions of the signal set
Rb = 1e6; M = 2**np.arange(1, 7); k = np.log2(M)
N = np.array([np.ones(6), 2 - (M == 2), M])   # PAM; PSK and QAM (BPSK N = 1); FSK
W = N*Rb/(2*k)                                # one family a row, in Hz
print('W in kHz for Rb = 1 Mb/s')
print(' M      PAM   PSK, QAM   orthogonal FSK')
for j in range(6):
    w = W[:, j]/1e3
    print(f'{M[j]:2d}   {w[0]:6.1f}     {w[1]:6.1f}           {w[2]:6.1f}')
plt.semilogy(k, (Rb/W).T, '-o', linewidth=1.5); plt.grid(True)
plt.xlabel(r'bits a symbol, $\\log_2 M$'); plt.ylabel(r'$R_b/W$ (b/s/Hz)')
plt.legend(['PAM', 'PSK and QAM', 'orthogonal FSK'], loc='lower left')
plt.show()`},

'm5-cmp-plane': {
  title:'The bandwidth and power plane',
  what:'For each family and $M$, finds the $E_b/N_0$ at which the nearest-neighbour form $N_{\\min}Q\\big(\\sqrt{d_{\\min}^2/2N_0}\\big)$ reaches $P_e=10^{-5}$. It plots $R_b/W$ against that $E_b/N_0$: PAM, PSK and QAM climb to the right, and orthogonal FSK falls to the left.',
  try:'Change the target to $P_e=10^{-7}$. Predict whether every point moves right by about the same amount before you run it.',
  out:'Eb/N0 (dB) for Pe = 1e-5\nM         2      4      8     16     32     64\nPAM    9.59  13.75  18.29  23.14  28.22  33.46\nPSK    9.59   9.89  13.46  18.07  23.08  28.30\nQAM       -   9.89      -  14.04      -  18.58\nFSK   12.60  10.06   8.64   7.67   6.95   6.39',
  m:`% Eb/N0 for Pe = 1e-5 from Nmin Q(sqrt(dmin^2/2N0)), and Rb/W = 2 log2(M)/N
Q = @(x) 0.5*erfc(x/sqrt(2));
M = 2.^(1:6); k = log2(M); name = {'PAM', 'PSK', 'QAM', 'FSK'};
Nm = [2*(M-1)./M; min(2, M-1); 4*(1-1./sqrt(M)); M-1];  % PAM, PSK, QAM, FSK
c = [12./(M.^2-1); 4*sin(pi./M).^2; 6./(M-1); 2 + 0*k]; % dmin^2 / Es
r = [2*k; 2*k./(2 - (M == 2)); k; 2*k./M];               % Rb/W
lo = zeros(4, 6); hi = 40*ones(4, 6);                    % Eb/N0 in dB
for it = 1:50                                            % halve every interval
    mid = (lo + hi)/2;
    up = Nm.*Q(sqrt(c.*k.*10.^(mid/10)/2)) > 1e-5;       % Es = k Eb
    lo(up) = mid(up); hi(~up) = mid(~up);
end
mid(3, [1 3 5]) = NaN;                                   % square QAM only
fprintf('Eb/N0 (dB) for Pe = 1e-5\\nM   %s\\n', sprintf('%7d', M))
for f = 1:4
    fprintf('%s %s\\n', name{f}, strrep(sprintf('%7.2f', mid(f,:)), 'NaN', '  -'))
    ok = ~isnan(mid(f,:)); semilogy(mid(f,ok), r(f,ok), '-o'), hold on
end
hold off, grid on, xlabel('E_b/N_0 (dB)'), ylabel('R_b/W (b/s/Hz)'), legend(name)`,
  py:`import numpy as np, matplotlib.pyplot as plt
from math import erfc
# Eb/N0 for Pe = 1e-5 from Nmin Q(sqrt(dmin^2/2N0)), and Rb/W = 2 log2(M)/N
Q = np.vectorize(lambda x: 0.5*erfc(x/np.sqrt(2)))
M = 2**np.arange(1, 7); k = np.log2(M); name = ['PAM', 'PSK', 'QAM', 'FSK']
Nm = np.array([2*(M-1)/M, np.minimum(2, M-1), 4*(1-1/np.sqrt(M)), M-1])  # PAM..FSK
c = np.array([12/(M**2-1), 4*np.sin(np.pi/M)**2, 6/(M-1), 2 + 0*k])     # dmin^2 / Es
r = np.array([2*k, 2*k/(2 - (M == 2)), k, 2*k/M])                        # Rb/W
lo, hi = np.zeros((4, 6)), 40*np.ones((4, 6))            # Eb/N0 in dB
for it in range(50):                                     # halve every interval
    mid = (lo + hi)/2
    up = Nm*Q(np.sqrt(c*k*10**(mid/10)/2)) > 1e-5        # Es = k Eb
    lo[up] = mid[up]; hi[~up] = mid[~up]
mid[2, [0, 2, 4]] = np.nan                               # square QAM only
print('Eb/N0 (dB) for Pe = 1e-5'); print('M   ' + ''.join(f'{v:7d}' for v in M))
for f in range(4):
    print(name[f], ''.join(f'{v:7.2f}' for v in mid[f]).replace('nan', '  -'))
    ok = ~np.isnan(mid[f]); plt.semilogy(mid[f, ok], r[f, ok], '-o')
plt.grid(True); plt.xlabel(r'$E_b/N_0$ (dB)'); plt.ylabel(r'$R_b/W$ (b/s/Hz)')
plt.legend(name)
plt.show()`},

'm5-cmp-psd': {
  title:'Side lobes of QPSK and MSK',
  what:'Draws the spectrum of QPSK, $\\operatorname{sinc}^2(2fT_b)$ with $\\operatorname{sinc}(x)=\\sin(\\pi x)/(\\pi x)$, and of MSK, $\\big[\\cos(2\\pi fT_b)/(1-16f^2T_b^2)\\big]^2$, at the same bit rate. It finds the first null of each and the height of the first side lobe.',
  try:'Predict, before you run it, which of the two is larger at $f=2R_b$.',
  out:'QPSK: first null at f = 0.50 Rb, first side lobe at -13.3 dB\nMSK:  first null at f = 0.75 Rb, first side lobe at -23.0 dB',
  m:`% Spectra at the same bit rate, f in units of Rb = 1/Tb, both 1 at f = 0
f = ((0:39999) + 0.5)/10000;                     % 0 to 4 Rb, missing f = 1/4
S = [(sin(2*pi*f)./(2*pi*f)).^2;                 % QPSK: sinc^2(2 f Tb)
     (cos(2*pi*f)./(1 - 16*f.^2)).^2];           % MSK
name = {'QPSK:', 'MSK: '};
for k = 1:2
    s = S(k,:);
    i = find(diff(s) > 0, 1);                    % the spectrum turns up: first null
    j = i + find(diff(s(i+1:end)) < 0, 1);       % it turns down: top of the side lobe
    fprintf('%s first null at f = %.2f Rb, first side lobe at %.1f dB\\n', ...
            name{k}, f(i), 10*log10(s(j)))
end
plot(f, 10*log10(S), 'LineWidth', 1.5), grid on, ylim([-60 3])
xlabel('f / R_b'), ylabel('power spectrum (dB)'), legend('QPSK', 'MSK')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Spectra at the same bit rate, f in units of Rb = 1/Tb, both 1 at f = 0
f = (np.arange(40000) + 0.5)/10000               # 0 to 4 Rb, missing f = 1/4
S = np.array([(np.sin(2*np.pi*f)/(2*np.pi*f))**2,  # QPSK: sinc^2(2 f Tb)
              (np.cos(2*np.pi*f)/(1 - 16*f**2))**2])  # MSK
name = ['QPSK:', 'MSK: ']
for k in range(2):
    s = S[k]
    i = np.argmax(np.diff(s) > 0)                # the spectrum turns up: first null
    j = i + 1 + np.argmax(np.diff(s[i+1:]) < 0)  # it turns down: top of the side lobe
    print(f'{name[k]} first null at f = {f[i]:.2f} Rb,',
          f'first side lobe at {10*np.log10(s[j]):.1f} dB')
plt.plot(f, 10*np.log10(S).T, linewidth=1.5); plt.grid(True); plt.ylim(-60, 3)
plt.xlabel(r'$f/R_b$'); plt.ylabel('power spectrum (dB)'); plt.legend(['QPSK', 'MSK'])
plt.show()`},

'm5-cmp-adaptive': {
  title:'Adaptive modulation',
  what:'For each signal-to-noise ratio $E_s/N_0$, picks the largest of BPSK, QPSK, 16-, 64- and 256-QAM whose bit error probability, about $P_e/\\log_2M$, stays below $10^{-5}$. The staircase is how a Wi-Fi or LTE link raises its rate as the signal gets stronger.',
  try:'Relax the target to $P_b=10^{-3}$. Predict the choice at $25$ dB before you run it.',
  out:'Es/N0 (dB)   scheme    bits a symbol\n     5       none      0\n    10       BPSK      1\n    15       QPSK      2\n    20       16-QAM    4\n    25       16-QAM    4\n    30       64-QAM    6\n    35       256-QAM   8',
  m:`% Highest of BPSK, QPSK, 16-, 64-, 256-QAM with Pb below 1e-5 at each Es/N0
Q = @(x) 0.5*erfc(x/sqrt(2));
M = [4 16 64 256]; k = [0 1 2 4 6 8];            % bits a symbol, for each name
name = {'none', 'BPSK', 'QPSK', '16-QAM', '64-QAM', '256-QAM'};
c = 4*(1 - 1./sqrt(M))./log2(M);                 % Pe/k = c Q(...) for square QAM
Pb = @(g) [Q(sqrt(2*g)), c.*Q(sqrt(3*g./(M - 1)))];
fprintf('Es/N0 (dB)   scheme    bits a symbol\\n')
for db = 5:5:35
    n = sum(Pb(10^(db/10)) <= 1e-5);             % how many schemes meet the target
    fprintf('%6d       %-8s  %d\\n', db, name{n+1}, k(n+1))
end
db = 0:0.05:40; bits = zeros(size(db));
for i = 1:length(db)
    bits(i) = k(sum(Pb(10^(db(i)/10)) <= 1e-5) + 1);
end
plot(db, bits, 'LineWidth', 2), grid on
xlabel('E_s/N_0 (dB)'), ylabel('bits a symbol')`,
  py:`import numpy as np, matplotlib.pyplot as plt
from math import erfc
# Highest of BPSK, QPSK, 16-, 64-, 256-QAM with Pb below 1e-5 at each Es/N0
Q = np.vectorize(lambda x: 0.5*erfc(x/np.sqrt(2)))
M = np.array([4, 16, 64, 256]); k = [0, 1, 2, 4, 6, 8]  # bits a symbol, for each name
name = ['none', 'BPSK', 'QPSK', '16-QAM', '64-QAM', '256-QAM']
c = 4*(1 - 1/np.sqrt(M))/np.log2(M)              # Pe/k = c Q(...) for square QAM
def Pb(g): return np.r_[Q(np.sqrt(2*g)), c*Q(np.sqrt(3*g/(M - 1)))]
print('Es/N0 (dB)   scheme    bits a symbol')
for db in range(5, 36, 5):
    n = np.sum(Pb(10**(db/10)) <= 1e-5)          # how many schemes meet the target
    print(f'{db:6d}       {name[n]:8s}  {k[n]}')
db = np.arange(0, 40.025, 0.05); bits = np.zeros(len(db))
for i in range(len(db)):
    bits[i] = k[np.sum(Pb(10**(db[i]/10)) <= 1e-5)]
plt.plot(db, bits, linewidth=2); plt.grid(True)
plt.xlabel(r'$E_s/N_0$ (dB)'); plt.ylabel('bits a symbol')
plt.show()`},

'm5-cmp-link': {
  title:'A link budget',
  what:'Finds the sensitivity and the free-space range of QPSK and 16-QAM on the $5.8$ GHz link of the worked example. It draws $P_r$ against $d$ with each sensitivity plus the $15$ dB margin.',
  try:'Raise both antenna gains to $15$ dBi. Predict how far QPSK reaches before you run it.',
  out:'scheme    Rb (Mb/s)   Pmin (dBm)   range (km)\nQPSK          40        -81.4        1.36\n16-QAM        80        -74.6        0.62',
  m:`% Link budget at 5.8 GHz: sensitivity and range of QPSK and 16-QAM
Pt = 20; G = 12; NF = 7; margin = 15;             % dBm, dBi, dB, dB
lambda = 3e8/5.8e9;                               % wavelength (m)
Rs = 25e6/1.25;                                   % symbol rate in 25 MHz, roll-off 0.25
k = [2 4]; EbN0 = [9.6 13.4];                     % bits a symbol, Eb/N0 for Pb = 1e-5 (dB)
name = {'QPSK', '16-QAM'};
Rb = k*Rs;                                        % bit rate (b/s)
Pmin = -174 + NF + 10*log10(Rb) + EbN0;           % sensitivity (dBm)
Lp = Pt + 2*G - Pmin - margin;                    % largest path loss (dB)
d = lambda/(4*pi) * 10.^(Lp/20);                  % range (m)
fprintf('scheme    Rb (Mb/s)   Pmin (dBm)   range (km)\\n')
for i = 1:2
    fprintf('%-8s  %6.0f      %7.1f      %6.2f\\n', name{i}, Rb(i)/1e6, Pmin(i), d(i)/1000)
end
dk = logspace(-1, 1, 200);                        % distance (km)
Pr = Pt + 2*G - 20*log10(4*pi*dk*1000/lambda);    % Friis in dBm
semilogx(dk, Pr, 'LineWidth', 2), hold on, grid on
semilogx(dk([1 end]), [1; 1]*(Pmin + margin), '--')
xlabel('d (km)'), ylabel('P_r (dBm)')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Link budget at 5.8 GHz: sensitivity and range of QPSK and 16-QAM
Pt, G, NF, margin = 20, 12, 7, 15                 # dBm, dBi, dB, dB
lam = 3e8/5.8e9                                   # wavelength (m)
Rs = 25e6/1.25                                    # symbol rate in 25 MHz, roll-off 0.25
k = np.array([2, 4]); EbN0 = np.array([9.6, 13.4])  # bits a symbol, Eb/N0 for Pb = 1e-5 (dB)
name = ['QPSK', '16-QAM']
Rb = k*Rs                                         # bit rate (b/s)
Pmin = -174 + NF + 10*np.log10(Rb) + EbN0         # sensitivity (dBm)
Lp = Pt + 2*G - Pmin - margin                     # largest path loss (dB)
d = lam/(4*np.pi) * 10**(Lp/20)                   # range (m)
print('scheme    Rb (Mb/s)   Pmin (dBm)   range (km)')
for i in range(2):
    print(f'{name[i]:8s}  {Rb[i]/1e6:6.0f}      {Pmin[i]:7.1f}      {d[i]/1000:6.2f}')
dk = np.logspace(-1, 1, 200)                      # distance (km)
Pr = Pt + 2*G - 20*np.log10(4*np.pi*dk*1000/lam)  # Friis in dBm
plt.semilogx(dk, Pr, linewidth=2); plt.grid(True)
for p in Pmin + margin: plt.axhline(p, linestyle='--')
plt.xlabel('$d$ (km)'); plt.ylabel('$P_r$ (dBm)')
plt.show()`}

};
