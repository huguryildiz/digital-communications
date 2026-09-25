/* ==========================================================================
   Code for Module 6: programs in MATLAB and Python
   One entry a program, keyed by a short name. Each program draws a figure
   from the section (a set of bars, a curve, a tree's lengths) and prints the
   number the section computes, with the same wording in both languages, so
   `out` is one text for both. MATLAB uses no toolbox; Python uses NumPy and
   Matplotlib only.
   Random bits are drawn from `rand` with seed 1 (MATLAB `rng(1,'twister')`,
   NumPy `np.random.seed(1)`), which gives the same uniform numbers in both
   languages, so a random program prints the same text in both.
   The sources are the ones the slides and laboratories use: the Huffman
   source 0.4, 0.2, 0.2, 0.1, 0.1; the three-symbol source 0.7, 0.2, 0.1; the
   BSC with p = 0.1; the Z-channel (1, 0; 1/2, 1/2); the joint pmf 0.4, 0.1,
   0.1, 0.4; the water-filling noise 0.1, 0.2, 0.4, 0.8, 1.6, 3.2.
   The keys carry an `m6-` prefix because CODE_LIB is one flat object.
   `title`, `what` and `try` are student text and go through md(); the code
   is plain text. Each section closes with a code page (`CODE_BANKS_M6`) that
   pages through its programs.
   verify/code_check.py runs every entry in both languages and compares what
   it prints with `out`.
   ========================================================================== */
const CODE_BANKS_M6 = {
  'm6-code-entropy':  ['m6-ent-self', 'm6-ent-h', 'm6-ent-ext', 'm6-ent-text'],
  'm6-code-bound':    ['m6-bnd-kraft', 'm6-bnd-typical', 'm6-bnd-block', 'm6-bnd-rd'],
  'm6-code-huffman':  ['m6-huf-build', 'm6-huf-var', 'm6-huf-pairs', 'm6-huf-lz'],
  'm6-code-channel':  ['m6-ch-output', 'm6-ch-joint', 'm6-ch-mutual', 'm6-ch-mc'],
  'm6-code-capacity': ['m6-cap-search', 'm6-cap-bec', 'm6-cap-rep', 'm6-cap-sym'],
  'm6-code-gauss':    ['m6-gs-shannon', 'm6-gs-wide', 'm6-gs-plane', 'm6-gs-water']
};

