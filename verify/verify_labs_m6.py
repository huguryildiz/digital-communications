"""PASS lines for the Module 6 laboratories (build/src/76_labs_m6.js).

The laboratory file is loaded in Node with its browser globals stubbed, and
the numbers it exposes on `core` are evaluated at the settings the screens
show. Every value is compared with an independent route in NumPy/SciPy:

  * the entropies of Laboratory I against scipy.stats.entropy,
  * the typical-set probability and size of TS against scipy.stats.binom and
    log-binomial sums, and the drawn rows against their Bernoulli law,
  * the Huffman codes of J against a heap-based Huffman written here, the
    Kraft sum and the prefix condition,
  * the entropies of MI against the joint pmf, and every Monte Carlo count
    against its joint probability (|z| <= 4),
  * the capacities of K against scalar maximisation and the closed forms
    of the BSC, the erasure channel and the Z-channel, and the cascade
    against a matrix power,
  * the water-filling of WF against the sorted closed form and against a
    constrained optimiser.

    cd verify && ../.venv/bin/python verify_labs_m6.py      # N passed, 0 failed
"""
import heapq
import json
import math
import os
import subprocess

import numpy as np
from scipy import optimize, stats

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LAB = os.path.join(ROOT, "build", "src", "76_labs_m6.js")

passed = failed = 0


def check(name, got, want, tol, rel=False):
    global passed, failed
    err = abs(got - want) / (abs(want) if rel and want else 1.0)
    ok = err <= tol
    passed += ok
    failed += not ok
    kind = "rel" if rel else "abs"
    print(f"{'PASS' if ok else 'FAIL'}  {name}: {got:.6g} (want {want:.6g}, {kind} tol {tol})")


def truth(name, cond):
    global passed, failed
    passed += bool(cond)
    failed += not cond
    print(f"{'PASS' if cond else 'FAIL'}  {name}")


def H(ps):
    ps = np.asarray(ps, float)
    return float(stats.entropy(ps[ps > 0], base=2))


h2 = lambda p: H([p, 1 - p])

