import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { PieChart, Target, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { categoryLabelKey } from '../data/categories';
import { useI18n } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { monthlyChange, recentDailySeries, sumAmount, totalsByCategory } from '../lib/aggregate';
import { calendarMonthRange } from '../lib/dates';
import { formatCurrency, formatPercent } from '../lib/format';
import { Sparkline } from './Sparkline';

export function KpiCards() {
  const { t, locale } = useI18n();
  const { transactions, budgets, currency } = useAppStore(
    useShallow((s) => ({ transactions: s.transactions, budgets: s.budgets, currency: s.currency })),
  );

  const totalSpend = useMemo(() => sumAmount(transactions), [transactions]);
  const { change, percent } = useMemo(() => monthlyChange(transactions), [transactions]);
  const totalTrend = useMemo(() => recentDailySeries(transactions, 14), [transactions]);

  const thisMonthTotals = useMemo(() => {
    const [start, end] = calendarMonthRange(0);
    return totalsByCategory(transactions.filter((tx) => tx.date >= start && tx.date <= end));
  }, [transactions]);

  const largest = thisMonthTotals[0];
  const largestTrend = useMemo(
    () => (largest ? recentDailySeries(transactions, 14, largest.category) : []),
    [transactions, largest],
  );

  const budgetInfo = useMemo(() => {
    const entries = Object.entries(budgets) as [string, number][];
    if (entries.length === 0) return null;
    let limitSum = 0;
    let spendSum = 0;
    for (const [category, limit] of entries) {
      limitSum += limit;
      spendSum += thisMonthTotals.find((c) => c.category === category)?.total ?? 0;
    }
    return { remaining: limitSum - spendSum, limitSum };
  }, [budgets, thisMonthTotals]);

  const budgetTrend = useMemo(() => {
    if (!budgetInfo) return [];
    let running = budgetInfo.limitSum;
    return totalTrend.map((v) => (running -= v));
  }, [budgetInfo, totalTrend]);

  const changeUp = change > 0;

  const cards = [
    {
      label: t('kpi.totalSpend'),
      value: formatCurrency(totalSpend, locale, currency),
      sub: null as string | null,
      icon: Wallet,
      iconClass: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
      trend: totalTrend,
      trendColor: 'var(--color-primary)',
    },
    {
      label: t('kpi.monthlyChange'),
      value: formatCurrency(change, locale, currency),
      sub: `${formatPercent(percent, locale)} ${t('kpi.vsPrevMonth')}`,
      icon: changeUp ? TrendingUp : TrendingDown,
      iconClass: changeUp
        ? 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
        : 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
      tone: changeUp ? 'danger' : change < 0 ? 'success' : 'neutral',
      trend: totalTrend,
      trendColor: changeUp ? 'var(--color-danger)' : 'var(--color-success)',
    },
    {
      label: t('kpi.largestCategory'),
      value: largest ? t(categoryLabelKey(largest.category)) : '—',
      sub: largest ? formatCurrency(largest.total, locale, currency) : t('kpi.acrossCategories', { count: 0 }),
      icon: PieChart,
      iconClass: 'bg-violet-100 text-violet-600',
      trend: largestTrend,
      trendColor: '#7c3aed',
    },
    {
      label: t('kpi.budgetRemaining'),
      value: budgetInfo ? formatCurrency(budgetInfo.remaining, locale, currency) : t('kpi.noBudgetSet'),
      sub: budgetInfo ? t('kpi.ofTotalBudget') : null,
      icon: Target,
      iconClass: 'bg-amber-100 text-amber-600',
      tone: budgetInfo && budgetInfo.remaining < 0 ? 'danger' : 'neutral',
      trend: budgetTrend,
      trendColor: 'var(--color-warning)',
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${c.iconClass}`}>
                <Icon size={17} strokeWidth={2.25} />
              </div>
              {c.trend.length > 1 && <Sparkline data={[...c.trend]} color={c.trendColor} />}
            </div>
            <div className="mt-3 text-xs font-medium text-[var(--color-ink-soft)]">{c.label}</div>
            <div
              className={`mt-0.5 text-2xl font-semibold tabular-nums ${
                'tone' in c && c.tone === 'danger'
                  ? 'text-[var(--color-danger)]'
                  : 'tone' in c && c.tone === 'success'
                    ? 'text-[var(--color-success)]'
                    : 'text-[var(--color-ink)]'
              }`}
            >
              {c.value}
            </div>
            {c.sub && <div className="mt-0.5 text-[11px] text-[var(--color-ink-soft)]">{c.sub}</div>}
          </div>
        );
      })}
    </div>
  );
}
