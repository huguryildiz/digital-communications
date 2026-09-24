"""Re-derives every number stated in the Module 6 practice questions.

Each question in build/src/97_drill_m6.js builds a source from one or two
others, then states its pmf, its entropy term by term, a Huffman code, the
average length, the efficiency, and the numbers of its Check step. STATED below
lists those numbers with the exact text the solution prints. Each is reached
here by a route the solution does not take:

  pmf values       brute-force enumeration of the input alphabets with the
                   mapping written again below, plus one Monte Carlo run a
                   question with a fixed seed
  entropy          scipy.stats.entropy on the enumerated pmf
  lengths          a heap-based Huffman construction (a different algorithm
                   from the list procedure the solutions use; the average
                   length of an optimal code is the same for both)
  constants        sympy solves the normalisation and ratio statements
  information      double sums over the joint pmf of input and output

A last check per question confirms that every stated text occurs inside that
question's block of the JS file, so the table below cannot drift from the page.

Four questions are on the channel side (D6-06, D6-07, D6-14, D6-22). Their
numbers are in the CHANNEL table further down, with the routes listed there.

The runner is the one in verify_drills.py: a CHECKS list of dicts with
"name", "stated", "derive" and "tol", and main() prints N passed, M failed.
"""

import heapq
import itertools
import json
import math
import os
import re
import sys
from fractions import Fraction

import numpy as np
import sympy as sp
from scipy.stats import entropy as sp_entropy

DEFAULT_TOL = 5e-4          # stated values carry four significant decimals
HERE = os.path.dirname(os.path.abspath(__file__))
JS = os.path.join(HERE, '..', 'build', 'src', '97_drill_m6.js')

# ── the sources, written again from the question statements ─────────────────

def U(vals):
    vals = list(vals)
    return {v: 1.0/len(vals) for v in vals}


def _c_normalised(weights):
    """sympy: the constant c that makes c*sum(weights) = 1"""
    c = sp.Symbol('c', positive=True)
    return float(sp.solve(sp.Eq(c*sum(sp.nsimplify(w) for w in weights), 1), c)[0])


def geo(zs, base, c=None):
    """p(z) = c * base**z on the integers zs, with c from sympy"""
    ws = [sp.Rational(base)**z for z in zs]
    cc = _c_normalised(ws) if c is None else c
    return {z: cc*float(w) for z, w in zip(zs, ws)}


SOURCES = {
    'D6-01': ([U(range(-4, 5))], lambda x: (x**3) % 5),
    'D6-02': ([U(range(0, 10))], lambda x: (x*x) % 10),
    'D6-03': ([U(range(1, 13))], lambda x: math.floor(12/x)),
    'D6-04': ([U(range(16))], lambda x: sum((x >> i) & 1 for i in range(4))),
    'D6-05': ([U(range(-5, 6))], lambda x: math.ceil(abs(x)/2)),
    'D6-08': ([U(range(-7, 8))], lambda x: max(x, 0)),
    'D6-09': ([U([1, 2, 3]), geo([-1, 0, 1], '1/3')], lambda x, z: x*z),
    'D6-10': ([U([-1, 0, 1]), {z: _c_normalised([sp.Rational(1, k) for k in (1, 2, 3)])/z for z in (1, 2, 3)}], lambda x, z: x*z),
    'D6-11': ([U(range(4)), geo([0, 1, 2], '1/2')], lambda x, z: max(x, z)),
    'D6-12': ([U(range(4)), {z: _c_normalised([sp.Rational(1, 2), 1, sp.Rational(1, 2)])*2.0**(-abs(z)) for z in (-1, 0, 1)}], lambda x, z: x+z),
    'D6-13': ([U(range(6)), {z: _c_normalised([1, 3])*z for z in (1, 3)}], lambda x, z: math.floor(x/z)),
    'D6-15': ([U(range(4)), geo([0, 1, 2, 3], '1/2')], lambda x, z: min(x, z)),
    'D6-16': ([{0: 4/7, 1: 2/7, 2: 1/7}, U(range(4))], lambda x, y: x+y),
    'D6-17': ([U([1, 2, 3]), {1: 0.5, 2: 0.25, 3: 0.25}], lambda x, y: x*y),
    'D6-18': ([U(range(4)), U(range(6))], lambda x, y: abs(x-y)),
    'D6-19': ([U(range(1, 6)), U(range(1, 6))], lambda x, y: min(x, y)),
    'D6-20': ([{0: 0.25, 1: 0.5, 2: 0.25}, {0: 4/7, 1: 2/7, 2: 1/7}], lambda x, y: x-y),
    'D6-21': ([{k: k/10 for k in range(1, 5)}, U([0, 2, 4])], lambda x, y: x+y),
    'D6-23': ([U(range(1, 17))], lambda x: math.floor(math.log2(x))),
    'D6-24': ([U(range(4)), U(range(4))], lambda x, y: abs(x-y)),
    'D6-25': ([U(range(4)), U([0, 1])], lambda x, z: (x*z) % 2),
    'D6-26': ([U(range(-2, 6))], lambda x: abs(x-1)),
    'D6-27': ([{0: 0.5, 1: 0.25, 2: 0.25}, U(range(4))], lambda x, y: x+y),
    'D6-28': ([U(range(1, 10))], lambda x: x % 4),
    'D6-29': ([U(range(1, 13))], lambda x: x % 5),
    'D6-30': ([U(range(4)), geo([0, 1, 2], '1/3')], lambda x, z: x*z),
}

# the common denominator each solution writes its probabilities over
DEN = {'D6-01': 9, 'D6-02': 10, 'D6-03': 12, 'D6-04': 16, 'D6-05': 11,
       'D6-08': 15, 'D6-09': 39, 'D6-10': 33, 'D6-11': 28, 'D6-12': 16,
       'D6-13': 24, 'D6-15': 60, 'D6-16': 28, 'D6-17': 12, 'D6-18': 24,
       'D6-19': 25, 'D6-20': 28, 'D6-21': 30, 'D6-23': 16, 'D6-24': 16,
       'D6-25': 4, 'D6-26': 8, 'D6-27': 16, 'D6-28': 9, 'D6-29': 12, 'D6-30': 52}


def pmf(q):
    ins, f = SOURCES[q]
    out = {}
    for combo in itertools.product(*[list(p.items()) for p in ins]):
        y = f(*[v for v, _ in combo])
        out[y] = out.get(y, 0.0) + float(np.prod([p for _, p in combo]))
    return out


def joint(q):
    """p(x, y_out) for the first input and the output"""
    ins, f = SOURCES[q]
    out = {}
    for combo in itertools.product(*[list(p.items()) for p in ins]):
        key = (combo[0][0], f(*[v for v, _ in combo]))
        out[key] = out.get(key, 0.0) + float(np.prod([p for _, p in combo]))
    return out


def mc_pmf(q, y, n=400_000, seed=6):
    rng = np.random.default_rng(seed)
    ins, f = SOURCES[q]
    draws = []
    for p in ins:
        vals, pr = zip(*p.items())
        draws.append(rng.choice(np.array(vals), size=n, p=np.array(pr)/sum(pr)))
    ys = np.array([f(*map(int, t)) for t in zip(*draws)])
    return float(np.mean(ys == y))


def H(p):
    return float(sp_entropy(list(p.values()), base=2))


def heap_huffman(p):
    """Huffman by a priority queue. Returns (depth of each symbol, merge sums)."""
    cnt = itertools.count()
    heap = [(pr, next(cnt), [s]) for s, pr in p.items()]
    heapq.heapify(heap)
    depth = {s: 0 for s in p}
    sums = []
    while len(heap) > 1:
        a, _, sa = heapq.heappop(heap)
        b, _, sb = heapq.heappop(heap)
        for s in sa + sb:
            depth[s] += 1
        sums.append(a+b)
        heapq.heappush(heap, (a+b, next(cnt), sa+sb))
    return depth, sums


def Lopt(p):
    d, _ = heap_huffman(p)
    return sum(p[s]*d[s] for s in p)


def list_huffman_low(counts):
    """The list procedure with each merged sum placed as LOW as possible among
    equal values: the second code of D6-24. Returns the codeword lengths."""
    items = sorted(counts.items(), key=lambda t: -t[1])
    lst = [(c, [s]) for s, c in items]
    depth = {s: 0 for s in counts}
    while len(lst) > 1:
        (ca, sa), (cb, sb) = lst[-2], lst[-1]
        lst = lst[:-2]
        for s in sa + sb:
            depth[s] += 1
        s_ = ca + cb
        pos = 0
        for i, (c, _) in enumerate(lst):
            if c >= s_:
                pos = i + 1
        lst.insert(pos, (s_, sa + sb))
    return depth


def ext(q):
    p = pmf(q)
    return {f'{a}{b}': p[a]*p[b] for a in p for b in p}


def codes_ok(q, codes):
    """prefix-free, Kraft sum one, and optimal average length"""
    codes = {k: v for k, v in codes.items()}
    p = pmf(q)
    if all(len(k) == 2 and set(k) <= {'0', '1'} for k in codes) and q == 'D6-25':
        p = ext(q)
        keyed = {k: codes[k] for k in p}
    else:
        keyed = {y: codes[str(y)] for y in p}
    words = list(keyed.values())
    prefix_free = not any(a != b and b.startswith(a) for a in words for b in words)
    kraft = sum(2.0**-len(w) for w in words)
    L = sum(p[y]*len(w) for y, w in keyed.items())
    return 1.0 if (prefix_free and abs(kraft-1) < 1e-12 and abs(L - Lopt(p)) < 1e-12) else 0.0