# ---------------------------------------------------------------- the JS side
JS = r"""
const fs = require('fs');
global.LABS = {KIT:{T:s=>s, M:s=>s, F:(v,d=3)=>String(v), GH:()=>v=>v, el:()=>null, gcd:(a,b)=>1,
  transport(){}, runbar:()=>''}};
global.PLOT = {COL:{dec:{}}, labelScale:()=>1};
global.APP = {state:{layout:'wide', motion:'full'}};
eval(fs.readFileSync(process.argv[1], 'utf8'));
const I = LABS.I.core, TS = LABS.TS.core, J = LABS.J.core, MI = LABS.MI.core, K = LABS.K.core, WF = LABS.WF.core;
const out = { I:{}, TS:{}, J:{}, MI:{}, K:{}, WF:{} };

out.I.pre = {}; ['uni','one','dya','src'].forEach(k => { const r = I.apply(k); out.I.pre[k] = { K:r.K, w:r.w, H:I.ent(I.norm(r.w)) }; });
out.I.uniK = [2,3,4,5,6].map(k => I.ent(I.norm(Array(k).fill(50))));
out.I.dyadic = [[0.5,0.25,0.125,0.125],[0.7,0.2,0.1],[0.5,0.5],[1,0,0]].map(ps => I.dyadic(ps));
out.I.zeroW = I.norm([0,0,0]);

out.TS.NS = TS.NS; out.TS.ROWS = TS.ROWS;
const d = (n,p,e) => { const r = TS.dist(n,p,e); return { H:r.H, Pt:r.Pt, lA:r.lA, rate:r.rate, size:r.size,
  total:r.pts.reduce((s,q)=>s+q.m,0), typ:r.pts.filter(q=>q.typ).map(q=>q.k), agg:r.agg.length }; };
out.TS.def = d(100, 0.2, 0.1);
out.TS.half = d(50, 0.5, 0.05);
out.TS.grow = TS.NS.map(n => d(n, 0.2, 0.1));
out.TS.small = d(10, 0.2, 0.1);
out.TS.rows = TS.rows(100, 20, 12).map(r => Array.from(r));
out.TS.rows6 = TS.rows(100, 20, 6).map(r => Array.from(r));
out.TS.rowsB = TS.rows(1000, 5, 12).map(r => r.reduce((a,b)=>a+b,0));
out.TS.surprise = out.TS.rows.map(r => TS.surprise(r, 0.2));

const cw = (mode, w, q, high) => { const S = J.source(mode, w, q), B = J.build(S.ps, high);
  return { ps:S.ps, names:S.names, code:B.code, L:B.Lbar, V:B.V, merges:B.steps.length, snaps:B.snaps.map(s=>s.length) }; };
out.J.hi = cw('single', [40,20,20,10,10], [70,20,10], true);
out.J.lo = cw('single', [40,20,20,10,10], [70,20,10], false);
out.J.pairsHi = cw('pairs', [40,20,20,10,10], [70,20,10], true);
out.J.pairsLo = cw('pairs', [40,20,20,10,10], [70,20,10], false);
out.J.single3 = J.single([70,20,10], true);
out.J.rand = [[35,5,27,13,20],[1,1,1,1,96],[60,10,10,10,10]].map(w => cw('single', w, [70,20,10], true));

const ex = (a,b,q) => { const r = MI.exact(a,b,q); return { J:r.J, px:r.px, py:r.py, HX:r.HX, HY:r.HY, HXY:r.HXY, HXgY:r.HXgY, HYgX:r.HYgX, I:r.I }; };
out.MI.bsc = ex(0.1, 0.1, 0.5);
out.MI.any = ex(0.2, 0.3, 0.5);
out.MI.any75 = ex(0.2, 0.3, 0.75);
out.MI.z = ex(0, 0.5, 0.5);
out.MI.eqrows = ex(0.4, 0.6, 0.3);
out.MI.PER = MI.PER; out.MI.BATCHES = MI.BATCHES;
out.MI.mc = [[0.1,0.1,0.5],[0.2,0.3,0.5],[0,0.5,0.6]].map(([a,b,q]) => { const c = MI.counts(a,b,q,25);
  const cn = MI.counted(c.cum[25]); return { a, b, q, cum:c.cum.map(x=>x.slice()), I:cn.I }; });

const cap = (ch, p, n, steps) => { const r = K.cap(K.matrix(ch, p, n), steps); return { q:r.q, I:r.I }; };
out.K.bsc = cap('bsc', 0.1, 1); out.K.bscHalf = K.use(K.matrix('bsc', 0.1, 1), 0.5).I;
out.K.z = cap('z', 0.5, 1); out.K.zHalf = K.use(K.matrix('z', 0.5, 1), 0.5).I;
out.K.bec = cap('bec', 0.1, 1);
out.K.casc = cap('casc', 0.01, 10); out.K.casc1 = cap('casc', 0.01, 1); out.K.pn = K.pHops(0.01, 10);
out.K.pHops = [1,2,5,10,20].map(n => K.pHops(0.1, n));
out.K.useless = cap('bsc', 0.5, 1);
out.K.sweep = [0.05,0.2,0.35,0.7].map(p => ({ p, bsc:cap('bsc',p,1).I, bec:cap('bec',p,1).I, z:cap('z',p,1), cz:cap('casc',p,5).I }));
out.K.family = ['bsc','z','bec'].map(ch => K.family(ch));

out.WF.rise6 = WF.noise('rise', 6); out.WF.notch = [4,6,16].map(n => WF.noise('notch', n));
out.WF.rand = [WF.noise('rand', 8), WF.noise('rand', 8)];
out.WF.flat = WF.noise('flat', 5);
const wf = (prof, n, P) => { const Ns = WF.noise(prof, n), f = WF.fill(Ns, P), e = WF.equal(Ns, P);
  return { Ns, mu:f.mu, Ps:f.Ps, Cw:WF.cap(Ns, f.Ps), Ce:WF.cap(Ns, e), bits:WF.bitsOf(Ns, f.Ps) }; };
out.WF.def = wf('rise', 6, 1);
out.WF.cases = [['rise',6,0.1],['rise',6,8],['flat',5,2],['notch',8,3],['rand',12,4],['rise',16,6]].map(a => Object.assign({ a }, wf(...a)));
process.stdout.write(JSON.stringify(out));
"""
js = json.loads(subprocess.run(["node", "-e", JS, LAB], check=True, capture_output=True, text=True).stdout)


