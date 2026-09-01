import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { categoryLabelKey } from '../data/categories';
import { useI18n } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { sumAmount } from '../lib/aggregate';
import { calendarMonthRange } from '../lib/dates';
import { formatCurrency, formatMonth } from '../lib/format';

export function AgentContextPanel() {
  const { t, locale } = useI18n();
  const { transactions, budgets, currency, filters, missionCategory, datasetLoaded } = useAppStore(
    useShallow((s) => ({
      transactions: s.transactions,
      budgets: s.budgets,
      currency: s.currency,
      filters: s.filters,
      missionCategory: s.mission.result?.category ?? null,
      datasetLoaded: s.datasetLoaded,
    })),
  );

  const monthlySpend = useMemo(() => {
    const [start, end] = calendarMonthRange(0);
    return sumAmount(transactions.filter((t) => t.date >= start && t.date <= end));
  }, [transactions]);

  const focusCategory = missionCategory ?? (filters.category !== 'ALL' ? filters.category : null);

  const rows: { label: string; value: string }[] = [
    { label: t('context.account'), value: t('context.accountValue') },
    { label: t('context.currentMonth'), value: formatMonth(calendarMonthRange(0)[0], locale) },
    { label: t('context.transactions'), value: String(transactions.length) },
    { label: t('context.monthlySpend'), value: datasetLoaded ? formatCurrency(monthlySpend, locale, currency) : '—' },
    { label: t('context.budgetCategories'), value: String(Object.keys(budgets).length) },
    { label: t('context.currentFocus'), value: focusCategory ? t(categoryLabelKey(focusCategory)) : t('context.none') },
  ];

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">{t('context.title')}</h3>
      <p className="mb-3 text-[11px] text-[var(--color-ink-soft)]">{t('context.subtitle')}</p>
      <dl className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-2 text-xs">
            <dt className="text-[var(--color-ink-soft)]">{row.label}</dt>
            <dd className="font-medium text-[var(--color-ink)]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
