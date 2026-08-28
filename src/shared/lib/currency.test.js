import { describe, it, expect } from 'vitest';
import { formatCurrency } from './currency';

describe('formatCurrency', () => {
  it('prefixes with LKR and uses en-LK thousands separators', () => {
    expect(formatCurrency(3550)).toBe('LKR 3,550');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('LKR 0');
  });

  it('coerces a numeric string (as amounts arriving from Postgres/DB rows often are)', () => {
    expect(formatCurrency('1200')).toBe('LKR 1,200');
  });

  it('handles large amounts with multiple thousands separators', () => {
    expect(formatCurrency(1234567)).toBe('LKR 1,234,567');
  });

  it('passes through toLocaleString options, e.g. rounding off decimals', () => {
    expect(formatCurrency(1234.56, { maximumFractionDigits: 0 })).toBe('LKR 1,235');
  });

  it('shows decimals when the amount actually has them and no options are given', () => {
    expect(formatCurrency(99.5)).toBe('LKR 99.5');
  });
});
