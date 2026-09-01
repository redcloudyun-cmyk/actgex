import { describe, expect, it } from 'vitest';
import { generateDemoData } from './demoData';
import { calendarMonthRange } from '../lib/dates';
import { percentChange } from '../lib/finance';
import type { Region, Transaction } from './types';

function diningMonthOverMonthChange(region: Region, referenceDate: Date): number {
  const transactions = generateDemoData(region, referenceDate);
  const [curStart, curEnd] = calendarMonthRange(0, referenceDate);
  const [prevStart, prevEnd] = calendarMonthRange(1, referenceDate);

  const sum = (start: string, end: string) =>
    transactions
      .filter((t) => t.category === 'DINING' && t.date >= start && t.date <= end)
      .reduce((s, t) => s + t.amount, 0);

  return percentChange(sum(curStart, curEnd), sum(prevStart, prevEnd));
}

describe('generateDemoData determinism', () => {
  it('produces byte-identical output for the same region and reference date', () => {
    const referenceDate = new Date('2026-08-30T12:00:00Z');
    const a = generateDemoData('US', referenceDate);
    const b = generateDemoData('US', referenceDate);
    expect(a).toEqual(b);
  });

  it('produces the same transaction count for US and KR on a given reference date', () => {
    const referenceDate = new Date('2026-08-30T12:00:00Z');
    const us = generateDemoData('US', referenceDate);
    const kr = generateDemoData('KR', referenceDate);
    expect(us.length).toBeGreaterThan(0);
    expect(kr.length).toBeGreaterThan(0);
  });
});

describe('generateDemoData dining month-over-month story', () => {
  // The generator deliberately pins this ratio (see demoData.ts) so the
  // "compare_spending_periods" demo scenario is stable regardless of which
  // day of the month it's actually run on.
  const referenceDate = new Date('2026-08-30T12:00:00Z');
  const tolerance = 0.02; // ±2%

  it('US demo: dining increases ~29% vs. the previous month', () => {
    expect(diningMonthOverMonthChange('US', referenceDate)).toBeGreaterThan(0.29 - tolerance);
    expect(diningMonthOverMonthChange('US', referenceDate)).toBeLessThan(0.29 + tolerance);
  });

  it('KR demo: dining increases ~29% vs. the previous month', () => {
    expect(diningMonthOverMonthChange('KR', referenceDate)).toBeGreaterThan(0.29 - tolerance);
    expect(diningMonthOverMonthChange('KR', referenceDate)).toBeLessThan(0.29 + tolerance);
  });
});

describe('generateDemoData flag_unusual_spending ratio', () => {
  // The Agent Mission runs flag_unusual_spending and acts on whichever
  // category ranks first — it must reliably be DINING, matching the
  // MoM story above, not a low-volume category spiking on random noise.
  function categoryFlagRatio(transactions: Transaction[], category: string, referenceDate: Date): number {
    const recentStart = new Date(referenceDate.getTime() - 30 * 86400000).toISOString().slice(0, 10);
    const baselineStart = new Date(referenceDate.getTime() - 120 * 86400000).toISOString().slice(0, 10);
    let recent = 0;
    let baseline = 0;
    for (const t of transactions) {
      if (t.category !== category) continue;
      if (t.date >= recentStart) recent += t.amount;
      else if (t.date >= baselineStart) baseline += t.amount;
    }
    const baselineAvgMonthly = baseline / 3;
    return baselineAvgMonthly > 0 ? recent / baselineAvgMonthly : recent > 0 ? Infinity : 0;
  }

  for (const referenceDate of [new Date('2026-08-30T12:00:00Z'), new Date('2026-09-01T12:00:00Z')]) {
    for (const region of ['US', 'KR'] as const) {
      it(`${region} demo (ref ${referenceDate.toISOString().slice(0, 10)}): DINING has the highest flag_unusual_spending ratio`, () => {
        const transactions = generateDemoData(region, referenceDate);
        const categories = [...new Set(transactions.map((t) => t.category))];
        const diningRatio = categoryFlagRatio(transactions, 'DINING', referenceDate);
        for (const category of categories) {
          if (category === 'DINING') continue;
          expect(diningRatio).toBeGreaterThan(categoryFlagRatio(transactions, category, referenceDate));
        }
        expect(diningRatio).toBeGreaterThanOrEqual(1.3);
      });
    }
  }
});
