/* ==========================================================================
   Code for Module 4: programs in MATLAB and Python
   One entry a program, keyed by a short name. Each program draws a signal
   from the section and prints the number the section computes, with the same
   wording in both languages, so `out` is one text for both. MATLAB uses no
   toolbox; Python uses NumPy and Matplotlib only.
   Noise is drawn from `rand` with seed 1 (MATLAB `rng(1,'twister')`, NumPy
   `np.random.seed(1)`), which gives the same uniform numbers in both
   languages, and turned into Gaussian samples by the Box-Muller formula, so
   a random program prints the same text in both.
   `title`, `what` and `try` are student text and go through md(); the code
   is plain text. Each section closes with a code page (`CODE_BANKS_M4`) that
   pages through its programs.
   verify/code_check.py runs every entry in both languages and compares what
   it prints with `out`.
   ========================================================================== */
const CODE_BANKS_M4 = {
  'm4-code-observe': ['obs-bank', 'obs-var', 'obs-pam', 'obs-orth'],
  'm4-code-rule':    ['rule-map', 'rule-area', 'rule-mindist', 'rule-metric'],
  'm4-code-regions': ['reg-grid', 'reg-binary', 'reg-priors'],
  'm4-code-union':   ['un-mc', 'un-bounds', 'un-face', 'un-exp']
};