def codes_low_ok(q, codes):
    p = pmf(q)
    counts = {y: round(p[y]*DEN[q]) for y in p}
    d = list_huffman_low(counts)
    words = {y: codes[str(y)] for y in p}
    prefix_free = not any(a != b and b.startswith(a) for a in words.values() for b in words.values())
    same = all(len(words[y]) == d[y] for y in p)
    return 1.0 if (prefix_free and same) else 0.0


def cond_H(q):
    """H(first input | output) by the double sum over the joint pmf"""
    j = joint(q)
    py = {}
    for (x, y), v in j.items():
        py[y] = py.get(y, 0.0) + v
    return -sum(v*math.log2(v/py[y]) for (x, y), v in j.items() if v > 0)


def cond_H_out(q):
    """H(output | first input)"""
    j = joint(q)
    px = {}
    for (x, y), v in j.items():
        px[x] = px.get(x, 0.0) + v
    return -sum(v*math.log2(v/px[x]) for (x, y), v in j.items() if v > 0)


def mutual(q):
    j = joint(q)
    px, py = {}, {}
    for (x, y), v in j.items():
        px[x] = px.get(x, 0.0) + v
        py[y] = py.get(y, 0.0) + v
    return sum(v*math.log2(v/(px[x]*py[y])) for (x, y), v in j.items() if v > 0)


def ratio_q(eqs, unknowns, target):
    sol = sp.solve(eqs, unknowns, dict=True)[0]
    return float(sol[target])


def solve_a30():
    c, a = sp.symbols('c a', positive=True)
    sols = sp.solve([sp.Eq(c + (1 - c)/4, sp.Rational(10, 13)), sp.Eq(c*(1 + a + a**2), 1)], [c, a], dict=True)
    sols = [s for s in sols if 0 < s[a] < 1]
    return float(sols[0][c]), float(sols[0][a])


def parse_frac(t):
    m = re.search(r'\\t?frac(?:\{(\d+)\}|(\d))(?:\{(\d+)\}|(\d))', t)
    return int(m.group(1) or m.group(2)), int(m.group(3) or m.group(4))

# ── derivations by kind ───────────────────────────────────────────────────────

def derive(q, kind, args, text):
    D = DEN[q]
    p = pmf(q)
    if kind == 'pmf':
        y = int(args[0])
        return p[y]
    if kind == 'term':
        n = int(args[0])
        return (n/D)*math.log(D/n)/math.log(2)
    if kind in ('H',):
        return H(p)
    if kind in ('L', 'Lfrac'):
        return Lopt(p)
    if kind == 'msum':
        if q == 'D6-25':
            return sum(heap_huffman(ext(q))[1])
        return sum(heap_huffman(p)[1])
    if kind in ('eta', 'pct'):
        return H(p)/Lopt(p)
    if kind == 'log2D':
        return float(sp.log(D, 2).evalf())
    if kind == 'nlogn':
        return float(sp.log(D, 2).evalf()) - H(p)
    if kind == 'kraft':
        d, _ = heap_huffman(p)
        return sum(2.0**-d[s] for s in p)
    if kind == 'Hp1':
        return H(p) + 1
    if kind == 'codes':
        return codes_ok(q, json.loads(args[0]))
    if kind == 'codes_low':
        return codes_low_ok(q, json.loads(args[0]))
    if kind == 'c':
        if q == 'D6-30':
            return solve_a30()[0]
        zp = SOURCES[q][0][1]
        # the constant is p_Z at the point where the shape equals one
        shape = {'D6-09': 0, 'D6-10': 1, 'D6-11': 0, 'D6-12': 0, 'D6-13': 1, 'D6-15': 0}[q]
        return zp[shape]
    if kind == 'a':
        return solve_a30()[1]
    if kind in ('q', 'r'):
        x0, x1, x2, x3 = sp.symbols('x0 x1 x2 x3', positive=True)
        if q == 'D6-16':
            return ratio_q([sp.Eq(x0, 2*x1), sp.Eq(x0, 4*x2), sp.Eq(x0+x1+x2, 1)], [x0, x1, x2], x2)
        if q == 'D6-17':
            return ratio_q([sp.Eq(x1, 2*x2), sp.Eq(x1, 2*x3), sp.Eq(x1+x2+x3, 1)], [x1, x2, x3], x2)
        if q == 'D6-20' and kind == 'q':
            return ratio_q([sp.Eq(x1, 2*x0), sp.Eq(x1, 2*x2), sp.Eq(x0+x1+x2, 1)], [x0, x1, x2], x0)
        if q == 'D6-20' and kind == 'r':
            return ratio_q([sp.Eq(x0, 2*x1), sp.Eq(x0, 4*x2), sp.Eq(x0+x1+x2, 1)], [x0, x1, x2], x2)
        if q == 'D6-21':
            return ratio_q([sp.Eq(x0+2*x0+3*x0+4*x0, 1)], [x0], x0)
        if q == 'D6-27':
            return ratio_q([sp.Eq(x0, 2*x1), sp.Eq(x0, 2*x2), sp.Eq(x0+x1+x2, 1)], [x0, x1, x2], x1)
    if kind == 'cdf11':
        return p[0] + p[1]
    if kind == 'log2_5':
        return math.log(5)/math.log(2)
    if kind == 'log2_6':
        return math.log(6)/math.log(2)
    if kind == 'etafix':
        return H(p)/math.ceil(math.log2(len(p)))
    if kind == 'excess':
        return math.ceil(math.log2(len(p)))/H(p) - 1
    if kind == 'L2':
        if q == 'D6-24':
            counts = {y: round(p[y]*D) for y in p}
            d = list_huffman_low(counts)
            return sum(p[y]*d[y] for y in p)
        return Lopt(ext(q))
    if kind == 'var2':
        counts = {y: round(p[y]*D) for y in p}
        d = list_huffman_low(counts)
        L = sum(p[y]*d[y] for y in p)
        return sum(p[y]*(d[y]-L)**2 for y in p)
    if kind == 'eta1':
        return H(p)/1.0
    if kind == 'pairp':
        return ext(q)[args[0]]
    if kind == 'Lper':
        return Lopt(ext(q))/2
    if kind == 'eta2':
        return H(ext(q))/Lopt(ext(q))
    if kind == 'H2':
        return H(ext(q))
    if kind == 'H2p1':
        return H(ext(q)) + 1
    if kind == '3log3':
        return 2 - H(p)
    if kind == 'HX':
        return H(SOURCES[q][0][0])
    if kind == 'I':
        return mutual(q)
    if kind == 'HXgY':
        return cond_H(q)
    if kind == 'HZgX':
        return cond_H_out(q)
    if kind == 'kraftprop':
        return sum(2.0**-l for l in (1, 1, 2, 2))
    if kind == 'Lprop':
        prop = {1: '0', 0: '1', 2: '01', 3: '10'}
        return sum(p[y]*len(prop[y]) for y in p)
    if kind in ('kraftS', 'LS', 'etaS'):
        ls = {y: math.ceil(-math.log2(p[y]) - 1e-12) for y in p}
        if kind == 'kraftS':
            return sum(2.0**-l for l in ls.values())
        LS = sum(p[y]*ls[y] for y in p)
        return LS if kind == 'LS' else H(p)/LS
    raise KeyError(kind)


def stated_value(kind, value, text):
    """The number as the page prints it. A fraction is read from its TeX."""
    if kind in ('codes', 'codes_low'):
        return 1.0
    if '\\frac' in text or '\\tfrac' in text:
        n, d = parse_frac(text)
        return n/d
    if kind == 'pct':
        return float(text)/100
    if kind == 'excess':
        return float(text.replace('\\%', ''))/100
    return float(text)


def js_blocks():
    src = open(JS, encoding='utf-8').read()
    parts = re.split(r"\n\{ id:'(D6-\d\d)'", src)
    return {parts[i]: parts[i+1] for i in range(1, len(parts), 2)}


def text_present(q):
    """Fraction of the stated texts found in the question's JS block."""
    block = js_blocks()[q].replace('\\\\', '\\')
    texts = [t for k, a, v, t in STATED[q] if t]
    return sum(1 for t in texts if t in block)/len(texts)


