import math
from wilson import wilson_interval, consistent

def test_interval_brackets_the_point_estimate():
    lo, hi = wilson_interval(500, 10000)
    assert lo < 0.05 < hi

def test_interval_narrows_with_more_trials():
    w_small = wilson_interval(50, 1000)
    w_large = wilson_interval(5000, 100000)
    assert (w_large[1] - w_large[0]) < (w_small[1] - w_small[0])

def test_zero_successes_gives_a_finite_upper_bound():
    lo, hi = wilson_interval(0, 10000)
    assert lo == 0.0
    assert 0.0 < hi < 0.01

def test_a_factor_of_two_error_is_rejected():
    # 10000 trials at a true rate of 0.05 gives ~500 errors.
    # A claim of 0.025 must fall outside the interval.
    assert consistent(0.05, 500, 10000)
    assert not consistent(0.025, 500, 10000)