const CODE_M4 = {

/* -------------------------------------------------------------- 4.1 ---- */
'obs-bank': {
  title:'The correlator bank on one noisy waveform',
  what:'Sends $\\mathbf s_2=(-1,1)$ on the basis $\\psi_1=\\sqrt2$ on $[0,\\tfrac12)$, $\\psi_2=\\sqrt2$ on $[\\tfrac12,1)$ and adds white noise with $N_0=0.2$. Correlating $r(t)$ with each basis function gives $\\mathbf r=\\mathbf s_2+\\mathbf n$.',
  try:'Set $N_0=2$. Predict whether the nearest point is still $\\mathbf s_2$ before you run it.',
  out:'r = (-1.129, 0.989)\nn = r - s2 = (-0.129, -0.011)\nnearest point: s2',
  m:`% Four signals on the halves basis, T = 1; s2 is sent, white noise with N0 = 0.2
K = 200; dt = 1/K; t = ((1:K) - 0.5)*dt; N0 = 0.2;
psi1 = sqrt(2)*(t < 0.5); psi2 = sqrt(2)*(t >= 0.5);
S = [1 1; -1 1; -1 -1; 1 -1];                      % rows: s1, s2, s3, s4
s = S(2,1)*psi1 + S(2,2)*psi2;                     % the waveform s2(t)
rng(1, 'twister'); u = rand(1, 2*K);               % the same numbers as NumPy seed 1
w = sqrt(-2*log(u(1:K))) .* cos(2*pi*u(K+1:end));  % Gaussian samples, variance 1
r = s + sqrt(N0/(2*dt))*w;                         % r(t) = s2(t) + n(t)
r1 = sum(r.*psi1)*dt; r2 = sum(r.*psi2)*dt;        % the two correlators
[~, i] = min(sum(([r1 r2] - S).^2, 2));
fprintf('r = (%.3f, %.3f)\\n', r1, r2)
fprintf('n = r - s2 = (%.3f, %.3f)\\n', r1 - S(2,1), r2 - S(2,2))
fprintf('nearest point: s%d\\n', i)
subplot(1,2,1), plot(t, r, t, s, 'LineWidth', 1)
xlabel('t'), legend('r(t)', 's_2(t)')
subplot(1,2,2), plot(S(:,1), S(:,2), 'o', r1, r2, 'x', 'MarkerSize', 10)
axis equal, grid on, xlabel('r_1'), ylabel('r_2')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Four signals on the halves basis, T = 1; s2 is sent, white noise with N0 = 0.2
K, N0 = 200, 0.2
dt = 1/K; t = (np.arange(1, K+1) - 0.5)*dt
psi1, psi2 = np.sqrt(2)*(t < 0.5), np.sqrt(2)*(t >= 0.5)
S = np.array([[1, 1], [-1, 1], [-1, -1], [1, -1]])     # rows: s1, s2, s3, s4
s = S[1,0]*psi1 + S[1,1]*psi2                          # the waveform s2(t)
np.random.seed(1); u = np.random.rand(2*K)  # the same numbers as MATLAB rng(1)
w = np.sqrt(-2*np.log(u[:K])) * np.cos(2*np.pi*u[K:])  # Gaussian samples, variance 1
r = s + np.sqrt(N0/(2*dt))*w                           # r(t) = s2(t) + n(t)
r1, r2 = np.sum(r*psi1)*dt, np.sum(r*psi2)*dt          # the two correlators
i = np.argmin(np.sum((np.array([r1, r2]) - S)**2, axis=1)) + 1
print(f'r = ({r1:.3f}, {r2:.3f})')
print(f'n = r - s2 = ({r1-S[1,0]:.3f}, {r2-S[1,1]:.3f})')
print(f'nearest point: s{i}')
fig, ax = plt.subplots(1, 2)
ax[0].plot(t, r, t, s); ax[0].set_xlabel(r'$t$')
ax[0].legend([r'$r(t)$', r'$s_2(t)$'])
ax[1].plot(S[:,0], S[:,1], 'o', r1, r2, 'x', markersize=10); ax[1].set_aspect('equal')
ax[1].set_xlabel(r'$r_1$'); ax[1].set_ylabel(r'$r_2$'); ax[1].grid(True)
plt.show()`},

'obs-var': {
  title:'Each noise component has variance $N_0/2$',
  what:'Passes $10\\,000$ white-noise waveforms with $N_0=0.2$ through the two correlators and prints the average of $n_1^2$, $n_2^2$ and $n_1n_2$ next to $N_0/2$.',
  try:'Replace $\\psi_2$ by $\\psi_1$, a basis that is not orthogonal. Predict the average of $n_1n_2$ before you run it.',
  out:'N0/2         = 0.100\nmean of n1^2 = 0.100\nmean of n2^2 = 0.102\nmean of n1n2 = 0.001',
  m:`% 10000 noise waveforms through the two correlators; N0 = 0.2, T = 1
K = 100; L = 10000; dt = 1/K; t = ((1:K) - 0.5)*dt; N0 = 0.2;
psi1 = sqrt(2)*(t < 0.5); psi2 = sqrt(2)*(t >= 0.5);
rng(1, 'twister'); u = rand(1, 2*K*L);    % the same numbers as NumPy seed 1
w = sqrt(-2*log(u(1:K*L))) .* cos(2*pi*u(K*L+1:end));
W = sqrt(N0/(2*dt)) * reshape(w, K, L)';  % one noise waveform n(t) per row
n1 = W*psi1'*dt; n2 = W*psi2'*dt;         % n_k = int n(t) psi_k(t) dt
fprintf('N0/2         = %.3f\\n', N0/2)
fprintf('mean of n1^2 = %.3f\\n', mean(n1.^2))
fprintf('mean of n2^2 = %.3f\\n', mean(n2.^2))
fprintf('mean of n1n2 = %.3f\\n', mean(n1.*n2))
th = linspace(0, 2*pi, 200); sd = sqrt(N0/2);
plot(n1, n2, '.', 2*sd*cos(th), 2*sd*sin(th), '-'), axis equal, grid on
xlabel('n_1'), ylabel('n_2')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# 10000 noise waveforms through the two correlators; N0 = 0.2, T = 1
K, L, N0 = 100, 10000, 0.2
dt = 1/K; t = (np.arange(1, K+1) - 0.5)*dt
psi1, psi2 = np.sqrt(2)*(t < 0.5), np.sqrt(2)*(t >= 0.5)
np.random.seed(1); u = np.random.rand(2*K*L)  # the same numbers as MATLAB rng(1)
w = np.sqrt(-2*np.log(u[:K*L])) * np.cos(2*np.pi*u[K*L:])
W = np.sqrt(N0/(2*dt)) * w.reshape(L, K)      # one noise waveform n(t) per row
n1, n2 = W @ psi1 * dt, W @ psi2 * dt         # n_k = int n(t) psi_k(t) dt
print(f'N0/2         = {N0/2:.3f}')
print(f'mean of n1^2 = {np.mean(n1**2):.3f}')
print(f'mean of n2^2 = {np.mean(n2**2):.3f}')
print(f'mean of n1n2 = {np.mean(n1*n2):.3f}')
th = np.linspace(0, 2*np.pi, 200); sd = np.sqrt(N0/2)
plt.plot(n1, n2, '.', 2*sd*np.cos(th), 2*sd*np.sin(th), '-'); plt.axis('equal')
plt.xlabel(r'$n_1$'); plt.ylabel(r'$n_2$'); plt.grid(True)
plt.show()`},

'obs-pam': {
  title:'Four-level PAM: the four conditional densities',
  what:'Draws $f(r\\mid s_m)=\\frac{1}{\\sqrt{\\pi N_0}}e^{-(r-s_m)^2/N_0}$ for $s_m=-3,-1,1,3$ with $N_0=0.5$, checks each area and peak, and finds how much of $f(r\\mid s_2)$ lies past the midpoint $r=0$.',
  try:'Set $N_0=2$. Predict the new peak height and whether the tail past $r=0$ grows, before you run it.',
  out:'s1 = -3   area = 1.000   peak = 0.798\ns2 = -1   area = 1.000   peak = 0.798\ns3 =  1   area = 1.000   peak = 0.798\ns4 =  3   area = 1.000   peak = 0.798\nP(r > 0 | s2) = 0.0228 (area)   0.0228 (Q(1/sigma))',
  m:`% Four-level PAM: s_m = -3, -1, 1, 3 on one axis, N0 = 0.5
s = [-3 -1 1 3]; N0 = 0.5; sigma = sqrt(N0/2);
Q = @(x) 0.5*erfc(x/sqrt(2));
dr = 1e-3; r = ((0:13999) + 0.5)*dr - 7;       % midpoint grid on [-7, 7]
for m = 1:4
    f = exp(-(r - s(m)).^2/N0) / sqrt(pi*N0);  % f(r | s_m), variance N0/2
    plot(r, f, 'LineWidth', 1.5), hold on
    fprintf('s%d = %2d   area = %.3f   peak = %.3f\\n', m, s(m), sum(f)*dr, max(f))
end
f2 = exp(-(r + 1).^2/N0) / sqrt(pi*N0);        % f(r | s2), s2 = -1
tail = sum(f2(r > 0))*dr;                      % area of f(r | s2) past r = 0
fprintf('P(r > 0 | s2) = %.4f (area)   %.4f (Q(1/sigma))\\n', tail, Q(1/sigma))
hold off, grid on, xlabel('r'), ylabel('f(r | s_m)')`,
  py:`import numpy as np, matplotlib.pyplot as plt
from math import erfc, sqrt
# Four-level PAM: s_m = -3, -1, 1, 3 on one axis, N0 = 0.5
s, N0 = [-3, -1, 1, 3], 0.5
sigma = sqrt(N0/2)
def Q(x): return 0.5*erfc(x/sqrt(2))
dr = 1e-3; r = (np.arange(14000) + 0.5)*dr - 7       # midpoint grid on [-7, 7]
for m, sm in enumerate(s, 1):
    f = np.exp(-(r - sm)**2/N0) / np.sqrt(np.pi*N0)  # f(r | s_m), variance N0/2
    plt.plot(r, f, linewidth=1.5)
    print(f's{m} = {sm:2d}   area = {np.sum(f)*dr:.3f}   peak = {np.max(f):.3f}')
f2 = np.exp(-(r + 1)**2/N0) / np.sqrt(np.pi*N0)      # f(r | s2), s2 = -1
tail = np.sum(f2[r > 0])*dr                          # area of f(r | s2) past r = 0
print(f'P(r > 0 | s2) = {tail:.4f} (area)   {Q(1/sigma):.4f} (Q(1/sigma))')
plt.xlabel(r'$r$'); plt.ylabel(r'$f(r\\mid s_m)$'); plt.grid(True)
plt.show()`},

'obs-orth': {
  title:'Four orthogonal signals: the four components',
  what:'Sends $\\mathbf s_1=(\\sqrt E,0,0,0)$ with $E=1$ and $N_0=0.5$ twenty thousand times. It prints the mean and variance of each component $r_k$, then how often $r_1$ is the largest.',
  try:'Set $E=4$. Predict which means change and whether the variances change, before you run it.',
  out:'r1: mean =  0.998   variance = 0.254\nr2: mean =  0.004   variance = 0.251\nr3: mean =  0.000   variance = 0.250\nr4: mean =  0.003   variance = 0.252\nfraction decided s1 = 0.819',
  m:`% Four orthogonal signals, E = 1, N0 = 0.5: s1 = (1, 0, 0, 0) is sent 20000 times
E = 1; N0 = 0.5; L = 20000; s1 = [sqrt(E) 0 0 0];
rng(1, 'twister'); u = rand(1, 8*L);      % the same numbers as NumPy seed 1
w = sqrt(-2*log(u(1:4*L))) .* cos(2*pi*u(4*L+1:end));
R = s1 + sqrt(N0/2) * reshape(w, 4, L)';  % one observation vector r per row
for k = 1:4
    fprintf('r%d: mean = %6.3f   variance = %.3f\\n', k, mean(R(:,k)), var(R(:,k)))
end
[~, dec] = max(R, [], 2);                 % the largest component wins
fprintf('fraction decided s1 = %.3f\\n', mean(dec == 1))
histogram(R(:,1), 60), hold on, histogram(R(:,2), 60), hold off
xlabel('r_k'), legend('r_1', 'r_2')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Four orthogonal signals, E = 1, N0 = 0.5: s1 = (1, 0, 0, 0) is sent 20000 times
E, N0, L = 1, 0.5, 20000
s1 = np.array([np.sqrt(E), 0, 0, 0])
np.random.seed(1); u = np.random.rand(8*L)  # the same numbers as MATLAB rng(1)
w = np.sqrt(-2*np.log(u[:4*L])) * np.cos(2*np.pi*u[4*L:])
R = s1 + np.sqrt(N0/2) * w.reshape(L, 4)    # one observation vector r per row
for k in range(4):
    mk, vk = np.mean(R[:,k]), np.var(R[:,k], ddof=1)
    print(f'r{k+1}: mean = {mk:6.3f}   variance = {vk:.3f}')
dec = np.argmax(R, axis=1)                  # the largest component wins
print(f'fraction decided s1 = {np.mean(dec == 0):.3f}')
plt.hist(R[:,0], 60, alpha=0.7); plt.hist(R[:,1], 60, alpha=0.7)
plt.xlabel(r'$r_k$'); plt.legend([r'$r_1$', r'$r_2$'])
plt.show()`},

/* -------------------------------------------------------------- 4.2 ---- */
'rule-map': {
  title:'MAP and ML thresholds for binary antipodal signals',
  what:'Takes $s_1=+\\sqrt{E_b}$, $s_2=-\\sqrt{E_b}$ with $E_b=1$, $N_0=0.5$, $P(s_1)=0.25$, computes $\\tau=\\frac{N_0}{4\\sqrt{E_b}}\\ln\\frac{P(s_2)}{P(s_1)}$, and prints $P_e$ at $\\tau$ and at the ML threshold $0$.',
  try:'Set $P(s_1)=0.5$. Predict $\\tau$ and the two error probabilities before you run it.',
  out:'MAP threshold tau = 0.1373\nat tau: P(s1)f(r|s1) = 0.0450   P(s2)f(r|s2) = 0.0450\nPe at tau (MAP) = 0.0192\nPe at 0   (ML)  = 0.0228',
  m:`% Binary antipodal: s1 = +sqrt(Eb), s2 = -sqrt(Eb); Eb = 1, N0 = 0.5, P(s1) = 0.25
Eb = 1; N0 = 0.5; P1 = 0.25; P2 = 0.75; sigma = sqrt(N0/2);
Q = @(x) 0.5*erfc(x/sqrt(2));
tau = N0/(4*sqrt(Eb)) * log(P2/P1);                   % MAP: decide s1 when r > tau
Pe = @(th) P1*Q((sqrt(Eb) - th)/sigma) + P2*Q((sqrt(Eb) + th)/sigma);
g1 = @(r) P1*exp(-(r - sqrt(Eb)).^2/N0)/sqrt(pi*N0);  % P(s1) f(r|s1)
g2 = @(r) P2*exp(-(r + sqrt(Eb)).^2/N0)/sqrt(pi*N0);  % P(s2) f(r|s2)
fprintf('MAP threshold tau = %.4f\\n', tau)
fprintf('at tau: P(s1)f(r|s1) = %.4f   P(s2)f(r|s2) = %.4f\\n', g1(tau), g2(tau))
fprintf('Pe at tau (MAP) = %.4f\\n', Pe(tau))
fprintf('Pe at 0   (ML)  = %.4f\\n', Pe(0))
r = linspace(-3, 3, 601);
plot(r, g1(r), r, g2(r), 'LineWidth', 1.5), xline(tau, '--'), grid on
xlabel('r'), legend('P(s_1) f(r|s_1)', 'P(s_2) f(r|s_2)')`,
  py:`import numpy as np, matplotlib.pyplot as plt
from math import erfc, sqrt, log
# Binary antipodal: s1 = +sqrt(Eb), s2 = -sqrt(Eb); Eb = 1, N0 = 0.5, P(s1) = 0.25
Eb, N0, P1, P2 = 1, 0.5, 0.25, 0.75
sigma = sqrt(N0/2)
def Q(x): return 0.5*erfc(x/sqrt(2))
tau = N0/(4*sqrt(Eb)) * log(P2/P1)  # MAP: decide s1 when r > tau
def Pe(th): return P1*Q((sqrt(Eb) - th)/sigma) + P2*Q((sqrt(Eb) + th)/sigma)
def g1(r): return P1*np.exp(-(r - sqrt(Eb))**2/N0)/np.sqrt(np.pi*N0)  # P(s1) f(r|s1)
def g2(r): return P2*np.exp(-(r + sqrt(Eb))**2/N0)/np.sqrt(np.pi*N0)  # P(s2) f(r|s2)
print(f'MAP threshold tau = {tau:.4f}')
print(f'at tau: P(s1)f(r|s1) = {g1(tau):.4f}   P(s2)f(r|s2) = {g2(tau):.4f}')
print(f'Pe at tau (MAP) = {Pe(tau):.4f}')
print(f'Pe at 0   (ML)  = {Pe(0):.4f}')
r = np.linspace(-3, 3, 601)
plt.plot(r, g1(r), r, g2(r), linewidth=1.5); plt.axvline(tau, linestyle='--')
plt.xlabel(r'$r$'); plt.grid(True)
plt.legend([r'$P(s_1)f(r|s_1)$', r'$P(s_2)f(r|s_2)$'])
plt.show()`},

'rule-area': {
  title:'The error area against the threshold',
  what:'The error area is the part of $P(s_1)f(r\\mid s_1)$ below the threshold plus the part of $P(s_2)f(r\\mid s_2)$ above it. The program scans thresholds from $-0.5$ to $0.5$ and prints where this area is smallest.',
  try:'Swap the priors, $P(s_1)=0.75$ and $P(s_2)=0.25$. Predict where the minimum moves, before you run it.',
  out:'smallest error area at threshold = 0.137\nsmallest error area = 0.0192\nerror area at threshold 0 = 0.0228',
  m:`% Error area against the threshold: Eb = 1, N0 = 0.5, P(s1) = 0.25
Eb = 1; N0 = 0.5; P1 = 0.25; P2 = 0.75;
dr = 1e-3; r = ((0:7999) + 0.5)*dr - 4;          % midpoint grid on [-4, 4]
g1 = P1*exp(-(r - sqrt(Eb)).^2/N0)/sqrt(pi*N0);  % P(s1) f(r|s1)
g2 = P2*exp(-(r + sqrt(Eb)).^2/N0)/sqrt(pi*N0);  % P(s2) f(r|s2)
th = (-500:500)*1e-3; Pe = zeros(size(th));
for k = 1:length(th)
    % s1 is lost below the threshold, s2 above it
    Pe(k) = sum(g1(r < th(k)))*dr + sum(g2(r > th(k)))*dr;
end
[Pmin, k] = min(Pe);
fprintf('smallest error area at threshold = %.3f\\n', th(k))
fprintf('smallest error area = %.4f\\n', Pmin)
fprintf('error area at threshold 0 = %.4f\\n', Pe(th == 0))
plot(th, Pe, 'LineWidth', 1.5), grid on
xlabel('threshold'), ylabel('P_e')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Error area against the threshold: Eb = 1, N0 = 0.5, P(s1) = 0.25
Eb, N0, P1, P2 = 1, 0.5, 0.25, 0.75
dr = 1e-3; r = (np.arange(8000) + 0.5)*dr - 4               # midpoint grid on [-4, 4]
g1 = P1*np.exp(-(r - np.sqrt(Eb))**2/N0)/np.sqrt(np.pi*N0)  # P(s1) f(r|s1)
g2 = P2*np.exp(-(r + np.sqrt(Eb))**2/N0)/np.sqrt(np.pi*N0)  # P(s2) f(r|s2)
th = np.arange(-500, 501)*1e-3; Pe = np.zeros(len(th))
for k in range(len(th)):
    # s1 is lost below the threshold, s2 above it
    Pe[k] = np.sum(g1[r < th[k]])*dr + np.sum(g2[r > th[k]])*dr
k = np.argmin(Pe)
print(f'smallest error area at threshold = {th[k]:.3f}')
print(f'smallest error area = {Pe[k]:.4f}')
print(f'error area at threshold 0 = {Pe[th == 0][0]:.4f}')
plt.plot(th, Pe, linewidth=1.5)
plt.xlabel('threshold'); plt.ylabel(r'$P_e$'); plt.grid(True)
plt.show()`},

'rule-mindist': {
  title:'Minimum distance and the MAP handicap',
  what:'Takes five points, $(\\pm2,0)$, $(0,\\pm2)$ and $(0,0)$, with $P(\\mathbf s_5)=0.6$ and $0.1$ for the rest, $N_0=1$, and $\\mathbf r=(1.2,0.3)$. It prints $\\|\\mathbf r-\\mathbf s_i\\|^2$ and $\\|\\mathbf r-\\mathbf s_i\\|^2-N_0\\ln P(\\mathbf s_i)$ and both decisions.',
  try:'Set all five priors to $0.2$. Predict the MAP decision before you run it.',
  out:'s1: D^2 =  0.730   D^2 - N0 ln P =  3.033\ns2: D^2 =  4.330   D^2 - N0 ln P =  6.633\ns3: D^2 = 10.330   D^2 - N0 ln P = 12.633\ns4: D^2 =  6.730   D^2 - N0 ln P =  9.033\ns5: D^2 =  1.530   D^2 - N0 ln P =  2.041\nML decision:  s1\nMAP decision: s5',
  m:`% Five points and one observation r; N0 = 1, P = (0.1, 0.1, 0.1, 0.1, 0.6)
S = [2 0; 0 2; -2 0; 0 -2; 0 0]; P = [0.1 0.1 0.1 0.1 0.6]; N0 = 1;
r = [1.2 0.3];
D2 = sum((r - S).^2, 2);  % squared distances ||r - s_i||^2
mapm = D2 - N0*log(P');   % MAP metric: distance plus handicap
for i = 1:5
    fprintf('s%d: D^2 = %6.3f   D^2 - N0 ln P = %6.3f\\n', i, D2(i), mapm(i))
end
[~, iml] = min(D2); [~, imap] = min(mapm);
fprintf('ML decision:  s%d\\n', iml)
fprintf('MAP decision: s%d\\n', imap)
plot(S(:,1), S(:,2), 'o', r(1), r(2), 'x', 'MarkerSize', 10), hold on
for i = 1:5, plot([r(1) S(i,1)], [r(2) S(i,2)], ':'), end, hold off
axis equal, grid on, xlabel('\\psi_1'), ylabel('\\psi_2')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Five points and one observation r; N0 = 1, P = (0.1, 0.1, 0.1, 0.1, 0.6)
S = np.array([[2, 0], [0, 2], [-2, 0], [0, -2], [0, 0]])
P, N0 = np.array([0.1, 0.1, 0.1, 0.1, 0.6]), 1
r = np.array([1.2, 0.3])
D2 = np.sum((r - S)**2, axis=1)  # squared distances ||r - s_i||^2
mapm = D2 - N0*np.log(P)         # MAP metric: distance plus handicap
for i in range(5):
    print(f's{i+1}: D^2 = {D2[i]:6.3f}   D^2 - N0 ln P = {mapm[i]:6.3f}')
print(f'ML decision:  s{np.argmin(D2)+1}')
print(f'MAP decision: s{np.argmin(mapm)+1}')
plt.plot(S[:,0], S[:,1], 'o', markersize=10); plt.plot(r[0], r[1], 'x', markersize=10)
for p in S: plt.plot([r[0], p[0]], [r[1], p[1]], ':')
plt.axis('equal'); plt.xlabel(r'$\\psi_1$'); plt.ylabel(r'$\\psi_2$'); plt.grid(True)
plt.show()`},

'rule-metric': {
  title:'The correlation metric makes the same decisions',
  what:'For $1000$ observations spread over the same five-point set, compares the distance form $\\|\\mathbf r-\\mathbf s_i\\|^2-N_0\\ln P(\\mathbf s_i)$ with the metric $\\mathbf r\\cdot\\mathbf s_i-\\tfrac{E_i}{2}+\\tfrac{N_0}{2}\\ln P(\\mathbf s_i)$, with and without $-E_i/2$.',
  try:'Remove the centre point and its prior, so the four points left have equal energy. Predict how often the version without $-E_i/2$ agrees, before you run it.',
  out:'correlation metric agrees: 1000 of 1000\nwithout -E/2 it agrees:    806 of 1000',
  m:`% Distance form and correlation metric on 1000 observations; N0 = 1
S = [2 0; 0 2; -2 0; 0 -2; 0 0]; P = [0.1 0.1 0.1 0.1 0.6]; N0 = 1;
rng(1, 'twister'); R = 6*reshape(rand(1, 2000), 2, 1000)' - 3;  % r in [-3,3]^2
E = sum(S.^2, 2)';                                              % energies E_i
D2 = (R(:,1) - S(:,1)').^2 + (R(:,2) - S(:,2)').^2; % ||r - s_i||^2
[~, dmap] = min(D2 - N0*log(P), [], 2);                         % distance form of MAP
[~, cmap] = max(R*S' - E/2 + N0/2*log(P), [], 2);               % correlation metric
[~, cbad] = max(R*S' + N0/2*log(P), [], 2);  % the metric without -E_i/2
fprintf('correlation metric agrees: %d of 1000\\n', sum(dmap == cmap))
fprintf('without -E/2 it agrees:    %d of 1000\\n', sum(dmap == cbad))
scatter(R(:,1), R(:,2), 12, cmap, 'filled'), hold on
plot(S(:,1), S(:,2), 'ko', 'MarkerSize', 10), hold off
axis equal, xlabel('r_1'), ylabel('r_2')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Distance form and correlation metric on 1000 observations; N0 = 1
S = np.array([[2, 0], [0, 2], [-2, 0], [0, -2], [0, 0]])
P, N0 = np.array([0.1, 0.1, 0.1, 0.1, 0.6]), 1
np.random.seed(1); R = 6*np.random.rand(2000).reshape(1000, 2) - 3  # r in [-3,3]^2
E = np.sum(S**2, axis=1)                                            # energies E_i
D2 = (R[:,[0]] - S[:,0])**2 + (R[:,[1]] - S[:,1])**2                # ||r - s_i||^2
dmap = np.argmin(D2 - N0*np.log(P), axis=1)  # distance form of MAP
cmap = np.argmax(R @ S.T - E/2 + N0/2*np.log(P), axis=1)  # correlation metric
cbad = np.argmax(R @ S.T + N0/2*np.log(P), axis=1)  # the metric without -E_i/2
print(f'correlation metric agrees: {np.sum(dmap == cmap)} of 1000')
print(f'without -E/2 it agrees:    {np.sum(dmap == cbad)} of 1000')
plt.scatter(R[:,0], R[:,1], 12, cmap)
plt.plot(S[:,0], S[:,1], 'ko', markersize=10, fillstyle='none')
plt.axis('equal'); plt.xlabel(r'$r_1$'); plt.ylabel(r'$r_2$')
plt.show()`},

/* -------------------------------------------------------------- 4.3 ---- */
'reg-grid': {
  title:'Decision regions by testing a grid',
  what:'Takes the square $(\\pm1,\\pm1)$ with a fifth point at the centre and gives every point of a grid on $[-3,3]^2$ to its nearest signal point. It then measures the centre region and checks which regions reach the edge.',
  try:'Move the centre point to $(0.5,0)$. Predict whether its region stays bounded before you run it.',
  out:'area of the centre region = 2.01 (exact 2)\nregion of s1 reaches the edge: yes\nregion of s2 reaches the edge: yes\nregion of s3 reaches the edge: yes\nregion of s4 reaches the edge: yes\nregion of s5 reaches the edge: no',
  m:`% Decision regions by testing a grid: the square (+-1, +-1) and a centre point
S = [1 1; -1 1; -1 -1; 1 -1; 0 0]; M = 5;
h = 0.012; x = ((0:499) + 0.5)*h - 3;                    % cell centres on [-3, 3]
[X, Y] = meshgrid(x, x);
D2 = zeros(numel(X), M);
for i = 1:M, D2(:,i) = (X(:) - S(i,1)).^2 + (Y(:) - S(i,2)).^2; end
[~, lab] = min(D2, [], 2); lab = reshape(lab, size(X));  % the nearest point wins
fprintf('area of the centre region = %.2f (exact 2)\\n', sum(lab(:) == 5)*h^2)
edge = [lab(1,:), lab(end,:), lab(:,1)', lab(:,end)'];
yn = {'no', 'yes'};
for i = 1:M
    fprintf('region of s%d reaches the edge: %s\\n', i, yn{any(edge == i) + 1})
end
imagesc(x, x, lab), axis xy equal tight, hold on
plot(S(:,1), S(:,2), 'ko', 'MarkerFaceColor', 'w'), hold off
xlabel('r_1'), ylabel('r_2')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Decision regions by testing a grid: the square (+-1, +-1) and a centre point
S = np.array([[1, 1], [-1, 1], [-1, -1], [1, -1], [0, 0]]); M = 5
h = 0.012; x = (np.arange(500) + 0.5)*h - 3         # cell centres on [-3, 3]
X, Y = np.meshgrid(x, x)
D2 = np.zeros((X.size, M))
for i in range(M): D2[:,i] = (X.ravel() - S[i,0])**2 + (Y.ravel() - S[i,1])**2
lab = (np.argmin(D2, axis=1) + 1).reshape(X.shape)  # the nearest point wins
print(f'area of the centre region = {np.sum(lab == 5)*h**2:.2f} (exact 2)')
edge = np.concatenate([lab[0,:], lab[-1,:], lab[:,0], lab[:,-1]])
yn = ['no', 'yes']
for i in range(1, M+1):
    print(f'region of s{i} reaches the edge: {yn[int(np.any(edge == i))]}')
plt.imshow(lab, extent=[-3, 3, -3, 3], origin='lower')
plt.plot(S[:,0], S[:,1], 'ko', markerfacecolor='w')
plt.xlabel(r'$r_1$'); plt.ylabel(r'$r_2$')
plt.show()`},

'reg-binary': {
  title:'Binary error probability from the distance',
  what:'For two points $d=2$ apart with $N_0=0.5$, prints $P_e=Q\\big(\\sqrt{d^2/2N_0}\\big)$ next to the area of the noise tail beyond $d/2$. Then compares antipodal, $d^2=4E_b$, with on-off, $d^2=2E_b$, at $E_b/N_0=6$ dB.',
  try:'Predict, before you run it, how many dB more $E_b/N_0$ the on-off curve needs to reach the antipodal $P_b$.',
  out:'Pe = Q(sqrt(d^2/(2 N0))) = 0.0228\nPe = area of the tail    = 0.0228\nEb/N0 = 6 dB: antipodal Pb = 2.388e-03\nEb/N0 = 6 dB: on-off    Pb = 2.301e-02',
  m:`% Two equally likely points d apart; the boundary is at d/2 from each
Q = @(x) 0.5*erfc(x/sqrt(2));
d = 2; N0 = 0.5;
dx = 1e-4; x = d/2 + ((0:59999) + 0.5)*dx;  % from the boundary outwards
tail = sum(exp(-x.^2/N0)/sqrt(pi*N0))*dx;   % noise along the line beyond d/2
fprintf('Pe = Q(sqrt(d^2/(2 N0))) = %.4f\\n', Q(sqrt(d^2/(2*N0))))
fprintf('Pe = area of the tail    = %.4f\\n', tail)
g = 10^(6/10);                              % Eb/N0 = 6 dB
fprintf('Eb/N0 = 6 dB: antipodal Pb = %.3e\\n', Q(sqrt(4*g/2)))
fprintf('Eb/N0 = 6 dB: on-off    Pb = %.3e\\n', Q(sqrt(2*g/2)))
db = 0:0.5:12; G = 10.^(db/10);
semilogy(db, Q(sqrt(2*G)), db, Q(sqrt(G)), 'LineWidth', 1.5), grid on
xlabel('E_b/N_0 (dB)'), ylabel('P_b'), legend('antipodal', 'on-off')`,
  py:`import numpy as np, matplotlib.pyplot as plt
from math import erfc, sqrt
# Two equally likely points d apart; the boundary is at d/2 from each
def Q(x): return 0.5*erfc(x/sqrt(2))
d, N0 = 2, 0.5
dx = 1e-4; x = d/2 + (np.arange(60000) + 0.5)*dx      # from the boundary outwards
tail = np.sum(np.exp(-x**2/N0)/np.sqrt(np.pi*N0))*dx  # the tail beyond d/2
print(f'Pe = Q(sqrt(d^2/(2 N0))) = {Q(sqrt(d**2/(2*N0))):.4f}')
print(f'Pe = area of the tail    = {tail:.4f}')
g = 10**(6/10)                                        # Eb/N0 = 6 dB
print(f'Eb/N0 = 6 dB: antipodal Pb = {Q(sqrt(4*g/2)):.3e}')
print(f'Eb/N0 = 6 dB: on-off    Pb = {Q(sqrt(2*g/2)):.3e}')
db = np.arange(0, 12.25, 0.5); G = 10**(db/10)
plt.semilogy(db, [Q(sqrt(2*v)) for v in G], db, [Q(sqrt(v)) for v in G])
plt.xlabel(r'$E_b/N_0$ (dB)'); plt.ylabel(r'$P_b$')
plt.legend(['antipodal', 'on-off']); plt.grid(True)
plt.show()`},

'reg-priors': {
  title:'Binary error probability with unequal priors',
  what:'Two points $d=2$ apart, $N_0=0.5$, $P(\\mathbf s_1)=0.9$. Places the boundary at $\\mu=\\frac d2+\\frac{N_0}{2d}\\ln\\frac{P(\\mathbf s_1)}{P(\\mathbf s_0)}$ from $\\mathbf s_1$ and prints $P_e$ from the formula, at the midpoint, and from $200\\,000$ simulated symbols.',
  try:'Set $P(\\mathbf s_1)=0.5$. Predict $\\mu$ and whether the two formula values become equal, before you run it.',
  out:'boundary mu = 1.275 (midpoint 1.000)\nPe with mu       = 0.0122\nPe with midpoint = 0.0228\nPe simulated     = 0.0123',
  m:`% Two points d apart, P(s1) = 0.9, P(s0) = 0.1; positions measured from s1
Q = @(x) 0.5*erfc(x/sqrt(2));
d = 2; N0 = 0.5; P1 = 0.9; P0 = 0.1; sigma = sqrt(N0/2);
mu = d/2 + N0/(2*d)*log(P1/P0);                   % the boundary, measured from s1
fprintf('boundary mu = %.3f (midpoint %.3f)\\n', mu, d/2)
fprintf('Pe with mu       = %.4f\\n', P0*Q((d - mu)/sigma) + P1*Q(mu/sigma))
fprintf('Pe with midpoint = %.4f\\n', Q(d/2/sigma))
L = 200000; rng(1, 'twister'); u = rand(1, 3*L);  % the same numbers as NumPy seed 1
x = d*(u(1:L) > P1);                              % s1 at 0 (probability P1), s0 at d
n = sigma*sqrt(-2*log(u(L+1:2*L))) .* cos(2*pi*u(2*L+1:end));
dec = d*((x + n) > mu);                           % s0 is chosen beyond the boundary
fprintf('Pe simulated     = %.4f\\n', mean(dec ~= x))
r = linspace(-2, 4, 601); k = 1/sqrt(pi*N0);
plot(r, P1*k*exp(-r.^2/N0), r, P0*k*exp(-(r - d).^2/N0), 'LineWidth', 1.5)
xline(mu, '--'), grid on
xlabel('position along the line, from s_1')
legend('P(s_1) f(r|s_1)', 'P(s_0) f(r|s_0)')`,
  py:`import numpy as np, matplotlib.pyplot as plt
from math import erfc, sqrt, log
# Two points d apart, P(s1) = 0.9, P(s0) = 0.1; positions measured from s1
def Q(x): return 0.5*erfc(x/sqrt(2))
d, N0, P1, P0 = 2, 0.5, 0.9, 0.1
sigma = sqrt(N0/2)
mu = d/2 + N0/(2*d)*log(P1/P0)  # the boundary, measured from s1
print(f'boundary mu = {mu:.3f} (midpoint {d/2:.3f})')
print(f'Pe with mu       = {P0*Q((d - mu)/sigma) + P1*Q(mu/sigma):.4f}')
print(f'Pe with midpoint = {Q(d/2/sigma):.4f}')
L = 200000; np.random.seed(1); u = np.random.rand(3*L)  # same as MATLAB rng(1)
x = d*(u[:L] > P1)  # s1 at 0 (probability P1), s0 at d
n = sigma*np.sqrt(-2*np.log(u[L:2*L])) * np.cos(2*np.pi*u[2*L:])
dec = d*((x + n) > mu)  # s0 is chosen beyond the boundary
print(f'Pe simulated     = {np.mean(dec != x):.4f}')
r = np.linspace(-2, 4, 601); k = 1/sqrt(np.pi*N0)
plt.plot(r, P1*k*np.exp(-r**2/N0), r, P0*k*np.exp(-(r - d)**2/N0))
plt.axvline(mu, linestyle='--'); plt.grid(True)
plt.xlabel(r'position along the line, from $s_1$')
plt.legend([r'$P(s_1)f(r|s_1)$', r'$P(s_0)f(r|s_0)$'])
plt.show()`},

/* -------------------------------------------------------------- 4.4 ---- */
'un-mc': {
  title:'Error probability by simulation',
  what:'Sends $\\mathbf s_1=(1,1)$ from the square $(\\pm1,\\pm1)$ with $N_0=1$ and counts the observations outside its quadrant. It prints the fraction after $10$, $100$, up to $100\\,000$ symbols, and the exact $P_e=2Q-Q^2$ with $Q=Q(1/\\sqrt{N_0/2})$.',
  try:'Set $N_0=0.25$. Predict how many symbols the count needs before it settles, before you run it.',
  out:'    10 symbols: Pe = 0.3000\n   100 symbols: Pe = 0.2000\n  1000 symbols: Pe = 0.1480\n 10000 symbols: Pe = 0.1520\n100000 symbols: Pe = 0.1536\nexact: 2Q - Q^2 = 0.1511',
  m:`% Square of four points (+-1, +-1), d = 2, N0 = 1; s1 = (1, 1) is sent
N0 = 1; sigma = sqrt(N0/2); L = 100000;
Q = @(x) 0.5*erfc(x/sqrt(2));
rng(1, 'twister'); u = rand(1, 2*L);             % the same numbers as NumPy seed 1
a = sqrt(-2*log(u(1:L))); b = 2*pi*u(L+1:end);
r = [1 + sigma*a.*cos(b); 1 + sigma*a.*sin(b)];  % Box-Muller: two noise components
err = r(1,:) < 0 | r(2,:) < 0;                   % outside the first quadrant
for n = [10 100 1000 10000 100000]
    fprintf('%6d symbols: Pe = %.4f\\n', n, mean(err(1:n)))
end
fprintf('exact: 2Q - Q^2 = %.4f\\n', 2*Q(1/sigma) - Q(1/sigma)^2)
semilogx(1:L, cumsum(err)./(1:L), 'LineWidth', 1.5), grid on
xlabel('number of symbols'), ylabel('fraction in the wrong region')`,
  py:`import numpy as np, matplotlib.pyplot as plt
from math import erfc, sqrt
# Square of four points (+-1, +-1), d = 2, N0 = 1; s1 = (1, 1) is sent
N0, L = 1, 100000
sigma = sqrt(N0/2)
def Q(x): return 0.5*erfc(x/sqrt(2))
np.random.seed(1); u = np.random.rand(2*L)  # the same numbers as MATLAB rng(1)
a, b = np.sqrt(-2*np.log(u[:L])), 2*np.pi*u[L:]
r1, r2 = 1 + sigma*a*np.cos(b), 1 + sigma*a*np.sin(b)  # Box-Muller pair
err = (r1 < 0) | (r2 < 0)                              # outside the first quadrant
for n in [10, 100, 1000, 10000, 100000]:
    print(f'{n:6d} symbols: Pe = {np.mean(err[:n]):.4f}')
print(f'exact: 2Q - Q^2 = {2*Q(1/sigma) - Q(1/sigma)**2:.4f}')
plt.semilogx(np.arange(1, L+1), np.cumsum(err)/np.arange(1, L+1), linewidth=1.5)
plt.xlabel('number of symbols'); plt.ylabel('fraction in the wrong region')
plt.grid(True)
plt.show()`},

'un-bounds': {
  title:'Four bounds on the square constellation',
  what:'Takes the square $(\\pm1,\\pm1)$ with $d^2/2N_0=9$. It adds one $Q\\big(\\sqrt{d_{kj}^2/2N_0}\\big)$ for every other point, then for the faces only, then for the $N_{\\min}$ nearest points, then $M-1$ times at $d_{\\min}$. Each sum is printed next to the exact $P_e$.',
  try:'Set $N_0=2$, a low signal-to-noise ratio. Predict which bound lies furthest above the exact value, before you run it.',
  out:'general union bound  2.711e-03\nintelligent bound    2.700e-03\nnearest neighbour    2.700e-03\nminimum distance     4.050e-03\nexact (the square)   2.698e-03',
  m:`% Square of four points, d = 2, N0 = 2/9 so that d^2/(2 N0) = 9
S = [1 1; -1 1; -1 -1; 1 -1]; N0 = 2/9; M = size(S, 1);
Q = @(x) 0.5*erfc(x/sqrt(2));
D = sqrt((S(:,1) - S(:,1)').^2 + (S(:,2) - S(:,2)').^2);  % all distances d_kj
T = Q(sqrt(D.^2/(2*N0))); T(1:M+1:end) = 0;               % pairwise terms, j ~= k
face = false(M);  % s_j borders R_k: their midpoint is nearest to them only
for k = 1:M, for j = [1:k-1, k+1:M]
    dm = sum(((S(k,:) + S(j,:))/2 - S).^2, 2);
    face(k,j) = sum(dm <= dm(k) + 1e-9) == 2;
end, end
dmin = min(D(D > 0)); Nmin = mean(sum(abs(D - dmin) < 1e-9, 2));
fprintf('general union bound  %.3e\\n', mean(sum(T, 2)))
fprintf('intelligent bound    %.3e\\n', mean(sum(T.*face, 2)))
fprintf('nearest neighbour    %.3e\\n', Nmin*Q(sqrt(dmin^2/(2*N0))))
fprintf('minimum distance     %.3e\\n', (M-1)*Q(sqrt(dmin^2/(2*N0))))
fprintf('exact (the square)   %.3e\\n', 1 - (1 - Q(1/sqrt(N0/2)))^2)
plot(S(:,1), S(:,2), 'o', 'MarkerSize', 10), axis([-2 2 -2 2]), axis square, grid on
xlabel('\\psi_1'), ylabel('\\psi_2')`,
  py:`import numpy as np, matplotlib.pyplot as plt
from math import erfc, sqrt
# Square of four points, d = 2, N0 = 2/9 so that d^2/(2 N0) = 9
S = np.array([[1, 1], [-1, 1], [-1, -1], [1, -1]]); N0 = 2/9; M = len(S)
def Q(x): return 0.5*erfc(x/sqrt(2))
D = np.sqrt(((S[:,None,:] - S[None,:,:])**2).sum(axis=2))  # all distances d_kj
T = np.array([[Q(sqrt(v**2/(2*N0))) if v > 0 else 0 for v in row] for row in D])
face = np.zeros((M, M))  # s_j borders R_k: their midpoint is nearest to them only
for k in range(M):
    for j in [i for i in range(M) if i != k]:
        dm = np.sum(((S[k] + S[j])/2 - S)**2, axis=1)
        face[k,j] = np.sum(dm <= dm[k] + 1e-9) == 2
dmin = D[D > 0].min(); Nmin = np.mean(np.sum(np.abs(D - dmin) < 1e-9, axis=1))
print(f'general union bound  {np.mean(T.sum(axis=1)):.3e}')
print(f'intelligent bound    {np.mean((T*face).sum(axis=1)):.3e}')
print(f'nearest neighbour    {Nmin*Q(sqrt(dmin**2/(2*N0))):.3e}')
print(f'minimum distance     {(M-1)*Q(sqrt(dmin**2/(2*N0))):.3e}')
print(f'exact (the square)   {1 - (1 - Q(1/sqrt(N0/2)))**2:.3e}')
plt.plot(S[:,0], S[:,1], 'o', markersize=10); plt.axis('equal')
plt.xlabel(r'$\\psi_1$'); plt.ylabel(r'$\\psi_2$'); plt.grid(True)
plt.show()`},

'un-face': {
  title:'A face further away than $d_{\\min}$',
  what:'Takes the rectangle $(\\pm1.5,\\pm1)$ with $N_0=0.4$. The region of $\\mathbf s_1=(1.5,1)$ has a face with $\\mathbf s_4$ at $d_{\\min}=2$ and one with $\\mathbf s_2$ at $3$. The intelligent bound keeps that second term, and the nearest-neighbour form drops it.',
  try:'Stretch the rectangle to $(\\pm3,\\pm1)$. Predict whether the intelligent bound and the nearest-neighbour form move closer, before you run it.',
  out:'distances from s1: 3.000  3.606  2.000\ngeneral union bound  1.310e-02\nintelligent bound    1.307e-02\nnearest neighbour    1.267e-02\nminimum distance     3.802e-02\nexact (a rectangle)  1.307e-02',
  m:`% Rectangle (+-1.5, +-1), N0 = 0.4; every point sees the same distances as s1
S = [1.5 1; -1.5 1; -1.5 -1; 1.5 -1]; N0 = 0.4; M = 4;
Q = @(x) 0.5*erfc(x/sqrt(2));
q = @(d) Q(sqrt(d.^2/(2*N0)));                             % one pairwise term
D = sqrt(sum((S(1,:) - S(2:4,:)).^2, 2));  % distances from s1 to s2, s3, s4
dmin = min(D); Nmin = sum(abs(D - dmin) < 1e-9);
fprintf('distances from s1: %.3f  %.3f  %.3f\\n', D)
fprintf('general union bound  %.3e\\n', sum(q(D)))
fprintf('intelligent bound    %.3e\\n', q(D(1)) + q(D(3)))  % the faces with s2 and s4
fprintf('nearest neighbour    %.3e\\n', Nmin*q(dmin))
fprintf('minimum distance     %.3e\\n', (M-1)*q(dmin))
pc = (1 - Q(1.5/sqrt(N0/2)))*(1 - Q(1/sqrt(N0/2)));        % P(correct decision)
fprintf('exact (a rectangle)  %.3e\\n', 1 - pc)
plot(S(:,1), S(:,2), 'o', 'MarkerSize', 10), hold on
plot([0 0], [-3 3], '-', [-3 3], [0 0], '-'), hold off     % the region boundaries
axis([-3 3 -3 3]), axis square, grid on, xlabel('\\psi_1'), ylabel('\\psi_2')`,
  py:`import numpy as np, matplotlib.pyplot as plt
from math import erfc, sqrt
# Rectangle (+-1.5, +-1), N0 = 0.4; every point sees the same distances as s1
S = np.array([[1.5, 1], [-1.5, 1], [-1.5, -1], [1.5, -1]]); N0, M = 0.4, 4
def Q(x): return 0.5*erfc(x/sqrt(2))
def q(d): return Q(sqrt(d**2/(2*N0)))                   # one pairwise term
D = np.sqrt(np.sum((S[0] - S[1:])**2, axis=1))  # distances from s1 to s2, s3, s4
dmin = D.min(); Nmin = np.sum(np.abs(D - dmin) < 1e-9)
print(f'distances from s1: {D[0]:.3f}  {D[1]:.3f}  {D[2]:.3f}')
print(f'general union bound  {sum(q(v) for v in D):.3e}')
print(f'intelligent bound    {q(D[0]) + q(D[2]):.3e}')  # the faces with s2 and s4
print(f'nearest neighbour    {Nmin*q(dmin):.3e}')
print(f'minimum distance     {(M-1)*q(dmin):.3e}')
pc = (1 - Q(1.5/sqrt(N0/2)))*(1 - Q(1/sqrt(N0/2)))      # P(correct decision)
print(f'exact (a rectangle)  {1 - pc:.3e}')
plt.plot(S[:,0], S[:,1], 'o', markersize=10)
plt.plot([0, 0], [-3, 3], '-', [-3, 3], [0, 0], '-')    # the region boundaries
plt.axis([-3, 3, -3, 3]); plt.gca().set_aspect('equal')
plt.xlabel(r'$\\psi_1$'); plt.ylabel(r'$\\psi_2$'); plt.grid(True)
plt.show()`},

'un-exp': {
  title:'The exponential bound on $Q(x)$',
  what:'Prints $Q(x)$ and $\\tfrac12e^{-x^2/2}$ at $x=1,\\dots,5$, then the minimum-distance bound $(M-1)Q(3)$ and its exponential form $\\frac{M-1}{2}e^{-d_{\\min}^2/4N_0}$ for the square with $d^2/2N_0=9$.',
  try:'Predict, before you run it, whether the ratio of the two grows or shrinks as $x$ grows.',
  out:'x = 1   Q(x) = 1.587e-01   bound = 3.033e-01   ratio = 1.91\nx = 2   Q(x) = 2.275e-02   bound = 6.767e-02   ratio = 2.97\nx = 3   Q(x) = 1.350e-03   bound = 5.554e-03   ratio = 4.11\nx = 4   Q(x) = 3.167e-05   bound = 1.677e-04   ratio = 5.30\nx = 5   Q(x) = 2.867e-07   bound = 1.863e-06   ratio = 6.50\nsquare: (M-1) Q(3)               = 4.050e-03\nsquare: (M-1)/2 exp(-dmin^2/4N0) = 1.666e-02',
  m:`% Q(x) against the exponential bound (1/2) exp(-x^2/2)
Q = @(x) 0.5*erfc(x/sqrt(2));
for x = 1:5
    q = Q(x); b = 0.5*exp(-x^2/2);
    fprintf('x = %d   Q(x) = %.3e   bound = %.3e   ratio = %.2f\\n', x, q, b, b/q)
end
M = 4; g = 9;  % the square, d_min^2/(2 N0) = 9
fprintf('square: (M-1) Q(3)               = %.3e\\n', (M-1)*Q(sqrt(g)))
fprintf('square: (M-1)/2 exp(-dmin^2/4N0) = %.3e\\n', (M-1)/2*exp(-g/2))
x = linspace(0, 6, 300);
semilogy(x, Q(x), x, 0.5*exp(-x.^2/2), '--', 'LineWidth', 1.5), grid on
xlabel('x'), legend('Q(x)', '(1/2) e^{-x^2/2}')`,
  py:`import numpy as np, matplotlib.pyplot as plt
from math import erfc, sqrt, exp
# Q(x) against the exponential bound (1/2) exp(-x^2/2)
def Q(x): return 0.5*erfc(x/sqrt(2))
for x in range(1, 6):
    q, b = Q(x), 0.5*exp(-x**2/2)
    print(f'x = {x}   Q(x) = {q:.3e}   bound = {b:.3e}   ratio = {b/q:.2f}')
M, g = 4, 9  # the square, d_min^2/(2 N0) = 9
print(f'square: (M-1) Q(3)               = {(M-1)*Q(sqrt(g)):.3e}')
print(f'square: (M-1)/2 exp(-dmin^2/4N0) = {(M-1)/2*exp(-g/2):.3e}')
x = np.linspace(0, 6, 300)
plt.semilogy(x, [Q(v) for v in x], x, 0.5*np.exp(-x**2/2), '--', linewidth=1.5)
plt.xlabel(r'$x$'); plt.grid(True)
plt.legend([r'$Q(x)$', r'$\\frac{1}{2}e^{-x^2/2}$'])
plt.show()`}

};
