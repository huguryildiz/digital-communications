"""Every closed-form error probability the course states, paired with an
independent simulation of the same system.

The simulation is written from the system description, not from the formula:
it draws noise, forms the decision statistic, applies the decision rule and
counts disagreements. If the closed form is wrong, the two disagree.

Nothing here is ported from commsyslab. A gate built from the implementation
it checks verifies itself.
"""

import numpy as np
from scipy.special import erfc


def qfunc(x):
    return 0.5 * erfc(np.asarray(x, dtype=float) / np.sqrt(2.0))


# ── Binary antipodal signalling in AWGN ──────────────────────────────────────
# s = ±sqrt(Eb), noise variance N0/2, matched-filter output y = s + n.
# Claimed: P_b = Q(sqrt(2 Eb/N0)).

def antipodal_closed(ebn0_db):
    ebn0 = 10.0 ** (ebn0_db / 10.0)
    return float(qfunc(np.sqrt(2.0 * ebn0)))


def antipodal_sim(rng, n, ebn0_db):
    ebn0 = 10.0 ** (ebn0_db / 10.0)
    eb = 1.0
    n0 = eb / ebn0
    sigma = np.sqrt(n0 / 2.0)
    bits = rng.integers(0, 2, size=n)
    sent = np.where(bits == 1, np.sqrt(eb), -np.sqrt(eb))
    y = sent + rng.normal(0.0, sigma, size=n)
    decided = (y > 0).astype(int)
    return int(np.count_nonzero(decided != bits))


CLAIMS = [
    {
        "name": "binary antipodal, Eb/N0 = 4 dB",
        "closed_form": antipodal_closed,
        "simulate": antipodal_sim,
        "trials": 2_000_000,
        "params": {"ebn0_db": 4.0},
    },
    {
        "name": "binary antipodal, Eb/N0 = 8 dB",
        "closed_form": antipodal_closed,
        "simulate": antipodal_sim,
        "trials": 20_000_000,
        "params": {"ebn0_db": 8.0},
    },
]


# ── On-off (unipolar) signalling in AWGN ─────────────────────────────────────
# s = sqrt(2 Eb) for a one and 0 for a zero, so the average energy per bit is
# Eb. Threshold midway. Claimed: P_b = Q(sqrt(Eb/N0)), three decibels worse
# than antipodal, and that three decibels is the whole content of the claim.

def onoff_closed(ebn0_db):
    ebn0 = 10.0 ** (ebn0_db / 10.0)
    return float(qfunc(np.sqrt(ebn0)))


def onoff_sim(rng, n, ebn0_db):
    ebn0 = 10.0 ** (ebn0_db / 10.0)
    eb = 1.0
    n0 = eb / ebn0
    sigma = np.sqrt(n0 / 2.0)
    bits = rng.integers(0, 2, size=n)
    sent = np.where(bits == 1, np.sqrt(2.0 * eb), 0.0)
    y = sent + rng.normal(0.0, sigma, size=n)
    decided = (y > np.sqrt(2.0 * eb) / 2.0).astype(int)
    return int(np.count_nonzero(decided != bits))


CLAIMS += [
    {
        "name": "on-off keying, Eb/N0 = 7 dB",
        "closed_form": onoff_closed,
        "simulate": onoff_sim,
        "trials": 2_000_000,
        "params": {"ebn0_db": 7.0},
    },
    {
        "name": "on-off keying, Eb/N0 = 11 dB",
        "closed_form": onoff_closed,
        "simulate": onoff_sim,
        "trials": 20_000_000,
        "params": {"ebn0_db": 11.0},
    },
]


# ── The modulation schemes of Module 5 ───────────────────────────────────────
# One simulator for all of them. A constellation is written down in whole
# numbers, scaled to unit average symbol energy, and then used twice: once by
# the closed form, which needs only the minimum distance and the average
# neighbour count, and once by the simulation, which adds noise to a symbol and
# asks which point is nearest. The two share the point list and nothing else.
#
# The closed form the course states is the nearest-neighbour estimate, so it is
# an approximation and not an identity. The trial counts below give an interval
# a few per cent wide -- far wider than the approximation error, which is under
# half a per cent at these operating points, and far narrower than the factor
# of two a dropped 2 in the Q argument would produce.