def zscore(k, n, p):
    if p <= 0 or p >= 1:
        return 0.0 if k == round(n * p) else float("inf")
    return (k - n * p) / math.sqrt(n * p * (1 - p))


# ================================================================ I
print("\n--- I · Entropy of a source")
Ij = js["I"]
check("I preset 0.7, 0.2, 0.1: H(S) shown as 1.1568", Ij["pre"]["src"]["H"], H([0.7, 0.2, 0.1]), 1e-12)
check("I preset 0.7, 0.2, 0.1: H(S) to four places", round(Ij["pre"]["src"]["H"], 4), 1.1568, 1e-12)
truth("I preset 0.7, 0.2, 0.1 sets K = 3", Ij["pre"]["src"]["K"] == 3)
check("I preset 0.7, 0.2, 0.1: redundancy 1 - H/log2 3 shown as 0.2702",
      round(1 - Ij["pre"]["src"]["H"] / math.log2(3), 4), 0.2702, 1e-12)
check("I preset 0.7, 0.2, 0.1: ceiling log2 3 shown as 1.5850", round(math.log2(3), 4), 1.5850, 1e-12)
truth("I preset 0.7, 0.2, 0.1: fixed-length code of 2 bits", math.ceil(math.log2(3)) == 2)
check("I preset 0.7, 0.2, 0.1: the gap 2 - H shown as 0.843", round(2 - Ij["pre"]["src"]["H"], 3), 0.843, 1e-12)
check("I dyadic preset: H = 1.75", Ij["pre"]["dya"]["H"], 1.75, 1e-12)
truth("I dyadic preset sets K = 4", Ij["pre"]["dya"]["K"] == 4)
check("I one certain: H = 0", Ij["pre"]["one"]["H"], 0.0, 1e-12)
for k, v in zip([2, 3, 4, 5, 6], Ij["uniK"]):
    check(f"I uniform K = {k}: H = log2 K", v, math.log2(k), 1e-12)
truth("I dyadic test: (1/2,1/4,1/8,1/8) yes, (0.7,0.2,0.1) no, (1/2,1/2) yes, (1,0,0) yes",
      Ij["dyadic"] == [True, False, True, True])
check("I all weights zero: read as uniform", sum(Ij["zeroW"]), 1.0, 1e-12)

# ================================================================ TS
print("\n--- TS · Typical sequences")
T = js["TS"]


def typical(n, p, eps):
    k = np.arange(n + 1)
    v = (-k * np.log2(p) - (n - k) * np.log2(1 - p)) / n
    Hp = h2(p)
    sel = np.abs(v - Hp) <= eps + 1e-12
    Pt = stats.binom.pmf(k[sel], n, p).sum()
    from scipy.special import gammaln, logsumexp
    lc = gammaln(n + 1) - gammaln(k[sel] + 1) - gammaln(n - k[sel] + 1)
    lA = logsumexp(lc) / math.log(2) if sel.any() else -math.inf
    return Hp, Pt, lA, k[sel].tolist()


Hp, Pt, lA, ks = typical(100, 0.2, 0.1)
D = T["def"]
check("TS p = 0.2: H shown as 0.7219", round(D["H"], 4), 0.7219, 1e-12)
check("TS n = 100, eps = 0.1: P(A) against the binomial", D["Pt"], Pt, 1e-10)
check("TS n = 100, eps = 0.1: P(A) shown as 0.8321", round(D["Pt"], 4), 0.8321, 1e-12)
check("TS n = 100, eps = 0.1: log2|A| against log-binomial sum", D["lA"], lA, 1e-9)
check("TS n = 100: log2|A| shown as 78.2", round(D["lA"], 1), 78.2, 1e-12)
check("TS n = 100: rate (1/n) log2|A| shown as 0.7824", round(D["rate"], 4), 0.7824, 1e-12)
check("TS n = 100: share of all 2^n shown as 2^-21.8", round(D["lA"] - 100, 1), -21.8, 1e-12)
check("TS n = 100: nH shown as 72.2", round(100 * D["H"], 1), 72.2, 1e-12)
truth("TS n = 100: the typical counts of ones are the same set", D["typ"] == ks)
check("TS n = 100: the stems carry probability 1", D["total"], 1.0, 1e-12)
Hh, Pth, lAh, _ = typical(50, 0.5, 0.05)
check("TS p = 1/2: every sequence typical, P(A) = 1", T["half"]["Pt"], 1.0, 1e-12)
check("TS p = 1/2: log2|A| = n", T["half"]["lA"], 50.0, 1e-9)
truth("TS p = 1/2: all sequences share one surprise, so one stem", T["half"]["agg"] == 1)
pts = [g["Pt"] for g in T["grow"]]
truth("TS p = 0.2, eps = 0.1: P(A) rises with n over 10 ... 1000 (" + ", ".join(f"{x:.3f}" for x in pts) + ")",
      all(b > a for a, b in zip(pts, pts[1:])) and pts[-1] > 0.99)
