import { describe, expect, it } from 'vitest';
import { generateDemoData } from '../data/demoData';
import { calendarMonthRange } from './dates';
import { percentChange } from './finance';
import { filterTransactions, sumAmount } from './aggregate';

/**
 * `compare_spending_periods` runs this same current-vs-previous-total
 * comparison as a DuckDB SQL query (see webmcp/tools.ts). DuckDB-Wasm needs
 * a real browser Worker, which this Node test environment doesn't have, so
 * this test instead exercises the identical math via the pure aggregation
 * helpers against the same generated dataset, to lock down the comparison
 * semantics independent of the SQL layer.
 */
describe('compare_spending_periods math (pure, mirrors the SQL tool)', () => {
  const referenceDate = new Date('2026-08-30T12:00:00Z');
  const transactions = generateDemoData('US', referenceDate);

  it('current/previous totals sum correctly for a specific category', () => {
    const [curStart, curEnd] = calendarMonthRange(0, referenceDate);
    const [prevStart, prevEnd] = calendarMonthRange(1, referenceDate);

    const current = sumAmount(
      filterTransactions(transactions, { category: 'DINING', startDate: curStart, endDate: curEnd, search: '' }),
    );
    const previous = sumAmount(
      filterTransactions(transactions, { category: 'DINING', startDate: prevStart, endDate: prevEnd, search: '' }),
    );

    expect(current).toBeGreaterThan(0);
    expect(previous).toBeGreaterThan(0);

    const changeAmount = current - previous;
    const changePercent = percentChange(current, previous);

    // changeAmount and changePercent must agree with each other.
    expect(changePercent).toBeCloseTo(changeAmount / previous, 10);
    // And the pinned demo story: dining goes up, not down, this month.
    expect(changeAmount).toBeGreaterThan(0);
  });

  it('grand total across all categories equals the sum of every category total', () => {
    const [curStart, curEnd] = calendarMonthRange(0, referenceDate);
    const inMonth = filterTransactions(transactions, {
      category: 'ALL',
      startDate: curStart,
      endDate: curEnd,
      search: '',
    });
    const grandTotal = sumAmount(inMonth);

    const byCategory = new Set(inMonth.map((t) => t.category));
    const summed = [...byCategory].reduce(
      (sum, cat) =>
        sum + sumAmount(filterTransactions(inMonth, { category: cat, startDate: null, endDate: null, search: '' })),
      0,
    );

    expect(summed).toBeCloseTo(grandTotal, 6);
  });
});
