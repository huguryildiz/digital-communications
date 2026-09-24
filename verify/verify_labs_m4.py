"""PASS lines for the Module 4 laboratories (build/src/74_labs_m4.js).

The laboratory file is loaded in Node with its browser globals stubbed, and
the formulas it exposes on `core` are evaluated at a few settings. Every value
is compared with an independent route in NumPy/SciPy:

  * Q(x) against scipy.special.erfc,
  * the MAP threshold and the binary P_e against numerical integration of the
    two weighted densities, and the threshold against a numerical minimiser,
  * the face neighbours of every constellation against scipy.spatial.Voronoi,
    and every bound against its own sum written out here,
  * the Monte Carlo counts against exact or large-sample error rates,
  * the noise projection of Laboratory U against the variance N0/2.

    cd verify && ../.venv/bin/python verify_labs_m4.py      # N passed, 0 failed
"""
import json
import math
import os
import subprocess

import numpy as np
from scipy import integrate, optimize, special
from scipy.spatial import Voronoi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LAB = os.path.join(ROOT, "build", "src", "74_labs_m4.js")

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


Qs = lambda x: 0.5 * special.erfc(x / math.sqrt(2))

# ---------------------------------------------------------------- the JS side
JS = r"""
const fs = require('fs');
global.LABS = {KIT:{T:s=>s, M:s=>s, F:(v,d=3)=>String(v), GH:()=>v=>v, transport(){}, runbar:()=>''}};
global.PLOT = {COL:{dec:{}}};
eval(fs.readFileSync(process.argv[1], 'utf8'));
const G = LABS.G.core, V = LABS.V.core, W = LABS.W.core, U = LABS.U.core;
const out = { Q:{}, V:[], sets:{}, W:{}, U:{} };
[0, 0.5, 1, 2, 3, 4, 5, 6].forEach(x => out.Q[x] = G.Q(x));
[[0.8,1],[0.8,3],[0.5,3],[0.3,0],[0.95,6],[0.1,10]].forEach(([p1,db]) => {
  const N0 = Math.pow(10,-db/10), t = V.tauMAP(p1,N0);
  out.V.push({p1, db, tau:t, pe:V.pe(t,p1,N0), peML:V.pe(0,p1,N0), pe03:V.pe(0.3,p1,N0)});
});
['binary','pam4','qpsk','psk8','five','qam16'].forEach(k => {
  const g = G.unitSet(k);
  out.sets[k] = { pts:g.pts, dmin:g.dmin, Nmin:g.Nmin, Eavg:g.Eavg, nbs:g.nbs.map(s=>[...s].sort((a,b)=>a-b)),
                  b:[0,6,10,16].map(db=>G.bounds(g, Math.pow(10,-db/10))) };
});
['qpsk','psk8','pam4','five','qam16'].forEach(k => { out.W[k] = { c1:W.counts(k,1), c25:W.counts(k,25) }; });
out.W.MARKS = W.MARKS; out.W.PER = W.PER;
['carrier','halves'].forEach(k => {
  const c = U.cells(k), kap = U.kappa(k);
  out.U[k] = { kappa:kap, ss:c.map(cc=>cc.reduce((s,v)=>s+v*v,0)), cross:c[0].reduce((s,v,i)=>s+v*c[1][i],0) };
});
const n = []; for(let k=0;k<20000;k++){ const r = U.send(k, 0, 'qpsk', 6); n.push(r.r); }
out.U.sends = n; out.U.NC = U.NC; out.U.DC = U.DC;
process.stdout.write(JSON.stringify(out));
"""
js = json.loads(subprocess.run(["node", "-e", JS, LAB], check=True, capture_output=True, text=True).stdout)

# ---------------------------------------------------------------- Q(x)
for x, v in js["Q"].items():
    check(f"Q({x}) against erfc", v, Qs(float(x)), 2e-7, rel=True)

# ---------------------------------------------------------------- Laboratory V
A = 1.0
for row in js["V"]:
    p1, db = row["p1"], row["db"]
    p2, N0 = 1 - p1, 10 ** (-db / 10)
    s = math.sqrt(N0 / 2)
    f = lambda r, m: math.exp(-(r - m) ** 2 / (2 * s * s)) / (s * math.sqrt(2 * math.pi))
    pe_int = lambda t: (integrate.quad(lambda r: p1 * f(r, A), -np.inf, t)[0]
                        + integrate.quad(lambda r: p2 * f(r, -A), t, np.inf)[0])
    tag = f"V P(s1)={p1}, Eb/N0={db} dB"
    check(f"{tag}: tau_MAP = N0/(4 sqrt Eb) ln(P2/P1)", row["tau"], N0 / (4 * A) * math.log(p2 / p1), 1e-12)
    t_min = optimize.minimize_scalar(pe_int, bounds=(-3, 3), method="bounded", options={"xatol": 1e-9}).x
    check(f"{tag}: tau_MAP is the minimiser of the integrated P_e", row["tau"], t_min, 2e-5)
    check(f"{tag}: P_e at tau_MAP against integration", row["pe"], pe_int(row["tau"]), 1e-6, rel=True)
    check(f"{tag}: P_e at the ML threshold against integration", row["peML"], pe_int(0.0), 1e-6, rel=True)
    check(f"{tag}: P_e at tau = 0.3 against integration", row["pe03"], pe_int(0.3), 1e-6, rel=True)
    truth(f"{tag}: ML is never better than MAP", row["peML"] >= row["pe"] - 1e-15)

