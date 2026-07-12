import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatCurrency, formatCurrencyCompact } from '../currency';

describe('formatCurrencyCompact', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows standard two-decimal precision under $1,000 instead of compact-notation truncation', () => {
    // Regression: compact notation (maximumFractionDigits: 1) was applied
    // to every amount regardless of size, so $12.40 rendered as $12.4 —
    // dropping the trailing zero and reading as a formatting bug rather
    // than an intentional "$1.2k"-style abbreviation.
    expect(formatCurrencyCompact(12.4)).toBe('$12.40');
    expect(formatCurrencyCompact(45)).toBe('$45.00');
    expect(formatCurrencyCompact(999.99)).toBe('$999.99');
  });

  it('still abbreviates large amounts compactly', () => {
    expect(formatCurrencyCompact(1200)).toBe('$1.2K');
    expect(formatCurrencyCompact(45000)).toBe('$45.0K');
  });

  it('returns "Unknown" for non-numeric input', () => {
    expect(formatCurrencyCompact(undefined)).toBe('Unknown');
    expect(formatCurrencyCompact(null)).toBe('Unknown');
    expect(formatCurrencyCompact(NaN)).toBe('Unknown');
  });
});

describe('formatCurrency', () => {
  it('formats with two decimal places by default', () => {
    expect(formatCurrency(12.4)).toBe('$12.40');
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
  });
});