for n, g in zip(T["NS"], T["grow"]):
    _, Pn, lAn, _ = typical(n, 0.2, 0.1)
    check(f"TS n = {n}: P(A) against the binomial", g["Pt"], Pn, 1e-10)
truth("TS n = 10: the band holds under 90%, so the note reads not yet concentrated", T["small"]["Pt"] < 0.9)
# the same three numbers as the code page m6-bnd-typical (edge counted as typical)
for n, want in ((10, 0.3020), (100, 0.8321), (1000, 0.9999)):
    got = T["grow"][T["NS"].index(n)]["Pt"]
    check(f"TS n = {n}, eps = 0.1: P(A) shown as {want:.4f}, as the code page prints", round(got, 4), want, 1e-12)
rows = np.array(T["rows"])
ones = rows.sum()
check("TS twelve rows of 100 at p = 0.2: count of ones |z| <= 4", abs(zscore(ones, rows.size, 0.2)), 0.0, 4.0)
truth("TS rows drawn in two runs of six are the first six of one run of twelve", T["rows6"] == T["rows"][:6])
check("TS twelve rows of 1000 at p = 0.05: count of ones |z| <= 4",
      abs(zscore(sum(T["rowsB"]), 12 * 1000, 0.05)), 0.0, 4.0)
for j in (0, 5, 11):
    k = int(rows[j].sum())
    check(f"TS row {j+1}: surprise from its {k} ones", T["surprise"][j], (-k * math.log2(0.2) - (100 - k) * math.log2(0.8)) / 100, 1e-12)

# ================================================================ J
print("\n--- J · Huffman code construction")
Jj = js["J"]


def huffman_lengths(ps):
    heap = [(p, i, [i]) for i, p in enumerate(ps)]
    heapq.heapify(heap)
    L = [0] * len(ps)
    c = len(ps)
    while len(heap) > 1:
        p1, _, a = heapq.heappop(heap)
        p2, _, b = heapq.heappop(heap)
        for i in a + b:
            L[i] += 1
        heapq.heappush(heap, (p1 + p2, c, a + b))
        c += 1
    return L


def tie_rule(ps, high):
    """The course's list rule, written again: sort down, merge the last two,
    put the sum above (high) or below (low) the entries it ties with."""
    items = sorted([(p, [i]) for i, p in enumerate(ps)], key=lambda t: (-t[0], t[1][0]))
    L = [0] * len(ps)
    while len(items) > 1:
        pb, b = items.pop()
        pa, a = items.pop()
        for i in a + b:
            L[i] += 1
        s = pa + pb
        at = len(items)
        for i, (p, _) in enumerate(items):
            if (p <= s + 1e-12) if high else (p < s - 1e-12):
                at = i
                break
        items.insert(at, (s, a + b))
    return L


def avg_var(ps, L):
    Lb = sum(p * l for p, l in zip(ps, L))
    return Lb, sum(p * (l - Lb) ** 2 for p, l in zip(ps, L))


ps5 = [0.4, 0.2, 0.2, 0.1, 0.1]
for tag, got, high in (("high", Jj["hi"], True), ("low", Jj["lo"], False)):
    Lw, Vw = avg_var(ps5, tie_rule(ps5, high))
    check(f"J 0.4, 0.2, 0.2, 0.1, 0.1, ties {tag}: average length 2.2", got["L"], 2.2, 1e-12)
    check(f"J ties {tag}: average against a heap Huffman", got["L"], avg_var(ps5, huffman_lengths(ps5))[0], 1e-12)
    check(f"J ties {tag}: variance against the rule written here", got["V"], Vw, 1e-12)
    lengths = [len(c) for c in got["code"]]
    check(f"J ties {tag}: Kraft sum of the lengths is 1", sum(2.0 ** -l for l in lengths), 1.0, 1e-12)
    truth(f"J ties {tag}: no codeword begins another ({', '.join(got['code'])})",
          not any(a != b and b.startswith(a) for a in got["code"] for b in got["code"]))
    truth(f"J ties {tag}: four merges, the list shrinking 5 to 1", got["merges"] == 4 and got["snaps"] == [5, 4, 3, 2, 1])
