"""PASS lines for every number stated in build/src/87_scenes_m6.js.

Module 6, an introduction to information theory: the slide cards, the
prediction questions, the gallery captions, the quick check, the summary
cards and the numbers the figures print at their default settings. The data
the galleries compute from (the speech text, the drawn image, the seeded
source of the Lempel-Ziv slide) is read from or ported from the scene file,
so a number a figure prints is the number checked below.

    .venv/bin/python verify/verify_m6.py      # N passed, 0 failed
"""
import math
import os
import re
from itertools import product

L2 = math.log2
Q = lambda x: 0.5 * math.erfc(x / math.sqrt(2))
dB = lambda d: 10 ** (d / 10)
todB = lambda x: 10 * math.log10(x)

passed = failed = 0


def check(name, got, want, tol):
    global passed, failed
    ok = abs(got - want) <= tol
    passed += ok
    failed += not ok
    print(f"{'PASS' if ok else 'FAIL'}  {name}: {got:.6g} (want {want} ± {tol})")


def truth(name, ok):
    global passed, failed
    passed += bool(ok)
    failed += not ok
    print(f"{'PASS' if ok else 'FAIL'}  {name}")


def H(ps):
    return -sum(p * L2(p) for p in ps if p > 0)


def hb(p):
    return H([p, 1 - p])


def solve(g, lo, hi):
    for _ in range(200):
        mid = (lo + hi) / 2
        if g(lo) * g(mid) <= 0:
            hi = mid
        else:
            lo = mid
    return (lo + hi) / 2


def chan(P, px):
    """Entropies of a discrete channel P[j][k] = p(y_k | x_j) with input px."""
    J = [[P[j][k] * px[j] for k in range(len(P[0]))] for j in range(len(P))]
    py = [sum(J[j][k] for j in range(len(P))) for k in range(len(P[0]))]
    HX, HY = H(px), H(py)
    HXY = H([v for row in J for v in row])
    return dict(py=py, HX=HX, HY=HY, HXY=HXY, HYgX=HXY - HX, HXgY=HXY - HY, I=HX + HY - HXY)


def cap(P, n=20000):
    best = max(((chan(P, [q, 1 - q])["I"], q) for q in (i / n for i in range(1, n))))
    return best


def huffman(ps):
    """Average length of a binary Huffman code: the sum of the merged probabilities."""
    xs = sorted(ps)
    tot = 0.0
    while len(xs) > 1:
        a, b = xs[0], xs[1]
        xs = sorted(xs[2:] + [a + b])
        tot += a + b
    return tot


def jsround(x):
    return math.floor(x + 0.5)


SRC = os.path.join(os.path.dirname(__file__), "..", "build", "src", "87_scenes_m6.js")
JS = open(SRC, encoding="utf-8").read()

# ---- 6.1 information and entropy -------------------------------------------
check("m6-selfinfo 1/8 carries 3 bits", -L2(1 / 8), 3, 1e-12)
check("m6-questions 8 cards", L2(8), 3, 0)
check("m6-questions 16 outcomes", L2(16), 4, 0)
check("m6-questions skewed average", 0.5 * 1 + 0.25 * 2 + 0.125 * 3 + 0.125 * 3, 1.75, 1e-12)
check("m6-questions skewed entropy", H([0.5, 0.25, 0.125, 0.125]), 1.75, 1e-12)
S3 = [0.7, 0.2, 0.1]
check("m6-entropy H(0.7,0.2,0.1)", H(S3), 1.157, 0.0005)
check("m6-entropy term 0.7", -0.7 * L2(0.7), 0.360, 0.0005)
check("m6-entropy term 0.2", -0.2 * L2(0.2), 0.464, 0.0005)
check("m6-entropy term 0.1", -0.1 * L2(0.1), 0.332, 0.0005)
check("m6-entropy log2 3", L2(3), 1.585, 0.0005)
check("m6-hb H_b(0.11)", hb(0.11), 0.500, 0.0005)
check("m6-hb term 0.11", -0.11 * L2(0.11), 0.350, 0.0005)
check("m6-hb term 0.89", -0.89 * L2(0.89), 0.150, 0.0005)
RATE = [0.4, 0.3, 0.2, 0.1]
check("m6-ex-rate H", H(RATE), 1.846, 0.0005)
for p, t in zip(RATE, [0.529, 0.521, 0.464, 0.332]):
    check(f"m6-ex-rate term {p}", -p * L2(p), t, 0.0005)
check("m6-ex-rate rate (b/s)", H(RATE) * 6000, 11079, 0.5)
check("m6-ex-rate common error (b/s)", H(RATE) * 3000, 5539, 0.5)
H2 = H([a * b for a, b in product(S3, S3)])
check("m6-extension H(S^2)", H2, 2.3136, 0.00005)
check("m6-extension 2 H(S)", 2 * H(S3), 2.3136, 0.00005)
check("m6-extension H(S)", H(S3), 1.1568, 0.00005)
check("m6-extension H(S^3)", 3 * H(S3), 3.470, 0.0005)
check("m6-extension figure 2 x 1.157", 2 * 1.157, 2.314, 1e-9)

