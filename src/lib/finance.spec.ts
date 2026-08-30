import { describe, expect, it } from 'vitest';
import { percentChange, simulateReduction } from './finance';

describe('percentChange', () => {
  it('computes a positive change', () => {
    expect(percentChange(128, 100)).toBeCloseTo(0.28, 10);
  });

  it('computes a negative change', () => {
    expect(percentChange(80, 100)).toBeCloseTo(-0.2, 10);
  });

  it('treats a zero previous total with spend as +100%', () => {
    expect(percentChange(50, 0)).toBe(1);
  });

  it('treats zero vs zero as no change', () => {
    expect(percentChange(0, 0)).toBe(0);
  });
});

describe('simulateReduction', () => {
  it('matches the spec example: $520,000/mo, -20%, 4 months', () => {
    const result = simulateReduction(520000, 20, 4);
    expect(result.targetMonthlySpend).toBeCloseTo(416000, 5);
    expect(result.estimatedSavings).toBeCloseTo(416000, 5);
  });

  it('is a no-op at 0% reduction', () => {
    const result = simulateReduction(1000, 0, 6);
    expect(result.targetMonthlySpend).toBeCloseTo(1000, 10);
    expect(result.estimatedSavings).toBeCloseTo(0, 10);
  });

  it('zeroes spend out at 100% reduction', () => {
    const result = simulateReduction(1000, 100, 3);
    expect(result.targetMonthlySpend).toBe(0);
    expect(result.estimatedSavings).toBe(3000);
  });
});
