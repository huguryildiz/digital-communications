"""PASS lines for the Module 5 laboratories (build/src/75_labs_m5.js).

The laboratory file is loaded in Node with its browser globals stubbed, and
the numbers it exposes on `core` are evaluated at the settings the screens
show. Every value is compared with an independent route in NumPy/SciPy:

  * Q(x) and its inverse against scipy.special / scipy.stats,
  * the constellations of Laboratory X against unit energy, Gray adjacency
    and the identity I cos - Q sin = A cos(2 pi f t + theta),
  * the nearest-neighbour and exact error rates of Y and H against distances
    measured here and against the exact M-PSK integral,
  * the phase margin of Y against a brute-force rotation of every point,
  * the orthogonal-signal error rates of Z against numerical integration of
    the correlator and envelope densities,
  * the bandwidth-power plane and the adaptive link of BW against root
    finding on the same error expressions,
  * every Monte Carlo count against its true error rate (|z| <= 4).

    cd verify && ../.venv/bin/python verify_labs_m5.py      # N passed, 0 failed
"""
import json
import math
import os
import subprocess

import numpy as np
from scipy import integrate, optimize, special, stats

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LAB = os.path.join(ROOT, "build", "src", "75_labs_m5.js")

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
lin = lambda d: 10 ** (d / 10)
dB = lambda v: 10 * math.log10(v)
pop = lambda v: bin(v).count("1")
gray = lambda i: i ^ (i >> 1)

# ---------------------------------------------------------------- the JS side
JS = r"""
const fs = require('fs');
global.LABS = {KIT:{T:s=>s, M:s=>s, F:(v,d=3)=>String(v), GH:()=>v=>v, el:()=>null, gcd:(a,b)=>1,
  transport(){}, runbar:()=>''}};
global.PLOT = {COL:{dec:{}}, labelScale:()=>1};
global.APP = {state:{layout:'wide', motion:'full'}};
eval(fs.readFileSync(process.argv[1], 'utf8'));
const X = LABS.X.core, Y = LABS.Y.core, H = LABS.H.core, Z = LABS.Z.core, BW = LABS.BW.core;
const out = { X:{}, Y:{}, H:{}, Z:{}, BW:{} };
['bask','bpsk','qpsk','psk8','qam16'].forEach(k => out.X[k] = X.table(k));
out.X.syms = {}; ['qpsk','psk8','qam16','bfsk','bpsk'].forEach(k => out.X.syms[k] = X.symbols(k, X.DEF));
out.X.DEF = X.DEF; out.X.NB = X.NB;
out.X.burst = [[0.9487,-0.3162,2,0.137],[-0.7071,-0.7071,3,0.61],[0.3162,0.9487,1,0.05]].map(a => X.burst(...a));

out.Y.PER = Y.PER; out.Y.BATCHES = Y.BATCHES; out.Y.sets = {};
['qpsk','psk8','psk16','qam16'].forEach(k => {
  const S = Y.setOf(k);
  out.Y.sets[k] = { pts:S.pts, g:S.g, n:S.n, k:S.k, margin:Y.margin(k),
    f:[0,4,8,12,16].map(d => Y.formula(k, d)),
    mc:[4,8].map(d => { const c = Y.counts(k, d, 0, 25).cum[25]; return {d, sym:c.sym, bg:c.bg, bn:c.bn}; }) };
});
{ const c = Y.counts('qpsk', 6, 30, 25).cum[25]; out.Y.rot = {sym:c.sym}; }

out.H.MARKS = H.MARKS; out.H.PERS = H.PERS; out.H.sets = {};
['bpsk','bfsk','qpsk','psk8','pam4','pam8','qam16','qam64'].forEach(k => {
  const g = H.geoOf(k);
  out.H.sets[k] = { pts:H.setOf(k).pts, dmin:g.dmin, Nmin:g.Nmin, Eavg:g.Eavg,
    closed:H.MARKS.map(d => H.closed(k, d)), exact:H.MARKS.map(d => H.exact(k, d)),
    c1:H.counts(k, 3, 1).cum[1].slice(), c25:H.counts(k, 3, 25).cum[25].slice() };
});

out.Z.MARKS = Z.MARKS; out.Z.PER = Z.PER; out.Z.LIMIT = Z.LIMIT; out.Z.M = {};
[2,4,8,16,32].forEach(Mn => {
  out.Z.M[Mn] = { coh:[-2,0,4,8,12].map(d => Z.peCoh(Mn, d)), nc:[-2,0,4,8,12].map(d => Z.peNc(Mn, d)),
    ucoh:[4,8].map(d => Z.union('coh', Mn, d)), unc:[4,8].map(d => Z.union('nc', Mn, d)),
    need:Z.need('coh', Mn, 1e-5), needNc:Z.need('nc', Mn, 1e-5), band:Z.band('coh', Mn), bandNc:Z.band('nc', Mn) };
});
out.Z.mc = {};
[['coh',2],['coh',8],['nc',8],['coh',32]].forEach(([m,Mn]) => out.Z.mc[m+Mn] = Z.counts(m, Mn, 25).cum[25].slice());

out.BW.FAM = BW.FAM; out.BW.TG = BW.TG; out.BW.AD = BW.AD;
out.BW.need = {}; out.BW.rw = {};
Object.keys(BW.FAM).forEach(f => BW.FAM[f].Ms.forEach(Mn => {
  out.BW.need[f+Mn] = [1e-3, 1e-5, 1e-7].map(p => BW.need(f, Mn, p)); out.BW.rw[f+Mn] = BW.rw(f, Mn); }));
out.BW.shannon = [0.01, 1, 2, 8].map(BW.shannon);
out.BW.thresh = BW.AD.map(s => BW.TG.map(t => BW.thresh(s, Math.pow(10, t))));
out.BW.pbAtThresh = BW.AD.map(s => BW.TG.map(t => BW.pb(s, Math.pow(10, BW.thresh(s, Math.pow(10, t))/10))));
out.BW.choose = [-5, 5, 12, 17, 23, 30, 40].map(v => BW.choose(v, 1e-5));
out.BW.trace = [0, 12, 30, 48].map(t => BW.trace(t, 20));
out.BW.slots = []; for(let t=0;t<=48;t++){ const v = BW.trace(t, 20); out.BW.slots.push([v, BW.choose(v, 1e-5)]); }
out.BW.pbNow = BW.pb(BW.AD[3], Math.pow(10, BW.trace(48, 20)/10));
process.stdout.write(JSON.stringify(out));
"""
js = json.loads(subprocess.run(["node", "-e", JS, LAB], check=True, capture_output=True, text=True).stdout)


