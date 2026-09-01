import { describe, expect, it } from 'vitest';
import { computeBudgetImpact } from './impact';
import { calendarMonthRange } from './dates';
import type { MissionResult } from '../store/useAppStore';
import type { Transaction } from '../data/types';

function tx(date: string, amount: number): Transaction {
  return { id: `${date}-${amount}`, date, merchant: 'Test', category: 'DINING', amount };
}

describe('computeBudgetImpact', () => {
  const [monthStart] = calendarMonthRange(0);
  const transactions = [tx(monthStart, 1000)];

  const result: MissionResult = {
    category: 'DINING',
    flagRatio: 1.28,
    currentBudget: 650,
    currentMonthlyAvg: 650,
    recommendedLimit: 520,
    targetMonthlySpend: 520,
    estimatedSavingsPerMonth: 130,
    reductionPercent: 20,
  };

  it('reduces projected monthly spend by the category delta', () => {
    const impact = computeBudgetImpact(transactions, 6000, result);
    expect(impact.currentMonthlySpend).toBe(1000);
    expect(impact.projectedMonthlySpend).toBe(870); // 1000 - (650 - 520)
  });

  it('computes savings and savings rate from income', () => {
    const impact = computeBudgetImpact(transactions, 6000, result);
    expect(impact.currentSavings).toBe(5000);
    expect(impact.projectedSavings).toBe(5130);
    expect(impact.currentSavingsRate).toBeCloseTo(5000 / 6000);
    expect(impact.projectedSavingsRate).toBeCloseTo(5130 / 6000);
  });

  it('returns null savings fields when income is unknown', () => {
    const impact = computeBudgetImpact(transactions, null, result);
    expect(impact.currentSavings).toBeNull();
    expect(impact.projectedSavings).toBeNull();
    expect(impact.currentSavingsRate).toBeNull();
    expect(impact.projectedSavingsRate).toBeNull();
  });

  it('never lets projected spend go negative', () => {
    const bigReduction: MissionResult = { ...result, currentMonthlyAvg: 5000, targetMonthlySpend: 0 };
    const impact = computeBudgetImpact(transactions, 6000, bigReduction);
    expect(impact.projectedMonthlySpend).toBe(0);
  });
});
