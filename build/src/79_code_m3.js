/* ==========================================================================
   Code for Module 3: programs in MATLAB and Python
   One entry a program, keyed by a short name. Each program draws a signal
   from the section and prints the number the section computes, with the same
   wording in both languages, so `out` is one text for both. MATLAB uses no
   toolbox; Python uses NumPy and Matplotlib only.
   `title`, `what` and `try` are student text and go through md(); the code
   is plain text. Each section closes with a code page (`CODE_BANKS_M3`) that
   pages through its programs.
   verify/code_check.py runs every entry in both languages and compares what
   it prints with `out`.
   ========================================================================== */
const CODE_BANKS_M3 = {
  'm3-code-vectors':      ['vec-coords', 'vec-inner', 'vec-energy'],
  'm3-code-constellation':['con-psk', 'con-qam', 'con-carrier'],
  'm3-code-gs':           ['gs-pulses', 'gs-book', 'gs-order']
};

const CODE_M3 = {

/* -------------------------------------------------------------- 3.1 ---- */
'vec-coords': {
  title:'Coordinates of four signals in the halves basis',
  what:'Builds $s_1,\\dots,s_4$ on $[0,2]$ and the basis $\\psi_1=1$ on $[0,1)$, $\\psi_2=1$ on $[1,2)$, then computes $s_{ij}=\\int s_i\\psi_j\\,dt$ on a fine grid.',
  try:'Change $s_1$ to $2$ on $[0,1)$ and $0$ on $[1,2)$. Predict its new vector before you run it.',
  out:'s1 = ( 1.000,  1.000)\ns2 = ( 1.000, -1.000)\ns3 = (-1.000,  1.000)\ns4 = (-1.000, -1.000)',
  m:`% Four signals on [0,2], basis psi1 = 1 on [0,1), psi2 = 1 on [1,2)
dt = 1e-3; t = (0:dt:2-dt) + dt/2;                  % midpoint samples
psi1 = double(t < 1); psi2 = double(t >= 1);
sigs = {ones(size(t)), psi1-psi2, psi2-psi1, -ones(size(t))};
names = {'s1','s2','s3','s4'};
for k = 1:4
    s = sigs{k};
    fprintf('%s = (%6.3f, %6.3f)\\n', names{k}, sum(s.*psi1)*dt, sum(s.*psi2)*dt)
end
plot(1, 1, 'o', 1, -1, 'o', -1, 1, 'o', -1, -1, 'o', 'MarkerSize', 8), grid on
xlabel('s_{i1}'), ylabel('s_{i2}')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# Four signals on [0,2], basis psi1 = 1 on [0,1), psi2 = 1 on [1,2)
dt = 1e-3
t = np.arange(0, 2, dt) + dt/2                      # midpoint samples
psi1, psi2 = (t < 1).astype(float), (t >= 1).astype(float)
sigs = [np.ones_like(t), psi1-psi2, psi2-psi1, -np.ones_like(t)]
names = ['s1', 's2', 's3', 's4']
for name, s in zip(names, sigs):
    c1, c2 = np.sum(s*psi1)*dt, np.sum(s*psi2)*dt
    print(f'{name} = ({c1:6.3f}, {c2:6.3f})')

plt.plot([1,1,-1,-1], [1,-1,1,-1], 'o', markersize=8)
plt.xlabel(r'$s_{i1}$'); plt.ylabel(r'$s_{i2}$'); plt.grid(True)
plt.show()`},

'vec-inner': {
  title:'Inner product from the waveform and from the vector',
  what:'Builds $x=2\\psi_1+\\psi_2$ and $y=\\psi_1-\\psi_2$ and prints $\\int x(t)y(t)\\,dt$ next to the dot product $(2,1)\\cdot(1,-1)$.',
  try:'Set $y=\\psi_1+2\\psi_2$. Predict the new integral and dot product before you run it.',
  out:'integral of x*y = 1.000\nx . y        = 1.000',
  m:`% x = 2*psi1 + psi2, y = psi1 - psi2, halves basis on [0,2)
dt = 1e-3; t = (0:dt:2-dt) + dt/2;
psi1 = double(t < 1);
psi2 = double(t >= 1);
x = 2*psi1 + psi2; y = psi1 - psi2;
xv = [2 1]; yv = [1 -1];
fprintf('integral of x*y = %.3f\\n', sum(x .* y) * dt)
fprintf('x . y        = %.3f\\n', dot(xv, yv))
plot(t, x, t, y, t, x.*y, 'LineWidth', 1.5), grid on
xlabel('t'), legend('x(t)', 'y(t)', 'x(t)y(t)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# x = 2*psi1 + psi2, y = psi1 - psi2, halves basis on [0,2)
dt = 1e-3
t = np.arange(0, 2, dt) + dt/2
psi1, psi2 = (t < 1).astype(float), (t >= 1).astype(float)
x, y = 2*psi1 + psi2, psi1 - psi2
xv, yv = np.array([2, 1]), np.array([1, -1])
print(f'integral of x*y = {np.sum(x*y)*dt:.3f}')
print(f'x . y        = {np.dot(xv, yv):.3f}')

plt.plot(t, x, t, y, t, x*y, linewidth=1.5)
plt.xlabel(r'$t$'); plt.legend([r'$x(t)$', r'$y(t)$', r'$x(t)y(t)$']); plt.grid(True)
plt.show()`},

'vec-energy': {
  title:'Energy and distance, waveform and vector',
  what:'Takes the four $(\\pm1,\\pm1)$ points and prints each energy from $\\int s^2\\,dt$ and from $\\|s\\|^2$, then the distances $d(s_1,s_2)$ and $d(s_1,s_4)$ both ways.',
  try:'Scale all four signals by 3. Predict the new energies and distances before you run it.',
  out:'E(s1) = 2.000 (waveform)   2.000 (vector)\nE(s2) = 2.000 (waveform)   2.000 (vector)\nE(s3) = 2.000 (waveform)   2.000 (vector)\nE(s4) = 2.000 (waveform)   2.000 (vector)\nd(s1,s2) = 2.000 (waveform)   2.000 (vector)\nd(s1,s4) = 2.828 (waveform)   2.828 (vector)',
  m:`% Energy and distance of the four square constellation points, both ways
dt = 1e-3; t = (0:dt:2-dt) + dt/2;
psi1 = double(t < 1); psi2 = double(t >= 1);
s1 = psi1+psi2; s2 = psi1-psi2; s3 = -psi1+psi2; s4 = -psi1-psi2;
sigs = {s1, s2, s3, s4}; vecs = {[1 1], [1 -1], [-1 1], [-1 -1]}; names = {'s1','s2','s3','s4'};
for k = 1:4
    fprintf('E(%s) = %.3f (waveform)   %.3f (vector)\\n', names{k}, sum(sigs{k}.^2)*dt, dot(vecs{k},vecs{k}))
end
fprintf('d(s1,s2) = %.3f (waveform)   %.3f (vector)\\n', sqrt(sum((s1-s2).^2)*dt), norm(vecs{1}-vecs{2}))
fprintf('d(s1,s4) = %.3f (waveform)   %.3f (vector)\\n', sqrt(sum((s1-s4).^2)*dt), norm(vecs{1}-vecs{4}))
plot([1 1 -1 -1], [1 -1 1 -1], 'o', 'MarkerSize', 8), grid on
xlabel('s_{i1}'), ylabel('s_{i2}')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# Energy and distance of the four square constellation points, both ways
dt = 1e-3
t = np.arange(0, 2, dt) + dt/2
psi1, psi2 = (t < 1).astype(float), (t >= 1).astype(float)
s1, s2, s3, s4 = psi1+psi2, psi1-psi2, -psi1+psi2, -psi1-psi2
sigs = [s1, s2, s3, s4]
vecs = [np.array([1,1]), np.array([1,-1]), np.array([-1,1]), np.array([-1,-1])]
names = ['s1', 's2', 's3', 's4']
for name, s, v in zip(names, sigs, vecs):
    print(f'E({name}) = {np.sum(s**2)*dt:.3f} (waveform)   {np.dot(v,v):.3f} (vector)')
print(f'd(s1,s2) = {np.sqrt(np.sum((s1-s2)**2)*dt):.3f} (waveform)   {np.linalg.norm(vecs[0]-vecs[1]):.3f} (vector)')
print(f'd(s1,s4) = {np.sqrt(np.sum((s1-s4)**2)*dt):.3f} (waveform)   {np.linalg.norm(vecs[0]-vecs[3]):.3f} (vector)')

plt.plot([1,1,-1,-1], [1,-1,1,-1], 'o', markersize=8)
plt.xlabel(r'$s_{i1}$'); plt.ylabel(r'$s_{i2}$'); plt.grid(True)
plt.show()`},

/* -------------------------------------------------------------- 3.2 ---- */
'con-psk': {
  title:'M-PSK points and the smallest distance',
  what:'Places $M=8$ points $(\\cos(2\\pi k/M),\\sin(2\\pi k/M))$ at energy $E=1$ and prints the average energy and $d_{\\min}=2\\sin(\\pi/M)$, checked against the adjacent-point distance.',
  try:'Set $M=16$. Predict $d_{\\min}$ before you run it.',
  out:'average energy = 1.000\nd_min (formula) = 0.765\nd_min (points)  = 0.765',
  m:`% M-PSK points at energy E = 1: (cos(2 pi k/M), sin(2 pi k/M))
M = 8; k = 0:M-1;
x = cos(2*pi*k/M);
y = sin(2*pi*k/M);
fprintf('average energy = %.3f\\n', mean(x.^2 + y.^2))
fprintf('d_min (formula) = %.3f\\n', 2*sin(pi/M))
fprintf('d_min (points)  = %.3f\\n', sqrt((x(2)-x(1))^2 + (y(2)-y(1))^2))
th = linspace(0, 2*pi, 200);
plot(cos(th), sin(th), '-', x, y, 'o', 'MarkerSize', 8), grid on, axis equal
xlabel('s_{i1}'), ylabel('s_{i2}')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# M-PSK points at energy E = 1: (cos(2 pi k/M), sin(2 pi k/M))
M = 8
k = np.arange(M)
x, y = np.cos(2*np.pi*k/M), np.sin(2*np.pi*k/M)
print(f'average energy = {np.mean(x**2 + y**2):.3f}')
print(f'd_min (formula) = {2*np.sin(np.pi/M):.3f}')
print(f'd_min (points)  = {np.sqrt((x[1]-x[0])**2 + (y[1]-y[0])**2):.3f}')

th = np.linspace(0, 2*np.pi, 200)
plt.plot(np.cos(th), np.sin(th), '-')
plt.plot(x, y, 'o', markersize=8)
plt.xlabel(r'$s_{i1}$'); plt.ylabel(r'$s_{i2}$'); plt.axis('equal'); plt.grid(True)
plt.show()`},

'con-qam': {
  title:'16-QAM scaled to unit average energy',
  what:'Scales the $\\{\\pm1,\\pm3\\}^2$ grid by $1/\\sqrt{10}$ and prints the scale, the average energy, the peak energy, and the smallest distance.',
  try:'Predict the peak-to-average energy ratio in dB before you run it.',
  out:'scale = 0.316\naverage energy = 1.000\npeak energy = 1.800\nd_min = 0.632',
  m:`% 16-QAM on {-3,-1,1,3}^2, scaled so the average symbol energy is 1
levels = [-3 -1 1 3];
[I, Q] = meshgrid(levels, levels); I = I(:); Q = Q(:);
scale = 1/sqrt(mean(I.^2 + Q.^2));
Is = I*scale; Qs = Q*scale;
fprintf('scale = %.3f\\n', scale)
fprintf('average energy = %.3f\\n', mean(Is.^2 + Qs.^2))
fprintf('peak energy = %.3f\\n', max(Is.^2 + Qs.^2))
fprintf('d_min = %.3f\\n', 2*scale)
plot(Is, Qs, 'o', 'MarkerSize', 8), grid on, axis equal
xlabel('s_{i1}'), ylabel('s_{i2}')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# 16-QAM on {-3,-1,1,3}^2, scaled so the average symbol energy is 1
levels = np.array([-3, -1, 1, 3])
I, Q = np.meshgrid(levels, levels)
I, Q = I.ravel(), Q.ravel()
scale = 1/np.sqrt(np.mean(I**2 + Q**2))
Is, Qs = I*scale, Q*scale
print(f'scale = {scale:.3f}')
print(f'average energy = {np.mean(Is**2 + Qs**2):.3f}')
print(f'peak energy = {np.max(Is**2 + Qs**2):.3f}')
print(f'd_min = {2*scale:.3f}')

plt.plot(Is, Qs, 'o', markersize=8)
plt.xlabel(r'$s_{i1}$'); plt.ylabel(r'$s_{i2}$'); plt.axis('equal'); plt.grid(True)
plt.show()`},

'con-carrier': {
  title:'Recovering QPSK vectors with the carrier basis',
  what:'Builds $\\psi_1(t)=\\sqrt{2/T}\\cos(2\\pi f_ct)$, $\\psi_2(t)=\\sqrt{2/T}\\sin(2\\pi f_ct)$, $T=1$, $f_c=3$, forms the four QPSK waveforms, and recovers each vector by correlation.',
  try:'Set $f_c=3.25$, not an integer number of cycles in $T$. Predict what happens to the orthogonality check.',
  out:'s1 = (-1.000,  1.000)\ns2 = ( 1.000,  1.000)\ns3 = (-1.000, -1.000)\ns4 = ( 1.000, -1.000)\nint psi1*psi2 dt = 0.000\nint psi1^2 dt = 1.000',
  m:`% Carrier basis psi1, psi2 on [0,T], T = 1, fc = 3 (fc*T an integer)
T = 1; fc = 3; dt = T/4000; t = (0:dt:T-dt) + dt/2;
psi1 = sqrt(2/T)*cos(2*pi*fc*t); psi2 = sqrt(2/T)*sin(2*pi*fc*t);
sigs = {-psi1+psi2, psi1+psi2, -psi1-psi2, psi1-psi2}; names = {'s1','s2','s3','s4'};
for k = 1:4
    fprintf('%s = (%6.3f, %6.3f)\\n', names{k}, sum(sigs{k}.*psi1)*dt, sum(sigs{k}.*psi2)*dt)
end
cross12 = sum(psi1 .* psi2) * dt; if abs(cross12) < 5e-4, cross12 = 0; end
fprintf('int psi1*psi2 dt = %.3f\\n', cross12)
fprintf('int psi1^2 dt = %.3f\\n', sum(psi1.^2) * dt)
plot(t, sigs{1}, 'LineWidth', 1.5), grid on
xlabel('t'), ylabel('s_1(t)')`,
  py:`import numpy as np
import matplotlib.pyplot as plt

# Carrier basis psi1, psi2 on [0,T], T = 1, fc = 3 (fc*T an integer)
T, fc = 1, 3
dt = T/4000
t = np.arange(0, T, dt) + dt/2
psi1, psi2 = np.sqrt(2/T)*np.cos(2*np.pi*fc*t), np.sqrt(2/T)*np.sin(2*np.pi*fc*t)
sigs = [-psi1+psi2, psi1+psi2, -psi1-psi2, psi1-psi2]
names = ['s1', 's2', 's3', 's4']
for name, s in zip(names, sigs):
    print(f'{name} = ({np.sum(s*psi1)*dt:6.3f}, {np.sum(s*psi2)*dt:6.3f})')
cross12 = np.sum(psi1*psi2)*dt
if abs(cross12) < 5e-4: cross12 = 0.0
print(f'int psi1*psi2 dt = {cross12:.3f}')
print(f'int psi1^2 dt = {np.sum(psi1**2)*dt:.3f}')

plt.plot(t, sigs[0], linewidth=1.5)
plt.xlabel(r'$t$'); plt.ylabel(r'$s_1(t)$'); plt.grid(True)
plt.show()`},

/* -------------------------------------------------------------- 3.3 ---- */
'gs-pulses': {
  title:'Gram–Schmidt on three rectangular pulses',
  what:'Runs Gram–Schmidt on sampled waveforms for $s_1=1$ on $[0,2)$, $s_2=1$ on $[2,3)$, $s_3=1$ on $[0,3)$, and prints the dimension $N$ and each vector.',
  try:'Change $s_3$ to $1$ on $[0,2.5)$. Predict the new $N$ before you run it.',
  out:'N = 2\ns1 = (1.414, 0.000)\ns2 = (0.000, 1.000)\ns3 = (1.414, 1.000)',
  m:`% Gram-Schmidt on sampled waveforms, dt = 1e-3, s1,s2,s3 on [0,3)
dt = 1e-3; t = (0:dt:3-dt) + dt/2;
sigs = {double(t<2), double(t>=2 & t<3), double(t<3)}; names = {'s1','s2','s3'};
basis = {}; coords = {};
for k = 1:3
    g = sigs{k}; c = [];
    for b = basis, cc = sum(g.*b{1})*dt; c(end+1) = cc; g = g - cc*b{1}; end
    E = sum(g.^2)*dt;
    if E >= 3e-9, nrm = sqrt(E); basis{end+1} = g/nrm; c(end+1) = nrm; end
    coords{k} = c;
end
fprintf('N = %d\\n', numel(basis))
for k = 1:3
    c = coords{k}; while numel(c) < numel(basis), c(end+1) = 0; end
    c(abs(c) < 5e-4) = 0;
    fprintf('%s = (%.3f, %.3f)\\n', names{k}, c(1), c(2))
end
plot(t, basis{1}, t, basis{2}, 'LineWidth', 1.5), grid on
xlabel('t'), legend('psi_1', 'psi_2')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Gram-Schmidt on sampled waveforms, dt = 1e-3, s1,s2,s3 on [0,3)
dt = 1e-3; t = np.arange(0, 3, dt) + dt/2
sigs = [(t<2).astype(float), ((t>=2)&(t<3)).astype(float), (t<3).astype(float)]
names = ['s1', 's2', 's3']
basis, coords = [], []
for s in sigs:
    g = s.copy(); c = []
    for b in basis: cc = np.sum(g*b)*dt; c.append(cc); g = g - cc*b
    E = np.sum(g**2)*dt
    if E >= 3e-9: nrm = np.sqrt(E); basis.append(g/nrm); c.append(nrm)
    coords.append(c)
print(f'N = {len(basis)}')
for name, c in zip(names, coords):
    c = np.array(c + [0.0]*(len(basis)-len(c))); c[np.abs(c) < 5e-4] = 0
    print(f'{name} = ({c[0]:.3f}, {c[1]:.3f})')
plt.plot(t, basis[0], t, basis[1], linewidth=1.5)
plt.xlabel(r'$t$'); plt.legend([r'$\\psi_1$', r'$\\psi_2$']); plt.grid(True)
plt.show()`},

'gs-book': {
  title:'Four signals, three axes',
  what:'Runs Gram–Schmidt on $s_1,\\dots,s_4$ on $[0,3)$ and prints $N$, each vector, and each energy $\\int s_i^2\\,dt$.',
  try:'Predict which basis function changes if $s_4$ is taken first, before you run it.',
  out:'N = 3\ns1 = (1.414, 0.000, 0.000)\ns2 = (0.000, 1.414, 0.000)\ns3 = (0.000, -1.414, 1.000)\ns4 = (1.414, 0.000, 1.000)\nE(s1) = 2.000\nE(s2) = 2.000\nE(s3) = 3.000\nE(s4) = 3.000',
  m:`% s1=1 on [0,2); s2=+-1 on [0,1),[1,2); s3=-1,+1 on [0,1),[1,3); s4=1 on [0,3)
dt = 1e-3; t = (0:dt:3-dt) + dt/2;
sigs = {double(t<2), double(t<1)-double(t>=1&t<2), -double(t<1)+double(t>=1&t<3), double(t<3)};
names = {'s1','s2','s3','s4'}; basis = {}; coords = {};
for k = 1:4
    g = sigs{k}; c = [];
    for b = basis, cc = sum(g.*b{1})*dt; c(end+1) = cc; g = g - cc*b{1}; end
    E = sum(g.^2)*dt;
    if E >= 3e-9, nrm = sqrt(E); basis{end+1} = g/nrm; c(end+1) = nrm; end
    coords{k} = c;
end
fprintf('N = %d\\n', numel(basis))
for k = 1:4
    c = coords{k}; while numel(c) < numel(basis), c(end+1) = 0; end
    c(abs(c) < 5e-4) = 0;
    fprintf('%s = (%.3f, %.3f, %.3f)\\n', names{k}, c(1), c(2), c(3))
end
for k = 1:4, fprintf('E(%s) = %.3f\\n', names{k}, sum(sigs{k}.^2)*dt), end
plot(t, basis{1}, t, basis{2}, t, basis{3}, 'LineWidth', 1.5), grid on
xlabel('t'), legend('psi_1', 'psi_2', 'psi_3')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# s1=1 on [0,2); s2=+-1 on [0,1),[1,2); s3=-1,+1 on [0,1),[1,3); s4=1 on [0,3)
dt = 1e-3; t = np.arange(0, 3, dt) + dt/2
sigs = [(t<2).astype(float), (t<1).astype(float)-((t>=1)&(t<2)).astype(float),
        -(t<1).astype(float)+((t>=1)&(t<3)).astype(float), (t<3).astype(float)]
names = ['s1', 's2', 's3', 's4']
basis, coords = [], []
for s in sigs:
    g = s.copy(); c = []
    for b in basis: cc = np.sum(g*b)*dt; c.append(cc); g = g - cc*b
    E = np.sum(g**2)*dt
    if E >= 3e-9: nrm = np.sqrt(E); basis.append(g/nrm); c.append(nrm)
    coords.append(c)
print(f'N = {len(basis)}')
for name, c in zip(names, coords):
    c = np.array(c + [0.0]*(len(basis)-len(c))); c[np.abs(c) < 5e-4] = 0
    print(f'{name} = ({c[0]:.3f}, {c[1]:.3f}, {c[2]:.3f})')
for name, s in zip(names, sigs): print(f'E({name}) = {np.sum(s**2)*dt:.3f}')
plt.plot(t, basis[0], t, basis[1], t, basis[2], linewidth=1.5)
plt.xlabel(r'$t$'); plt.legend([r'$\\psi_1$', r'$\\psi_2$', r'$\\psi_3$']); plt.grid(True)
plt.show()`},

'gs-order': {
  title:'Gram–Schmidt in reverse order',
  what:'Runs Gram–Schmidt on the same four signals taken $s_4,s_3,s_2,s_1$, prints the new vectors, then shows every energy and pairwise distance is unchanged from the forward order.',
  try:'Predict whether $N$ changes with the order, before you run it.',
  out:'N = 3\ns4 = (1.732, 0.000, 0.000)\ns3 = (0.577, 1.633, 0.000)\ns2 = (0.000, -1.225, 0.707)\ns1 = (1.155, -0.408, -0.707)\nE(s1) = 2.000   E(s2) = 2.000   E(s3) = 3.000   E(s4) = 3.000\nd12 = 2.000\nd13 = 2.236\nd14 = 1.000\nd23 = 3.000\nd24 = 2.236\nd34 = 2.000',
  m:`% Same four signals, Gram-Schmidt taken in the order s4, s3, s2, s1
dt = 1e-3; t = (0:dt:3-dt) + dt/2;
sv = {double(t<2), double(t<1)-double(t>=1&t<2), -double(t<1)+double(t>=1&t<3), double(t<3)};
sigs = {sv{4},sv{3},sv{2},sv{1}}; names = {'s4','s3','s2','s1'}; basis = {}; coords = {};
for k = 1:4
    g = sigs{k}; c = [];
    for b = basis, cc = sum(g.*b{1})*dt; c(end+1) = cc; g = g - cc*b{1}; end
    E = sum(g.^2)*dt;
    if E >= 3e-9, nrm = sqrt(E); basis{end+1} = g/nrm; c(end+1) = nrm; end
    while numel(c) < 3, c(end+1) = 0; end
    c(abs(c) < 5e-4) = 0; coords{k} = c;
end
fprintf('N = %d\\n', numel(basis))
for k = 1:4, fprintf('%s = (%.3f, %.3f, %.3f)\\n', names{k}, coords{k}), end
V = [coords{4}; coords{3}; coords{2}; coords{1}];     % rows in s1..s4 order
fprintf('E(s1) = %.3f   E(s2) = %.3f   E(s3) = %.3f   E(s4) = %.3f\\n', sum(V.^2, 2))
pairs = [1 2; 1 3; 1 4; 2 3; 2 4; 3 4];
for p = pairs', fprintf('d%d%d = %.3f\\n', p(1), p(2), norm(V(p(1),:)-V(p(2),:))), end
plot(t, basis{1}, t, basis{2}, t, basis{3}, 'LineWidth', 1.5), grid on
xlabel('t'), legend('psi_1', 'psi_2', 'psi_3')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Same four signals, Gram-Schmidt taken in the order s4, s3, s2, s1
dt = 1e-3; t = np.arange(0, 3, dt) + dt/2
lo, mid, hi = (t<1).astype(float), ((t>=1)&(t<2)).astype(float), ((t>=1)&(t<3)).astype(float)
sv = [(t<2).astype(float), lo-mid, hi-lo, (t<3).astype(float)]           # s1, s2, s3, s4
sigs, names, basis, coords = [sv[3], sv[2], sv[1], sv[0]], ['s4', 's3', 's2', 's1'], [], []
for s in sigs:
    g = s.copy(); c = []
    for b in basis: cc = np.sum(g*b)*dt; c.append(cc); g = g - cc*b
    E = np.sum(g**2)*dt
    if E >= 3e-9: nrm = np.sqrt(E); basis.append(g/nrm); c.append(nrm)
    c = np.array(c + [0.0]*(3-len(c))); c[np.abs(c) < 5e-4] = 0
    coords.append(c)
print(f'N = {len(basis)}')
for name, c in zip(names, coords): print(f'{name} = ({c[0]:.3f}, {c[1]:.3f}, {c[2]:.3f})')
V = np.array([coords[3], coords[2], coords[1], coords[0]])   # rows in s1..s4 order
print('   '.join(f'E(s{i+1}) = {np.dot(V[i],V[i]):.3f}' for i in range(4)))
for a, b in [(1,2),(1,3),(1,4),(2,3),(2,4),(3,4)]: print(f'd{a}{b} = {np.linalg.norm(V[a-1]-V[b-1]):.3f}')
plt.plot(t, basis[0], t, basis[1], t, basis[2], linewidth=1.5)
plt.xlabel(r'$t$'); plt.legend([r'$\\psi_1$', r'$\\psi_2$', r'$\\psi_3$']); plt.grid(True)
plt.show()`}

};