STATED = {
    'D6-01': [
        ('pmf', ['0'], 0.1111111111111111, '\\frac{1}{9}'),
        ('pmf', ['1'], 0.2222222222222222, '\\frac{2}{9}'),
        ('pmf', ['2'], 0.2222222222222222, '\\frac{2}{9}'),
        ('pmf', ['3'], 0.2222222222222222, '\\frac{2}{9}'),
        ('pmf', ['4'], 0.2222222222222222, '\\frac{2}{9}'),
        ('term', ['2'], 0.48220555587606934, '0.4822'),
        ('term', ['1'], 0.3522138890491458, '0.3522'),
        ('H', [], 2.2810361125534238, '2.2810'),
        ('codes', ['{"4": "000", "0": "001", "1": "01", "2": "10", "3": "11"}'], 1.0, ''),
        ('L', [], 2.3333333333333335, '2.3333'),
        ('Lfrac', [], 2.3333333333333335, '\\frac{21}{9}'),
        ('eta', [], 0.9775869053800387, '0.9776'),
        ('pct', [], 0.9775869053800387, '97.76'),
        ('msum', [], 2.3333333333333335, '\\frac{21}{9}'),
        ('log2D', [], 3.169925001442312, '3.1699'),
        ('nlogn', [], 0.8888888888888888, '0.8889'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 3.2810361125534238, '3.2810'),
    ],
    'D6-02': [
        ('pmf', ['0'], 0.1, '\\frac{1}{10}'),
        ('pmf', ['1'], 0.2, '\\frac{2}{10}'),
        ('pmf', ['4'], 0.2, '\\frac{2}{10}'),
        ('pmf', ['5'], 0.1, '\\frac{1}{10}'),
        ('pmf', ['6'], 0.2, '\\frac{2}{10}'),
        ('pmf', ['9'], 0.2, '\\frac{2}{10}'),
        ('term', ['2'], 0.46438561897747244, '0.46439'),
        ('term', ['1'], 0.33219280948873625, '0.33219'),
        ('H', [], 2.5219280948873624, '2.5219'),
        ('codes', ['{"6": "000", "9": "001", "0": "010", "5": "011", "1": "10", "4": "11"}'], 1.0, ''),
        ('L', [], 2.6, '2.6000'),
        ('Lfrac', [], 2.6, '\\frac{26}{10}'),
        ('eta', [], 0.969972344187447, '0.9700'),
        ('pct', [], 0.969972344187447, '97.00'),
        ('msum', [], 2.6, '\\frac{26}{10}'),
        ('log2D', [], 3.321928094887362, '3.3219'),
        ('nlogn', [], 0.8, '0.8000'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 3.5219280948873624, '3.5219'),
    ],
    'D6-03': [
        ('pmf', ['1'], 0.5, '\\frac{6}{12}'),
        ('pmf', ['2'], 0.16666666666666666, '\\frac{2}{12}'),
        ('pmf', ['3'], 0.08333333333333333, '\\frac{1}{12}'),
        ('pmf', ['4'], 0.08333333333333333, '\\frac{1}{12}'),
        ('pmf', ['6'], 0.08333333333333333, '\\frac{1}{12}'),
        ('pmf', ['12'], 0.08333333333333333, '\\frac{1}{12}'),
        ('term', ['6'], 0.5, '0.50000'),
        ('term', ['2'], 0.430827083453526, '0.43083'),
        ('term', ['1'], 0.29874687506009634, '0.29875'),
        ('H', [], 2.1258145836939115, '2.1258'),
        ('codes', ['{"6": "0000", "12": "0001", "2": "001", "3": "010", "4": "011", "1": "1"}'], 1.0, ''),
        ('L', [], 2.1666666666666665, '2.1667'),
        ('Lfrac', [], 2.1666666666666665, '\\frac{26}{12}'),
        ('eta', [], 0.981145192474113, '0.9811'),
        ('pct', [], 0.981145192474113, '98.11'),
        ('msum', [], 2.1666666666666665, '\\frac{26}{12}'),
        ('log2D', [], 3.584962500721156, '3.5850'),
        ('nlogn', [], 1.4591479170272448, '1.4591'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 3.1258145836939115, '3.1258'),
    ],
    'D6-04': [
        ('pmf', ['0'], 0.0625, '\\frac{1}{16}'),
        ('pmf', ['1'], 0.25, '\\frac{4}{16}'),
        ('pmf', ['2'], 0.375, '\\frac{6}{16}'),
        ('pmf', ['3'], 0.25, '\\frac{4}{16}'),
        ('pmf', ['4'], 0.0625, '\\frac{1}{16}'),
        ('term', ['6'], 0.5306390622295664, '0.5306'),
        ('term', ['4'], 0.5, '0.5000'),
        ('term', ['1'], 0.25, '0.2500'),
        ('H', [], 2.0306390622295662, '2.0306'),
        ('codes', ['{"2": "00", "1": "01", "3": "10", "0": "110", "4": "111"}'], 1.0, ''),
        ('L', [], 2.125, '2.1250'),
        ('Lfrac', [], 2.125, '\\frac{34}{16}'),
        ('eta', [], 0.9555948528139135, '0.9556'),
        ('pct', [], 0.9555948528139135, '95.56'),
        ('msum', [], 2.125, '\\frac{34}{16}'),
        ('log2D', [], 4.0, '4.0000'),
        ('nlogn', [], 1.9693609377704335, '1.9694'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 3.0306390622295662, '3.0306'),
    ],
    'D6-05': [
        ('pmf', ['0'], 0.09090909090909091, '\\frac{1}{11}'),
        ('pmf', ['1'], 0.36363636363636365, '\\frac{4}{11}'),
        ('pmf', ['2'], 0.36363636363636365, '\\frac{4}{11}'),
        ('pmf', ['3'], 0.18181818181818182, '\\frac{2}{11}'),
        ('term', ['4'], 0.530702406777199, '0.5307'),
        ('term', ['2'], 0.44716938520678134, '0.4472'),
        ('term', ['1'], 0.3144937835124816, '0.3145'),
        ('H', [], 1.823067982273661, '1.8231'),
        ('codes', ['{"2": "00", "3": "010", "0": "011", "1": "1"}'], 1.0, ''),
        ('L', [], 1.9090909090909092, '1.9091'),
        ('Lfrac', [], 1.9090909090909092, '\\frac{21}{11}'),
        ('eta', [], 0.9549403716671557, '0.9549'),
        ('pct', [], 0.9549403716671557, '95.49'),
        ('msum', [], 1.9090909090909092, '\\frac{21}{11}'),
        ('log2D', [], 3.4594316186372973, '3.4594'),
        ('nlogn', [], 1.6363636363636365, '1.6364'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 2.823067982273661, '2.8231'),
    ],
    'D6-08': [
        ('pmf', ['0'], 0.5333333333333333, '\\frac{8}{15}'),
        ('pmf', ['1'], 0.06666666666666667, '\\frac{1}{15}'),
        ('pmf', ['2'], 0.06666666666666667, '\\frac{1}{15}'),
        ('pmf', ['3'], 0.06666666666666667, '\\frac{1}{15}'),
        ('pmf', ['4'], 0.06666666666666667, '\\frac{1}{15}'),
        ('pmf', ['5'], 0.06666666666666667, '\\frac{1}{15}'),
        ('pmf', ['6'], 0.06666666666666667, '\\frac{1}{15}'),
        ('pmf', ['7'], 0.06666666666666667, '\\frac{1}{15}'),
        ('term', ['8'], 0.4836749843245432, '0.48367'),
        ('term', ['1'], 0.26045937304056793, '0.26046'),
        ('H', [], 2.3068905956085186, '2.3069'),
        ('codes', ['{"0": "0", "2": "1000", "3": "1001", "4": "1010", "5": "1011", "6": "1100", "7": "1101", "1": "111"}'], 1.0, ''),
        ('L', [], 2.3333333333333335, '2.3333'),
        ('Lfrac', [], 2.3333333333333335, '\\frac{35}{15}'),
        ('eta', [], 0.9886673981179365, '0.9887'),
        ('pct', [], 0.9886673981179365, '98.87'),
        ('msum', [], 2.3333333333333335, '\\frac{35}{15}'),
        ('log2D', [], 3.9068905956085187, '3.9069'),
        ('nlogn', [], 1.6, '1.6000'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 3.3068905956085186, '3.3069'),
    ],
    'D6-09': [
        ('pmf', ['-3'], 0.23076923076923078, '\\frac{9}{39}'),
        ('pmf', ['-2'], 0.23076923076923078, '\\frac{9}{39}'),
        ('pmf', ['-1'], 0.23076923076923078, '\\frac{9}{39}'),
        ('pmf', ['0'], 0.23076923076923078, '\\frac{9}{39}'),
        ('pmf', ['1'], 0.02564102564102564, '\\frac{1}{39}'),
        ('pmf', ['2'], 0.02564102564102564, '\\frac{1}{39}'),
        ('pmf', ['3'], 0.02564102564102564, '\\frac{1}{39}'),
        ('term', ['9'], 0.48818705017383135, '0.4882'),
        ('term', ['1'], 0.13552313381698072, '0.1355'),
        ('H', [], 2.359317602146268, '2.3593'),
        ('codes', ['{"0": "000", "2": "00100", "3": "00101", "1": "0011", "-3": "01", "-2": "10", "-1": "11"}'], 1.0, ''),
        ('L', [], 2.4358974358974357, '2.4359'),
        ('Lfrac', [], 2.4358974358974357, '\\frac{95}{39}'),
        ('eta', [], 0.9685619629863627, '0.9686'),
        ('pct', [], 0.9685619629863627, '96.86'),
        ('c', [], 0.23076923076923078, 'c=\\tfrac{3}{13}'),
        ('msum', [], 2.4358974358974357, '\\frac{95}{39}'),
        ('log2D', [], 5.285402218862249, '5.2854'),
        ('nlogn', [], 2.9260846167159804, '2.9261'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 3.359317602146268, '3.3593'),
    ],
    'D6-10': [
        ('pmf', ['-3'], 0.06060606060606061, '\\frac{2}{33}'),
        ('pmf', ['-2'], 0.09090909090909091, '\\frac{3}{33}'),
        ('pmf', ['-1'], 0.18181818181818182, '\\frac{6}{33}'),
        ('pmf', ['0'], 0.3333333333333333, '\\frac{11}{33}'),
        ('pmf', ['1'], 0.18181818181818182, '\\frac{6}{33}'),
        ('pmf', ['2'], 0.09090909090909091, '\\frac{3}{33}'),
        ('pmf', ['3'], 0.06060606060606061, '\\frac{2}{33}'),
        ('term', ['11'], 0.5283208335737186, '0.5283'),
        ('term', ['6'], 0.44716938520678134, '0.4472'),
        ('term', ['3'], 0.3144937835124816, '0.3145'),
        ('term', ['2'], 0.24511479511263354, '0.2451'),
        ('H', [], 2.5418767612375115, '2.5419'),
        ('codes', ['{"0": "00", "1": "010", "-3": "0110", "3": "0111", "-2": "100", "2": "101", "-1": "11"}'], 1.0, ''),
        ('L', [], 2.606060606060606, '2.6061'),
        ('Lfrac', [], 2.606060606060606, '\\frac{86}{33}'),
        ('eta', [], 0.97537131535858, '0.9754'),
        ('pct', [], 0.97537131535858, '97.54'),
        ('c', [], 0.5454545454545454, 'c=\\tfrac{6}{11}'),
        ('msum', [], 2.606060606060606, '\\frac{86}{33}'),
        ('log2D', [], 5.044394119358453, '5.0444'),
        ('nlogn', [], 2.502517358120942, '2.5025'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 3.5418767612375115, '3.5419'),
    ],
    'D6-11': [
        ('pmf', ['0'], 0.14285714285714285, '\\frac{4}{28}'),
        ('pmf', ['1'], 0.2857142857142857, '\\frac{8}{28}'),
        ('pmf', ['2'], 0.32142857142857145, '\\frac{9}{28}'),
        ('pmf', ['3'], 0.25, '\\frac{7}{28}'),
        ('term', ['9'], 0.5263167601977724, '0.5263'),
        ('term', ['8'], 0.5163871205878868, '0.5164'),
        ('term', ['7'], 0.5, '0.5000'),
        ('term', ['4'], 0.40105070315108626, '0.4011'),
        ('H', [], 1.9437545839367454, '1.9438'),
        ('codes', ['{"2": "00", "1": "01", "3": "10", "0": "11"}'], 1.0, ''),
        ('L', [], 2.0, '2.0000'),
        ('Lfrac', [], 2.0, '\\frac{56}{28}'),
        ('eta', [], 0.9718772919683727, '0.9719'),
        ('pct', [], 0.9718772919683727, '97.19'),
        ('c', [], 0.5714285714285714, 'c=\\tfrac{4}{7}'),
        ('cdf11', [], 0.42857142857142855, '\\tfrac{12}{28}'),
        ('msum', [], 2.0, '\\frac{56}{28}'),
        ('log2D', [], 4.807354922057604, '4.8074'),
        ('nlogn', [], 2.8636003381208583, '2.8636'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 2.9437545839367454, '2.9438'),
    ],
    'D6-12': [
        ('pmf', ['-1'], 0.0625, '\\frac{1}{16}'),
        ('pmf', ['0'], 0.1875, '\\frac{3}{16}'),
        ('pmf', ['1'], 0.25, '\\frac{4}{16}'),
        ('pmf', ['2'], 0.25, '\\frac{4}{16}'),
        ('pmf', ['3'], 0.1875, '\\frac{3}{16}'),
        ('pmf', ['4'], 0.0625, '\\frac{1}{16}'),
        ('term', ['4'], 0.5, '0.5000'),
        ('term', ['3'], 0.45281953111478324, '0.4528'),
        ('term', ['1'], 0.25, '0.2500'),
        ('H', [], 2.4056390622295662, '2.4056'),
        ('codes', ['{"3": "000", "-1": "0010", "4": "0011", "1": "01", "2": "10", "0": "11"}'], 1.0, ''),
        ('L', [], 2.4375, '2.4375'),
        ('Lfrac', [], 2.4375, '\\frac{39}{16}'),
        ('eta', [], 0.986928846042899, '0.9869'),
        ('pct', [], 0.986928846042899, '98.69'),
        ('c', [], 0.5, 'c=\\tfrac12'),
        ('msum', [], 2.4375, '\\frac{39}{16}'),
        ('log2D', [], 4.0, '4.0000'),
        ('nlogn', [], 1.5943609377704335, '1.5944'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 3.4056390622295662, '3.4056'),
    ],
    'D6-13': [
        ('pmf', ['0'], 0.4166666666666667, '\\frac{10}{24}'),
        ('pmf', ['1'], 0.4166666666666667, '\\frac{10}{24}'),
        ('pmf', ['2'], 0.041666666666666664, '\\frac{1}{24}'),
        ('pmf', ['3'], 0.041666666666666664, '\\frac{1}{24}'),
        ('pmf', ['4'], 0.041666666666666664, '\\frac{1}{24}'),
        ('pmf', ['5'], 0.041666666666666664, '\\frac{1}{24}'),
        ('term', ['10'], 0.5262643357640807, '0.52626'),
        ('term', ['1'], 0.19104010419671483, '0.19104'),
        ('H', [], 1.8166890883150209, '1.8167'),
        ('codes', ['{"1": "00", "2": "0100", "3": "0101", "4": "0110", "5": "0111", "0": "1"}'], 1.0, ''),
        ('L', [], 1.9166666666666667, '1.9167'),
        ('Lfrac', [], 1.9166666666666667, '\\frac{46}{24}'),
        ('eta', [], 0.9478377852078369, '0.9478'),
        ('pct', [], 0.9478377852078369, '94.78'),
        ('c', [], 0.25, 'c=\\tfrac14'),
        ('msum', [], 1.9166666666666667, '\\frac{46}{24}'),
        ('log2D', [], 4.584962500721156, '4.5850'),
        ('nlogn', [], 2.7682734124061352, '2.7683'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 2.816689088315021, '2.8167'),
    ],
    'D6-15': [
        ('pmf', ['0'], 0.65, '\\frac{39}{60}'),
        ('pmf', ['1'], 0.25, '\\frac{15}{60}'),
        ('pmf', ['2'], 0.08333333333333333, '\\frac{5}{60}'),
        ('pmf', ['3'], 0.016666666666666666, '\\frac{1}{60}'),
        ('term', ['39'], 0.40396744488507563, '0.40397'),
        ('term', ['15'], 0.5, '0.50000'),
        ('term', ['5'], 0.29874687506009634, '0.29875'),
        ('term', ['1'], 0.09844817659347531, '0.09845'),
        ('H', [], 1.3011624965386472, '1.3012'),
        ('codes', ['{"0": "0", "1": "10", "2": "110", "3": "111"}'], 1.0, ''),
        ('L', [], 1.45, '1.4500'),
        ('Lfrac', [], 1.45, '\\frac{87}{60}'),
        ('eta', [], 0.8973534458887222, '0.8974'),
        ('pct', [], 0.8973534458887222, '89.74'),
        ('c', [], 0.5333333333333333, 'c=\\tfrac{8}{15}'),
        ('msum', [], 1.45, '\\frac{87}{60}'),
        ('log2D', [], 5.906890595608519, '5.9069'),
        ('nlogn', [], 4.605728099069871, '4.6057'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 2.3011624965386472, '2.3012'),
    ],
    'D6-16': [
        ('pmf', ['0'], 0.14285714285714285, '\\frac{4}{28}'),
        ('pmf', ['1'], 0.21428571428571427, '\\frac{6}{28}'),
        ('pmf', ['2'], 0.25, '\\frac{7}{28}'),
        ('pmf', ['3'], 0.25, '\\frac{7}{28}'),
        ('pmf', ['4'], 0.10714285714285714, '\\frac{3}{28}'),
        ('pmf', ['5'], 0.03571428571428571, '\\frac{1}{28}'),
        ('term', ['7'], 0.5, '0.50000'),
        ('term', ['6'], 0.4762269474292389, '0.47623'),
        ('term', ['4'], 0.40105070315108626, '0.40105'),
        ('term', ['3'], 0.3452563308574766, '0.34526'),
        ('term', ['1'], 0.171691247216343, '0.17169'),
        ('H', [], 2.3942252286541446, '2.3942'),
        ('codes', ['{"4": "0000", "5": "0001", "0": "001", "2": "01", "3": "10", "1": "11"}'], 1.0, ''),
        ('L', [], 2.4285714285714284, '2.4286'),
        ('Lfrac', [], 2.4285714285714284, '\\frac{68}{28}'),
        ('eta', [], 0.9858574470928831, '0.9859'),
        ('pct', [], 0.9858574470928831, '98.59'),
        ('q', [], 0.14285714285714285, 'q=\\tfrac17'),
        ('msum', [], 2.4285714285714284, '\\frac{68}{28}'),
        ('log2D', [], 4.807354922057604, '4.8074'),
        ('nlogn', [], 2.413129693403459, '2.4131'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 3.3942252286541446, '3.3942'),
    ],
    'D6-17': [
        ('pmf', ['1'], 0.16666666666666666, '\\frac{2}{12}'),
        ('pmf', ['2'], 0.25, '\\frac{3}{12}'),
        ('pmf', ['3'], 0.25, '\\frac{3}{12}'),
        ('pmf', ['4'], 0.08333333333333333, '\\frac{1}{12}'),
        ('pmf', ['6'], 0.16666666666666666, '\\frac{2}{12}'),
        ('pmf', ['9'], 0.08333333333333333, '\\frac{1}{12}'),
        ('term', ['3'], 0.5, '0.50000'),
        ('term', ['2'], 0.430827083453526, '0.43083'),
        ('term', ['1'], 0.29874687506009634, '0.29875'),
        ('H', [], 2.4591479170272446, '2.4591'),
        ('codes', ['{"1": "000", "6": "001", "2": "01", "3": "10", "4": "110", "9": "111"}'], 1.0, ''),
        ('L', [], 2.5, '2.5000'),
        ('Lfrac', [], 2.5, '\\frac{30}{12}'),
        ('eta', [], 0.9836591668108978, '0.9837'),
        ('pct', [], 0.9836591668108978, '98.37'),
        ('q', [], 0.25, 'q=\\tfrac14'),
        ('msum', [], 2.5, '\\frac{30}{12}'),
        ('log2D', [], 3.584962500721156, '3.5850'),
        ('nlogn', [], 1.1258145836939113, '1.1258'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 3.4591479170272446, '3.4591'),
    ],
    'D6-18': [
        ('pmf', ['0'], 0.16666666666666666, '\\frac{4}{24}'),
        ('pmf', ['1'], 0.2916666666666667, '\\frac{7}{24}'),
        ('pmf', ['2'], 0.25, '\\frac{6}{24}'),
        ('pmf', ['3'], 0.16666666666666666, '\\frac{4}{24}'),
        ('pmf', ['4'], 0.08333333333333333, '\\frac{2}{24}'),
        ('pmf', ['5'], 0.041666666666666664, '\\frac{1}{24}'),
        ('term', ['7'], 0.5184688771102026, '0.51847'),
        ('term', ['6'], 0.5, '0.50000'),
        ('term', ['4'], 0.430827083453526, '0.43083'),
        ('term', ['2'], 0.29874687506009634, '0.29875'),
        ('term', ['1'], 0.19104010419671483, '0.19104'),
        ('H', [], 2.3699100232740657, '2.3699'),
        ('codes', ['{"3": "000", "4": "0010", "5": "0011", "1": "01", "2": "10", "0": "11"}'], 1.0, ''),
        ('L', [], 2.4166666666666665, '2.4167'),
        ('Lfrac', [], 2.4166666666666665, '\\frac{58}{24}'),
        ('eta', [], 0.9806524234237514, '0.9807'),
        ('pct', [], 0.9806524234237514, '98.07'),
        ('msum', [], 2.4166666666666665, '\\frac{58}{24}'),
        ('log2D', [], 4.584962500721156, '4.5850'),
        ('nlogn', [], 2.2150524774470903, '2.2151'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 3.3699100232740657, '3.3699'),
    ],
    'D6-19': [
        ('pmf', ['1'], 0.36, '\\frac{9}{25}'),
        ('pmf', ['2'], 0.28, '\\frac{7}{25}'),
        ('pmf', ['3'], 0.2, '\\frac{5}{25}'),
        ('pmf', ['4'], 0.12, '\\frac{3}{25}'),
        ('pmf', ['5'], 0.04, '\\frac{1}{25}'),
        ('term', ['9'], 0.5306152277996684, '0.53062'),
        ('term', ['7'], 0.5142203549607939, '0.51422'),
        ('term', ['5'], 0.46438561897747244, '0.46439'),
        ('term', ['3'], 0.3670672426864282, '0.36707'),
        ('term', ['1'], 0.185754247590989, '0.18575'),
        ('H', [], 2.0620426920153516, '2.0620'),
        ('codes', ['{"1": "00", "2": "01", "3": "10", "4": "110", "5": "111"}'], 1.0, ''),
        ('L', [], 2.16, '2.1600'),
        ('Lfrac', [], 2.16, '\\frac{54}{25}'),
        ('eta', [], 0.9546493944515516, '0.9546'),
        ('pct', [], 0.9546493944515516, '95.46'),
        ('msum', [], 2.16, '\\frac{54}{25}'),
        ('log2D', [], 4.643856189774724, '4.6439'),
        ('nlogn', [], 2.5818134977593727, '2.5818'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 3.0620426920153516, '3.0620'),
    ],
    'D6-20': [
        ('pmf', ['-2'], 0.03571428571428571, '\\frac{1}{28}'),
        ('pmf', ['-1'], 0.14285714285714285, '\\frac{4}{28}'),
        ('pmf', ['0'], 0.32142857142857145, '\\frac{9}{28}'),
        ('pmf', ['1'], 0.35714285714285715, '\\frac{10}{28}'),
        ('pmf', ['2'], 0.14285714285714285, '\\frac{4}{28}'),
        ('term', ['10'], 0.5305095811322292, '0.53051'),
        ('term', ['9'], 0.5263167601977724, '0.52632'),
        ('term', ['4'], 0.40105070315108626, '0.40105'),
        ('term', ['1'], 0.171691247216343, '0.17169'),
        ('H', [], 2.030618994848517, '2.0306'),
        ('codes', ['{"2": "0000", "-2": "0001", "-1": "001", "0": "01", "1": "1"}'], 1.0, ''),
        ('L', [], 2.142857142857143, '2.1429'),
        ('Lfrac', [], 2.142857142857143, '\\frac{60}{28}'),
        ('eta', [], 0.9476221975959745, '0.9476'),
        ('pct', [], 0.9476221975959745, '94.76'),
        ('q', [], 0.25, 'q=\\tfrac14'),
        ('r', [], 0.14285714285714285, 'r=\\tfrac17'),
        ('msum', [], 2.142857142857143, '\\frac{60}{28}'),
        ('log2D', [], 4.807354922057604, '4.8074'),
        ('nlogn', [], 2.7767359272090872, '2.7767'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 3.030618994848517, '3.0306'),
    ],
    'D6-21': [
        ('pmf', ['1'], 0.03333333333333333, '\\frac{1}{30}'),
        ('pmf', ['2'], 0.06666666666666667, '\\frac{2}{30}'),
        ('pmf', ['3'], 0.13333333333333333, '\\frac{4}{30}'),
        ('pmf', ['4'], 0.2, '\\frac{6}{30}'),
        ('pmf', ['5'], 0.13333333333333333, '\\frac{4}{30}'),
        ('pmf', ['6'], 0.2, '\\frac{6}{30}'),
        ('pmf', ['7'], 0.1, '\\frac{3}{30}'),
        ('pmf', ['8'], 0.13333333333333333, '\\frac{4}{30}'),
        ('term', ['6'], 0.46438561897747244, '0.46439'),
        ('term', ['4'], 0.3875854127478025, '0.38759'),
        ('term', ['3'], 0.33219280948873625, '0.33219'),
        ('term', ['2'], 0.26045937304056793, '0.26046'),
        ('term', ['1'], 0.1635630198536173, '0.16356'),
        ('H', [], 2.847742678581274, '2.8477'),
        ('codes', ['{"6": "000", "3": "001", "5": "010", "8": "011", "2": "1000", "1": "1001", "7": "101", "4": "11"}'], 1.0, ''),
        ('L', [], 2.9, '2.9000'),
        ('Lfrac', [], 2.9, '\\frac{87}{30}'),
        ('eta', [], 0.9819802339935428, '0.9820'),
        ('pct', [], 0.9819802339935428, '98.20'),
        ('q', [], 0.1, 'q=\\tfrac{1}{10}'),
        ('msum', [], 2.9, '\\frac{87}{30}'),
        ('log2D', [], 4.906890595608519, '4.9069'),
        ('nlogn', [], 2.0591479170272446, '2.0591'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 3.847742678581274, '3.8477'),
    ],
    'D6-23': [
        ('pmf', ['0'], 0.0625, '\\frac{1}{16}'),
        ('pmf', ['1'], 0.125, '\\frac{2}{16}'),
        ('pmf', ['2'], 0.25, '\\frac{4}{16}'),
        ('pmf', ['3'], 0.5, '\\frac{8}{16}'),
        ('pmf', ['4'], 0.0625, '\\frac{1}{16}'),
        ('term', ['8'], 0.5, '0.5000'),
        ('term', ['4'], 0.5, '0.5000'),
        ('term', ['2'], 0.375, '0.3750'),
        ('term', ['1'], 0.25, '0.2500'),
        ('H', [], 1.875, '1.8750'),
        ('codes', ['{"0": "0000", "4": "0001", "1": "001", "2": "01", "3": "1"}'], 1.0, ''),
        ('log2_5', [], 2.321928094887362, '2.3219'),
        ('etafix', [], 0.625, '0.6250'),
        ('L', [], 1.875, '1.8750'),
        ('Lfrac', [], 1.875, '\\frac{30}{16}'),
        ('eta', [], 1.0, '1.0000'),
        ('pct', [], 1.0, '100.00'),
        ('excess', [], 0.6, '60\\%'),
        ('msum', [], 1.875, '\\frac{30}{16}'),
        ('log2D', [], 4.0, '4.0000'),
        ('nlogn', [], 2.125, '2.1250'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 2.875, '2.8750'),
    ],
    'D6-24': [
        ('pmf', ['0'], 0.25, '\\frac{4}{16}'),
        ('pmf', ['1'], 0.375, '\\frac{6}{16}'),
        ('pmf', ['2'], 0.25, '\\frac{4}{16}'),
        ('pmf', ['3'], 0.125, '\\frac{2}{16}'),
        ('term', ['6'], 0.5306390622295664, '0.5306'),
        ('term', ['4'], 0.5, '0.5000'),
        ('term', ['2'], 0.375, '0.3750'),
        ('H', [], 1.9056390622295665, '1.9056'),
        ('codes', ['{"1": "00", "0": "01", "2": "10", "3": "11"}'], 1.0, ''),
        ('codes_low', ['{"2": "000", "3": "001", "0": "01", "1": "1"}'], 1.0, ''),
        ('L2', [], 2.0, '2.0000'),
        ('eta', [], 0.9528195311147832, '0.9528'),
        ('var2', [], 0.75, '0.7500'),
        ('msum', [], 2.0, '\\frac{32}{16}'),
        ('log2D', [], 4.0, '4.0000'),
        ('nlogn', [], 2.0943609377704338, '2.0944'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 2.9056390622295662, '2.9056'),
    ],
    'D6-25': [
        ('pmf', ['0'], 0.75, '\\frac{3}{4}'),
        ('pmf', ['1'], 0.25, '\\frac{1}{4}'),
        ('term', ['3'], 0.31127812445913283, '0.3113'),
        ('term', ['1'], 0.5, '0.5000'),
        ('H', [], 0.8112781244591328, '0.8113'),
        ('eta1', [], 0.8112781244591328, '0.8113'),
        ('pairp', ['00'], 0.5625, '\\tfrac{9}{16}'),
        ('pairp', ['01'], 0.1875, '\\tfrac{3}{16}'),
        ('pairp', ['10'], 0.1875, '\\tfrac{3}{16}'),
        ('pairp', ['11'], 0.0625, '\\tfrac{1}{16}'),
        ('codes', ['{"00": "0", "10": "100", "11": "101", "01": "11"}'], 1.0, ''),
        ('L2', [], 1.6875, '1.6875'),
        ('Lper', [], 0.84375, '0.8438'),
        ('eta2', [], 0.961514814173787, '0.9615'),
        ('msum', [], 1.6875, '\\frac{27}{16}'),
        ('H2', [], 1.6225562489182657, '1.6226'),
        ('H2p1', [], 2.622556248918266, '2.6226'),
        ('3log3', [], 1.188721875540867, '1.1887'),
    ],
    'D6-26': [
        ('HX', [], 3.0, '3'),
        ('pmf', ['0'], 0.125, '\\frac{1}{8}'),
        ('pmf', ['1'], 0.25, '\\frac{2}{8}'),
        ('pmf', ['2'], 0.25, '\\frac{2}{8}'),
        ('pmf', ['3'], 0.25, '\\frac{2}{8}'),
        ('pmf', ['4'], 0.125, '\\frac{1}{8}'),
        ('term', ['2'], 0.5, '0.5000'),
        ('term', ['1'], 0.375, '0.3750'),
        ('H', [], 2.25, '2.2500'),
        ('I', [], 2.25, '2.2500'),
        ('HXgY', [], 0.75, '0.7500'),
        ('codes', ['{"0": "000", "4": "001", "1": "01", "2": "10", "3": "11"}'], 1.0, ''),
        ('L', [], 2.25, '2.2500'),
        ('Lfrac', [], 2.25, '\\frac{18}{8}'),
        ('eta', [], 1.0, '1.0000'),
        ('pct', [], 1.0, '100.00'),
        ('msum', [], 2.25, '\\frac{18}{8}'),
        ('log2D', [], 3.0, '3.0000'),
        ('nlogn', [], 0.75, '0.7500'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 3.25, '3.2500'),
    ],
    'D6-27': [
        ('pmf', ['0'], 0.125, '\\frac{2}{16}'),
        ('pmf', ['1'], 0.1875, '\\frac{3}{16}'),
        ('pmf', ['2'], 0.25, '\\frac{4}{16}'),
        ('pmf', ['3'], 0.25, '\\frac{4}{16}'),
        ('pmf', ['4'], 0.125, '\\frac{2}{16}'),
        ('pmf', ['5'], 0.0625, '\\frac{1}{16}'),
        ('term', ['4'], 0.5, '0.5000'),
        ('term', ['3'], 0.45281953111478324, '0.4528'),
        ('term', ['2'], 0.375, '0.3750'),
        ('term', ['1'], 0.25, '0.2500'),
        ('H', [], 2.452819531114783, '2.4528'),
        ('HZgX', [], 2.0, '2'),
        ('I', [], 0.4528195311147831, '0.4528'),
        ('codes', ['{"1": "000", "0": "001", "2": "01", "3": "10", "4": "110", "5": "111"}'], 1.0, ''),
        ('L', [], 2.5, '2.5000'),
        ('Lfrac', [], 2.5, '\\frac{40}{16}'),
        ('eta', [], 0.9811278124459133, '0.9811'),
        ('pct', [], 0.9811278124459133, '98.11'),
        ('q', [], 0.25, 'q=\\tfrac14'),
        ('HX', [], 1.5, '1.5'),
        ('msum', [], 2.5, '\\frac{40}{16}'),
        ('log2D', [], 4.0, '4.0000'),
        ('nlogn', [], 1.5471804688852169, '1.5472'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 3.452819531114783, '3.4528'),
    ],
    'D6-28': [
        ('pmf', ['0'], 0.2222222222222222, '\\frac{2}{9}'),
        ('pmf', ['1'], 0.3333333333333333, '\\frac{3}{9}'),
        ('pmf', ['2'], 0.2222222222222222, '\\frac{2}{9}'),
        ('pmf', ['3'], 0.2222222222222222, '\\frac{2}{9}'),
        ('term', ['3'], 0.5283208335737186, '0.5283'),
        ('term', ['2'], 0.48220555587606934, '0.4822'),
        ('H', [], 1.974937501201927, '1.9749'),
        ('kraftprop', [], 1.5, '1.5'),
        ('Lprop', [], 1.4444444444444444, '1.4444'),
        ('codes', ['{"1": "00", "0": "01", "2": "10", "3": "11"}'], 1.0, ''),
        ('L', [], 2.0, '2.0000'),
        ('Lfrac', [], 2.0, '\\frac{18}{9}'),
        ('eta', [], 0.9874687506009635, '0.9875'),
        ('pct', [], 0.9874687506009635, '98.75'),
        ('msum', [], 2.0, '\\frac{18}{9}'),
        ('log2D', [], 3.169925001442312, '3.1699'),
        ('nlogn', [], 1.1949875002403854, '1.1950'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 2.974937501201927, '2.9749'),
    ],
    'D6-29': [
        ('pmf', ['0'], 0.16666666666666666, '\\frac{2}{12}'),
        ('pmf', ['1'], 0.25, '\\frac{3}{12}'),
        ('pmf', ['2'], 0.25, '\\frac{3}{12}'),
        ('pmf', ['3'], 0.16666666666666666, '\\frac{2}{12}'),
        ('pmf', ['4'], 0.16666666666666666, '\\frac{2}{12}'),
        ('term', ['3'], 0.5, '0.50000'),
        ('term', ['2'], 0.430827083453526, '0.43083'),
        ('H', [], 2.292481250360578, '2.2925'),
        ('log2_6', [], 2.584962500721156, '2.585'),
        ('kraftS', [], 0.875, '0.875'),
        ('LS', [], 2.5, '2.5000'),
        ('codes', ['{"3": "000", "4": "001", "1": "01", "2": "10", "0": "11"}'], 1.0, ''),
        ('etaS', [], 0.9169925001442312, '0.9170'),
        ('L', [], 2.3333333333333335, '2.3333'),
        ('Lfrac', [], 2.3333333333333335, '\\frac{28}{12}'),
        ('eta', [], 0.9824919644402477, '0.9825'),
        ('pct', [], 0.9824919644402477, '98.25'),
        ('msum', [], 2.3333333333333335, '\\frac{28}{12}'),
        ('log2D', [], 3.584962500721156, '3.5850'),
        ('nlogn', [], 1.292481250360578, '1.2925'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 3.292481250360578, '3.2925'),
    ],
    'D6-30': [
        ('c', [], 0.6923076923076923, 'c=\\tfrac{9}{13}'),
        ('a', [], 0.3333333333333333, 'a=\\tfrac13'),
        ('pmf', ['0'], 0.7692307692307693, '\\frac{40}{52}'),
        ('pmf', ['1'], 0.057692307692307696, '\\frac{3}{52}'),
        ('pmf', ['2'], 0.07692307692307693, '\\frac{4}{52}'),
        ('pmf', ['3'], 0.057692307692307696, '\\frac{3}{52}'),
        ('pmf', ['4'], 0.019230769230769232, '\\frac{1}{52}'),
        ('pmf', ['6'], 0.019230769230769232, '\\frac{1}{52}'),
        ('term', ['40'], 0.2911627871182537, '0.29116'),
        ('term', ['4'], 0.28464920908777636, '0.28465'),
        ('term', ['3'], 0.23743137792807323, '0.23743'),
        ('term', ['1'], 0.10962384073348254, '0.10962'),
        ('H', [], 1.2699224335291415, '1.2699'),
        ('codes', ['{"0": "0", "2": "100", "1": "101", "3": "110", "4": "1110", "6": "1111"}'], 1.0, ''),
        ('L', [], 1.5, '1.5000'),
        ('Lfrac', [], 1.5, '\\frac{78}{52}'),
        ('eta', [], 0.8466149556860944, '0.8466'),
        ('pct', [], 0.8466149556860944, '84.66'),
        ('msum', [], 1.5, '\\frac{78}{52}'),
        ('log2D', [], 5.700439718141092, '5.7004'),
        ('nlogn', [], 4.430517284611951, '4.4305'),
        ('kraft', [], 1.0, '1'),
        ('Hp1', [], 2.2699224335291417, '2.2699'),
    ],
}