check("J ties high: variance shown as 0.16", round(Jj["hi"]["V"], 4), 0.16, 1e-12)
check("J ties low: variance shown as 1.36", round(Jj["lo"]["V"], 4), 1.36, 1e-12)
check("J efficiency H/L shown as 0.9645", round(H(ps5) / Jj["hi"]["L"], 4), 0.9645, 1e-12)
check("J entropy of the five-symbol source shown as 2.1219", round(H(ps5), 4), 2.1219, 1e-12)
ps3 = [0.7, 0.2, 0.1]
pairs = [a * b for a in ps3 for b in ps3]
for tag, got, high in (("high", Jj["pairsHi"], True), ("low", Jj["pairsLo"], False)):
    check(f"J pairs, ties {tag}: L2/2 shown as 1.165", round(got["L"] / 2, 4), 1.165, 1e-12)
    check(f"J pairs, ties {tag}: L2 against a heap Huffman", got["L"], avg_var(pairs, huffman_lengths(pairs))[0], 1e-12)
    check(f"J pairs, ties {tag}: variance against the rule written here", got["V"], avg_var(pairs, tie_rule(pairs, high))[1], 1e-12)
    check(f"J pairs, ties {tag}: Kraft sum 1", sum(2.0 ** -len(c) for c in got["code"]), 1.0, 1e-12)
    truth(f"J pairs, ties {tag}: eight merges", got["merges"] == 8)
check("J one symbol of 0.7, 0.2, 0.1: L shown as 1.3", Jj["single3"]["L"], 1.3, 1e-12)
check("J one symbol: efficiency shown as 0.8898", round(H(ps3) / 1.3, 4), 0.8898, 1e-12)
check("J pairs: efficiency shown as 0.9929", round(2 * H(ps3) / Jj["pairsHi"]["L"], 4), 0.9929, 1e-12)
truth("J pairs: L2/2 < H + 1/2, the bound the note states", Jj["pairsHi"]["L"] / 2 < H(ps3) + 0.5)
truth("J pairs: the names are the nine products s_i s_j", len(Jj["pairsHi"]["names"]) == 9)
for w, got in zip([[35, 5, 27, 13, 20], [1, 1, 1, 1, 96], [60, 10, 10, 10, 10]], Jj["rand"]):
    ps = np.array(w) / sum(w)
    check(f"J weights {w}: average against a heap Huffman", got["L"], avg_var(ps, huffman_lengths(ps))[0], 1e-12)

# ================================================================ MI
print("\n--- MI · Mutual information of a channel")
Mj = js["MI"]


def mi(e0, e1, q):
    Jm = np.array([[q * (1 - e0), q * e0], [(1 - q) * e1, (1 - q) * (1 - e1)]])
    px, py = Jm.sum(1), Jm.sum(0)
    I = sum(Jm[x, y] * math.log2(Jm[x, y] / (px[x] * py[y])) for x in range(2) for y in range(2) if Jm[x, y] > 0)
    return Jm, px, py, I


for tag, got, args in (("BSC p = 0.1, q = 0.5", Mj["bsc"], (0.1, 0.1, 0.5)), ("0.8/0.2, 0.3/0.7, q = 0.5", Mj["any"], (0.2, 0.3, 0.5)),
                       ("Z-channel 1/2, q = 0.5", Mj["z"], (0, 0.5, 0.5))):
    Jm, px, py, I = mi(*args)
    check(f"MI {tag}: I against the sum over the joint pmf", got["I"], I, 1e-12)
    check(f"MI {tag}: H(X) - H(X|Y) = H(Y) - H(Y|X)", got["HX"] - got["HXgY"], got["HY"] - got["HYgX"], 1e-12)
    check(f"MI {tag}: H(X,Y) against the joint pmf", got["HXY"], H(Jm.ravel()), 1e-12)
    check(f"MI {tag}: H(Y) against the output pmf", got["HY"], H(py), 1e-12)