def zscore(k, n, p):
    return (k - n * p) / math.sqrt(n * p * (1 - p)) if 0 < p < 1 else (0.0 if k == 0 else float("inf"))


# ------------------------------------------------------------ independent sets
def psk_pts(M, off):
    a = off + 2 * np.pi * np.arange(M) / M
    return np.c_[np.cos(a), np.sin(a)]


def pam_pts(M):
    x = np.arange(-(M - 1), M, 2, dtype=float)
    x /= math.sqrt(np.mean(x ** 2))
    return np.c_[x, np.zeros(M)]


def qam_pts(M):
    s = int(round(math.sqrt(M)))
    lv = np.arange(-(s - 1), s, 2, dtype=float)
    P = np.array([[x, y] for x in lv for y in lv])
    return P / math.sqrt(np.mean(np.sum(P ** 2, 1)))


def geometry(P):
    D = np.linalg.norm(P[:, None] - P[None], axis=2)
    np.fill_diagonal(D, np.inf)
    dmin = D.min()
    return dmin, float(np.sum(D < dmin * (1 + 1e-9)) / len(P))


def psk_exact(M, g):
    """exact M-PSK symbol error at Es/N0 = g: (1/pi) int_0^{pi - pi/M} exp(-g sin^2(pi/M)/sin^2 t) dt"""
    s2 = math.sin(math.pi / M) ** 2
    return integrate.quad(lambda t: math.exp(-g * s2 / math.sin(t) ** 2), 0, math.pi - math.pi / M, epsabs=1e-14)[0] / math.pi


def qam_exact(M, g):
    s = math.sqrt(M)
    p = 2 * (1 - 1 / s) * Qs(math.sqrt(3 * g / (M - 1)))
    return 1 - (1 - p) ** 2