def _m5_points(scheme):
    if scheme == "bpsk":
        raw = [(-1.0, 0.0), (1.0, 0.0)]
    elif scheme == "bfsk":
        raw = [(1.0, 0.0), (0.0, 1.0)]
    elif scheme == "bask":
        raw = [(0.0, 0.0), (1.0, 0.0)]
    elif scheme.startswith("psk"):
        m = int(scheme[3:])
        raw = [(np.cos(2 * np.pi * k / m), np.sin(2 * np.pi * k / m)) for k in range(m)]
    elif scheme.startswith("pam"):
        m = int(scheme[3:])
        raw = [(2.0 * k - (m - 1), 0.0) for k in range(m)]
    elif scheme.startswith("qam"):
        side = int(round(np.sqrt(int(scheme[3:]))))
        lv = [2.0 * k - (side - 1) for k in range(side)]
        raw = [(x, y) for x in lv for y in lv]
    else:
        raise ValueError(f"unknown scheme {scheme}")
    pts = np.asarray(raw, dtype=float)
    return pts / np.sqrt((pts ** 2).sum(axis=1).mean())


def _m5_geometry(scheme):
    """The minimum distance and the average number of points at it."""
    pts = _m5_points(scheme)
    d = np.hypot(pts[:, None, 0] - pts[None, :, 0], pts[:, None, 1] - pts[None, :, 1])
    off = d[~np.eye(len(pts), dtype=bool)]
    dmin = off.min()
    nmin = np.count_nonzero(off < dmin * 1.0001) / len(pts)
    return pts, float(dmin), float(nmin)


def _m5_dims(scheme):
    """How many basis functions the scheme uses, and so how many noise terms."""
    return 1 if scheme in ("bpsk", "bask") or scheme.startswith("pam") else 2


def m5_closed(scheme, esn0_db):
    _, dmin, nmin = _m5_geometry(scheme)
    n0 = 10.0 ** (-esn0_db / 10.0)
    return float(nmin * qfunc(np.sqrt(dmin ** 2 / (2.0 * n0))))


def m5_sim(rng, n, scheme, esn0_db):
    pts, _, _ = _m5_geometry(scheme)
    n0 = 10.0 ** (-esn0_db / 10.0)
    sigma = np.sqrt(n0 / 2.0)
    sent = rng.integers(0, len(pts), size=n)
    r = pts[sent].copy()
    r[:, 0] += rng.normal(0.0, sigma, size=n)
    if _m5_dims(scheme) == 2:
        r[:, 1] += rng.normal(0.0, sigma, size=n)
    wrong = 0
    for lo in range(0, n, 200_000):            # in blocks, to bound the memory
        blk = r[lo:lo + 200_000]
        d2 = ((blk[:, None, :] - pts[None, :, :]) ** 2).sum(axis=2)
        wrong += int(np.count_nonzero(d2.argmin(axis=1) != sent[lo:lo + 200_000]))
    return wrong


def _m5_claim(name, scheme, esn0_db, trials):
    return {"name": name, "closed_form": m5_closed, "simulate": m5_sim,
            "trials": trials, "params": {"scheme": scheme, "esn0_db": esn0_db}}


CLAIMS += [
    _m5_claim("D5-01 BPSK, Es/N0 = 9 dB", "bpsk", 9.0, 5_000_000),
    _m5_claim("D5-02 BFSK, Es/N0 = 9 dB", "bfsk", 9.0, 1_000_000),
    _m5_claim("D5-03 on-off keying, Es/N0 = 10 dB", "bask", 10.0, 2_000_000),
    _m5_claim("D5-06 QPSK, Es/N0 = 12 dB", "psk4", 12.0, 5_000_000),
    _m5_claim("D5-05 8-PSK, Es/N0 = 13 dB", "psk8", 13.0, 1_000_000),
    _m5_claim("D5-09 4-PAM, Es/N0 = 12 dB", "pam4", 12.0, 1_000_000),
    _m5_claim("D5-12 16-QAM, Es/N0 = 15 dB", "qam16", 15.0, 1_000_000),
    _m5_claim("D5-18 16-QAM, Es/N0 = 18 dB", "qam16", 18.0, 5_000_000),
]
