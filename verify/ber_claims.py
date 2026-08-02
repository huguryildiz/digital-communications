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