# ── the four channel-side questions (D6-06, D6-07, D6-14, D6-22) ─────────────
#
# These state probabilities of a binary symmetric channel and energies per bit
# of the bandlimited channel, not pmfs of a derived source, so they have their
# own table. Each entry is (text printed on the page, number it stands for,
# re-derivation, absolute tolerance). The routes differ from the solutions':
#
#   binomial tails   scipy.stats.binom survival functions, and one seeded
#                    Monte Carlo run of the majority vote over the BSC
#   binary entropy   scipy.stats.entropy of (p, 1-p)
#   Shannon limit    the smallest E_b/N_0 with r <= log2(1 + r E_b/N_0),
#                    found by brentq on the capacity itself rather than read
#                    from the closed form (2^r - 1)/r
#   E_b/N_0 needed   brentq on a*Q(sqrt(b x)) = P_b with scipy's Q, where a
#                    and b come from the constellation points (nearest
#                    neighbours counted on the lattice)
#   ranges           brentq on the received E_s/N_0 at distance d
#
# A value printed to k decimals gets an absolute tolerance of a little over
# half a unit in the last place. A value in dB at two decimals that the page
# reaches through rounded table entries gets 0.008 dB.

from scipy.optimize import brentq
from scipy.stats import binom, norm

Qf = norm.sf