const CODE_M6 = {

/* -------------------------------------------------------------- 6.1 ---- */
'm6-ent-self': {
  title:'Self-information in bits',
  what:'Prints $I(p)=-\\log_2 p$ for $p=\\tfrac12$ down to $\\tfrac1{64}$ and draws the curve. Each halving of $p$ adds one bit. For two independent events the probabilities multiply, so the bits add.',
  try:'Add $p=\\tfrac1{128}$ to the list. Predict its self-information before you run it.',
  out:'   p     I(p) (bits)\n  1/2        1\n  1/4        2\n  1/8        3\n  1/16       4\n  1/32       5\n  1/64       6\nI(1/2 x 1/4) = 3 bits = I(1/2) + I(1/4)',
  m:`% Self-information I(p) = -log2(p) of an event with probability p
p = 1./2.^(1:6);                             % 1/2, 1/4, ..., 1/64
I = -log2(p);                                % in bits
fprintf('   p     I(p) (bits)\\n')
fprintf('  1/%-2d       %d\\n', [1./p; I])
% two independent events: the probabilities multiply, the bits add
fprintf('I(1/2 x 1/4) = %d bits = I(1/2) + I(1/4)\\n', -log2(1/2*1/4))
q = linspace(0.005, 1, 400);
plot(q, -log2(q), 'LineWidth', 1.5), hold on
plot(p, I, 'o'), hold off, grid on
xlabel('p'), ylabel('I(p) (bits)')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Self-information I(p) = -log2(p) of an event with probability p
p = 1/2**np.arange(1, 7)                     # 1/2, 1/4, ..., 1/64
I = -np.log2(p)                              # in bits
print('   p     I(p) (bits)')
for k in range(6):
    print(f'  1/{int(1/p[k]):<2d}       {int(I[k])}')
# two independent events: the probabilities multiply, the bits add
print(f'I(1/2 x 1/4) = {int(-np.log2(1/2*1/4))} bits = I(1/2) + I(1/4)')
q = np.linspace(0.005, 1, 400)
plt.plot(q, -np.log2(q), linewidth=1.5); plt.plot(p, I, 'o'); plt.grid(True)
plt.xlabel(r'$p$'); plt.ylabel(r'$I(p)$ (bits)')
plt.show()`},

'm6-ent-h': {
  title:'Entropy of a three-symbol source',
  what:'Takes the source $0.7,\\,0.2,\\,0.1$ and prints each symbol\'s self-information $I(s_k)$ and its share $p_kI(s_k)$. The shares add up to the entropy $H$, which is compared with $\\log_2 3$, the entropy of three equally likely symbols.',
  try:'Change the source to $0.5,\\,0.3,\\,0.2$. Predict whether $H$ moves toward $\\log_2 3$ before you run it.',
  out:'symbol    p     I (bits)    p*I\n  s1     0.7    0.5146    0.3602\n  s2     0.2    2.3219    0.4644\n  s3     0.1    3.3219    0.3322\nH = 1.1568 bits, log2(3) = 1.5850 bits',
  m:`% Entropy of the source 0.7, 0.2, 0.1: the average self-information
p = [0.7 0.2 0.1];
I = -log2(p);                                % self-information of each symbol
H = sum(p.*I);                               % entropy, bits a symbol
fprintf('symbol    p     I (bits)    p*I\\n')
for k = 1:3
    fprintf('  s%d     %.1f    %.4f    %.4f\\n', k, p(k), I(k), p(k)*I(k))
end
fprintf('H = %.4f bits, log2(3) = %.4f bits\\n', H, log2(3))
bar([I(:), p(:).*I(:)]), hold on
yline(H, '--'), yline(log2(3), ':'), hold off, grid on
xticklabels({'s_1', 's_2', 's_3'}), ylabel('bits')
legend('I(s_k)', 'p_k I(s_k)', 'H', 'log_2 3')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Entropy of the source 0.7, 0.2, 0.1: the average self-information
p = np.array([0.7, 0.2, 0.1])
I = -np.log2(p)                              # self-information of each symbol
H = np.sum(p*I)                              # entropy, bits a symbol
print('symbol    p     I (bits)    p*I')
for k in range(3):
    print(f'  s{k+1}     {p[k]:.1f}    {I[k]:.4f}    {p[k]*I[k]:.4f}')
print(f'H = {H:.4f} bits, log2(3) = {np.log2(3):.4f} bits')
k = np.arange(3)
plt.bar(k - 0.2, I, 0.4); plt.bar(k + 0.2, p*I, 0.4)
plt.axhline(H, linestyle='--'); plt.axhline(np.log2(3), linestyle=':')
plt.xticks(k, [r'$s_1$', r'$s_2$', r'$s_3$']); plt.ylabel('bits'); plt.grid(True)
plt.legend([r'$H$', r'$\\log_2 3$', r'$I(s_k)$', r'$p_k I(s_k)$'])
plt.show()`},

'm6-ent-ext': {
  title:'The second extension of a source',
  what:'Builds the nine pair probabilities of $S^2$ as products $p_ip_j$, one outer product of the source $0.7,\\,0.2,\\,0.1$ with itself. Its entropy is twice that of $S$, because the two symbols of a pair are independent.',
  try:'Build the third extension with one more outer product. Predict $H(S^3)$ before you run it.',
  out:'pair probabilities p(i)p(j)\n  0.49  0.14  0.07\n  0.14  0.04  0.02\n  0.07  0.02  0.01\nH(S)   = 1.1568 bits\nH(S^2) = 2.3136 bits = 2 H(S) = 2.3136 bits',
  m:`% Second extension S^2: pairs of independent symbols from 0.7, 0.2, 0.1
p = [0.7 0.2 0.1];
P2 = p(:)*p;                                 % P2(i,j) = p(i) p(j), a 3 x 3 table
H = @(q) -sum(q(:).*log2(q(:)));             % entropy of a table of probabilities
fprintf('pair probabilities p(i)p(j)\\n')
for i = 1:3
    fprintf('  %.2f  %.2f  %.2f\\n', P2(i,:))
end
fprintf('H(S)   = %.4f bits\\n', H(p))
fprintf('H(S^2) = %.4f bits = 2 H(S) = %.4f bits\\n', H(P2), 2*H(p))
bar(sort(P2(:), 'descend')), grid on
xlabel('pair, most likely first'), ylabel('probability')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Second extension S^2: pairs of independent symbols from 0.7, 0.2, 0.1
p = np.array([0.7, 0.2, 0.1])
P2 = np.outer(p, p)                          # P2[i,j] = p[i] p[j], a 3 x 3 table
def H(q): return -np.sum(q*np.log2(q))       # entropy of a table of probabilities
print('pair probabilities p(i)p(j)')
for i in range(3):
    print('  ' + '  '.join(f'{v:.2f}' for v in P2[i]))
print(f'H(S)   = {H(p):.4f} bits')
print(f'H(S^2) = {H(P2):.4f} bits = 2 H(S) = {2*H(p):.4f} bits')
plt.bar(np.arange(1, 10), np.sort(P2.ravel())[::-1]); plt.grid(True)
plt.xlabel('pair, most likely first'); plt.ylabel('probability')
plt.show()`},

'm6-ent-text': {
  title:'Letter statistics of a sentence',
  what:'Counts the $26$ letters and the space in one sentence, $27$ symbols, and turns the counts into probabilities. The entropy of those letter frequencies is compared with $\\log_2 27$, the entropy if every symbol were equally likely.',
  try:'Replace the sentence by a longer one of your own. Predict whether $H$ stays near $4$ bits a letter before you run it.',
  out:'95 characters, 20 different symbols\nH = 4.0120 bits a letter, log2(27) = 4.7549 bits\na fixed-length code needs 5 bits a letter',
  m:`% Letter statistics of one sentence: 26 letters and the space, 27 symbols
s = ['a message that we could predict in advance would tell us ', ...
     'nothing new so information is surprise'];
a = [' ', 'a':'z'];                          % the 27 symbols
n = zeros(1, 27);
for k = 1:27
    n(k) = sum(s == a(k));                   % how often symbol k occurs
end
p = n(n > 0)/length(s);                      % frequencies of the symbols used
H = -sum(p.*log2(p));
fprintf('%d characters, %d different symbols\\n', length(s), nnz(n))
fprintf('H = %.4f bits a letter, log2(27) = %.4f bits\\n', H, log2(27))
fprintf('a fixed-length code needs %d bits a letter\\n', ceil(log2(27)))
bar(0:26, n/length(s)), grid on
xticks(0:26), xticklabels(num2cell(a))
xlabel('symbol (the first bar is the space)'), ylabel('relative frequency')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Letter statistics of one sentence: 26 letters and the space, 27 symbols
s = ('a message that we could predict in advance would tell us '
     'nothing new so information is surprise')
a = ' abcdefghijklmnopqrstuvwxyz'               # the 27 symbols
n = np.array([s.count(c) for c in a])        # how often each symbol occurs
p = n[n > 0]/len(s)                          # frequencies of the symbols used
H = -np.sum(p*np.log2(p))
print(f'{len(s)} characters, {np.count_nonzero(n)} different symbols')
print(f'H = {H:.4f} bits a letter, log2(27) = {np.log2(27):.4f} bits')
print(f'a fixed-length code needs {int(np.ceil(np.log2(27)))} bits a letter')
plt.bar(range(27), n/len(s)); plt.grid(True)
plt.xticks(range(27), list(a))
plt.xlabel('symbol (the first bar is the space)'); plt.ylabel('relative frequency')
plt.show()`},

/* -------------------------------------------------------------- 6.2 ---- */
'm6-bnd-kraft': {
  title:'The Kraft inequality',
  what:'A codeword of length $l$ takes the share $2^{-l}$ of the code tree. The program adds the shares $\\sum_k 2^{-l_k}$ for Codes I, II and III and for the lengths $1,2,2,3$. A sum above $1$ means no prefix code has those lengths.',
  try:'Change the last row to lengths $2,2,2,3$. Predict the sum before you run it.',
  out:'code             Kraft sum\nCode I           1.5000  no prefix code can have these lengths\nCode II          1.0000  a prefix code can have these lengths\nCode III         0.9375  a prefix code can have these lengths\nlengths 1,2,2,3  1.1250  no prefix code can have these lengths',
  m:`% Kraft sum of 2^(-l) over the codeword lengths l of four codes
L = [1 1 2 2; 1 2 3 3; 1 2 3 4; 1 2 2 3];    % one code a row
name = {'Code I', 'Code II', 'Code III', 'lengths 1,2,2,3'};
S = 2.^(-L);                                 % the share of the tree each takes
K = sum(S, 2);                               % the Kraft sum of each code
fprintf('code             Kraft sum\\n')
for c = 1:4
    if K(c) <= 1, v = 'a prefix code can have these lengths';
    else,         v = 'no prefix code can have these lengths'; end
    fprintf('%-16s %.4f  %s\\n', name{c}, K(c), v)
end
bar(S, 'stacked'), yline(1, '--'), grid on
xticklabels(name), ylabel('sum of 2^{-l}')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Kraft sum of 2^(-l) over the codeword lengths l of four codes
L = np.array([[1, 1, 2, 2], [1, 2, 3, 3], [1, 2, 3, 4], [1, 2, 2, 3]])  # a code a row
name = ['Code I', 'Code II', 'Code III', 'lengths 1,2,2,3']
S = 2.0**(-L)                                # the share of the tree each takes
K = S.sum(axis=1)                            # the Kraft sum of each code
print('code             Kraft sum')
for c in range(4):
    if K[c] <= 1: v = 'a prefix code can have these lengths'
    else:         v = 'no prefix code can have these lengths'
    print(f'{name[c]:16s} {K[c]:.4f}  {v}')
base = np.zeros(4)
for j in range(4):                           # stack the shares, a layer a codeword
    plt.bar(range(4), S[:, j], bottom=base); base += S[:, j]
plt.axhline(1, linestyle='--'); plt.grid(True)
plt.xticks(range(4), name); plt.ylabel(r'sum of $2^{-l}$')
plt.show()`},

'm6-bnd-typical': {
  title:'Probability of the typical set',
  what:'For a binary source with $P(1)=0.2$, a sequence of $n$ bits is typical when $-\\tfrac1n\\log_2P(\\mathbf{x})$ lies within $0.1$ of $H=0.7219$. The program adds the exact binomial probabilities of the typical sequences and counts them.',
  try:'Narrow the band to $0.05$. Predict whether $P(\\text{typical})$ at $n=100$ rises or falls before you run it.',
  out:'H = 0.7219 bits, band 0.1\n   n   P(typical)   (1/n) log2(size)\n  10     0.3020        0.5492\n 100     0.8321        0.7824\n1000     0.9999        0.8068',
  m:`% Binary source, P(1) = 0.2: sequences with -(1/n) log2 P(x) within e of H
p = 0.2; e = 0.1; H = -p*log2(p) - (1-p)*log2(1-p);
fprintf('H = %.4f bits, band %.1f\\n   n   P(typical)   (1/n) log2(size)\\n', H, e)
N = 10:10:1000; Pt = zeros(size(N));
for i = 1:length(N)
    n = N(i); k = 0:n;                               % k ones among n bits
    lf = [0, cumsum(log(1:n))];                      % log(0!), ..., log(n!)
    lc = lf(n+1) - lf(k+1) - lf(n-k+1);              % log of n choose k
    s = -(k*log2(p) + (n-k)*log2(1-p))/n;            % -(1/n) log2 P(x)
    t = abs(s - H) <= e + 1e-12;                     % the typical k, edge included
    Pt(i) = sum(exp(lc(t) + k(t)*log(p) + (n-k(t))*log(1-p)));
    if any(n == [10 100 1000])
        fprintf('%4d     %.4f        %.4f\\n', n, Pt(i), log2(sum(exp(lc(t))))/n)
    end
end
plot(N, Pt, 'LineWidth', 1.5), grid on, ylim([0 1])
xlabel('n'), ylabel('P(typical set)')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Binary source, P(1) = 0.2: sequences with -(1/n) log2 P(x) within e of H
p = 0.2; e = 0.1; H = -p*np.log2(p) - (1-p)*np.log2(1-p)
print(f'H = {H:.4f} bits, band {e:.1f}')
print('   n   P(typical)   (1/n) log2(size)')
N = np.arange(10, 1001, 10); Pt = np.zeros(len(N))
for i, n in enumerate(N):
    k = np.arange(n + 1)                             # k ones among n bits
    lf = np.r_[0, np.cumsum(np.log(np.arange(1, n+1)))]   # log(0!), ..., log(n!)
    lc = lf[n] - lf[k] - lf[n-k]                     # log of n choose k
    s = -(k*np.log2(p) + (n-k)*np.log2(1-p))/n       # -(1/n) log2 P(x)
    t = np.abs(s - H) <= e + 1e-12                   # the typical k, edge included
    Pt[i] = np.sum(np.exp(lc[t] + k[t]*np.log(p) + (n-k[t])*np.log(1-p)))
    if n in (10, 100, 1000):
        print(f'{n:4d}     {Pt[i]:.4f}        {np.log2(np.sum(np.exp(lc[t])))/n:.4f}')
plt.plot(N, Pt, linewidth=1.5); plt.grid(True); plt.ylim(0, 1)
plt.xlabel(r'$n$'); plt.ylabel('P(typical set)')
plt.show()`},

'm6-bnd-block': {
  title:'Coding blocks of symbols',
  what:'Coding $n$ symbols of the source $0.7,\\,0.2,\\,0.1$ at a time gives $H\\le \\bar L_n/n<H+1/n$, where $\\bar L_n$ is the average length of the block code. The program prints the upper bound and the number of codewords $K^n$ the code needs.',
  try:'Predict the smallest $n$ that brings the bound within $0.05$ bits of $H$, and how many codewords that code needs.',
  out:'H = 1.1568 bits a symbol\n n   codewords K^n   upper bound H + 1/n\n 1               3   2.1568\n 2               9   1.6568\n 3              27   1.4901\n 4              81   1.4068\n 5             243   1.3568\n 6             729   1.3234\n 7            2187   1.2996\n 8            6561   1.2818\n 9           19683   1.2679\n10           59049   1.2568',
  m:`% Blocks of n symbols from 0.7, 0.2, 0.1: H <= (average length)/n < H + 1/n
p = [0.7 0.2 0.1]; K = numel(p);             % K symbols
H = -sum(p.*log2(p));                        % entropy, bits a symbol
n = 1:10;
fprintf('H = %.4f bits a symbol\\n', H)
fprintf(' n   codewords K^n   upper bound H + 1/n\\n')
fprintf('%2d   %13d   %.4f\\n', [n; K.^n; H + 1./n])
plot(n, H + 1./n, 'o-', 'LineWidth', 1.5), hold on
yline(H, '--'), hold off, grid on
xlabel('block length n'), ylabel('bits a symbol')
legend('H + 1/n', 'H')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Blocks of n symbols from 0.7, 0.2, 0.1: H <= (average length)/n < H + 1/n
p = np.array([0.7, 0.2, 0.1]); K = len(p)    # K symbols
H = -np.sum(p*np.log2(p))                    # entropy, bits a symbol
n = np.arange(1, 11)
print(f'H = {H:.4f} bits a symbol')
print(' n   codewords K^n   upper bound H + 1/n')
for m in n:
    print(f'{m:2d}   {K**m:13d}   {H + 1/m:.4f}')
plt.plot(n, H + 1/n, 'o-', linewidth=1.5); plt.axhline(H, linestyle='--')
plt.grid(True); plt.xlabel(r'block length $n$'); plt.ylabel('bits a symbol')
plt.legend([r'$H + 1/n$', r'$H$'])
plt.show()`},

'm6-bnd-rd': {
  title:'Distortion against rate',
  what:'A Gaussian source of variance $1$ described with $R$ bits a sample can reach the distortion $D(R)=2^{-2R}$ and no lower. The Lloyd–Max quantizer with $2^R$ levels is found by the Lloyd iteration and sits above that limit.',
  try:'Add $R=3$ to the loop. Predict whether its gap to $D(R)$ is larger than $2.74$ dB before you run it.',
  out:'R   D(R) = 2^(-2R)   Lloyd-Max    gap\n1       0.2500         0.3634    1.62 dB\n2       0.0625         0.1175    2.74 dB',
  m:`% Gaussian source, variance 1: the limit D(R) = 2^(-2R) against Lloyd-Max
Phi = @(x) 0.5*(1 + erf(x/sqrt(2)));             % Gaussian CDF
phi = @(x) exp(-x.^2/2)/sqrt(2*pi);              % Gaussian pdf
fprintf('R   D(R) = 2^(-2R)   Lloyd-Max    gap\\n')
for R = 1:2
    y = linspace(-2, 2, 2^R);                    % starting levels
    for it = 1:500                               % the Lloyd iteration
        t = [-Inf, (y(1:end-1) + y(2:end))/2, Inf];  % thresholds halfway
        P = Phi(t(2:end)) - Phi(t(1:end-1));     % probability of each cell
        y = (phi(t(1:end-1)) - phi(t(2:end)))./P;    % centroid of each cell
    end
    D(R) = 1 - sum(P.*y.^2);                     % mean-square error
    fprintf('%d       %.4f         %.4f    %.2f dB\\n', R, 2^(-2*R), D(R), ...
            10*log10(D(R)/2^(-2*R)))
end
r = linspace(0, 3, 200);
semilogy(r, 2.^(-2*r), 'LineWidth', 1.5), hold on
semilogy(1:numel(D), D, 'o'), hold off, grid on
xlabel('R (bits a sample)'), ylabel('D'), legend('D(R) = 2^{-2R}', 'Lloyd-Max')`,
  py:`import numpy as np, matplotlib.pyplot as plt
from math import erf
# Gaussian source, variance 1: the limit D(R) = 2^(-2R) against Lloyd-Max
Phi = np.vectorize(lambda x: 0.5*(1 + erf(x/np.sqrt(2))))   # Gaussian CDF
def phi(x): return np.exp(-x**2/2)/np.sqrt(2*np.pi)          # Gaussian pdf
print('R   D(R) = 2^(-2R)   Lloyd-Max    gap')
D = []
for R in (1, 2):
    y = np.linspace(-2, 2, 2**R)                 # starting levels
    for it in range(500):                        # the Lloyd iteration
        t = np.r_[-np.inf, (y[:-1] + y[1:])/2, np.inf]   # thresholds halfway
        P = Phi(t[1:]) - Phi(t[:-1])             # probability of each cell
        y = (phi(t[:-1]) - phi(t[1:]))/P         # centroid of each cell
    D.append(1 - np.sum(P*y**2))                 # mean-square error
    print(f'{R}       {2**(-2*R):.4f}         {D[-1]:.4f}',
          f'   {10*np.log10(D[-1]/2**(-2*R)):.2f} dB')
r = np.linspace(0, 3, 200)
plt.semilogy(r, 2**(-2*r), linewidth=1.5); plt.semilogy(range(1, len(D) + 1), D, 'o')
plt.grid(True); plt.xlabel(r'$R$ (bits a sample)'); plt.ylabel(r'$D$')
plt.legend([r'$D(R) = 2^{-2R}$', 'Lloyd-Max'])
plt.show()`},

/* -------------------------------------------------------------- 6.3 ---- */
'm6-huf-build': {
  title:'Huffman coding by repeated merges',
  what:'Builds the Huffman code for $0.4,\\,0.2,\\,0.2,\\,0.1,\\,0.1$. Each pass sorts the list, merges the two least likely entries, and gives every symbol under them one more bit. It prints the lengths, the average length $\\bar L$ and the efficiency $H/\\bar L$.',
  try:'Change the source to $0.5,\\,0.25,\\,0.125,\\,0.125$. Predict $\\bar L$ and the efficiency before you run it.',
  out:'lengths l_k:  2 2 2 3 3\naverage length L = 2.2000 bits a symbol\nentropy H = 2.1219 bits, efficiency H/L = 0.9645',
  m:`% Huffman code for 0.4, 0.2, 0.2, 0.1, 0.1 by repeated merges
p = [0.4 0.2 0.2 0.1 0.1]; K = numel(p);
q = p; g = num2cell(1:K);                    % each entry, and the symbols under it
l = zeros(1, K);                             % codeword lengths
while numel(q) > 1
    [q, i] = sort(q, 'descend'); g = g(i);   % most likely first; ties keep order
    u = [g{end-1:end}];                      % the symbols under the two least likely
    l(u) = l(u) + 1;                         % each gets one more bit
    q = [q(end-1) + q(end), q(1:end-2)]; g = [{u}, g(1:end-2)];   % merge, put first
end
H = -sum(p.*log2(p)); L = sum(p.*l);
fprintf('lengths l_k: %s\\n', sprintf(' %d', l))
fprintf('average length L = %.4f bits a symbol\\n', L)
fprintf('entropy H = %.4f bits, efficiency H/L = %.4f\\n', H, H/L)
bar([l(:), -log2(p(:))]), grid on
xlabel('symbol k'), ylabel('bits'), legend('length l_k', '-log_2 p_k')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Huffman code for 0.4, 0.2, 0.2, 0.1, 0.1 by repeated merges
p = np.array([0.4, 0.2, 0.2, 0.1, 0.1]); K = len(p)
q = list(p); g = [[k] for k in range(K)]     # each entry, and the symbols under it
l = np.zeros(K, dtype=int)                   # codeword lengths
while len(q) > 1:
    i = np.argsort(-np.array(q), kind='stable')   # most likely first; ties keep order
    q = [q[j] for j in i]; g = [g[j] for j in i]
    u = g[-2] + g[-1]                        # the symbols under the two least likely
    l[u] += 1                                # each gets one more bit
    q = [q[-2] + q[-1]] + q[:-2]; g = [u] + g[:-2]   # merge, put first
H = -np.sum(p*np.log2(p)); L = np.sum(p*l)
print('lengths l_k: ' + ''.join(f' {v}' for v in l))
print(f'average length L = {L:.4f} bits a symbol')
print(f'entropy H = {H:.4f} bits, efficiency H/L = {H/L:.4f}')
k = np.arange(1, K + 1)
plt.bar(k - 0.2, l, 0.4); plt.bar(k + 0.2, -np.log2(p), 0.4); plt.grid(True)
plt.xlabel(r'symbol $k$'); plt.ylabel('bits')
plt.legend([r'length $l_k$', r'$-\\log_2 p_k$'])
plt.show()`},

'm6-huf-var': {
  title:'Ties and variance',
  what:'Runs the Huffman merges twice on $0.4,\\,0.2,\\,0.2,\\,0.1,\\,0.1$. The merged entry goes above an equal one the first time and below it the second time. Both codes have $\\bar L=2.2$. The variance $\\sum_k p_k(l_k-\\bar L)^2$ tells them apart.',
  try:'Predict the longest codeword of each code for the source $0.3,\\,0.3,\\,0.2,\\,0.1,\\,0.1$ before you run it.',
  out:'merged high: lengths 2 2 2 3 3   L = 2.20   variance = 0.16\nmerged low:  lengths 1 2 3 4 4   L = 2.20   variance = 1.36',
  m:`% Two Huffman codes for 0.4, 0.2, 0.2, 0.1, 0.1: a merged entry above or below a tie
p = [0.4 0.2 0.2 0.1 0.1]; K = numel(p); rule = {'merged high:', 'merged low: '};
for r = 1:2
    q = p; g = num2cell(1:K); l = zeros(1, K);
    while numel(q) > 1
        [q, i] = sort(q, 'descend'); g = g(i);    % a tie keeps its order
        u = [g{end-1:end}]; l(u) = l(u) + 1;      % one more bit under the last two
        m = q(end-1) + q(end);                    % the merged probability
        if r == 1, q = [m, q(1:end-2)]; g = [{u}, g(1:end-2)];   % above a tie
        else,      q = [q(1:end-2), m]; g = [g(1:end-2), {u}];   % below a tie
        end
    end
    L = sum(p.*l); v = sum(p.*(l - L).^2);        % average and variance
    fprintf('%s lengths%s   L = %.2f   variance = %.2f\\n', ...
            rule{r}, sprintf(' %d', l), L, v)
    subplot(1, 2, r), bar(l), ylim([0 4.5]), grid on
    title(rule{r}), xlabel('symbol k'), ylabel('length l_k')
end`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Two Huffman codes for 0.4, 0.2, 0.2, 0.1, 0.1: a merged entry above or below a tie
p = np.array([0.4, 0.2, 0.2, 0.1, 0.1]); K = len(p)
rule = ['merged high:', 'merged low: ']
for r in range(2):
    q = list(p); g = [[k] for k in range(K)]; l = np.zeros(K, dtype=int)
    while len(q) > 1:
        i = np.argsort(-np.array(q), kind='stable')   # a tie keeps its order
        q = [q[j] for j in i]; g = [g[j] for j in i]
        u = g[-2] + g[-1]; l[u] += 1              # one more bit under the last two
        m = q[-2] + q[-1]                         # the merged probability
        if r == 0: q = [m] + q[:-2]; g = [u] + g[:-2]   # above a tie
        else:      q = q[:-2] + [m]; g = g[:-2] + [u]   # below a tie
    L = np.sum(p*l); v = np.sum(p*(l - L)**2)     # average and variance
    print(f'{rule[r]} lengths' + ''.join(f' {x}' for x in l),
          f'  L = {L:.2f}   variance = {v:.2f}')
    plt.subplot(1, 2, r + 1); plt.bar(range(1, K + 1), l); plt.ylim(0, 4.5)
    plt.grid(True); plt.title(rule[r])
    plt.xlabel(r'symbol $k$'); plt.ylabel(r'length $l_k$')
plt.show()`},

'm6-huf-pairs': {
  title:'Huffman codes for pairs of symbols',
  what:'Codes the source $0.7,\\,0.2,\\,0.1$ one symbol at a time, then in pairs with the nine probabilities $p_ip_j$. It divides the average length by the block length $n$ to get bits a source symbol.',
  try:'Run blocks up to $n=3$. Predict whether triples beat pairs before you run it.',
  out:'H = 1.1568 bits a symbol\nn = 1:  3 codewords, 1.3000 bits a symbol, efficiency 0.8898\nn = 2:  9 codewords, 1.1650 bits a symbol, efficiency 0.9929',
  m:`% Huffman codes for 0.7, 0.2, 0.1: single symbols, then pairs
p = [0.7 0.2 0.1]; H = -sum(p.*log2(p));
fprintf('H = %.4f bits a symbol\\n', H)
for n = 1:2
    P = p;
    for j = 2:n, P = kron(P, p); end             % blocks of n: products of p
    q = P; g = num2cell(1:numel(P)); l = zeros(1, numel(P));
    while numel(q) > 1                           % the Huffman merges
        [q, i] = sort(q, 'descend'); g = g(i);
        u = [g{end-1:end}]; l(u) = l(u) + 1;
        q = [q(end-1) + q(end), q(1:end-2)]; g = [{u}, g(1:end-2)];
    end
    R(n) = sum(P.*l)/n;                          % bits a source symbol
    fprintf('n = %d: %2d codewords, %.4f bits a symbol, efficiency %.4f\\n', ...
            n, numel(P), R(n), H/R(n))
end
bar(R), hold on, yline(H, '--'), hold off, grid on
xlabel('block length n'), ylabel('bits a source symbol'), legend('Huffman', 'H')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Huffman codes for 0.7, 0.2, 0.1: single symbols, then pairs
p = np.array([0.7, 0.2, 0.1]); H = -np.sum(p*np.log2(p))
print(f'H = {H:.4f} bits a symbol'); R = []
for n in range(1, 3):
    P = p
    for j in range(2, n + 1): P = np.kron(P, p)  # blocks of n: products of p
    q = list(P); g = [[k] for k in range(len(P))]; l = np.zeros(len(P), dtype=int)
    while len(q) > 1:                            # the Huffman merges
        i = np.argsort(-np.array(q), kind='stable')
        q = [q[j] for j in i]; g = [g[j] for j in i]
        u = g[-2] + g[-1]; l[u] += 1
        q = [q[-2] + q[-1]] + q[:-2]; g = [u] + g[:-2]
    R.append(np.sum(P*l)/n)                      # bits a source symbol
    print(f'n = {n}: {len(P):2d} codewords, {R[-1]:.4f} bits a symbol,',
          f'efficiency {H/R[-1]:.4f}')
n = range(1, len(R) + 1); plt.bar(n, R); plt.axhline(H, linestyle='--'); plt.xticks(n)
plt.grid(True); plt.xlabel(r'block length $n$'); plt.ylabel('bits a source symbol')
plt.legend([r'$H$', 'Huffman'])
plt.show()`},

'm6-huf-lz': {
  title:'Lempel–Ziv parsing',
  what:'Parses a stream into phrases, each an earlier phrase plus one new bit. Phrase $i$ is sent as a pointer of $\\lceil\\log_2 i\\rceil$ bits and the new bit. The program codes a short stream and $10\\,000$ bits of a source with $P(1)=0.1$. The long stream is random, so another stream from the same source, like the one drawn for Lempel–Ziv on a long stream, gives slightly different counts.',
  try:'Make the long stream $100\\,000$ bits. Predict whether the cost falls below $0.6$ bits a source bit before you run it.',
  out:'source bits   phrases   coded bits   per source bit\n         18         8           25            1.389\n      10000       669         6336            0.634\nentropy of the long stream: H = 0.469 bits a source bit',
  m:`% Lempel-Ziv parsing: each new phrase is an earlier phrase plus one new bit
rng(1, 'twister');                           % the same numbers as NumPy seed 1
S = {'000101110010100101', char('0' + (rand(1, 10000) < 0.1))};  % P(1) = 0.1
fprintf('source bits   phrases   coded bits   per source bit\\n')
for s = 1:2
    x = S{s}; d = containers.Map(); w = ''; e = [];  % dictionary, phrase, phrase ends
    for k = 1:length(x)
        w = [w, x(k)];
        if ~isKey(d, w), d(w) = 1; e(end+1) = k; w = ''; end   % a new phrase
    end
    if ~isempty(w), e(end+1) = length(x); end    % an unfinished last phrase
    c = cumsum(ceil(log2(1:numel(e))) + 1);      % pointer ceil(log2 i) bits + 1 bit
    fprintf('%11d   %7d   %10d   %14.3f\\n', ...
            length(x), numel(e), c(end), c(end)/length(x))
end
H = -0.1*log2(0.1) - 0.9*log2(0.9);
fprintf('entropy of the long stream: H = %.3f bits a source bit\\n', H)
semilogx(e, c./e, 'LineWidth', 1.5), yline(H, '--'), yline(1, ':'), grid on
xlabel('source bits read'), ylabel('coded bits a source bit')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Lempel-Ziv parsing: each new phrase is an earlier phrase plus one new bit
np.random.seed(1)                            # the same numbers as MATLAB rng(1)
S = ['000101110010100101',
     ''.join('1' if u < 0.1 else '0' for u in np.random.rand(10000))]   # P(1) = 0.1
print('source bits   phrases   coded bits   per source bit')
for x in S:
    d = set(); w = ''; e = []                # dictionary, phrase, phrase ends
    for k in range(len(x)):
        w += x[k]
        if w not in d: d.add(w); e.append(k + 1); w = ''   # a new phrase
    if w: e.append(len(x))                   # an unfinished last phrase
    e = np.array(e)
    c = np.cumsum(np.ceil(np.log2(np.arange(1, len(e) + 1))) + 1)   # pointer + 1 bit
    print(f'{len(x):11d}   {len(e):7d}   {int(c[-1]):10d}   {c[-1]/len(x):14.3f}')
H = -0.1*np.log2(0.1) - 0.9*np.log2(0.9)
print(f'entropy of the long stream: H = {H:.3f} bits a source bit')
plt.semilogx(e, c/e, linewidth=1.5); plt.axhline(H, linestyle='--')
plt.axhline(1, linestyle=':'); plt.grid(True)
plt.xlabel('source bits read'); plt.ylabel('coded bits a source bit')
plt.show()`},

/* -------------------------------------------------------------- 6.4 ---- */
'm6-ch-output': {
  title:'From input to output distribution',
  what:'The channel matrix $\\mathbf{P}$ has one row an input, and each row sums to one. With $p(x_0)=0.75$ the program forms the joint table $p(x,y)=p(x)\\,p(y\\mid x)$ and adds its columns to get $p(y)$.',
  try:'Set $p(x_0)=0.5$. Predict $p(y_0)$ before you run it.',
  out:'rows of P sum to 1.0 and 1.0\njoint p(x,y):  0.600  0.150\n               0.075  0.175\np(y0) = 0.675   p(y1) = 0.325',
  m:`% Output distribution: p(y) = sum over x of p(x) p(y|x)
P = [0.8 0.2; 0.3 0.7];                      % channel matrix, one row an input
px = [0.75 0.25];                            % p(x0), p(x1)
J = diag(px)*P;                              % joint p(x,y) = p(x) p(y|x)
py = px*P;                                   % add each column of J
fprintf('rows of P sum to %.1f and %.1f\\n', sum(P, 2))
fprintf('joint p(x,y):  %.3f  %.3f\\n', J(1,:))
fprintf('               %.3f  %.3f\\n', J(2,:))
fprintf('p(y0) = %.3f   p(y1) = %.3f\\n', py)
q = linspace(0, 1, 101);                     % every p(x0)
plot(q, q*P(1,1) + (1-q)*P(2,1), 'LineWidth', 1.5), hold on
plot(px(1), py(1), 'o'), hold off, grid on
xlabel('p(x_0)'), ylabel('p(y_0)')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Output distribution: p(y) = sum over x of p(x) p(y|x)
P = np.array([[0.8, 0.2], [0.3, 0.7]])       # channel matrix, one row an input
px = np.array([0.75, 0.25])                  # p(x0), p(x1)
J = np.diag(px) @ P                          # joint p(x,y) = p(x) p(y|x)
py = px @ P                                  # add each column of J
s = P.sum(axis=1)
print(f'rows of P sum to {s[0]:.1f} and {s[1]:.1f}')
print(f'joint p(x,y):  {J[0,0]:.3f}  {J[0,1]:.3f}')
print(f'               {J[1,0]:.3f}  {J[1,1]:.3f}')
print(f'p(y0) = {py[0]:.3f}   p(y1) = {py[1]:.3f}')
q = np.linspace(0, 1, 101)                   # every p(x0)
plt.plot(q, q*P[0,0] + (1-q)*P[1,0], linewidth=1.5); plt.plot(px[0], py[0], 'o')
plt.grid(True); plt.xlabel(r'$p(x_0)$'); plt.ylabel(r'$p(y_0)$')
plt.show()`},

'm6-ch-joint': {
  title:'Joint entropy and the chain rule',
  what:'From the joint pmf $0.4,\\,0.1,\\,0.1,\\,0.4$ the program computes $H(X,Y)$ and the two marginal entropies. The chain rule gives $H(Y\\mid X)=H(X,Y)-H(X)$, and the overlap is $I(X;Y)=H(X)+H(Y)-H(X,Y)$.',
  try:'Change the table to $0.25$ in every cell. Predict $I(X;Y)$ before you run it.',
  out:'H(X,Y) = 1.7219 bits\nH(X)   = 1.0000 bits, H(Y) = 1.0000 bits\nH(Y|X) = H(X,Y) - H(X) = 0.7219 bits\nI(X;Y) = H(X) + H(Y) - H(X,Y) = 0.2781 bits',
  m:`% Entropies of the joint pmf p(x,y) = [0.4 0.1; 0.1 0.4]
J = [0.4 0.1; 0.1 0.4];                      % rows x0, x1; columns y0, y1
H = @(q) -sum(q(q > 0).*log2(q(q > 0)));     % entropy of a table of probabilities
HXY = H(J); HX = H(sum(J, 2)); HY = H(sum(J, 1));   % joint and the two marginals
I = HX + HY - HXY;
fprintf('H(X,Y) = %.4f bits\\n', HXY)
fprintf('H(X)   = %.4f bits, H(Y) = %.4f bits\\n', HX, HY)
fprintf('H(Y|X) = H(X,Y) - H(X) = %.4f bits\\n', HXY - HX)
fprintf('I(X;Y) = H(X) + H(Y) - H(X,Y) = %.4f bits\\n', I)
barh(1, [HXY - HY, I, HXY - HX], 'stacked'), grid on
xline(HX, '--'), xlabel('bits'), yticks([])
legend('H(X|Y)', 'I(X;Y)', 'H(Y|X)', 'Location', 'southoutside')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Entropies of the joint pmf p(x,y) = [0.4 0.1; 0.1 0.4]
J = np.array([[0.4, 0.1], [0.1, 0.4]])       # rows x0, x1; columns y0, y1
def H(q): q = q[q > 0]; return -np.sum(q*np.log2(q))   # entropy of a table
HXY, HX, HY = H(J), H(J.sum(axis=1)), H(J.sum(axis=0))  # joint and the marginals
I = HX + HY - HXY
print(f'H(X,Y) = {HXY:.4f} bits')
print(f'H(X)   = {HX:.4f} bits, H(Y) = {HY:.4f} bits')
print(f'H(Y|X) = H(X,Y) - H(X) = {HXY - HX:.4f} bits')
print(f'I(X;Y) = H(X) + H(Y) - H(X,Y) = {I:.4f} bits')
parts, left = [HXY - HY, I, HXY - HX], 0
for v in parts:
    plt.barh(0, v, 0.5, left=left); left += v
plt.axvline(HX, linestyle='--'); plt.ylim(-0.5, 1.5); plt.yticks([]); plt.grid(True)
plt.xlabel('bits')
plt.legend([r'$H(X)$', r'$H(X|Y)$', r'$I(X;Y)$', r'$H(Y|X)$'], ncol=4)
plt.show()`},

'm6-ch-mutual': {
  title:'Mutual information of the BSC',
  what:'For a binary symmetric channel with crossover probability $p$ and equally likely inputs, $I(X;Y)=H(Y)-H(Y\\mid X)$ with $H(Y\\mid X)=H_b(p)$. The program prints $I$ for several $p$ and draws it for every $p$.',
  try:'Set the input to $P(X=1)=0.3$. Predict whether $I$ at $p=0.1$ goes up or down before you run it.',
  out:'   p     I(X;Y) (bits)\n 0.01    0.9192\n 0.05    0.7136\n 0.10    0.5310\n 0.20    0.2781\n 0.30    0.1187\n 0.40    0.0290\n 0.50    0.0000',
  m:`% Mutual information of a BSC with crossover p and input P(X = 1) = q
Hb = @(x) -x.*log2(x) - (1-x).*log2(1-x);    % the binary entropy function
q = 0.5;                                     % equally likely inputs
I = @(p) Hb(q*(1-p) + (1-q)*p) - Hb(p);      % H(Y) - H(Y|X)
p = [0.01 0.05 0.1 0.2 0.3 0.4 0.5];
fprintf('   p     I(X;Y) (bits)\\n')
fprintf('%5.2f    %.4f\\n', [p; I(p)])
x = (1:999)/1000;
plot(x, I(x), 'LineWidth', 1.5), hold on
plot(0.1, I(0.1), 'o'), hold off, grid on
xlabel('crossover probability p'), ylabel('I(X;Y) (bits)')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Mutual information of a BSC with crossover p and input P(X = 1) = q
def Hb(x): return -x*np.log2(x) - (1-x)*np.log2(1-x)   # binary entropy function
q = 0.5                                      # equally likely inputs
def I(p): return Hb(q*(1-p) + (1-q)*p) - Hb(p)   # H(Y) - H(Y|X)
p = np.array([0.01, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5])
print('   p     I(X;Y) (bits)')
for v in p:
    print(f'{v:5.2f}    {I(v):.4f}')
x = np.arange(1, 1000)/1000
plt.plot(x, I(x), linewidth=1.5); plt.plot(0.1, I(0.1), 'o'); plt.grid(True)
plt.xlabel(r'crossover probability $p$'); plt.ylabel(r'$I(X;Y)$ (bits)')
plt.show()`},

'm6-ch-mc': {
  title:'Counting bits through a BSC',
  what:'Sends $100\\,000$ equally likely bits through a binary symmetric channel with $p=0.1$ and counts the four input–output pairs. The counted table gives an estimate of $I(X;Y)$, printed next to the exact $1-H_b(0.1)$.',
  try:'Send only $1000$ bits. Predict whether the estimate of $I$ lands farther from $0.5310$ before you run it.',
  out:'counted p(x,y):  0.4496  0.0503\n                 0.0503  0.4498\nI counted = 0.5290 bits\nI exact   = 0.5310 bits',
  m:`% 100000 equally likely bits through a BSC with p = 0.1
L = 100000; p = 0.1;
rng(1, 'twister'); u = rand(1, 2*L);         % the same numbers as NumPy seed 1
x = u(1:L) < 0.5;                            % the bits sent
y = xor(x, u(L+1:end) < p);                  % each flipped with probability p
J = [sum(~x & ~y), sum(~x & y); sum(x & ~y), sum(x & y)]/L;   % counted p(x,y)
H = @(q) -sum(q(q > 0).*log2(q(q > 0)));     % entropy of a table of probabilities
I = H(sum(J, 2)) + H(sum(J, 1)) - H(J);      % H(X) + H(Y) - H(X,Y)
Je = [1-p, p; p, 1-p]/2;                     % the exact joint pmf
fprintf('counted p(x,y):  %.4f  %.4f\\n', J(1,:))
fprintf('                 %.4f  %.4f\\n', J(2,:))
fprintf('I counted = %.4f bits\\n', I)
fprintf('I exact   = %.4f bits\\n', H(sum(Je, 2)) + H(sum(Je, 1)) - H(Je))
bar(transpose([J(1,:), J(2,:); Je(1,:), Je(2,:)])), grid on
xticklabels({'00', '01', '10', '11'}), xlabel('x y'), ylabel('p(x,y)')
legend('counted', 'exact')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# 100000 equally likely bits through a BSC with p = 0.1
L = 100000; p = 0.1
np.random.seed(1); u = np.random.rand(2*L)   # the same numbers as MATLAB rng(1)
x = u[:L] < 0.5                              # the bits sent
y = x ^ (u[L:] < p)                          # each flipped with probability p
J = np.array([[np.sum(~x & ~y), np.sum(~x & y)],
              [np.sum(x & ~y), np.sum(x & y)]])/L   # counted p(x,y)
def H(q): q = q[q > 0]; return -np.sum(q*np.log2(q))   # entropy of a table
I = H(J.sum(axis=1)) + H(J.sum(axis=0)) - H(J)          # H(X) + H(Y) - H(X,Y)
Je = np.array([[1-p, p], [p, 1-p]])/2        # the exact joint pmf
print(f'counted p(x,y):  {J[0,0]:.4f}  {J[0,1]:.4f}')
print(f'                 {J[1,0]:.4f}  {J[1,1]:.4f}')
print(f'I counted = {I:.4f} bits')
print(f'I exact   = {H(Je.sum(axis=1)) + H(Je.sum(axis=0)) - H(Je):.4f} bits')
k = np.arange(4)
plt.bar(k - 0.2, J.ravel(), 0.4); plt.bar(k + 0.2, Je.ravel(), 0.4); plt.grid(True)
plt.xticks(k, ['00', '01', '10', '11']); plt.xlabel(r'$x\\,y$')
plt.ylabel(r'$p(x,y)$')
plt.legend(['counted', 'exact'])
plt.show()`},

/* -------------------------------------------------------------- 6.5 ---- */
'm6-cap-search': {
  title:'Capacity by search over the input',
  what:'Computes $I(X;Y)$ on a grid of inputs $q=P(X=0)$ for the Z-channel and for the BSC with $p=0.1$. The largest value on each curve is the capacity $C$, and $q^*$ is the input that reaches it.',
  try:'Change the Z-channel\'s second row to $0.3,\\,0.7$. Predict whether $q^*$ moves toward $\\tfrac12$ before you run it.',
  out:'channel        q*     C (bits a use)   I at q = 0.5\nZ-channel     0.600       0.3219          0.3113\nBSC p = 0.1   0.500       0.5310          0.5310',
  m:`% Capacity by search: I(X;Y) over the input q = P(X = 0) for two channels
h = @(x) -x.*log2(x + (x == 0));             % -x log2 x, with 0 log2 0 = 0
ch = {[1 0; 0.5 0.5], [0.9 0.1; 0.1 0.9]};   % Z-channel, BSC with p = 0.1
name = {'Z-channel', 'BSC p = 0.1'};
fprintf('channel        q*     C (bits a use)   I at q = 0.5\\n')
q = (0:1000)/1000;                           % the grid of inputs
for c = 1:2
    P = ch{c};
    py = q(:)*P(1,:) + (1 - q(:))*P(2,:);    % p(y), one row for each q
    HYX = q(:)*sum(h(P(1,:))) + (1 - q(:))*sum(h(P(2,:)));   % H(Y|X)
    I = sum(h(py), 2) - HYX;                 % I = H(Y) - H(Y|X)
    [C, j] = max(I);
    fprintf('%-12s  %.3f       %.4f          %.4f\\n', name{c}, q(j), C, I(501))
    plot(q, I, 'LineWidth', 1.5), hold on, plot(q(j), C, 'o')
    text(q(j), C + 0.03, name{c}, 'HorizontalAlignment', 'center')
end
hold off, grid on, xlabel('q = P(X = 0)'), ylabel('I(X;Y) (bits)')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Capacity by search: I(X;Y) over the input q = P(X = 0) for two channels
def h(x): return -x*np.log2(x + (x == 0))    # -x log2 x, with 0 log2 0 = 0
ch = [np.array([[1, 0], [0.5, 0.5]]), np.array([[0.9, 0.1], [0.1, 0.9]])]
name = ['Z-channel', 'BSC p = 0.1']         # Z-channel, BSC with p = 0.1
print('channel        q*     C (bits a use)   I at q = 0.5')
q = np.arange(1001)/1000                     # the grid of inputs
for c in range(2):
    P = ch[c]
    py = np.outer(q, P[0]) + np.outer(1 - q, P[1])        # p(y), a row for each q
    HYX = q*h(P[0]).sum() + (1 - q)*h(P[1]).sum()          # H(Y|X)
    I = h(py).sum(axis=1) - HYX              # I = H(Y) - H(Y|X)
    j = np.argmax(I); C = I[j]
    print(f'{name[c]:12s}  {q[j]:.3f}       {C:.4f}          {I[500]:.4f}')
    plt.plot(q, I, linewidth=1.5); plt.plot(q[j], C, 'o')
    plt.text(q[j], C + 0.03, name[c], ha='center')
plt.grid(True); plt.xlabel(r'$q = P(X = 0)$'); plt.ylabel(r'$I(X;Y)$ (bits)')
plt.show()`},

'm6-cap-bec': {
  title:'Erasures against flips',
  what:'Prints the capacity of the binary symmetric channel, $1-H_b(p)$, next to that of the binary erasure channel, $1-\\varepsilon$. An erasure is marked as unknown, and a flip is not, so the receiver loses less to an erasure.',
  try:'Predict the erasure probability $\\varepsilon$ that leaves the same capacity as a BSC with $p=0.1$ before you run it.',
  out:' p or e    BSC 1 - H(p)    BEC 1 - e\n  0.05       0.7136         0.9500\n  0.10       0.5310         0.9000\n  0.15       0.3902         0.8500\n  0.20       0.2781         0.8000\n  0.25       0.1887         0.7500\n  0.30       0.1187         0.7000\n  0.35       0.0659         0.6500\n  0.40       0.0290         0.6000\n  0.45       0.0072         0.5500\n  0.50       0.0000         0.5000\nat 0.1: an erasure costs 0.100 bit, a flip costs 0.469 bit',
  m:`% Capacity of the BSC, 1 - H(p), and of the erasure channel, 1 - e
Hb = @(x) -x.*log2(x) - (1-x).*log2(1-x);    % the binary entropy function
a = (1:10)/20;                               % p or e = 0.05, 0.10, ..., 0.50
fprintf(' p or e    BSC 1 - H(p)    BEC 1 - e\\n')
fprintf('  %.2f       %.4f         %.4f\\n', [a; 1 - Hb(a); 1 - a])
fprintf('at 0.1: an erasure costs %.3f bit, a flip costs %.3f bit\\n', 0.1, Hb(0.1))
x = (1:999)/1000;
plot(x, 1 - Hb(x), x, 1 - x, 'LineWidth', 1.5), grid on
xlabel('crossover p or erasure probability e'), ylabel('C (bits a use)')
legend('BSC', 'BEC')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Capacity of the BSC, 1 - H(p), and of the erasure channel, 1 - e
def Hb(x): return -x*np.log2(x) - (1-x)*np.log2(1-x)   # binary entropy function
a = np.arange(1, 11)/20                      # p or e = 0.05, 0.10, ..., 0.50
print(' p or e    BSC 1 - H(p)    BEC 1 - e')
for v in a:
    print(f'  {v:.2f}       {1 - Hb(v):.4f}         {1 - v:.4f}')
print(f'at 0.1: an erasure costs {0.1:.3f} bit, a flip costs {Hb(0.1):.3f} bit')
x = np.arange(1, 1000)/1000
plt.plot(x, 1 - Hb(x), x, 1 - x, linewidth=1.5); plt.grid(True)
plt.xlabel(r'crossover $p$ or erasure probability $\\varepsilon$')
plt.ylabel(r'$C$ (bits a use)'); plt.legend(['BSC', 'BEC'])
plt.show()`},

'm6-cap-rep': {
  title:'Repetition codes on a BSC',
  what:'Sends each bit $n$ times through a BSC with $p=0.1$ and decides by majority. The error probability falls with $n$, but the rate $1/n$ falls with it. The channel coding theorem allows any rate below $C=0.531$ with the error probability going to zero.',
  try:'Set $p=0.2$. Predict whether $P_e$ at $n=15$ is above or below $10^{-3}$ before you run it.',
  out:' n    rate 1/n    P_e (majority wrong)\n 1    1.0000      1.00e-01\n 3    0.3333      2.80e-02\n 5    0.2000      8.56e-03\n 7    0.1429      2.73e-03\n 9    0.1111      8.91e-04\n11    0.0909      2.96e-04\n13    0.0769      9.93e-05\n15    0.0667      3.36e-05\ncapacity C = 0.5310 bits a use',
  m:`% Repetition code on a BSC with p = 0.1: send each bit n times, vote
p = 0.1; C = 1 + p*log2(p) + (1-p)*log2(1-p);    % capacity, 1 - H(p)
fprintf(' n    rate 1/n    P_e (majority wrong)\\n')
N = 1:2:15; Pe = zeros(size(N));
for i = 1:length(N)
    n = N(i); k = (n+1)/2:n;                     % more than half the copies flipped
    nk = factorial(n)./(factorial(k).*factorial(n-k));   % n choose k
    Pe(i) = sum(nk.*p.^k.*(1-p).^(n-k));
    fprintf('%2d    %.4f      %.2e\\n', n, 1/n, Pe(i))
end
fprintf('capacity C = %.4f bits a use\\n', C)
semilogy(1./N, Pe, 'o-', 'LineWidth', 1.5), hold on
xline(C, '--'), hold off, grid on, xlim([0 1])
xlabel('rate R = 1/n (bits a use)'), ylabel('P_e')`,
  py:`import numpy as np, matplotlib.pyplot as plt
from math import comb
# Repetition code on a BSC with p = 0.1: send each bit n times, vote
p = 0.1; C = 1 + p*np.log2(p) + (1-p)*np.log2(1-p)   # capacity, 1 - H(p)
print(' n    rate 1/n    P_e (majority wrong)')
N = np.arange(1, 16, 2); Pe = np.zeros(len(N))
for i, n in enumerate(N):
    k = np.arange((n+1)//2, n + 1)               # more than half the copies flipped
    nk = np.array([comb(int(n), int(j)) for j in k])     # n choose k
    Pe[i] = np.sum(nk*p**k*(1-p)**(n-k))
    print(f'{n:2d}    {1/n:.4f}      {Pe[i]:.2e}')
print(f'capacity C = {C:.4f} bits a use')
plt.semilogy(1/N, Pe, 'o-', linewidth=1.5); plt.axvline(C, linestyle='--')
plt.grid(True); plt.xlim(0, 1)
plt.xlabel(r'rate $R = 1/n$ (bits a use)'); plt.ylabel(r'$P_e$')
plt.show()`},

'm6-cap-sym': {
  title:'A symmetric three-output channel',
  what:'Each row of the channel matrix is a shift of $0.6,\\,0.2,\\,0.2$, and so is each column. A uniform input then gives a uniform output, and $C=\\log_2 3-H(0.6,0.2,0.2)$. The program also tries the inputs $(a,\\tfrac{1-a}2,\\tfrac{1-a}2)$ and finds the best $a$.',
  try:'Change the row to $0.8,\\,0.1,\\,0.1$. Predict how many channel uses a bit needs before you run it.',
  out:'column sums: 1.0 1.0 1.0\nso a uniform input gives a uniform output\nC = log2(3) - H(0.6, 0.2, 0.2) = 0.2140 bits a use\nat least 4.67 channel uses for each bit\nalong the line, I peaks at a = 0.333 with 0.2140 bits',
  m:`% A symmetric channel: every row a shift of 0.6, 0.2, 0.2
r = [0.6 0.2 0.2];
P = [r; circshift(r, 1); circshift(r, 2)];   % the channel matrix
h = @(x) -sum(x.*log2(x), 2);                % entropy of each row of x
C = log2(3) - h(r);
fprintf('column sums: %.1f %.1f %.1f\\n', sum(P, 1))
fprintf('so a uniform input gives a uniform output\\n')
fprintf('C = log2(3) - H(0.6, 0.2, 0.2) = %.4f bits a use\\n', C)
fprintf('at least %.2f channel uses for each bit\\n', 1/C)
a = (0:1000)/1000;                           % inputs (a, (1-a)/2, (1-a)/2)
py = a(:)*P(1,:) + (1 - a(:))/2*(P(2,:) + P(3,:));
I = h(py) - h(r);                            % every row has the same entropy
[m, j] = max(I);
fprintf('along the line, I peaks at a = %.3f with %.4f bits\\n', a(j), m)
plot(a, I, 'LineWidth', 1.5), hold on, xline(1/3, '--'), hold off, grid on
xlabel('a = P(X = x_0)'), ylabel('I(X;Y) (bits)')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# A symmetric channel: every row a shift of 0.6, 0.2, 0.2
r = np.array([0.6, 0.2, 0.2])
P = np.array([r, np.roll(r, 1), np.roll(r, 2)])   # the channel matrix
def h(x): return -np.sum(x*np.log2(x), axis=-1)   # entropy of each row of x
C = np.log2(3) - h(r)
s = P.sum(axis=0)
print(f'column sums: {s[0]:.1f} {s[1]:.1f} {s[2]:.1f}')
print('so a uniform input gives a uniform output')
print(f'C = log2(3) - H(0.6, 0.2, 0.2) = {C:.4f} bits a use')
print(f'at least {1/C:.2f} channel uses for each bit')
a = np.arange(1001)/1000                     # inputs (a, (1-a)/2, (1-a)/2)
py = np.outer(a, P[0]) + np.outer((1 - a)/2, P[1] + P[2])
I = h(py) - h(r)                             # every row has the same entropy
j = np.argmax(I)
print(f'along the line, I peaks at a = {a[j]:.3f} with {I[j]:.4f} bits')
plt.plot(a, I, linewidth=1.5); plt.axvline(1/3, linestyle='--'); plt.grid(True)
plt.xlabel(r'$a = P(X = x_0)$'); plt.ylabel(r'$I(X;Y)$ (bits)')
plt.show()`},

/* -------------------------------------------------------------- 6.6 ---- */
'm6-gs-shannon': {
  title:'Capacity of a telephone line',
  what:'Evaluates $C=W\\log_2(1+\\text{SNR})$ for a line with $W=3.1$ kHz. The signal-to-noise ratio is given in decibels, so it is converted to a ratio before it goes inside the logarithm.',
  try:'Raise the band to $W=4$ kHz at $30$ dB. Predict $C$ before you run it.',
  out:'SNR (dB)    C (kb/s)\n    0         3.10\n   10        10.72\n   20        20.64\n   30        30.90\n   40        41.19\nat 30 dB: C = 30.9 kb/s\ncommon error, 30 inside the log: 15.4 kb/s',
  m:`% Capacity of a telephone line: C = W log2(1 + SNR), W = 3.1 kHz
W = 3100;                                    % Hz
fprintf('SNR (dB)    C (kb/s)\\n')
for dB = 0:10:40
    fprintf('%5d       %6.2f\\n', dB, W*log2(1 + 10^(dB/10))/1e3)
end
snr = 10^(30/10);                            % 30 dB is a ratio of 1000
fprintf('at 30 dB: C = %.1f kb/s\\n', W*log2(1 + snr)/1e3)
fprintf('common error, 30 inside the log: %.1f kb/s\\n', W*log2(1 + 30)/1e3)
d = (0:400)/10;                              % 0 to 40 dB
plot(d, W*log2(1 + 10.^(d/10))/1e3, 'LineWidth', 1.5), grid on
xlabel('SNR (dB)'), ylabel('C (kb/s)')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Capacity of a telephone line: C = W log2(1 + SNR), W = 3.1 kHz
W = 3100                                     # Hz
print('SNR (dB)    C (kb/s)')
for dB in range(0, 41, 10):
    print(f'{dB:5d}       {W*np.log2(1 + 10**(dB/10))/1e3:6.2f}')
snr = 10**(30/10)                            # 30 dB is a ratio of 1000
print(f'at 30 dB: C = {W*np.log2(1 + snr)/1e3:.1f} kb/s')
print(f'common error, 30 inside the log: {W*np.log2(1 + 30)/1e3:.1f} kb/s')
d = np.arange(401)/10                        # 0 to 40 dB
plt.plot(d, W*np.log2(1 + 10**(d/10))/1e3, linewidth=1.5); plt.grid(True)
plt.xlabel('SNR (dB)'); plt.ylabel(r'$C$ (kb/s)')
plt.show()`},

'm6-gs-wide': {
  title:'More bandwidth, same power',
  what:'With the power $P$ and the noise level $N_0$ fixed, $C=W\\log_2\\!\\big(1+P/(N_0W)\\big)$. The program measures $W$ and $C$ in units of $P/N_0$. More band always helps, but $C$ levels off at $P/(N_0\\ln 2)$.',
  try:'Add $W=10^4\\,P/N_0$. Predict how many digits of $1.4427$ it matches before you run it.',
  out:'W/(P/N0)    C/(P/N0)\n     0.1    0.3459\n     0.5    0.7925\n       1    1.0000\n       2    1.1699\n       5    1.3152\n      10    1.3750\n     100    1.4355\n    1000    1.4420\nlimit as W grows: 1/ln 2 = 1.4427',
  m:`% More bandwidth at fixed power: C = W log2(1 + P/(N0 W)), in units of P/N0
x = [0.1 0.5 1 2 5 10 100 1000];             % W / (P/N0)
Cn = x.*log2(1 + 1./x);                      % C / (P/N0)
fprintf('W/(P/N0)    C/(P/N0)\\n')
fprintf('%8g    %.4f\\n', [x; Cn])
fprintf('limit as W grows: 1/ln 2 = %.4f\\n', 1/log(2))
w = logspace(-2, 3, 400);
semilogx(w, w.*log2(1 + 1./w), 'LineWidth', 1.5), hold on
yline(1/log(2), '--'), hold off, grid on
xlabel('W / (P/N_0)'), ylabel('C / (P/N_0)')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# More bandwidth at fixed power: C = W log2(1 + P/(N0 W)), in units of P/N0
x = np.array([0.1, 0.5, 1, 2, 5, 10, 100, 1000])   # W / (P/N0)
Cn = x*np.log2(1 + 1/x)                      # C / (P/N0)
print('W/(P/N0)    C/(P/N0)')
for v, c in zip(x, Cn):
    print(f'{v:8g}    {c:.4f}')
print(f'limit as W grows: 1/ln 2 = {1/np.log(2):.4f}')
w = np.logspace(-2, 3, 400)
plt.semilogx(w, w*np.log2(1 + 1/w), linewidth=1.5)
plt.axhline(1/np.log(2), linestyle='--'); plt.grid(True)
plt.xlabel(r'$W/(P/N_0)$'); plt.ylabel(r'$C/(P/N_0)$')
plt.show()`},

'm6-gs-plane': {
  title:'The least energy per bit',
  what:'Sending at the rate $C$ with $r=R/W$ bits a second a hertz needs $E_b/N_0\\ge(2^r-1)/r$. The program prints that least $E_b/N_0$ in decibels and draws it on the bandwidth-efficiency plane. As $r\\to0$ the curve reaches $\\ln 2$, which is $-1.59$ dB.',
  try:'Predict the least $E_b/N_0$ for $r=8$ before you run it.',
  out:'   r    least Eb/N0\n 0.01    -1.58 dB\n 0.10    -1.44 dB\n 0.50    -0.82 dB\n 1.00     0.00 dB\n 2.00     1.76 dB\n 4.00     5.74 dB\n 6.00    10.21 dB\nr -> 0: ln 2 = 0.6931, which is -1.59 dB',
  m:`% The least Eb/N0 at spectral efficiency r = R/W: Eb/N0 >= (2^r - 1)/r
r = [0.01 0.1 0.5 1 2 4 6];                  % bits a second a hertz
g = (2.^r - 1)./r;                           % the least Eb/N0 as a ratio
fprintf('   r    least Eb/N0\\n')
fprintf('%5.2f   %6.2f dB\\n', [r; 10*log10(g)])
fprintf('r -> 0: ln 2 = %.4f, which is %.2f dB\\n', log(2), 10*log10(log(2)))
x = logspace(-2, log10(8), 400);
semilogy(10*log10((2.^x - 1)./x), x, 'LineWidth', 1.5), hold on
xline(10*log10(log(2)), '--'), hold off, grid on, xlim([-3 15])
text(8, 0.1, 'reliable'), text(0, 4, 'impossible')
xlabel('E_b/N_0 (dB)'), ylabel('r = R/W (b/s/Hz)')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# The least Eb/N0 at spectral efficiency r = R/W: Eb/N0 >= (2^r - 1)/r
r = np.array([0.01, 0.1, 0.5, 1, 2, 4, 6])   # bits a second a hertz
g = (2**r - 1)/r                             # the least Eb/N0 as a ratio
print('   r    least Eb/N0')
for v, db in zip(r, 10*np.log10(g)):
    print(f'{v:5.2f}   {db:6.2f} dB')
print(f'r -> 0: ln 2 = {np.log(2):.4f}, which is {10*np.log10(np.log(2)):.2f} dB')
x = np.logspace(-2, np.log10(8), 400)
plt.semilogy(10*np.log10((2**x - 1)/x), x, linewidth=1.5)
plt.axvline(10*np.log10(np.log(2)), linestyle='--'); plt.grid(True); plt.xlim(-3, 15)
plt.text(8, 0.1, 'reliable'); plt.text(0, 4, 'impossible')
plt.xlabel(r'$E_b/N_0$ (dB)'); plt.ylabel(r'$r = R/W$ (b/s/Hz)')
plt.show()`},

'm6-gs-water': {
  title:'Water-filling over six subchannels',
  what:'Shares a total power $P=1$ over six parallel subchannels with noise levels $N_k$ from $0.1$ to $3.2$. Water-filling gives $P_k=\\max(\\mu-N_k,0)$, and the water level $\\mu$ is found by halving an interval until the powers add to $P$. Each subchannel carries $\\tfrac12\\log_2(1+P_k/N_k)$.',
  try:'Raise the total power to $P=10$. Predict how many subchannels get power before you run it.',
  out:'water level mu = 0.5667\npower: 0.4667 0.3667 0.1667 0.0000 0.0000 0.0000\nwater-filling: C = 2.254 bits a use\nequal shares:  C = 1.641 bits a use',
  m:`% Water-filling: total power P = 1 over six subchannels with noise N
N = [0.1 0.2 0.4 0.8 1.6 3.2]; P = 1;
lo = 0; hi = max(N) + P;                     % the water level mu lies between
for it = 1:100                               % halve the interval each time
    mu = (lo + hi)/2;
    if sum(max(mu - N, 0)) > P, hi = mu; else, lo = mu; end
end
Pk = max(mu - N, 0);                         % the power in each subchannel
Cw = sum(0.5*log2(1 + Pk./N));               % bits a use
Ce = sum(0.5*log2(1 + (P/6)./N));            % the same power in equal shares
fprintf('water level mu = %.4f\\n', mu)
fprintf('power:%s\\n', sprintf(' %.4f', Pk))
fprintf('water-filling: C = %.3f bits a use\\n', Cw)
fprintf('equal shares:  C = %.3f bits a use\\n', Ce)
b = bar([N(:), Pk(:)], 'stacked'); b(1).FaceColor = [0.75 0.75 0.75];
yline(mu, '--'), grid on, xlabel('subchannel k')
ylabel('noise N_k and power P_k'), legend('noise', 'power', 'water level')`,
  py:`import numpy as np, matplotlib.pyplot as plt
# Water-filling: total power P = 1 over six subchannels with noise N
N = np.array([0.1, 0.2, 0.4, 0.8, 1.6, 3.2]); P = 1
lo, hi = 0, N.max() + P                      # the water level mu lies between
for it in range(100):                        # halve the interval each time
    mu = (lo + hi)/2
    if np.sum(np.maximum(mu - N, 0)) > P: hi = mu
    else: lo = mu
Pk = np.maximum(mu - N, 0)                   # the power in each subchannel
Cw = np.sum(0.5*np.log2(1 + Pk/N))           # bits a use
Ce = np.sum(0.5*np.log2(1 + (P/6)/N))        # the same power in equal shares
print(f'water level mu = {mu:.4f}')
print('power:' + ''.join(f' {v:.4f}' for v in Pk))
print(f'water-filling: C = {Cw:.3f} bits a use')
print(f'equal shares:  C = {Ce:.3f} bits a use')
k = np.arange(1, 7)
plt.bar(k, N, color='0.75'); plt.bar(k, Pk, bottom=N); plt.axhline(mu, linestyle='--')
plt.grid(True); plt.xlabel(r'subchannel $k$')
plt.ylabel(r'noise $N_k$ and power $P_k$')
plt.legend(['water level', 'noise', 'power'])
plt.show()`}

};
