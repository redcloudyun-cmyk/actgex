import { CATEGORY_IDS, type CategoryId } from '../data/types';
import { escapeSqlString, runQuery } from '../db/duckdb';
import { calendarMonthRange, daysAgoISO, isValidDateRange, todayISO } from '../lib/dates';
import { percentChange, simulateReduction } from '../lib/finance';
import { useAppStore, waitForApproval } from '../store/useAppStore';
import {
  invalidAmountRangeError,
  invalidBudgetLimitError,
  invalidCategoryError,
  invalidDateRangeError,
  invalidMonthCountError,
  invalidReductionPercentError,
  noDataError,
} from './errors';

function assertDataset() {
  if (!useAppStore.getState().datasetLoaded) throw noDataError();
}

function assertCategory(category: string | undefined): CategoryId | undefined {
  if (category === undefined || category === 'ALL') return undefined;
  if (!CATEGORY_IDS.includes(category as CategoryId)) throw invalidCategoryError(category);
  return category as CategoryId;
}

/**
 * Human UI → Shared State → Agent Tool Context: when the agent doesn't name
 * a category explicitly, fall back to whatever the human currently has
 * selected in the dashboard filter, rather than defaulting to "everything".
 * An explicit argument from the agent always wins.
 */
function resolveCategoryContext(input: string | undefined): CategoryId | undefined {
  if (input !== undefined) return assertCategory(input);
  const current = useAppStore.getState().filters.category;
  return current === 'ALL' ? undefined : current;
}

/** Same shared-state fallback, for the date-range filter. */
function resolveDateRangeContext(
  startDate: string | undefined,
  endDate: string | undefined,
): { startDate?: string; endDate?: string } {
  if (startDate || endDate) return { startDate, endDate };
  const filters = useAppStore.getState().filters;
  return { startDate: filters.startDate ?? undefined, endDate: filters.endDate ?? undefined };
}

function whereClause(opts: {
  category?: CategoryId;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}): string {
  const parts: string[] = ['1=1'];
  if (opts.category) parts.push(`category = '${opts.category}'`);
  if (opts.startDate) parts.push(`date >= DATE '${opts.startDate}'`);
  if (opts.endDate) parts.push(`date <= DATE '${opts.endDate}'`);
  if (opts.minAmount !== undefined) parts.push(`amount >= ${Number(opts.minAmount)}`);
  if (opts.maxAmount !== undefined) parts.push(`amount <= ${Number(opts.maxAmount)}`);
  if (opts.search) parts.push(`merchant ILIKE '%${escapeSqlString(opts.search)}%'`);
  return parts.join(' AND ');
}

// ---------------------------------------------------------------------------
// query_transactions (read-only)
// ---------------------------------------------------------------------------
export interface QueryTransactionsArgs {
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export async function queryTransactions(args: QueryTransactionsArgs) {
  if (
    (args.minAmount !== undefined && (!Number.isFinite(args.minAmount) || args.minAmount < 0)) ||
    (args.maxAmount !== undefined && (!Number.isFinite(args.maxAmount) || args.maxAmount < 0)) ||
    (args.minAmount !== undefined && args.maxAmount !== undefined && args.minAmount > args.maxAmount)
  ) {
    throw invalidAmountRangeError();
  }

  assertDataset();
  const category = resolveCategoryContext(args.category);
  const { startDate, endDate } = resolveDateRangeContext(args.startDate, args.endDate);
  if (!isValidDateRange(startDate, endDate)) throw invalidDateRangeError();
  const where = whereClause({ ...args, category, startDate, endDate });

  const rows = await runQuery(
    `SELECT id, date, merchant, category, amount FROM transactions WHERE ${where} ORDER BY date DESC LIMIT 200`,
  );
  const [agg] = await runQuery<{ count: number; total: number }>(
    `SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total FROM transactions WHERE ${where}`,
  );

  return {
    count: agg?.count ?? 0,
    totalAmount: agg?.total ?? 0,
    transactions: rows,
    truncated: (agg?.count ?? 0) > rows.length,
  };
}

// ---------------------------------------------------------------------------
// get_category_summary (read-only)
// ---------------------------------------------------------------------------
export interface CategorySummaryArgs {
  startDate?: string;
  endDate?: string;
}

export async function getCategorySummary(args: CategorySummaryArgs) {
  assertDataset();
  const { startDate, endDate } = resolveDateRangeContext(args.startDate, args.endDate);
  if (!isValidDateRange(startDate, endDate)) throw invalidDateRangeError();
  const where = whereClause({ startDate, endDate });

  const rows = await runQuery<{ category: CategoryId; count: number; total: number; average: number }>(
    `SELECT category, COUNT(*) AS count, SUM(amount) AS total, AVG(amount) AS average
     FROM transactions WHERE ${where} GROUP BY category ORDER BY total DESC`,
  );
  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);