def pam_exact(M, g):
    return 2 * (M - 1) / M * Qs(math.sqrt(6 * g / (M * M - 1)))


X = js["X"]
# ------------------------------------------------------------- Laboratory X
for key, k in [("bask", 1), ("bpsk", 1), ("qpsk", 2), ("psk8", 3), ("qam16", 4)]:
    T = np.array(X[key])
    check(f"X {key}: average symbol energy of the table is 1", float(np.mean(np.sum(T ** 2, 1))), 1.0, 1e-12)
    truth(f"X {key}: {1 << k} distinct points, one for each {k}-bit label", len(T) == 1 << k and
          len({(round(a, 9), round(b, 9)) for a, b in T}) == 1 << k)
for key, M in [("qpsk", 4), ("psk8", 8)]:
    T = np.array(X[key])
    ang = np.mod(np.degrees(np.arctan2(T[:, 1], T[:, 0])), 360)
    order = np.argsort(ang)
    truth(f"X {key}: labels of neighbouring points on the circle differ in one bit",
          all(pop(int(order[i]) ^ int(order[(i + 1) % M])) == 1 for i in range(M)))
T = np.array(X["qam16"])
c = 1 / math.sqrt(10)
truth("X 16-QAM: points on the grid (+-1, +-3)/sqrt(10)", np.allclose(np.sort(np.unique(np.round(T / c, 9))), [-3, -1, 1, 3]))
adj = [(i, j) for i in range(16) for j in range(i + 1, 16) if abs(np.linalg.norm(T[i] - T[j]) - 2 * c) < 1e-9]
truth(f"X 16-QAM: all {len(adj)} horizontal and vertical neighbour pairs differ in one bit (24 pairs)",
      len(adj) == 24 and all(pop(i ^ j) == 1 for i, j in adj))