check("MI BSC p = 0.1: I shown as 0.5310 = 1 - H(0.1)", round(Mj["bsc"]["I"], 4), 0.5310, 1e-12)
check("MI BSC p = 0.1: H(X|Y) shown as 0.4690", round(Mj["bsc"]["HXgY"], 4), 0.4690, 1e-12)
check("MI 0.8/0.2, 0.3/0.7, q = 0.5: I shown as 0.1912", round(Mj["any"]["I"], 4), 0.1912, 1e-12)
check("MI 0.8/0.2, 0.3/0.7, q = 0.5: H(Y) shown as 0.9928", round(Mj["any"]["HY"], 4), 0.9928, 1e-12)
check("MI 0.8/0.2, 0.3/0.7, q = 0.5: H(X|Y) shown as 0.809", round(Mj["any"]["HXgY"], 3), 0.809, 1e-12)
check("MI 0.8/0.2, 0.3/0.7, q = 0.5: H(Y|X) shown as 0.802", round(Mj["any"]["HYgX"], 3), 0.802, 1e-12)
check("MI 0.8/0.2, 0.3/0.7, P(x0) = 0.75: P(y0) = 0.675", Mj["any75"]["py"][0], 0.675, 1e-12)
check("MI Z-channel 1/2 at q = 1/2: I = 0.3113", round(Mj["z"]["I"], 4), 0.3113, 1e-12)
check("MI equal rows (0.6, 0.4 twice): I = 0", Mj["eqrows"]["I"], 0.0, 1e-12)
n = Mj["PER"] * Mj["BATCHES"]
truth("MI 25 batches of 200 symbols is 5000", n == 5000)
for m in Mj["mc"]:
    Jm, _, _, I = mi(m["a"], m["b"], m["q"])
    cum = m["cum"]
    worst = max(abs(zscore(cum[25][2 * x + y], n, Jm[x, y])) for x in range(2) for y in range(2) if 0 < Jm[x, y] < 1)
    check(f"MI run {m['a']}, {m['b']}, q = {m['q']}: worst joint count |z| <= 4", worst, 0.0, 4.0)
    check(f"MI run {m['a']}, {m['b']}, q = {m['q']}: counted I near exact", m["I"], I, 0.03)
    truth(f"MI run {m['a']}, {m['b']}, q = {m['q']}: counts grow by 200 a batch",
          all(sum(cum[b]) == 200 * b for b in range(26)))
    truth(f"MI run {m['a']}, {m['b']}, q = {m['q']}: the last batch is not the first replayed",
          [c1 - c0 for c1, c0 in zip(cum[25], cum[24])] != cum[1])
    if m["a"] == 0:
        truth("MI Z-channel run: x0 never flips", cum[25][1] == 0)
check("MI BSC run: counted I shown as 0.5484", round(Mj["mc"][0]["I"], 4), 0.5484, 1e-12)
check("MI BSC run: flips 243 + 230 = 473 counted", Mj["mc"][0]["cum"][25][1] + Mj["mc"][0]["cum"][25][2], 473, 0)

# ================================================================ K
print("\n--- K · Channel capacity")
Kj = js["K"]


def I_of(P, q):
    P = np.asarray(P, float)
    px = np.array([q, 1 - q])
    py = px @ P
    return H(py) - sum(px[i] * H(P[i]) for i in range(2))


def cap_opt(P):
    r = optimize.minimize_scalar(lambda q: -I_of(P, q), bounds=(0, 1), method="bounded", options={"xatol": 1e-10})
    return r.x, -r.fun


def mat(ch, p, n=1):
    if ch == "bsc":
        return [[1 - p, p], [p, 1 - p]]
    if ch == "z":
        return [[1, 0], [p, 1 - p]]
    if ch == "bec":
        return [[1 - p, p, 0], [0, p, 1 - p]]
    B = np.linalg.matrix_power(np.array([[1 - p, p], [p, 1 - p]]), n)
    return B.tolist()