  return {
    startDate: startDate ?? null,
    endDate: endDate ?? null,
    grandTotal,
    categories: rows.map((r) => ({
      category: r.category,
      total: r.total,
      count: r.count,
      average: r.average,
      ratio: grandTotal > 0 ? r.total / grandTotal : 0,
    })),
  };
}

// ---------------------------------------------------------------------------
// compare_spending_periods (read-only)
// ---------------------------------------------------------------------------
export interface ComparePeriodsArgs {
  currentStartDate?: string;
  currentEndDate?: string;
  previousStartDate?: string;
  previousEndDate?: string;
  category?: string;
}

export async function compareSpendingPeriods(args: ComparePeriodsArgs) {
  assertDataset();
  const category = resolveCategoryContext(args.category);

  let currentStartDate = args.currentStartDate;
  let currentEndDate = args.currentEndDate;
  let previousStartDate = args.previousStartDate;
  let previousEndDate = args.previousEndDate;

  if (!currentStartDate || !currentEndDate) {
    [currentStartDate, currentEndDate] = calendarMonthRange(0);
  }
  if (!previousStartDate || !previousEndDate) {
    [previousStartDate, previousEndDate] = calendarMonthRange(1);
  }

  if (
    !isValidDateRange(currentStartDate, currentEndDate) ||
    !isValidDateRange(previousStartDate, previousEndDate)
  ) {
    throw invalidDateRangeError();
  }

  const currentWhere = whereClause({ category, startDate: currentStartDate, endDate: currentEndDate });
  const previousWhere = whereClause({ category, startDate: previousStartDate, endDate: previousEndDate });

  const [[currentAgg], [previousAgg], currentByCat, previousByCat] = await Promise.all([
    runQuery<{ total: number }>(`SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE ${currentWhere}`),
    runQuery<{ total: number }>(`SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE ${previousWhere}`),
    runQuery<{ category: CategoryId; total: number }>(
      `SELECT category, SUM(amount) AS total FROM transactions WHERE ${currentWhere} GROUP BY category`,
    ),
    runQuery<{ category: CategoryId; total: number }>(
      `SELECT category, SUM(amount) AS total FROM transactions WHERE ${previousWhere} GROUP BY category`,
    ),
  ]);

  const currentMap = new Map(currentByCat.map((r) => [r.category, r.total]));
  const previousMap = new Map(previousByCat.map((r) => [r.category, r.total]));
  const allCats = new Set([...currentMap.keys(), ...previousMap.keys()]);

  const deltas = [...allCats].map((cat) => {
    const cur = currentMap.get(cat) ?? 0;
    const prev = previousMap.get(cat) ?? 0;
    return { category: cat, current: cur, previous: prev, change: cur - prev };
  });

  const increasedCategories = deltas
    .filter((d) => d.change > 0)
    .sort((a, b) => b.change - a.change)
    .map((d) => d.category);
  const decreasedCategories = deltas
    .filter((d) => d.change < 0)
    .sort((a, b) => a.change - b.change)
    .map((d) => d.category);

  const currentTotal = currentAgg?.total ?? 0;
  const previousTotal = previousAgg?.total ?? 0;
  const changeAmount = currentTotal - previousTotal;
  const changePercent = percentChange(currentTotal, previousTotal);

  return {
    category: category ?? null,
    currentStartDate,
    currentEndDate,
    previousStartDate,
    previousEndDate,
    currentTotal,
    previousTotal,
    changeAmount,
    changePercent,
    increasedCategories,
    decreasedCategories,
  };
}

// ---------------------------------------------------------------------------
// flag_unusual_spending (read-only)
// ---------------------------------------------------------------------------
export interface FlagUnusualArgs {
  threshold?: number;
}

export async function flagUnusualSpending(args: FlagUnusualArgs) {
  assertDataset();
  const threshold = args.threshold ?? 1.3;
  const recentStart = daysAgoISO(30);
  const baselineStart = daysAgoISO(120);

  const [recentRows, baselineRows] = await Promise.all([
    runQuery<{ category: CategoryId; total: number }>(
      `SELECT category, SUM(amount) AS total FROM transactions WHERE date >= DATE '${recentStart}' GROUP BY category`,
    ),
    runQuery<{ category: CategoryId; total: number }>(
      `SELECT category, SUM(amount) AS total FROM transactions
       WHERE date >= DATE '${baselineStart}' AND date < DATE '${recentStart}' GROUP BY category`,
    ),
  ]);

  const recentMap = new Map(recentRows.map((r) => [r.category, r.total]));
  const baselineMap = new Map(baselineRows.map((r) => [r.category, r.total]));

  const flagged = [...recentMap.keys()]
    .map((cat) => {
      const recentTotal = recentMap.get(cat) ?? 0;
      const baselineAvgMonthly = (baselineMap.get(cat) ?? 0) / 3;
      const ratio = baselineAvgMonthly > 0 ? recentTotal / baselineAvgMonthly : recentTotal > 0 ? Infinity : 0;
      return { category: cat, recentTotal, baselineAvgMonthly, ratio };
    })
    .filter((r) => r.ratio >= threshold && r.recentTotal > 0)
    .sort((a, b) => b.ratio - a.ratio);

  return { threshold, recentWindowStart: recentStart, flagged };
}