# the numbers the laboratory shows on opening: P(s1) = 0.8, Eb/N0 = 1 dB, MAP
v0 = js["V"][0]
check("V opening state: tau_MAP shown as -0.275", round(v0["tau"], 3), -0.275, 1e-12)
check("V opening state: P_e shown as 0.0422", round(v0["pe"], 4), 0.0422, 1e-12)
check("V opening state, ML chosen: P_e shown as 0.0563", round(v0["peML"], 4), 0.0563, 1e-12)
check("V opening state, ML chosen: card says 1.333 times the MAP value", round(v0["peML"] / v0["pe"], 3), 1.333, 1e-12)

# ---------------------------------------------------------------- constellations (G, W)
EXP_NMIN = {"binary": 1, "pam4": 1.5, "qpsk": 2, "psk8": 2, "five": 1.6, "qam16": 3}
EXP_DMIN = {"binary": 2, "pam4": 2 / math.sqrt(5), "qpsk": math.sqrt(2), "psk8": 2 * math.sin(math.pi / 8),
            "five": math.sqrt(5 / 4), "qam16": 2 / math.sqrt(10)}
EXP_FACES = {"binary": 1, "pam4": 1.5, "qpsk": 2, "psk8": 2, "five": 3.2, "qam16": 3}


def voronoi_neighbours(pts):
    """Face neighbours from scipy's Voronoi diagram. A 1-D set is lifted with
    two far mirror rows so that the diagram exists; only the real row counts."""
    P = np.array(pts)
    M = len(P)
    if np.ptp(P[:, 1]) < 1e-12:
        span = np.ptp(P[:, 0]) + 10
        P = np.vstack([P, P + [0, span], P - [0, span]])
    vor = Voronoi(P)
    nb = [set() for _ in range(M)]
    for (a, b), rv in zip(vor.ridge_points, vor.ridge_vertices):
        if a >= M or b >= M:
            continue
        rv = [v for v in rv if v >= 0]
        if len(rv) == 2 and np.linalg.norm(vor.vertices[rv[0]] - vor.vertices[rv[1]]) < 1e-9:
            continue                                   # a corner, not a face
        nb[a].add(b)
        nb[b].add(a)
    return [sorted(s) for s in nb]


for k, g in js["sets"].items():
    P = np.array(g["pts"])
    M = len(P)
    D = np.linalg.norm(P[:, None] - P[None], axis=2)
    dmin = D[~np.eye(M, dtype=bool)].min()
    check(f"{k}: average energy 1", g["Eavg"], float((P ** 2).sum(1).mean()), 1e-12)
    check(f"{k}: d_min = {EXP_DMIN[k]:.4f}", g["dmin"], EXP_DMIN[k], 1e-12)
    check(f"{k}: N_min = {EXP_NMIN[k]}", g["Nmin"], EXP_NMIN[k], 1e-12)
    vn = voronoi_neighbours(g["pts"])
    truth(f"{k}: face neighbours agree with scipy Voronoi", vn == g["nbs"])
    check(f"{k}: faces a point = {EXP_FACES[k]}", sum(len(s) for s in g["nbs"]) / M, EXP_FACES[k], 1e-12)
    for db, b in zip([0, 6, 10, 16], g["b"]):
        N0 = 10 ** (-db / 10)
        q = lambda d: Qs(d / math.sqrt(2 * N0))
        gen = sum(q(D[i, j]) for i in range(M) for j in range(M) if i != j) / M
        intel = sum(q(D[i, j]) for i in range(M) for j in vn[i]) / M
        tag = f"{k} at Es/N0 = {db} dB"
        check(f"{tag}: general union bound", b["general"], gen, 1e-6, rel=True)
        check(f"{tag}: intelligent union bound", b["intelligent"], intel, 1e-6, rel=True)
        check(f"{tag}: nearest-neighbour form", b["nearest"], EXP_NMIN[k] * q(dmin), 1e-6, rel=True)
        check(f"{tag}: minimum-distance bound", b["dmin"], (M - 1) * q(dmin), 1e-6, rel=True)
        check(f"{tag}: exponential bound", b["expo"], (M - 1) / 2 * math.exp(-dmin ** 2 / (4 * N0)), 1e-12, rel=True)
        truth(f"{tag}: exponential >= d_min bound >= general >= intelligent",
              b["expo"] >= b["dmin"] - 1e-15 and b["dmin"] >= b["general"] - 1e-15
              and b["general"] >= b["intelligent"] - 1e-15)