check("K BSC p = 0.1: C = 1 - H(0.1)", Kj["bsc"]["I"], 1 - h2(0.1), 1e-6)
check("K BSC p = 0.1: C shown as 0.5310", round(Kj["bsc"]["I"], 4), 0.5310, 1e-12)
check("K BSC p = 0.1: peak at P(x0) = 1/2", Kj["bsc"]["q"], 0.5, 1e-9)
check("K BSC: I at q = 1/2 equals C", Kj["bscHalf"], 1 - h2(0.1), 1e-12)
zq, zc = cap_opt(mat("z", 0.5))
check("K Z-channel 1/2: C against a scalar maximisation", Kj["z"]["I"], zc, 1e-6)
check("K Z-channel 1/2: C = log2(5/4) = 0.3219", Kj["z"]["I"], math.log2(5 / 4), 1e-6)
check("K Z-channel 1/2: peak at P(x0) = 0.6", Kj["z"]["q"], 0.6, 1e-3)
check("K Z-channel 1/2: I at q = 1/2 is 0.3113", round(Kj["zHalf"], 4), 0.3113, 1e-12)
check("K erasure 0.1: C = 1 - eps = 0.9", Kj["bec"]["I"], 0.9, 1e-9)
check("K erasure 0.1: peak at 1/2", Kj["bec"]["q"], 0.5, 1e-9)
truth("K erasure 0.1 carries more than a BSC of 0.1 (0.9 > 0.531): the note's comparison", Kj["bec"]["I"] > Kj["bsc"]["I"])
check("K cascade of 10 hops at p = 0.01: p_n = 0.0915", round(Kj["pn"], 4), 0.0915, 1e-12)
check("K cascade of 10 hops at p = 0.01: C = 0.5587 (0.559)", round(Kj["casc"]["I"], 4), 0.5587, 1e-12)
check("K cascade of one hop at p = 0.01: C = 0.9192 (0.919)", round(Kj["casc1"]["I"], 4), 0.9192, 1e-12)
for nh, v in zip([1, 2, 5, 10, 20], Kj["pHops"]):
    check(f"K cascade p = 0.1, n = {nh}: p_n against a matrix power", v, np.linalg.matrix_power(np.array([[0.9, 0.1], [0.1, 0.9]]), nh)[0, 1], 1e-12)
check("K BSC p = 1/2: C = 0", Kj["useless"]["I"], 0.0, 1e-12)
for s in Kj["sweep"]:
    p = s["p"]
    check(f"K p = {p}: BSC C = 1 - H(p)", s["bsc"], 1 - h2(p), 1e-6)
    check(f"K p = {p}: erasure C = 1 - p", s["bec"], 1 - p, 1e-6)
    zq, zc = cap_opt(mat("z", p))
    check(f"K p = {p}: Z-channel C against a scalar maximisation", s["z"]["I"], zc, 1e-6)
    check(f"K p = {p}: Z-channel C against log2(1 + (1-p) p^(p/(1-p)))", s["z"]["I"], math.log2(1 + (1 - p) * p ** (p / (1 - p))), 1e-6)
    check(f"K p = {p}: five hops against the matrix power", s["cz"], cap_opt(mat("casc", p, 5))[1], 1e-6)
    truth(f"K p = {p}: an erasure costs less than a flip", s["bec"] >= s["bsc"] - 1e-12)
for name, fam, f in (("BSC", Kj["family"][0], lambda p: 1 - h2(p) if 0 < p < 1 else 1.0),
                     ("Z", Kj["family"][1], lambda p: math.log2(1 + (1 - p) * p ** (p / (1 - p))) if 0 < p < 1 else (1.0 if p == 0 else 0.0)),
                     ("erasure", Kj["family"][2], lambda p: 1 - p)):
    worst = max(abs(v - f(p)) for p, v in fam)
    check(f"K the {name} curve on the second plot, 101 points (grid of 400)", worst, 0.0, 2e-5)

# ================================================================ WF
print("\n--- WF · Sharing power over parallel channels")
Wj = js["WF"]


def waterfill(Ns, P):
    Ns = np.sort(np.asarray(Ns, float))
    for k in range(len(Ns), 0, -1):
        mu = (P + Ns[:k].sum()) / k
        if mu > Ns[k - 1]:
            return mu
    return Ns[0]


def cap_of(Ns, Ps):
    return float(sum(0.5 * math.log2(1 + p / n) for p, n in zip(Ps, Ns)))