// ---------------------------------------------------------------------------
// recommend_budget_goal (read-only)
// ---------------------------------------------------------------------------
export interface RecommendBudgetArgs {
  category: string;
}

export async function recommendBudgetGoal(args: RecommendBudgetArgs) {
  assertDataset();
  const category = assertCategory(args.category);
  if (!category) throw invalidCategoryError(args.category);

  const since = daysAgoISO(90);
  const [row] = await runQuery<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE category = '${category}' AND date >= DATE '${since}'`,
  );
  const avgMonthly = (row?.total ?? 0) / 3;
  const currency = useAppStore.getState().currency;
  const step = currency === 'KRW' ? 10000 : 10;
  const recommendedMonthlyLimit = Math.max(step, Math.round(avgMonthly / step) * step);

  return {
    category,
    recommendedMonthlyLimit,
    basedOnMonths: 3,
    averageMonthlySpend: avgMonthly,
  };
}

// ---------------------------------------------------------------------------
// simulate_budget_change (read-only)
// ---------------------------------------------------------------------------
export interface SimulateBudgetChangeArgs {
  category: string;
  reductionPercent: number;
  months: number;
}

export async function simulateBudgetChange(args: SimulateBudgetChangeArgs) {
  if (!Number.isFinite(args.reductionPercent) || args.reductionPercent <= 0 || args.reductionPercent > 100) {
    throw invalidReductionPercentError();
  }
  if (!Number.isInteger(args.months) || args.months < 1 || args.months > 60) {
    throw invalidMonthCountError();
  }

  assertDataset();
  const category = assertCategory(args.category);
  if (!category) throw invalidCategoryError(args.category);

  const since = daysAgoISO(90);
  const [row] = await runQuery<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE category = '${category}' AND date >= DATE '${since}'`,
  );
  const currentMonthlyAverage = (row?.total ?? 0) / 3;
  const { targetMonthlySpend, estimatedSavings } = simulateReduction(
    currentMonthlyAverage,
    args.reductionPercent,
    args.months,
  );

  return {
    category,
    reductionPercent: args.reductionPercent,
    months: args.months,
    currentMonthlyAverage,
    targetMonthlySpend,
    estimatedSavings,
  };
}

// ---------------------------------------------------------------------------
// set_budget_goal (mutating — requires human approval)
// ---------------------------------------------------------------------------
export interface SetBudgetGoalArgs {
  category: string;
  monthlyLimit: number;
}

export async function setBudgetGoal(args: SetBudgetGoalArgs, activityId: string) {
  if (!Number.isFinite(args.monthlyLimit) || args.monthlyLimit <= 0) {
    throw invalidBudgetLimitError();
  }

  assertDataset();
  const category = assertCategory(args.category);
  if (!category) throw invalidCategoryError(args.category);

  const store = useAppStore.getState();
  store.updateActivity(activityId, { status: 'WAITING_APPROVAL' });
  store.requestBudgetApproval(activityId, category, args.monthlyLimit);

  const approved = await waitForApproval(activityId);

  if (!approved) {
    store.updateActivity(activityId, { status: 'REJECTED' });
    return { applied: false, category, monthlyLimit: args.monthlyLimit };
  }

  store.updateActivity(activityId, { status: 'RUNNING' });
  const before = store.budgets[category];
  store.setBudget(category, args.monthlyLimit);

  return {
    applied: true,
    category,
    monthlyLimit: args.monthlyLimit,
    previousLimit: before ?? null,
  };
}

// ---------------------------------------------------------------------------
// export_report (read-only)
// ---------------------------------------------------------------------------
export interface ExportReportArgs {
  format: 'markdown' | 'csv';
}

export async function exportReport(args: ExportReportArgs) {
  assertDataset();
  const summary = await getCategorySummary({});
  const { budgets, region, currency } = useAppStore.getState();

  let content: string;
  if (args.format === 'csv') {
    const header = 'category,total,count,average,budget';
    const lines = summary.categories.map(
      (c) => `${c.category},${c.total},${c.count},${c.average},${budgets[c.category] ?? ''}`,
    );
    content = [header, ...lines].join('\n');
  } else {
    const lines = [
      `# ActGeX Report (${region ?? ''}, ${currency}, generated ${todayISO()})`,
      '',
      '| Category | Total | Count | Average | Budget |',
      '|---|---|---|---|---|',
      ...summary.categories.map(
        (c) =>
          `| ${c.category} | ${c.total.toFixed(2)} | ${c.count} | ${c.average.toFixed(2)} | ${
            budgets[c.category] ?? '-'
          } |`,
      ),
    ];
    content = lines.join('\n');
  }

  return { format: args.format, content };
}
