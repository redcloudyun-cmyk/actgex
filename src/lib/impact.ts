import type { MissionResult } from '../store/useAppStore';
import type { BudgetImpact } from '../store/useAppStore';
import type { Transaction } from '../data/types';
import { calendarMonthRange } from './dates';
import { sumAmount } from './aggregate';

/**
 * Before/After numbers for the approval dialog: takes the whole-portfolio
 * current-month spend and applies the mission's category-level reduction to
 * it, so "Monthly Spend" / "Savings" reflect the real impact of the one
 * category change rather than just the category itself.
 */
export function computeBudgetImpact(
  transactions: Transaction[],
  monthlyIncome: number | null,
  result: MissionResult,
): BudgetImpact {
  const [start, end] = calendarMonthRange(0);
  const currentMonthlySpend = sumAmount(transactions.filter((t) => t.date >= start && t.date <= end));
  const categoryDelta = result.currentMonthlyAvg - result.targetMonthlySpend;
  const projectedMonthlySpend = Math.max(0, currentMonthlySpend - categoryDelta);

  const currentSavings = monthlyIncome !== null ? monthlyIncome - currentMonthlySpend : null;
  const projectedSavings = monthlyIncome !== null ? monthlyIncome - projectedMonthlySpend : null;
  const currentSavingsRate =
    monthlyIncome && monthlyIncome > 0 && currentSavings !== null ? currentSavings / monthlyIncome : null;
  const projectedSavingsRate =
    monthlyIncome && monthlyIncome > 0 && projectedSavings !== null ? projectedSavings / monthlyIncome : null;

  return {
    percentAboveAverage: result.flagRatio - 1,
    currentMonthlySpend,
    projectedMonthlySpend,
    currentSavings,
    projectedSavings,
    currentSavingsRate,
    projectedSavingsRate,
  };
}
