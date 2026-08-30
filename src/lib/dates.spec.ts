import { describe, expect, it } from 'vitest';
import { isStrictISODate, isValidDateRange } from './dates';

describe('isStrictISODate', () => {
  it('accepts a clean ISO date', () => {
    expect(isStrictISODate('2026-08-30')).toBe(true);
  });

  it.each([
    '2026-99-99', // out-of-range month/day
    '2026-02-30', // February has no 30th
    "2026-08-30' OR 1=1 --", // SQL injection attempt
    '08/30/2026', // non-ISO format
    '2026-8-30', // missing zero-padding
    'abc',
    '',
  ])('rejects %s', (value) => {
    expect(isStrictISODate(value)).toBe(false);
  });
});

describe('isValidDateRange', () => {
  it('accepts a null/undefined range', () => {
    expect(isValidDateRange(null, null)).toBe(true);
    expect(isValidDateRange(undefined, undefined)).toBe(true);
  });

  it('accepts start <= end', () => {
    expect(isValidDateRange('2026-08-01', '2026-08-30')).toBe(true);
    expect(isValidDateRange('2026-08-01', '2026-08-01')).toBe(true);
  });

  it('rejects start > end', () => {
    expect(isValidDateRange('2026-08-30', '2026-08-01')).toBe(false);
  });

  it('rejects a malformed date anywhere in the pair', () => {
    expect(isValidDateRange('2026-99-99', '2026-08-30')).toBe(false);
    expect(isValidDateRange('2026-08-01', "2026-08-30' OR 1=1 --")).toBe(false);
  });
});
