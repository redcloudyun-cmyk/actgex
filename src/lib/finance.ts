/** Fractional change from `previous` to `current` (0.28 = +28%). */
export function percentChange(current: number, previous: number): number {
  if (previous > 0) return (current - previous) / previous;
  return current > 0 ? 1 : 0;
}

export interface SimulatedReduction {
  targetMonthlySpend: number;
  estimatedSavings: number;
}

/** What-if: reducing a monthly average by `reductionPercent`, held for `months`. */
export function simulateReduction(
  currentMonthlyAverage: number,
  reductionPercent: number,
  months: number,
): SimulatedReduction {
  const targetMonthlySpend = currentMonthlyAverage * (1 - reductionPercent / 100);
  const estimatedSavings = (currentMonthlyAverage - targetMonthlySpend) * months;
  return { targetMonthlySpend, estimatedSavings };
}