truth("WF rising profile at N = 6 is 0.1, 0.2, 0.4, 0.8, 1.6, 3.2", np.allclose(Wj["rise6"], [0.1, 0.2, 0.4, 0.8, 1.6, 3.2], atol=1e-12))
D = Wj["def"]
check("WF rising, P = 1: level mu against the sorted closed form", D["mu"], waterfill(D["Ns"], 1), 1e-9)
check("WF rising, P = 1: mu shown as 0.5667", round(D["mu"], 4), 0.5667, 1e-12)
truth("WF rising, P = 1: three channels used", sum(p > 1e-9 for p in D["Ps"]) == 3)
check("WF rising, P = 1: water-filling C shown as 2.2538", round(D["Cw"], 4), 2.2538, 1e-12)
check("WF rising, P = 1: equal shares C shown as 1.6406", round(D["Ce"], 4), 1.6406, 1e-12)
check("WF rising, P = 1: gain shown as 0.6131", round(D["Cw"] - D["Ce"], 4), 0.6131, 1e-12)
check("WF rising, P = 1: the plan's 2.254 against 1.641", round(D["Cw"], 3) + round(D["Ce"], 3), 2.254 + 1.641, 1e-12)
for j, want in enumerate([1.25, 0.75, 0.25, 0, 0, 0]):
    check(f"WF rising, P = 1: bits of channel {j+1} shown as {want:.2f}", round(D["bits"][j], 2), want, 1e-12)
for c in Wj["cases"]:
    prof, nn, P = c["a"]
    Ns = np.array(c["Ns"])
    check(f"WF {prof}, N = {nn}, P = {P}: powers sum to P", sum(c["Ps"]), P, 1e-9)
    check(f"WF {prof}, N = {nn}, P = {P}: mu against the sorted closed form", c["mu"], waterfill(Ns, P), 1e-9)
    cons = ({"type": "eq", "fun": lambda x: x.sum() - P},)
    r = optimize.minimize(lambda x: -sum(0.5 * np.log2(1 + np.maximum(x, 0) / Ns)), np.full(nn, P / nn),
                          bounds=[(0, None)] * nn, constraints=cons, method="SLSQP", options={"ftol": 1e-13, "maxiter": 500})
    check(f"WF {prof}, N = {nn}, P = {P}: C against a constrained optimiser", c["Cw"], -r.fun, 1e-5)
    check(f"WF {prof}, N = {nn}, P = {P}: equal shares C", c["Ce"], cap_of(Ns, [P / nn] * nn), 1e-12)
    truth(f"WF {prof}, N = {nn}, P = {P}: water-filling never below equal shares", c["Cw"] >= c["Ce"] - 1e-12)
lo, hi = Wj["cases"][0], Wj["cases"][1]
truth("WF rising, P = 0.1: only the quietest channel is used", sum(p > 1e-9 for p in lo["Ps"]) == 1)
truth("WF rising, P = 8: five of six channels used, mu = 2.22 under the last floor 3.2", sum(p > 1e-9 for p in hi["Ps"]) == 5 and abs(hi["mu"] - 11.1 / 5) < 1e-9)
truth("WF flat, N = 5, P = 2: every channel is used", all(p > 1e-9 for p in Wj["cases"][2]["Ps"]))
truth("WF the gain as a share of C shrinks from P = 1 to P = 8",
      (hi["Cw"] - hi["Ce"]) / hi["Cw"] < (D["Cw"] - D["Ce"]) / D["Cw"])
check("WF flat noise: water-filling equals equal shares", Wj["cases"][2]["Cw"], Wj["cases"][2]["Ce"], 1e-9)
truth("WF notch: 2 of 4, 2 of 6 and 4 of 16 channels at 2.4, the rest at 0.3",
      [sum(v == 2.4 for v in x) for x in Wj["notch"]] == [2, 2, 4] and all(v in (0.3, 2.4) for x in Wj["notch"] for v in x))
truth("WF random profile is seeded: two draws of N = 8 agree", Wj["rand"][0] == Wj["rand"][1])
truth("WF random profile stays in 0.1 ... 3.2", all(0.1 <= v <= 3.2 for v in Wj["rand"][0]))

print(f"\n{passed} passed, {failed} failed")
raise SystemExit(1 if failed else 0)
