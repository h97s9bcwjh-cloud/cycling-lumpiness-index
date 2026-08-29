# Lumpiness Index v3.0 — reproducibility fix

This version restores the exact discrete implementation used during v3.0 development.

Key fixes:
- reversal smoothing now uses an exact n-point boxcar with zero-padding, equivalent to
  `numpy.convolve(arr, ones(n)/n, mode='same')`;
- successive GPX points separated by <=0.1 m are discarded before interpolation;
- the resampled route uses complete 25 m intervals only (no shorter appended final interval).

These changes resolve the known discrepancies:
- Rampos Inhumano: development 8.92, now reproduced by the website;
- Tour of the Valleys: development 5.77, now reproduced by the website.

The v3.0 mathematical architecture and fitted coefficients are unchanged.