# gallery: entropy around us, computed from the speech in the scene file
m = re.search(r"const SPEECH = \[(.*?)\]\.join\(' '\);", JS, re.S)
SPEECH = " ".join(re.findall(r"'([^']*)'", m.group(1)))
cnt = {}
for ch in SPEECH:
    cnt[ch] = cnt.get(ch, 0) + 1
K = len(cnt)
HL = H([v / len(SPEECH) for v in cnt.values()])
print(f"INFO  speech: {len(SPEECH)} characters, {K} symbols, H = {HL:.4f}")
check("m6-real-entropy symbol count", K, 24, 0)
check("m6-real-entropy H of the speech with its spaces (bits)", HL, 3.97, 0.005)
check("m6-real-entropy log2 K", L2(K), 4.58, 0.005)
truth("m6-real-entropy H below log2 K", HL < L2(K))
letters = {c: v for c, v in cnt.items() if c != " "}
HLL = H([v / sum(letters.values()) for v in letters.values()])
check("m6-real-codes letters of the speech (bits)", HLL, 4.04, 0.005)
check("m6-real-entropy fair die", L2(6), 2.585, 0.0005)
check("m6-real-entropy loaded die", H([0.1] * 5 + [0.5]), 2.161, 0.0005)
check("m6-real-entropy scan line H_b(0.1)", hb(0.1), 0.469, 0.0005)
SCAN = [0] * 80
for u, w in [(9, 11), (30, 33), (52, 54), (61, 62)]:
    for i in range(u, w):
        SCAN[i] = 1
check("m6-real-entropy scan line is 90% white", 1 - sum(SCAN) / 80, 0.9, 1e-12)
c = [0] * 8
for x in range(64):
    for y in range(64):
        c[math.floor(8 * ((x + 0.5) / 64) * ((y + 0.5) / 64))] += 1
HG = H([v / 4096 for v in c])
print(f"INFO  grey image H = {HG:.4f}")
truth("m6-real-entropy grey H below 3", HG < 3)
check("m6-real-entropy log2 8", L2(8), 3, 0)
check("m6-real-entropy English with memory", 1.3, 1.3, 0)

# ---- 6.2 the limits of compression -----------------------------------------
check("m6-coding dyadic L", 0.5 * 1 + 0.25 * 2 + 0.125 * 3 + 0.125 * 3, 1.75, 1e-12)
check("m6-coding English efficiency", 1.3 / 4.22, 0.31, 0.005)

TS_P, TS_EPS = 0.2, 0.1
TS_H = hb(TS_P)


def ptyp(n):
    P = 0.0
    cnt = 0
    for k in range(n + 1):
        s = -(k * L2(TS_P) + (n - k) * L2(1 - TS_P)) / n
        if abs(s - TS_H) <= TS_EPS + 1e-9:
            P += math.comb(n, k) * TS_P**k * (1 - TS_P) ** (n - k)
            cnt += math.comb(n, k)
    return P, cnt


check("m6-typical H_b(0.2)", TS_H, 0.722, 0.0005)
check("m6-typical 2^{nH} exponent at n=100", 100 * TS_H, 72.2, 0.05)
check("m6-source-thm P(typical) n=10", ptyp(10)[0], 0.3020, 0.00005)
check("m6-source-thm P(typical) n=100", ptyp(100)[0], 0.8321, 0.00005)
check("m6-source-thm P(typical) n=1000", ptyp(1000)[0], 0.9999, 0.00005)
check("m6-source-thm typical count n=10", ptyp(10)[1], 45, 0)
check("m6-source-thm index bits", math.ceil(L2(45)), 6, 0)
check("m6-source-thm share of sequences (%)", 100 * 45 / 1024, 4, 0.5)
check("m6-source-thm share of probability (%)", 100 * ptyp(10)[0], 30, 0.5)
check("m6-source-thm nH at H=0.5, n=1000", 1000 * 0.5, 500, 0)


def kraft(ls):
    return sum(2.0**-l for l in ls)


check("m6-kraft Code I", kraft([1, 1, 2, 2]), 1.5, 0)
check("m6-kraft Code II", kraft([1, 2, 3, 3]), 1, 0)
check("m6-kraft Code III", kraft([1, 2, 3, 4]), 0.9375, 0)
check("m6-kraft Given 1,2,2,3", kraft([1, 2, 2, 3]), 1.125, 0)


def prefix_free(cs):
    return not any(a != b and b.startswith(a) for a in cs for b in cs)