check("X 16-QAM label 1001: I = 3/sqrt(10) = 0.949", T[9][0], 3 * c, 1e-12)
check("X 16-QAM label 1001: Q = -1/sqrt(10) = -0.316", T[9][1], -c, 1e-12)
check("X 16-QAM label 1001: phase -18.4 deg", math.degrees(math.atan2(T[9][1], T[9][0])), -18.4349, 1e-3)
check("X 16-QAM label 1001: amplitude 1 (A^2/Es = 1)", float(np.hypot(*T[9])), 1.0, 1e-12)
T = np.array(X["qpsk"])
check("X QPSK label 01: phase 135 deg", math.degrees(math.atan2(T[1][1], T[1][0])), 135.0, 1e-9)
check("X QPSK label 01: I = -0.707 in s(t) = I cos - Q sin", T[1][0], -1 / math.sqrt(2), 1e-12)
check("X QPSK label 01: -Q = -0.707 in s(t) = I cos - Q sin", -T[1][1], -1 / math.sqrt(2), 1e-12)
for key, k in [("qpsk", 2), ("psk8", 3), ("qam16", 4), ("bpsk", 1)]:
    sy = X["syms"][key]
    want = [int("".join(map(str, X["DEF"][j * k:(j + 1) * k])), 2) for j in range(X["NB"] // k)]
    truth(f"X {key}: the 12 default bits read as {X['NB'] // k} symbols {want}",
          [s["v"] for s in sy] == want and all(np.allclose(s["p"], X[key][s["v"]]) for s in sy))
sy = X["syms"]["bfsk"]
ph, ok = 0.0, True
for s, b in zip(sy, X["DEF"]):
    ok &= abs(s["phi0"] - ph) < 1e-12 and s["dir"] == (1 if b else -1)
    ph += s["dir"] * math.pi / 2
truth("X BFSK: each bit turns the phase by +-pi/2 and the next bit starts where it ended (continuous phase)", ok)
for (I, Qq, fc, t), got in zip([[0.9487, -0.3162, 2, 0.137], [-0.7071, -0.7071, 3, 0.61], [0.3162, 0.9487, 1, 0.05]], X["burst"]):
    A, th = math.hypot(I, Qq), math.atan2(Qq, I)
    check(f"X burst I={I}, Q={Qq}: I cos - Q sin = A cos(2 pi fc t + theta)", got, A * math.cos(2 * math.pi * fc * t + th), 1e-12)

# ------------------------------------------------------------- Laboratory Y
Y = js["Y"]
YS = {"qpsk": (psk_pts(4, math.pi / 4), 2), "psk8": (psk_pts(8, 0), 3), "psk16": (psk_pts(16, 0), 4), "qam16": (qam_pts(16), 4)}
n = Y["PER"] * Y["BATCHES"]
for key, (Pref, k) in YS.items():
    y = Y["sets"][key]
    dmin, Nmin = geometry(Pref)
    for d, f in zip([0, 4, 8, 12, 16], y["f"]):
        N0 = 1 / (k * lin(d))
        check(f"Y {key} at Eb/N0 = {d} dB: N_min Q(d_min/sqrt(2N0))", f, Nmin * Qs(dmin / math.sqrt(2 * N0)), 1e-6, rel=True)
    # the phase margin by rotating every noiseless point until one crosses a boundary
    P = np.array(y["pts"])
    lo = None
    for phi in np.arange(0.0, 46.0, 0.01):
        r = np.radians(phi)
        R = P @ np.array([[math.cos(r), math.sin(r)], [-math.sin(r), math.cos(r)]])
        dec = np.linalg.norm(R[:, None] - P[None], axis=2).argmin(1)
        if np.any(dec != np.arange(len(P))):
            lo = phi
            break
    check(f"Y {key}: phase margin against a rotation search (0.01 deg grid)", y["margin"], lo, 0.011)
    # Gray labels: neighbours at d_min differ in one bit; natural labels do not all
    D = np.linalg.norm(P[:, None] - P[None], axis=2)
    pairs = [(i, j) for i in range(len(P)) for j in range(i + 1, len(P)) if D[i, j] < dmin * (1 + 1e-9)]
    truth(f"Y {key}: Gray labels differ in one bit across every d_min pair",
          all(pop(y["g"][i] ^ y["g"][j]) == 1 for i, j in pairs))
    truth(f"Y {key}: natural labels differ in two or more bits across some d_min pair",
          any(pop(y["n"][i] ^ y["n"][j]) > 1 for i, j in pairs))
    for mc in y["mc"]:
        g = k * lin(mc["d"])
        pe = qam_exact(16, g) if key == "qam16" else psk_exact(len(P), g)
        check(f"Y {key} at {mc['d']} dB: |z| of {mc['sym']} wrong of {n} against the exact P_e = {pe:.4g}",
              abs(zscore(mc["sym"], n, pe)), 0.0, 4.0)
        if mc["sym"] >= 30:
            truth(f"Y {key} at {mc['d']} dB: natural labels cost more bits a wrong symbol ({mc['bn'] / mc['sym']:.2f}) than Gray ({mc['bg'] / mc['sym']:.2f})",
                  mc["bn"] > mc["bg"])
            check(f"Y {key} at {mc['d']} dB: Gray bits a wrong symbol close to 1", mc["bg"] / mc["sym"], 1.0, 0.15)
qp = Y["sets"]["qpsk"]["mc"][0]
pb = Qs(math.sqrt(2 * lin(4)))
check(f"Y QPSK at 4 dB, Gray: |z| of {qp['bg']} bit errors of {2 * n} against Q(sqrt(2Eb/N0)) = {pb:.4g}",
      abs(zscore(qp["bg"], 2 * n, pb)), 0.0, 4.0)
check("Y QPSK: formula at 4 dB shown as 0.025", Y["sets"]["qpsk"]["f"][1], 0.025, 5e-4)
check("Y 16-QAM: formula at 4 dB shown as 0.2345", Y["sets"]["qam16"]["f"][1], 0.2345, 5e-5)
check("Y 16-QAM: phase margin shown as 16.9 deg", Y["sets"]["qam16"]["margin"], 16.9, 0.05)
# a 30 deg turn of QPSK leaves 15 deg of margin, so the rate rises above the known-phase rate
a = math.radians(30)
# exact rate of rotated QPSK: the two coordinates are decided apart
d1 = math.cos(math.pi / 4 + a) / math.sqrt(1 / (2 * lin(6)) / 2)
d2 = math.sin(math.pi / 4 + a) / math.sqrt(1 / (2 * lin(6)) / 2)
pe_rot = 1 - (1 - Qs(d1)) * (1 - Qs(d2))
check(f"Y QPSK at 6 dB, 30 deg phase error: |z| of {Y['rot']['sym']} wrong against {pe_rot:.4g}",
      abs(zscore(Y["rot"]["sym"], n, pe_rot)), 0.0, 4.0)

# ------------------------------------------------------------- Laboratory H
H = js["H"]
HS = {"bpsk": pam_pts(2), "bfsk": np.eye(2), "qpsk": psk_pts(4, math.pi / 4), "psk8": psk_pts(8, 0),
      "pam4": pam_pts(4), "pam8": pam_pts(8), "qam16": qam_pts(16), "qam64": qam_pts(64)}
per = H["PERS"][2]
for key, Pref in HS.items():
    h = H["sets"][key]
    dmin, Nmin = geometry(Pref)
    check(f"H {key}: d_min at unit energy", h["dmin"], dmin, 1e-12)
    check(f"H {key}: N_min", h["Nmin"], Nmin, 1e-12)
    check(f"H {key}: average energy", h["Eavg"], 1.0, 1e-12)
    worst = 0.0
    for i, d in enumerate(H["MARKS"]):
        g = lin(d)
        check(f"H {key} at Es/N0 = {d} dB: closed form", h["closed"][i], Nmin * Qs(dmin * math.sqrt(g / 2)), 1e-6, rel=True)
        if key.startswith("pam") or key == "bpsk":
            ex = pam_exact(len(Pref), g)
        elif key == "bfsk":
            ex = Qs(math.sqrt(g))
        elif key == "qpsk":
            ex = qam_exact(4, g)
        elif key.startswith("qam"):
            ex = qam_exact(len(Pref), g)
        else:
            ex = None
        if ex is None:
            truth(f"H {key} at {d} dB: no exact form is shown", h["exact"][i] is None)
            ex = psk_exact(8, g)
        else:
            check(f"H {key} at {d} dB: exact form", h["exact"][i], ex, 1e-6, rel=True)
        worst = max(worst, abs(zscore(h["c25"][i], 25 * per, ex)))
    check(f"H {key}: largest |z| of the 25-batch counts (5000 a mark) against the exact P_s", worst, 0.0, 4.0)
    truth(f"H {key}: counts grow batch by batch (25 batches are not 25 x batch one)",
          any(h["c25"][i] != 25 * h["c1"][i] for i in range(len(H["MARKS"])) if h["c1"][i] > 0) or not any(h["c1"]))
i10 = H["MARKS"].index(10)
check("H QPSK at 10 dB: closed form shown as 1.57e-3", H["sets"]["qpsk"]["closed"][i10], 1.57e-3, 5e-6)
check("H QPSK at 10 dB: exact form shown as 1.56e-3", H["sets"]["qpsk"]["exact"][i10], 1.56e-3, 5e-6)
check("H QPSK at 10 dB: argument of Q shown as 3.162", H["sets"]["qpsk"]["dmin"] * math.sqrt(lin(10) / 2), 3.162, 5e-4)
check("H QPSK at 10 dB: 5000 symbols predict 7.83 errors", 5000 * H["sets"]["qpsk"]["closed"][i10], 7.83, 5e-3)

# ------------------------------------------------------------- Laboratory Z
Z = js["Z"]
check("Z: the orthogonal limit ln 2 in dB", Z["LIMIT"], dB(math.log(2)), 1e-12)
check("Z: the orthogonal limit is -1.6 dB to one decimal", round(Z["LIMIT"], 1), -1.6, 1e-12)


def coh(M, d):
    a = math.sqrt(2 * math.log2(M) * lin(d))
    f = lambda z: stats.norm.pdf(z) * (1 - stats.norm.cdf(z + a) ** (M - 1))
    return integrate.quad(f, -12, 12, epsabs=1e-15, epsrel=1e-10, limit=200)[0]


def ncoh(M, d):
    """envelope detection: the sent envelope is Rician, the others Rayleigh"""
    g = math.log2(M) * lin(d)
    s2 = 1 / g / 2
    f = lambda r: stats.rice.pdf(r / math.sqrt(s2), 1 / math.sqrt(s2)) / math.sqrt(s2) * (1 - (1 - math.exp(-r * r / (2 * s2))) ** (M - 1))
    return integrate.quad(f, 0, 1 + 14 * math.sqrt(s2), epsabs=1e-15, epsrel=1e-10, limit=200)[0]


for Mn in [2, 4, 8, 16, 32]:
    z = Z["M"][str(Mn)]
    for d, v, w in zip([-2, 0, 4, 8, 12], z["coh"], z["nc"]):
        want = coh(Mn, d)
        check(f"Z M={Mn} at {d} dB: coherent P_e against quad", v, want, 1e-5 if want > 1e-9 else 1e-12, rel=want > 1e-9)
        want = ncoh(Mn, d)
        check(f"Z M={Mn} at {d} dB: noncoherent P_e against the Rician integral", w, want, 1e-6 if want > 1e-9 else 1e-12, rel=want > 1e-9)
    k = math.log2(Mn)
    for d, u, un in zip([4, 8], z["ucoh"], z["unc"]):
        check(f"Z M={Mn} at {d} dB: coherent union bound (M-1) Q(sqrt(k Eb/N0))", u, (Mn - 1) * Qs(math.sqrt(k * lin(d))), 1e-6, rel=True)
        check(f"Z M={Mn} at {d} dB: noncoherent bound (M-1)/2 exp(-k Eb/2N0)", un, (Mn - 1) / 2 * math.exp(-k * lin(d) / 2), 1e-12, rel=True)
    want = optimize.brentq(lambda d: coh(Mn, d) - 1e-5, -1.5, 20, xtol=1e-9)
    check(f"Z M={Mn}: coherent Eb/N0 for P_e = 1e-5 (dB)", z["need"], want, 0.005)
    want = optimize.brentq(lambda d: ncoh(Mn, d) - 1e-5, -1.5, 20, xtol=1e-9)
    check(f"Z M={Mn}: noncoherent Eb/N0 for P_e = 1e-5 (dB)", z["needNc"], want, 0.005)
    check(f"Z M={Mn}: coherent band W/R_b = M/(2 log2 M)", z["band"], Mn / (2 * k), 1e-12)
    check(f"Z M={Mn}: noncoherent band W/R_b = M/log2 M", z["bandNc"], Mn / k, 1e-12)
check("Z M=8 coherent: E_b/N0 for 1e-5 shown as 8.63 dB", Z["M"]["8"]["need"], 8.63, 0.005)
check("Z M=8 coherent: band shown as 1.333", Z["M"]["8"]["band"], 4 / 3, 5e-4)
check("Z M=8 coherent at 4 dB: rate formula shown as 0.0174", Z["M"]["8"]["coh"][2], 0.0174, 5e-5)
truth("Z: coherent E_b/N0 for 1e-5 falls as M doubles", all(Z["M"][str(a)]["need"] > Z["M"][str(b)]["need"] for a, b in [(2, 4), (4, 8), (8, 16), (16, 32)]))
nz = Z["PER"] * 25
for key, (mode, Mn) in {"coh2": ("coh", 2), "coh8": ("coh", 8), "nc8": ("nc", 8), "coh32": ("coh", 32)}.items():
    worst = 0.0
    for i, d in enumerate(Z["MARKS"]):
        p = coh(Mn, d) if mode == "coh" else ncoh(Mn, d)
        worst = max(worst, abs(zscore(Z["mc"][key][i], nz, p)))
    check(f"Z {mode} M={Mn}: largest |z| of the 25-batch counts against the true P_e", worst, 0.0, 4.0)
check("Z coherent M=8 at 4 dB: 84 of 5000 shown", Z["mc"]["coh8"][Z["MARKS"].index(4)], 84, 0)

# ------------------------------------------------------------ Laboratory BW
B = js["BW"]


def need_bw(f, M, pe):
    """E_b/N0 at which the nearest-neighbour P_s of a unit-energy set equals pe"""
    k = math.log2(M)
    if f == "fsk":
        return optimize.brentq(lambda g: (M - 1) * Qs(math.sqrt(k * g)) - pe, 1e-6, 1e4, xtol=1e-14, rtol=1e-13)
    P = {"pam": pam_pts, "psk": lambda m: psk_pts(m, 0), "qam": qam_pts}[f](M)
    dmin, Nmin = geometry(P)
    return optimize.brentq(lambda g: Nmin * Qs(dmin * math.sqrt(k * g / 2)) - pe, 1e-6, 1e6, xtol=1e-14, rtol=1e-13)


for f, F in B["FAM"].items():
    for Mn in F["Ms"]:
        for p, v in zip([1e-3, 1e-5, 1e-7], B["need"][f + str(Mn)]):
            check(f"BW {f.upper()} M={Mn}: E_b/N0 for P_s = {p:g} (dB)", dB(v), dB(need_bw(f, Mn, p)), 1e-4)
        k = math.log2(Mn)
        want = {"pam": 2 * k, "psk": k, "qam": k, "fsk": 2 * k / Mn}[f]
        check(f"BW {f.upper()} M={Mn}: R/W", B["rw"][f + str(Mn)], want, 1e-12)
for f, want in [("pam", 23.1), ("psk", 18.1), ("qam", 14.0), ("fsk", 7.7)]:
    check(f"BW M=16 at 1e-5: {f.upper()} shown as {want} dB", dB(B["need"][f + "16"][1]), want, 0.05)
for f, want in [("pam", 0.125), ("psk", 0.25), ("qam", 0.25), ("fsk", 2)]:
    check(f"BW M=16: {f.upper()} band W/R_b shown as {want}", 1 / B["rw"][f + "16"], want, 1e-12)
for r, v in zip([0.01, 1, 2, 8], B["shannon"]):
    check(f"BW Shannon limit at R/W = {r}: E_b/N0 = (2^r - 1)/r", v, (2 ** r - 1) / r, 1e-12, rel=True)
check("BW Shannon limit as R/W -> 0 approaches -1.6 dB", dB(B["shannon"][0]), -1.5917, 0.02)
for s, th, pbv in zip(B["AD"], B["thresh"], B["pbAtThresh"]):
    for t, x, y in zip(B["TG"], th, pbv):
        check(f"BW adaptive {s['name']}: P_b at its threshold for 10^{t}", y, 10 ** t, 1e-5, rel=True)
M_AD = [s["M"] for s in B["AD"]]


def pb_ad(M, g):
    k = math.log2(M)
    if M == 2:
        return Qs(math.sqrt(2 * g))
    if M == 4:
        return Qs(math.sqrt(g))
    return 4 / k * (1 - 1 / math.sqrt(M)) * Qs(math.sqrt(3 * g / (M - 1)))


for v, got in zip([-5, 5, 12, 17, 23, 30, 40], B["choose"]):
    want = max([i for i, M in enumerate(M_AD) if pb_ad(M, lin(v)) <= 1e-5], default=-1)
    truth(f"BW adaptive at {v} dB: the densest scheme with P_b <= 1e-5 is {B['AD'][want]['name'] if want >= 0 else 'none'}", got == want)
for t, v in zip([0, 12, 30, 48], B["trace"]):
    want = 20 + 7 * math.sin(2 * math.pi * 1.3 * t / 48) + 3.5 * math.sin(2 * math.pi * 3.1 * t / 48 + 1.1)
    check(f"BW trace at slot {t}", v, want, 1e-12)
check("BW slot 48: E_s/N0 now shown as 30.1 dB", B["trace"][3], 30.1, 0.05)
truth("BW slot 48: scheme shown as 64-QAM", B["slots"][48][1] == 3)
check("BW slot 48: P_b now shown as 7.91e-13", B["pbNow"], pb_ad(64, lin(B["trace"][3])), 1e-6, rel=True)
check("BW slot 48: P_b now to three figures", B["pbNow"], 7.91e-13, 5e-16)
avg = sum(B["AD"][i]["k"] if i >= 0 else 0 for _, i in B["slots"]) / 49
check("BW slots 0-48: average bits a symbol shown as 3.57", avg, 3.57, 0.005)

print(f"\n{passed} passed, {failed} failed")
raise SystemExit(1 if failed else 0)