def dB(x):
    return 10*math.log10(x)


def limit_lin(r):
    """smallest E_b/N_0 (linear) at which the bandlimited channel carries r bit/s/Hz"""
    return brentq(lambda g: math.log2(1 + r*g) - r, 1e-6, 1e6, xtol=1e-14)


def majority_fail(n, p):
    return float(binom.sf((n - 1)//2, n, p))


def mc_majority(n, p, trials=2_000_000, seed=606):
    rng = np.random.default_rng(seed)
    flips = rng.random((trials, n)) < p
    return float(np.mean(flips.sum(axis=1) > n//2))


def points(name):
    if name == 'QPSK':
        return np.exp(1j*(np.pi/4 + np.pi/2*np.arange(4)))
    if name == '8PSK':
        return np.exp(1j*2*np.pi*np.arange(8)/8)
    if name == '16QAM':
        g = np.array([-3, -1, 1, 3])
        return (g[:, None] + 1j*g[None, :]).ravel()
    raise KeyError(name)


def ab(name):
    """(a, b) with P_b ~ a Q(sqrt(b Eb/N0)): a is the mean nearest-neighbour
    count over log2 M, b is d_min^2/(2 Eb), both from the points themselves"""
    s = points(name)
    M = len(s)
    D = np.abs(s[:, None] - s[None, :])
    dmin = np.min(D[D > 1e-9])
    nn = np.mean(np.sum(np.abs(D - dmin) < 1e-9, axis=1))
    Eb = np.mean(np.abs(s)**2)/math.log2(M)
    return nn/math.log2(M), dmin**2/(2*Eb)


def ebn0_needed(a, b, pb=1e-4):
    return brentq(lambda x: a*Qf(math.sqrt(b*x)) - pb, 1e-3, 1e4, xtol=1e-12)


# the constants the D6-14 statement prints, rounded as printed
B14 = {'QPSK': 2.0, '8PSK': 0.879, '16QAM': 0.8}
A14 = {'QPSK': 1.0, '8PSK': 2/3, '16QAM': 3/4}

p06, k06 = 0.05, 20
P3 = majority_fail(3, p06)
P5 = majority_fail(5, p06)
C06 = 1 - float(sp_entropy([p06, 1 - p06], base=2))

P07, N007, R07, B07 = 1.8e-11, 4.0e-20, 60e6, 10e6

DB2 = 0.008          # dB at two decimals, reached through rounded entries

CHANNEL = {
    'D6-06': [
        ('0.2864', 0.2864, lambda: 1 - C06, 6e-5),
        ('1-0.3585', 0.3585, lambda: (1 - p06)**k06, 6e-5),
        ('0.6415', 0.6415, lambda: 1 - binom.pmf(0, k06, p06), 6e-5),
        ('0.007125', 0.007125, lambda: binom.pmf(2, 3, p06), 1e-9),
        ('0.000125', 0.000125, lambda: binom.pmf(3, 3, p06), 1e-9),
        ('7.25\\times10^{-3}', 7.25e-3, lambda: P3, 6e-6),
        ('(0.99275)^{20}', 0.99275, lambda: 1 - P3, 6e-6),
        ('1-0.8646', 0.8646, lambda: (1 - P3)**k06, 6e-5),
        ('0.1354', 0.1354, lambda: 1 - binom.pmf(0, k06, P3), 6e-5),
        ('1.1281\\times10^{-3}', 1.1281e-3, lambda: binom.pmf(3, 5, p06), 6e-8),
        ('2.969\\times10^{-5}', 2.969e-5, lambda: binom.pmf(4, 5, p06), 6e-9),
        ('3.125\\times10^{-7}', 3.125e-7, lambda: binom.pmf(5, 5, p06), 1e-12),
        ('1.158\\times10^{-3}', 1.158e-3, lambda: P5, 6e-7),
        ('(0.998842)^{20}', 0.998842, lambda: 1 - P5, 6e-7),
        ('1-0.97709', 0.97709, lambda: (1 - P5)**k06, 6e-6),
        ('0.02291', 0.02291, lambda: 1 - binom.pmf(0, k06, P5), 6e-6),
        ('0.7136', 0.7136, lambda: C06, 6e-5),
        ('28.03', 28.03, lambda: k06/C06, 6e-3),
        ('0.77378', 0.77378, lambda: binom.pmf(0, 5, p06), 6e-6),
        ('0.20363', 0.20363, lambda: binom.pmf(1, 5, p06), 6e-6),
        ('0.02143', 0.02143, lambda: binom.pmf(2, 5, p06), 6e-6),
        ('+0.00113', 0.00113, lambda: binom.pmf(3, 5, p06), 6e-6),
        ('0.00003', 0.00003, lambda: binom.pmf(4, 5, p06), 6e-6),
        ('1.00000', 1.0, lambda: sum(binom.pmf(j, 5, p06) for j in range(6)), 6e-6),
        ('3p^{2}=0.0075', 0.0075, lambda: 3*p06**2, 6e-5),
        ('10p^{3}=0.00125', 0.00125, lambda: 10*p06**3, 6e-6),
        ('=0.0232', 0.0232, lambda: k06*P5, 6e-5),
        ('2.3\\%', 0.023, lambda: 1 - (1 - P5)**k06, 6e-4),
        # the labels on the two solution figures
        ("'0.857'", 0.857, lambda: binom.pmf(0, 3, p06), 6e-4),
        ("'0.135'", 0.135, lambda: binom.pmf(1, 3, p06), 6e-4),
        ("'7.13\\times10^{-3}'", 7.13e-3, lambda: binom.pmf(2, 3, p06), 6e-6),
        ("'1.25\\times10^{-4}'", 1.25e-4, lambda: binom.pmf(3, 3, p06), 6e-7),
        ("'0.774'", 0.774, lambda: binom.pmf(0, 5, p06), 6e-4),
        ("'0.204'", 0.204, lambda: binom.pmf(1, 5, p06), 6e-4),
        ("'0.0214'", 0.0214, lambda: binom.pmf(2, 5, p06), 6e-5),
        ("'1.13\\times10^{-3}'", 1.13e-3, lambda: binom.pmf(3, 5, p06), 6e-6),
        ("'2.97\\times10^{-5}'", 2.97e-5, lambda: binom.pmf(4, 5, p06), 6e-8),
        ("'3.13\\times10^{-7}'", 3.13e-7, lambda: binom.pmf(5, 5, p06), 6e-10),
        # one Monte Carlo run of the vote: 2e6 trials, standard error 6e-5 at 7e-3
        ('Monte Carlo P_3', 7.25e-3, lambda: mc_majority(3, p06), 3e-4),
    ],
    'D6-07': [
        ('=6\\ \\text{bit/s/Hz}', 6.0, lambda: R07/B07, 1e-12),
        ('=10.5', 10.5, lambda: limit_lin(R07/B07), 1e-6),
        ('10.21\\ \\text{dB}', 10.21, lambda: dB(limit_lin(R07/B07)), 0.006),
        ('3.0\\times10^{-19}\\ \\text{J}', 3.0e-19, lambda: P07/R07, 1e-24),
        ('=7.5', 7.5, lambda: P07/R07/N007, 1e-9),
        ('8.75\\ \\text{dB}', 8.75, lambda: dB(P07/R07/N007), 0.006),
        ('10.21-8.75=1.46', 1.46, lambda: dB(limit_lin(6)) - dB(P07/R07/N007), 0.006),
        ('&=45', 45.0, lambda: P07/(N007*B07), 1e-9),
        ('\\log_2 46', 46.0, lambda: 1 + P07/(N007*B07), 1e-9),
        ('5.5236', 5.5236, lambda: math.log2(46), 6e-5),
        ('55.24\\ \\text{Mbit/s}', 55.24, lambda: B07*math.log2(1 + P07/(N007*B07))/1e6, 6e-3),
        ('0.9\\times10^{-11}', 0.9e-11, lambda: P07/2, 1e-20),
        ('=3\\ \\text{bit/s/Hz}', 3.0, lambda: (R07/2)/B07, 1e-12),
        ('=2.333', 2.333, lambda: limit_lin(3), 6e-4),
        ('3.68\\ \\text{dB}', 3.68, lambda: dB(limit_lin(3)), 0.006),
        ('8.75-3.68=5.07', 5.07, lambda: dB(P07/R07/N007) - dB(limit_lin(3)), 0.006),
        ('3(7.5)=22.5', 22.5, lambda: (P07/2)/(N007*B07), 1e-9),
        ('4.5546', 4.5546, lambda: math.log2(23.5), 6e-5),
        ('45.55\\ \\text{Mbit/s}', 45.55, lambda: B07*math.log2(1 + (P07/2)/(N007*B07))/1e6, 6e-3),
    ],
    'D6-14': [
        # the table printed in the statement
        ('Q(3.719)=1.00\\times10^{-4}', 1.00e-4, lambda: Qf(3.719), 6e-7),
        ('Q(3.646)=1.33\\times10^{-4}', 1.33e-4, lambda: Qf(3.646), 6e-7),
        ('Q(3.615)=1.50\\times10^{-4}', 1.50e-4, lambda: Qf(3.615), 6e-7),
        # the approximations printed in the statement, from the constellation points
        ('P_b=Q\\big(\\sqrt{2E_b/N_0}\\big)', 1.0, lambda: ab('QPSK')[0], 1e-12),
        ('\\sqrt{2E_b/N_0}', 2.0, lambda: ab('QPSK')[1], 1e-12),
        ('\\tfrac{2}{3}\\,Q', 2/3, lambda: ab('8PSK')[0], 1e-12),
        ('0.879\\,E_b/N_0', 0.879, lambda: ab('8PSK')[1], 6e-4),
        ('\\tfrac{3}{4}\\,Q', 0.75, lambda: ab('16QAM')[0], 1e-12),
        ('0.8\\,E_b/N_0', 0.8, lambda: ab('16QAM')[1], 1e-12),
        # part (a)
        ('\\frac{13.831}{2}', 13.831, lambda: 3.719**2, 6e-4),
        ('&=6.915', 6.915, lambda: ebn0_needed(A14['QPSK'], B14['QPSK']), 3e-3),
        ('8.40\\ \\text{dB}', 8.40, lambda: dB(ebn0_needed(A14['QPSK'], B14['QPSK'])), DB2),
        ('10^{-4}/\\tfrac{2}{3}=1.50\\times10^{-4}', 1.50e-4, lambda: 1e-4/A14['8PSK'], 1e-12),
        ('\\frac{13.068}{0.879}', 13.068, lambda: 3.615**2, 6e-4),
        ('&=14.867', 14.867, lambda: ebn0_needed(A14['8PSK'], B14['8PSK']), 0.012),
        ('11.72\\ \\text{dB}', 11.72, lambda: dB(ebn0_needed(A14['8PSK'], B14['8PSK'])), DB2),
        ('10^{-4}/\\tfrac{3}{4}=1.33\\times10^{-4}', 1.33e-4, lambda: 1e-4/A14['16QAM'], 4e-7),
        ('\\frac{13.293}{0.8}', 13.293, lambda: 3.646**2, 6e-4),
        ('&=16.617', 16.617, lambda: ebn0_needed(A14['16QAM'], B14['16QAM']), 0.012),
        ('12.21\\ \\text{dB}', 12.21, lambda: dB(ebn0_needed(A14['16QAM'], B14['16QAM'])), DB2),
        # part (b)
        ('=1.5=1.76\\ \\text{dB}', 1.76, lambda: dB(limit_lin(2)), 0.006),
        ('=2.333=3.68\\ \\text{dB}', 3.68, lambda: dB(limit_lin(3)), 0.006),
        ('=3.75=5.74\\ \\text{dB}', 5.74, lambda: dB(limit_lin(4)), 0.006),
        # part (c)
        ('6.64\\ \\text{dB}', 6.64, lambda: dB(ebn0_needed(1, 2)/limit_lin(2)), DB2),
        ('8.04\\ \\text{dB}', 8.04, lambda: dB(ebn0_needed(2/3, 0.879)/limit_lin(3)), DB2),
        ('6.47\\ \\text{dB}', 6.47, lambda: dB(ebn0_needed(0.75, 0.8)/limit_lin(4)), DB2),
        ('=6.37', 6.37, lambda: ebn0_needed(2/3, 0.879)/limit_lin(3), 0.012),
        ('=4.610', 4.610, lambda: ebn0_needed(1, 2)/limit_lin(2), 3e-3),
        ('=4.431', 4.431, lambda: ebn0_needed(0.75, 0.8)/limit_lin(4), 4e-3),
    ],
    'D6-22': [
        ('=6\\ \\text{Mbit/s},\\quad r=1', 6.0, lambda: 6e6*0.5*math.log2(4)/1e6, 1e-12),
        ('=12\\ \\text{Mbit/s},\\quad r=2', 12.0, lambda: 6e6*0.5*math.log2(16)/1e6, 1e-12),
        ('=18\\ \\text{Mbit/s},\\quad r=3', 18.0, lambda: 6e6*0.5*math.log2(64)/1e6, 1e-12),
        ('=1=0\\ \\text{dB}', 1.0, lambda: limit_lin(1), 1e-6),
        ('=1.5=1.76\\ \\text{dB}', 1.76, lambda: dB(limit_lin(2)), 0.006),
        ('=2.333=3.68\\ \\text{dB}', 3.68, lambda: dB(limit_lin(3)), 0.006),
        ('=1.50\\ \\text{dB}', 1.50, lambda: dB(limit_lin(1)*1) + 1.5, 0.006),
        ('+3.01=6.27', 6.27, lambda: dB(limit_lin(2)*2) + 1.5, 0.006),
        ('+4.77=9.95', 9.95, lambda: dB(limit_lin(3)*3) + 1.5, 0.006),
        ('6.27-1.50=4.77', 4.77, lambda: dB(limit_lin(2)*2) - dB(limit_lin(1)), 0.006),
        ('9.95-1.50=8.45', 8.45, lambda: dB(limit_lin(3)*3) - dB(limit_lin(1)), 0.006),
        ('2.4\\,(0.5774)', 0.5774, lambda: 10**(-4.77/20), 6e-5),
        ('2.4\\,(0.3780)', 0.3780, lambda: 10**(-8.45/20), 6e-5),
        # a range is the distance at which the received E_s/N_0 (QPSK's need
        # at 2.4 km, falling as 1/d^2) meets the scheme's need
        ('&=1.39\\ \\text{km}', 1.39, lambda: brentq(lambda d: limit_lin(1)*(2.4/d)**2 - 2*limit_lin(2), 0.1, 10), 6e-3),
        ('&=0.91\\ \\text{km}', 0.91, lambda: brentq(lambda d: limit_lin(1)*(2.4/d)**2 - 3*limit_lin(3), 0.1, 10), 6e-3),
        ('20\\log_{10}2=6.02', 6.02, lambda: dB((2.4/1.2)**2), 0.006),
        ('&=7.52\\ \\text{dB}', 7.52, lambda: dB(limit_lin(1)*(2.4/1.2)**2) + 1.5, 0.006),
        ('falls $2.43$ dB short', 2.43, lambda: dB(3*limit_lin(3)) - dB(limit_lin(1)*(2.4/1.2)**2), 0.006),
        ('7.52-6.27=1.25', 1.25, lambda: dB(limit_lin(1)*(2.4/1.2)**2) - dB(2*limit_lin(2)), 0.006),
        ('2.4/\\sqrt{3}=1.386', 1.386, lambda: brentq(lambda d: (2.4/d)**2 - 3, 0.1, 10), 6e-4),
        ('2.4/\\sqrt{7}=0.907', 0.907, lambda: brentq(lambda d: (2.4/d)**2 - 7, 0.1, 10), 6e-4),
        ("d:0.907", 0.907, lambda: 2.4/math.sqrt(7), 6e-4),
        ("d:1.386", 1.386, lambda: 2.4/math.sqrt(3), 6e-4),
    ],
}


def channel_text_present(q):
    block = js_blocks()[q].replace('\\\\', '\\')
    texts = [t for t, *_ in CHANNEL[q] if not t.startswith('Monte Carlo')]
    missing = [t for t in texts if t not in block]
    for t in missing:
        print(f"      not printed in {q}: {t}")
    return 1 - len(missing)/len(texts)


# ── the checks ───────────────────────────────────────────────────────────────

MC_TOL = 0.02   # 400 000 draws: the standard error of a probability near 0.2 is 6e-4

CHECKS = []
for q, items in STATED.items():
    for kind, args, value, text in items:
        name = f"{q} {kind}{'(' + ','.join(a[:24] for a in args) + ')' if args else ''} = {text or 'code'}"
        tol = DEFAULT_TOL
        if kind in ('term', 'nlogn', 'log2D'):
            tol = 2e-4 if text.count('.') and len(text.split('.')[-1]) >= 4 else 1e-3
        if kind == 'log2_6':
            tol = 1e-3
        CHECKS.append({"name": name,
                       "stated": stated_value(kind, value, text),
                       "derive": (lambda q=q, kind=kind, args=args, text=text: derive(q, kind, args, text)),
                       "tol": tol})
    # one Monte Carlo run a question, on its most likely symbol
    pm = [(float(a[0]) if a else None, t) for k, a, v, t in items if k == 'pmf']
    if pm:
        y, t = max(pm, key=lambda e: stated_value('pmf', 0, e[1]))
        CHECKS.append({"name": f"{q} Monte Carlo P(out={int(y)}) = {t}",
                       "stated": stated_value('pmf', 0, t),
                       "derive": (lambda q=q, y=int(y): mc_pmf(q, y)),
                       "tol": MC_TOL})
    CHECKS.append({"name": f"{q} every stated number is printed in the question",
                   "stated": 1.0, "derive": (lambda q=q: text_present(q)), "tol": 1e-12})

for q, items in CHANNEL.items():
    for text, value, fn_, atol in items:
        CHECKS.append({"name": f"{q} {text}",
                       "stated": value,
                       "derive": fn_,
                       "tol": atol if value == 0 else atol/abs(value)})
    CHECKS.append({"name": f"{q} every stated number is printed in the question",
                   "stated": 1.0, "derive": (lambda q=q: channel_text_present(q)), "tol": 1e-12})


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
        print(f"{status}  {c['name']}: solution states {stated:.6g}, "
              f"re-derived {got:.6g}, relative difference {rel:.2e}")
        if ok:
            passed += 1
        else:
            failed += 1
    print(f"{passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