truth("m6-prefix Code II is a prefix code", prefix_free(["0", "10", "110", "111"]))
truth("m6-prefix Code III is not a prefix code", not prefix_free(["0", "01", "011", "0111"]))
truth("m6-kraft 0,10,110,1110 is a prefix code", prefix_free(["0", "10", "110", "1110"]))
check("m6-bound 1/n at n=10", 1 / 10, 0.1, 0)
check("m6-bound codebook 3^10", 3**10, 59049, 0)
LMQ = {1: 0.3634, 2: 0.1175, 3: 0.03455}
for r, want in [(1, 1.62), (2, 2.74), (3, 3.45)]:
    check(f"m6-rd Lloyd-Max gap at {r} bit (dB)", todB(LMQ[r] / 2 ** (-2 * r)), want, 0.005)
check("m6-rd 6.02 dB a bit", todB(4), 6.02, 0.005)
check("m6-rd readout at R=1", 2**-2, 0.25, 0)
check("m6-real-codes Braille patterns", 2**6, 64, 0)

# ---- 6.3 Huffman and Lempel-Ziv coding --------------------------------------
FIVE = [0.4, 0.2, 0.2, 0.1, 0.1]
LH, LL = [2, 2, 2, 3, 3], [1, 2, 3, 4, 4]
Lbar = sum(p * l for p, l in zip(FIVE, LH))
check("m6-huffman H", H(FIVE), 2.1219, 0.00005)
check("m6-huffman L", Lbar, 2.2, 1e-12)
check("m6-huffman Huffman L", huffman(FIVE), 2.2, 1e-12)
check("m6-huffman efficiency", H(FIVE) / 2.2, 0.9645, 0.00005)
check("m6-huffman-var low L", sum(p * l for p, l in zip(FIVE, LL)), 2.2, 1e-12)
check("m6-huffman-var sigma^2 high", sum(p * (l - 2.2) ** 2 for p, l in zip(FIVE, LH)), 0.16, 1e-9)
check("m6-huffman-var sigma^2 low", sum(p * (l - 2.2) ** 2 for p, l in zip(FIVE, LL)), 1.36, 1e-9)
truth("m6-huffman codewords are prefix-free", prefix_free(["00", "10", "11", "010", "011"]))
truth("m6-huffman-var low codewords are prefix-free", prefix_free(["1", "01", "000", "0010", "0011"]))
ext = {}
for n in (1, 2, 3):
    ps = [math.prod(t) for t in product(S3, repeat=n)]
    ext[n] = huffman(ps) / n
check("m6-huffman-ext n=1", ext[1], 1.3, 1e-9)
check("m6-huffman-ext n=2", ext[2], 1.165, 1e-9)
check("m6-huffman-ext n=3", ext[3], 1.1753, 0.00005)
check("m6-huffman-ext pairs per pair", 2 * ext[2], 2.33, 1e-9)
check("m6-huffman-ext efficiency n=1", H(S3) / ext[1], 0.8898, 0.00005)
check("m6-huffman-ext efficiency n=2", H(S3) / ext[2], 0.9929, 0.00005)
check("m6-huffman-ext efficiency n=3", H(S3) / ext[3], 0.9842, 0.00005)
truth("m6-huffman-ext triples worse than pairs", ext[3] > ext[2])

lo, hi = 0.0, 1.0
cuts = [0, 0.7, 0.9, 1]
for s in [0, 0, 1]:
    w = hi - lo
    lo, hi = lo + w * cuts[s], lo + w * cuts[s + 1]
check("m6-arith width", hi - lo, 0.098, 1e-12)
check("m6-arith -log2 w", -L2(hi - lo), 3.35, 0.005)
check("m6-arith tag bits", math.ceil(-L2(hi - lo)) + 1, 5, 0)
check("m6-arith tag value 0.01100_2", int("01100", 2) / 32, 0.375, 0)
truth("m6-arith tag interval inside the message interval", lo <= 0.375 and 0.375 + 2**-5 <= hi)
print(f"INFO  arithmetic interval [{lo:.4f}, {hi:.4f})")
check("m6-arith interval low", lo, 0.343, 1e-9)
check("m6-arith interval high", hi, 0.441, 1e-9)


def lz78(bits):
    d = {"": 0}
    out = []
    cur = ""
    for b in bits:
        if cur + b in d:
            cur += b
        else:
            d[cur + b] = len(d)
            out.append((cur + b, d[cur], b))
            cur = ""
    return out


STREAM = "000101110010100101"
ph = lz78(STREAM)
truth("m6-lz stream is 18 bits", len(STREAM) == 18)
truth("m6-lz phrases 0,00,1,01,11,001,010,0101",
      [p[0] for p in ph] == ["0", "00", "1", "01", "11", "001", "010", "0101"])
truth("m6-lz phrase 8 is (7,1)", ph[7][1:] == (7, "1"))
check("m6-lz fixed 3-bit pointer total", len(ph) * (3 + 1), 32, 0)
check("m6-lz growing pointer total", sum(math.ceil(L2(i)) + 1 for i in range(1, len(ph) + 1)), 25, 0)