# the numbers Laboratory G shows on opening: QPSK at Es/N0 = 10 dB
qb = js["sets"]["qpsk"]["b"][2]
check("G opening state: union bound shown as 1.57e-3", round(qb["general"], 5), 0.00157, 1e-12)
check("G opening state: N_min Q form shown as 1.57e-3", round(qb["nearest"], 5), 0.00157, 1e-12)

# the numbers Laboratory W shows on opening: the five-point set at 6 dB
N0 = 10 ** (-0.6)
g5 = js["sets"]["five"]
P5 = np.array(g5["pts"])
B6 = [None]
for k2, want in [("general", 0.113), ("intelligent", 0.1123), ("nearest", 0.0918), ("dmin", 0.2294), ("expo", 0.5764)]:
    D5 = np.linalg.norm(P5[:, None] - P5[None], axis=2)
    d = math.sqrt(5 / 4)
    val = {"general": sum(Qs(D5[i, j] / math.sqrt(2 * N0)) for i in range(5) for j in range(5) if i != j) / 5,
           "intelligent": sum(Qs(D5[i, j] / math.sqrt(2 * N0)) for i in range(5) for j in voronoi_neighbours(g5["pts"])[i]) / 5,
           "nearest": 1.6 * Qs(d / math.sqrt(2 * N0)),
           "dmin": 4 * Qs(d / math.sqrt(2 * N0)),
           "expo": 2 * math.exp(-d * d / (4 * N0))}[k2]
    check(f"W opening state: {k2} shown as {want}", round(val, 4 if val < 0.1 or k2 != 'general' else 3), want, 1e-12)

# ---------------------------------------------------------------- Monte Carlo (W)
MARKS, PER = js["W"]["MARKS"], js["W"]["PER"]
rng = np.random.default_rng(20260924)


def exact_or_sampled(key, db):
    g = js["sets"][key]
    P = np.array(g["pts"])
    N0 = 10 ** (-db / 10)
    a = g["dmin"] / math.sqrt(2 * N0)
    if key == "qpsk":
        return 2 * Qs(a) - Qs(a) ** 2
    if key == "pam4":
        return 1.5 * Qs(a)
    if key == "qam16":
        return 3 * Qs(a) - 2.25 * Qs(a) ** 2
    n = 1_000_000
    i = rng.integers(0, len(P), n)
    r = P[i] + math.sqrt(N0 / 2) * rng.standard_normal((n, 2))
    return float((np.linalg.norm(r[:, None] - P[None], axis=2).argmin(1) != i).mean())


for key in ["qpsk", "psk8", "pam4", "five", "qam16"]:
    c1, c25 = js["W"][key]["c1"], js["W"][key]["c25"]
    worst = 0.0
    for idx, db in enumerate(MARKS):
        p = exact_or_sampled(key, db)
        n = 25 * PER
        if p * n < 5:
            continue
        z = (c25[idx] - p * n) / math.sqrt(p * (1 - p) * n)
        worst = max(worst, abs(z))
    check(f"W {key}: largest |z| of the 25-batch counts against the true P_e", worst, 0.0, 4.0)
    truth(f"W {key}: counts grow batch by batch (25 batches are not 25 x batch one)",
          any(c25[i] != 25 * c1[i] for i in range(len(MARKS)) if c1[i] > 0))

# ---------------------------------------------------------------- Laboratory U
NC, DC = js["U"]["NC"], js["U"]["DC"]
for k in ["carrier", "halves"]:
    u = js["U"][k]
    for j in range(2):
        check(f"U {k}: variance of correlator output {j + 1} is N0/2 (kappa^2 sum c^2 / DC = 1)",
              u["kappa"] ** 2 * u["ss"][j] / DC, 1.0, 1e-12)
    check(f"U {k}: the two outputs are uncorrelated (sum c1 c2 = 0)", u["cross"], 0.0, 1e-12)
check("U halves: kappa = 1 (a basis flat on every noise cell needs no correction)", js["U"]["halves"]["kappa"], 1.0, 1e-12)
R = np.array(js["U"]["sends"])
s1 = np.array(js["sets"]["qpsk"]["pts"])[0]
nz = R - s1
N0 = 10 ** (-0.6)
for j in range(2):
    check(f"U QPSK at 6 dB, 20000 sends: sample variance of n{j + 1} against N0/2 = {N0 / 2:.4f}",
          float(nz[:, j].var()), N0 / 2, 5 * N0 / 2 * math.sqrt(2 / 20000))
check("U QPSK at 6 dB, 20000 sends: sample correlation of n1 and n2", float(np.corrcoef(nz.T)[0, 1]), 0.0, 5 / math.sqrt(20000))
wrong = float((np.linalg.norm(R[:, None] - np.array(js["sets"]["qpsk"]["pts"])[None], axis=2).argmin(1) != 0).mean())
a = math.sqrt(2) / math.sqrt(2 * N0)
p = 2 * Qs(a) - Qs(a) ** 2
check("U QPSK at 6 dB: wrong-decision rate of 20000 sends against 2Q - Q^2", wrong, p, 5 * math.sqrt(p * (1 - p) / 20000))

print(f"\n{passed} passed, {failed} failed")
raise SystemExit(1 if failed else 0)