def mulberry32(seed):
    a = seed & 0xFFFFFFFF

    def r():
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = a
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t ^= (t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    return r


def lzlong(N, seed=6301, p=0.1):
    r = mulberry32(seed)
    nxt = {}
    node = count = cost = 0
    marks = {}
    targets = {jsround(10**e): e for e in (3, 4, 6)}
    for i in range(1, N + 1):
        b = 1 if r() < p else 0
        key = node * 2 + b
        if key in nxt:
            node = nxt[key]
        else:
            count += 1
            nxt[key] = count
            cost += (math.ceil(L2(count)) if count > 1 else 0) + 1
            node = 0
        if i in targets:
            marks[targets[i]] = cost / i
    return marks


mk = lzlong(10**6)
print(f"INFO  LZ78 seed 6301: {mk}")
check("m6-lz-long cost at 10^3", mk[3], 0.689, 0.0005)
check("m6-lz-long cost at 10^6", mk[6], 0.557, 0.0005)
check("m6-lz-long entropy H_b(0.1)", hb(0.1), 0.469, 0.0005)
truth("m6-lz-long cost falls toward H", mk[3] > mk[4] > mk[6] > hb(0.1))

# gallery: compression around us
LZ77 = SPEECH[:240]
PNG_ROW = [jsround(60 + 5 * n + 3 * math.sin(n / 2)) for n in range(32)]
PNG_D = [x - PNG_ROW[n - 1] if n else x for n, x in enumerate(PNG_ROW)]


def histH(xs):
    c = {}
    for x in xs:
        c[x] = c.get(x, 0) + 1
    return H([v / len(xs) for v in c.values()])


print(f"INFO  PNG row H = {histH(PNG_ROW):.2f}, differences H = {histH(PNG_D[1:]):.2f}")
truth("m6-real-compress differences have lower entropy", histH(PNG_D[1:]) < histH(PNG_ROW))
blk = [jsround(128 + 50 * math.cos(math.pi * (x + 0.5) / 10) + 20 * (y / 7) - 10 * math.sin(math.pi * (x + y) / 9)) - 128
       for y in range(8) for x in range(8)]
cu = lambda u: 1 if u else math.sqrt(0.5)
cf = []
for v in range(8):
    for u in range(8):
        s = sum(blk[8 * y + x] * math.cos((2 * x + 1) * u * math.pi / 16) * math.cos((2 * y + 1) * v * math.pi / 16)
                for y in range(8) for x in range(8))
        cf.append(jsround(0.25 * cu(u) * cu(v) * s / 16))
nz = sum(1 for c in cf if c != 0)
print(f"INFO  JPEG block: {nz} of 64 quantized values nonzero")
truth("m6-real-compress most JPEG values are zero", nz < 32)
check("m6-real-compress fax line (pixels)", sum([180, 12, 260, 8, 90, 30, 400, 6, 150, 16, 576]), 1728, 0)

# ---- 6.4 channels and mutual information ------------------------------------
DMC = [[0.8, 0.2], [0.3, 0.7]]
r = chan(DMC, [0.75, 0.25])
check("m6-dmc column sum 1", 0.8 + 0.3, 1.1, 1e-12)
check("m6-dmc column sum 2", 0.2 + 0.7, 0.9, 1e-12)
check("m6-inputdist p(y0)", r["py"][0], 0.675, 1e-12)
check("m6-inputdist p(y1)", r["py"][1], 0.325, 1e-12)
check("m6-inputdist joint x0 y0", 0.8 * 0.75, 0.6, 1e-12)
check("m6-inputdist joint x1 y0", 0.3 * 0.25, 0.075, 1e-12)
check("m6-inputdist joint x0 y1", 0.2 * 0.75, 0.150, 1e-12)
check("m6-inputdist joint x1 y1", 0.7 * 0.25, 0.175, 1e-12)
pb = Q(math.sqrt(2 * dB(4)))
check("m6-bsc 4 dB ratio", dB(4), 2.512, 0.0005)
check("m6-bsc Q argument", math.sqrt(2 * dB(4)), 2.241, 0.0005)
check("m6-bsc crossover at 4 dB", pb, 0.0125, 0.00005)
check("m6-bsc distractor 6 dB", Q(math.sqrt(2 * dB(6))), 0.0024, 0.00005)
check("m6-bsc distractor 0 dB", Q(math.sqrt(2)), 0.0786, 0.00005)
J = [0.4, 0.1, 0.1, 0.4]
check("m6-joint H(X,Y)", H(J), 1.7219, 0.00005)
check("m6-joint H(Y|X)", H(J) - 1, 0.7219, 0.00005)
check("m6-joint H_b(0.2)", hb(0.2), 0.7219, 0.00005)
post0 = 0.6 / 0.675
post1 = 0.15 / 0.325
check("m6-condent P(x0|y0)", post0, 0.889, 0.0005)
check("m6-condent H(X|y0)", hb(post0), 0.503, 0.0005)
check("m6-condent P(x0|y1)", post1, 0.462, 0.0005)
check("m6-condent H(X|y1)", hb(post1), 0.996, 0.0005)
check("m6-condent H(X|Y)", r["HXgY"], 0.663, 0.0005)
check("m6-condent H(Y|X)", r["HYgX"], 0.762, 0.0005)
check("m6-condent H(X) at 0.75", hb(0.75), 0.811, 0.0005)
check("m6-condent BSC 0.1 equivocation", chan([[0.9, 0.1], [0.1, 0.9]], [0.5, 0.5])["HXgY"], 0.469, 0.0005)
check("m6-mutual BSC 0.1", 1 - hb(0.1), 0.531, 0.0005)
check("m6-mutual H(X,Y) at p=0.1", chan([[0.9, 0.1], [0.1, 0.9]], [0.5, 0.5])["HXY"], 1.469, 0.0005)
r25 = chan([[0.75, 0.25], [0.25, 0.75]], [0.5, 0.5])
check("m6-mutual-props I at p=0.25", r25["I"], 0.189, 0.0005)
check("m6-mutual-props H(X,Y) at p=0.25", r25["HXY"], 1.811, 0.0005)
check("m6-mutual-props 1+1-1.811", 1 + 1 - 1.811, 0.189, 1e-9)
check("m6-mutual-props independent pair", chan([[0.5, 0.5], [0.5, 0.5]], [0.3, 0.7])["I"], 0, 1e-12)

# gallery: information around us
rain = chan([[0.8, 0.2], [0.1, 0.9]], [0.3, 0.7])
check("m6-real-info forecast I", rain["I"], 0.348, 0.0005)
check("m6-real-info forecast H(W)", rain["HX"], 0.881, 0.0005)
check("m6-real-info test I at 1%", chan([[0.99, 0.01], [0.05, 0.95]], [0.01, 0.99])["I"], 0.041, 0.0005)
check("m6-real-info BPSK I at 4 dB", 1 - hb(pb), 0.903, 0.0005)
edges = [-math.inf, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, math.inf]
Phi = lambda x: 1.0 if x == math.inf else 0.0 if x == -math.inf else 1 - Q(x)
qp = [Phi(b) - Phi(a) for a, b in zip(edges, edges[1:])]
check("m6-real-info quantizer H(Q)", H(qp), 2.888, 0.0005)

# ---- 6.5 channel capacity ----------------------------------------------------
BSC = lambda p: [[1 - p, p], [p, 1 - p]]
ZCH = [[1, 0], [0.5, 0.5]]
Iz, qz = cap(ZCH)
check("m6-capacity BSC peak", cap(BSC(0.1))[0], 0.531, 0.0005)
check("m6-capacity BSC peak at 1/2", cap(BSC(0.1))[1], 0.5, 0.0005)
check("m6-capacity Z peak", Iz, 0.322, 0.0005)
check("m6-capacity Z peak position", qz, 0.6, 0.0005)
check("m6-capacity readout BSC at 1/2", chan(BSC(0.1), [0.5, 0.5])["I"], 0.531, 0.0005)
check("m6-capacity readout Z at 1/2", chan(ZCH, [0.5, 0.5])["I"], 0.311, 0.0005)
check("m6-bsc-cap C at 0.11", 1 - hb(0.11), 0.5, 0.0005)
check("m6-bec BEC 0.1", 1 - 0.1, 0.9, 1e-12)
BEC = lambda e: [[1 - e, e, 0], [0, e, 1 - e]]
check("m6-bec BEC capacity by maximum", cap(BEC(0.1))[0], 0.9, 1e-6)
check("m6-bec BSC 0.1", 1 - hb(0.1), 0.531, 0.0005)
truth("m6-bec H_b(e) > e below 1/2", all(hb(e / 100) > e / 100 for e in range(1, 50)))
check("m6-ex-zchannel C", Iz, math.log2(5 / 4), 1e-6)
check("m6-ex-zchannel C value", L2(5 / 4), 0.3219, 0.00005)
check("m6-ex-zchannel H_b(0.2) - 0.4", hb(0.2) - 0.4, 0.3219, 0.00005)
check("m6-ex-zchannel I at q=1/2", chan(ZCH, [0.5, 0.5])["I"], 0.3113, 0.00005)
check("m6-ex-zchannel H(Y|X) = 1-q at q=0.6", chan(ZCH, [0.6, 0.4])["HYgX"], 0.4, 1e-12)
SYM = [[0.6, 0.2, 0.2], [0.2, 0.6, 0.2], [0.2, 0.2, 0.6]]
rs = chan(SYM, [1 / 3] * 3)
check("m6-ex-symmetric row entropy", H([0.6, 0.2, 0.2]), 1.371, 0.0005)
check("m6-ex-symmetric C", rs["I"], 0.2140, 0.00005)
check("m6-ex-symmetric log2 3 - H", L2(3) - H([0.6, 0.2, 0.2]), 0.2140, 0.00005)
check("m6-ex-symmetric uses a bit", 1 / rs["I"], 4.67, 0.005)
best = max((chan(SYM, [a, b, 1 - a - b])["I"], a, b)
           for a in (i / 60 for i in range(1, 60)) for b in (j / 60 for j in range(1, 60)) if a + b < 1)
check("m6-ex-symmetric peak input a", best[1], 1 / 3, 1 / 60)
check("m6-ex-symmetric peak input b", best[2], 1 / 3, 1 / 60)
check("m6-why-capacity n=100 p=0.11 exponent", 100 * (1 - hb(0.11)), 50, 0.05)


def repPe(n, p=0.1):
    return sum(math.comb(n, k) * p**k * (1 - p) ** (n - k) for k in range(n // 2 + 1, n + 1))


for n, want, tol in [(1, 0.1, 1e-12), (3, 0.028, 1e-12), (5, 0.0086, 0.00005), (15, 3.36e-5, 0.005e-5)]:
    check(f"m6-repetition P_e n={n}", repPe(n), want, tol)
check("m6-repetition n=3 by hand", 3 * 0.01 * 0.9 + 0.001, 0.028, 1e-12)
check("m6-repetition C(0.1)", 1 - hb(0.1), 0.531, 0.0005)
truth("m6-repetition P_e falls with n", all(repPe(n) > repPe(n + 2) for n in range(1, 15, 2)))
check("m6-coding-thm R=0.5 edge", solve(lambda p: 1 - hb(p) - 0.5, 0.001, 0.5), 0.11, 0.0005)
check("m6-transmission H(U)", hb(0.1), 0.469, 0.0005)
e_star = solve(lambda e: 1 - hb(e) - hb(0.1), 1e-9, 0.5)
check("m6-transmission edge", e_star, 0.1206, 0.00005)
check("m6-transmission upper edge", 1 - e_star, 0.8794, 0.00005)
check("m6-transmission C at 0.2", 1 - hb(0.2), 0.278, 0.0005)
check("m6-transmission readout at 0.05", 1 - hb(0.05), 0.714, 0.0005)


def syn(w):
    return [sum(w[i - 1] for i in range(1, 8) if i & b) % 2 for b in (1, 2, 4)]


words = []
for mword in range(16):
    c = [0] * 8
    for i, pos in enumerate([3, 5, 6, 7]):
        c[pos] = (mword >> (3 - i)) & 1
    c[1] = c[3] ^ c[5] ^ c[7]
    c[2] = c[3] ^ c[6] ^ c[7]
    c[4] = c[5] ^ c[6] ^ c[7]
    words.append(c[1:])
dmin = min(sum(w) for w in words if any(w))
check("m6-codes-glimpse codewords", len(words), 16, 0)
check("m6-codes-glimpse d_min", dmin, 3, 0)
check("m6-codes-glimpse t", (dmin - 1) // 2, 1, 0)
truth("m6-codes-glimpse every codeword has zero syndrome", all(syn(w) == [0, 0, 0] for w in words))
truth("m6-codes-glimpse 0110011 is a codeword", [0, 1, 1, 0, 0, 1, 1] in words)
rw = [0, 1, 1, 0, 1, 1, 1]
s1, s2, s4 = syn(rw)
check("m6-codes-glimpse syndrome of 0110111", s4 * 4 + s2 * 2 + s1, 5, 0)
truth("m6-codes-glimpse Given: s1, s4 fail, s2 holds names bit 5", (1 * 1 + 0 * 2 + 1 * 4) == 5)
check("m6-codes-glimpse rate", 4 / 7, 0.571, 0.0005)

# gallery: capacity around us
cascP = lambda p, n: (1 - (1 - 2 * p) ** n) / 2
check("m6-real-capacity BPSK at 0 dB", 1 - hb(Q(math.sqrt(2))), 0.603, 0.0005)
check("m6-real-capacity cascade 1 hop", 1 - hb(cascP(0.01, 1)), 0.919, 0.0005)
check("m6-real-capacity cascade 10 hops", 1 - hb(cascP(0.01, 10)), 0.559, 0.0005)
Il, ql = cap([[1, 0], [0.1, 0.9]])
check("m6-real-capacity leaky cell C", Il, 0.763, 0.0005)
check("m6-real-capacity leaky cell q", ql, 0.54, 0.005)
check("m6-real-capacity packet loss", 1 - 0.05, 0.95, 1e-12)

# ---- 6.6 the Gaussian channel ------------------------------------------------
check("m6-awgn P/P_N = 15", 0.5 * L2(16), 2, 0)
check("m6-shannon 1 MHz at SNR 15 (Mb/s)", 1 * L2(16), 4, 0)
check("m6-shannon default 11.76 dB", dB(11.76), 15.0, 0.005)
check("m6-shannon readout", L2(1 + dB(11.76)), 4.00, 0.005)
check("m6-shannon 30 dB", dB(30), 1000, 1e-9)
check("m6-ex-phone W", 3400 - 300, 3100, 0)
check("m6-ex-phone log2 1001", L2(1001), 9.967, 0.0005)
check("m6-ex-phone C (kb/s)", 3.1 * L2(1001), 30.9, 0.05)
check("m6-ex-phone common error (kb/s)", 3.1 * L2(31), 15.4, 0.05)
check("m6-bandwidth 1/ln2", 1 / math.log(2), 1.4427, 0.00005)
check("m6-bandwidth limit near W = 10^4 P/N0", 1e4 * L2(1 + 1e-4), 1.4427, 0.0001)
check("m6-bandwidth readout at WN0/P = 1", 1 * L2(2), 1.000, 1e-12)
lim = lambda r: todB((2**r - 1) / r)
check("m6-plane r=2", lim(2), 1.76, 0.005)
check("m6-plane r=2 ratio", (2**2 - 1) / 2, 1.5, 0)
check("m6-limit ln2 (dB)", todB(math.log(2)), -1.59, 0.005)
check("m6-limit r=0.001", lim(0.001), -1.59, 0.005)
check("m6-limit r=4 readout", lim(4), 5.74, 0.005)
bpsk = solve(lambda d: math.log(Q(math.sqrt(2 * dB(d)))) - math.log(1e-5), 0, 20)
check("m6-limit BPSK at 1e-5 (dB)", bpsk, 9.59, 0.005)
check("m6-limit gap (dB)", bpsk - todB(math.log(2)), 11.18, 0.005)
WF_N = [0.1, 0.2, 0.4, 0.8, 1.6, 3.2]


def waterfill(N, P):
    lo, hi = min(N), max(N) + P
    for _ in range(200):
        mu = (lo + hi) / 2
        if sum(max(0, mu - n) for n in N) > P:
            hi = mu
        else:
            lo = mu
    mu = (lo + hi) / 2
    pw = [max(0, mu - n) for n in N]
    return mu, pw, sum(0.5 * L2(1 + p / n) for p, n in zip(pw, N)), sum(0.5 * L2(1 + P / len(N) / n) for n in N)


mu, pw, Cw, Ce = waterfill(WF_N, 1)
check("m6-waterfill mu at P=1", mu, 0.567, 0.0005)
check("m6-waterfill channels used at P=1", sum(p > 0 for p in pw), 3, 0)
check("m6-waterfill C at P=1", Cw, 2.254, 0.0005)
check("m6-waterfill equal shares at P=1", Ce, 1.641, 0.0005)
mu8, pw8, _, _ = waterfill(WF_N, 8)
check("m6-waterfill channels used at P=8", sum(p > 0 for p in pw8), 5, 0)
truth("m6-waterfill low power goes to the quietest", waterfill(WF_N, 0.05)[1][0] > 0 and sum(p > 0 for p in waterfill(WF_N, 0.05)[1]) == 1)
check("m6-real-shannon radio (Mb/s)", 20 * L2(101), 133, 0.5)
check("m6-real-shannon deep space (kb/s)", 10 / math.log(2), 14.4, 0.05)
check("m6-real-shannon telephone (kb/s)", 3.1 * L2(1001), 30.9, 0.05)

# ---- 6.7 summary -------------------------------------------------------------
Hs = H(FIVE)
Cc = 1 - hb(pb)
check("m6-chain H R_s", Hs * 1000, 2122, 0.5)
check("m6-chain L R_s", 2.2 * 1000, 2200, 1e-9)
check("m6-chain C", Cc, 0.903, 0.0005)
check("m6-chain C R_c", Cc * 3000, 2709, 0.5)
check("m6-chain code rate", 2200 / 3000, 0.733, 0.0005)
check("m6-chain Given C R_c at 2000", Cc * 2000, 1806, 0.5)
check("m6-chain p at 4 dB", pb, 0.0125, 0.00005)
check("m6-quick uniform 8", L2(8), 3, 0)
check("m6-quick Kraft 1,2,3,3", kraft([1, 2, 3, 3]), 1, 0)
check("m6-quick BEC 0.2", 1 - 0.2, 0.8, 1e-12)
check("m6-quick BSC distractor 0.278", 1 - hb(0.2), 0.278, 0.0005)
check("m6-quick ln 2", math.log(2), 0.693, 0.0005)
check("m6-quick limit (dB)", todB(math.log(2)), -1.59, 0.005)
check("m6-synth BPSK gap", bpsk - todB(math.log(2)), 11.2, 0.05)
check("m6-synth bandwidth limit", 1 / math.log(2), 1.44, 0.005)
check("m6-open H_b(1/2)", hb(0.5), 1, 1e-12)

# ---- the lecture notes, notes/src/c6.js: numbers beyond the slides ---------------
check("c6 -log2 0.1", -L2(0.1), 3.32, 0.005)
check("c6 rate bound 2 x 6000", 2 * 6000, 12000, 0)
check("c6 typical band low", TS_H - 0.1, 0.622, 0.0005)
check("c6 typical band high", TS_H + 0.1, 0.822, 0.0005)
check("c6 surprise k=1, n=10", -(L2(0.2) + 9 * L2(0.8)) / 10, 0.522, 0.0005)
check("c6 surprise k=3, n=10", -(3 * L2(0.2) + 7 * L2(0.8)) / 10, 0.922, 0.0005)
check("c6 P of one typical sequence", 0.2**2 * 0.8**8, 0.00671, 0.000005)
check("c6 45 x 0.00671", 45 * 0.2**2 * 0.8**8, 0.3020, 0.00005)
check("c6 Huffman H+1", H(FIVE) + 1, 3.1219, 0.00005)
check("c6 variance high term l=2 (all three)", 0.8 * (2 - 2.2) ** 2, 0.032, 1e-9)
check("c6 variance high term l=3 (both)", 0.2 * (3 - 2.2) ** 2, 0.128, 1e-9)
for (p_, l_), want in zip(zip(FIVE, LL), [0.576, 0.008, 0.128, 0.324, 0.324]):
    check(f"c6 variance low term p={p_} l={l_}", p_ * (l_ - 2.2) ** 2, want, 1e-9)
check("c6 variance low terms 0.4 and 0.4 of the last two", 2 * 0.1 * (4 - 2.2) ** 2, 0.648, 1e-9)
check("c6 singles code 0,10,11", 0.7 * 1 + 0.2 * 2 + 0.1 * 2, 1.3, 1e-12)
for n, want in [(1, 2.1568), (2, 1.6568), (3, 1.4901)]:
    check(f"c6 bound H+1/{n}", H(S3) + 1 / n, want, 0.00005)
check("c6 arithmetic tag top", 0.375 + 2**-5, 0.40625, 0)
truth("c6 LZ pairs (0,0),(1,0),(0,1),(1,1),(3,1),(2,1),(4,0),(7,1)",
      [(q[1], int(q[2])) for q in ph] == [(0, 0), (1, 0), (0, 1), (1, 1), (3, 1), (2, 1), (4, 0), (7, 1)])
truth("c6 LZ per-phrase costs 1,2,3,3,4,4,4,4",
      [math.ceil(L2(i)) + 1 for i in range(1, 9)] == [1, 2, 3, 3, 4, 4, 4, 4])
check("c6 LZ phrase lengths sum", sum(len(q[0]) for q in ph), 18, 0)
check("c6 LZ cost at 10^4 (the slide stream)", mk[4], 0.625, 0.0005)
check("c6 H(X)=H_b(0.75)", hb(0.75), 0.811, 0.0005)
check("c6 I = 0.811 - 0.663", r["I"], 0.148, 0.0005)
check("c6 H(Y)=H_b(0.675)", hb(0.675), 0.910, 0.0005)
check("c6 symmetric term -0.6 log2 0.6", -0.6 * L2(0.6), 0.442, 0.0005)
check("c6 Z-channel (1+q)/(1-q) at 0.6", 1.6 / 0.4, 4, 1e-12)
check("c6 Z-channel H_b(0.2) = log2 5 - 1.6", hb(0.2), L2(5) - 1.6, 1e-12)
check("c6 repetition n=5 term k=3", 10 * 0.1**3 * 0.9**2, 0.0081, 1e-12)
check("c6 repetition n=5 term k=4", 5 * 0.1**4 * 0.9, 0.00045, 1e-12)
check("c6 repetition n=5 term k=5", 0.1**5, 0.00001, 1e-15)
truth("c6 Hamming data bits of 0110011 are 1011", [[0, 1, 1, 0, 0, 1, 1][i - 1] for i in (3, 5, 6, 7)] == [1, 0, 1, 1])
check("c6 telephone rough log2 1001", L2(1001), 10, 0.05)
check("c6 water level at P=1", 1.7 / 3, mu, 1e-6)
for i, want in enumerate([0.467, 0.367, 0.167]):
    check(f"c6 water P_{i+1} at P=1", pw[i], want, 0.0005)
for i, want in enumerate([5.667, 2.833, 1.417]):
    check(f"c6 mu/N_{i+1}", mu / WF_N[i], want, 0.0005)
for i, want in enumerate([1.251, 0.751, 0.251]):
    check(f"c6 half log2 on channel {i+1}", 0.5 * L2(1 + pw[i] / WF_N[i]), want, 0.0005)
check("c6 water level at P=8", mu8, (8 + 3.1) / 5, 1e-6)
check("c6 water level at P=8 value", mu8, 2.22, 0.0005)

print(f"\n{passed} passed, {failed} failed")
raise SystemExit(failed > 0)
