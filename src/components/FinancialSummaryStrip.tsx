import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useI18n } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { sumAmount } from '../lib/aggregate';
import { calendarMonthRange } from '../lib/dates';
import { formatCurrency, formatPercent } from '../lib/format';

export function FinancialSummaryStrip() {
  const { t, locale } = useI18n();
  const { transactions, currency, monthlyIncome, datasetLoaded } = useAppStore(
    useShallow((s) => ({
      transactions: s.transactions,
      currency: s.currency,
      monthlyIncome: s.monthlyIncome,
      datasetLoaded: s.datasetLoaded,
    })),
  );

  const spend = useMemo(() => {
    const [start, end] = calendarMonthRange(0);
    return sumAmount(transactions.filter((tx) => tx.date >= start && tx.date <= end));
  }, [transactions]);

  const savings = monthlyIncome !== null ? monthlyIncome - spend : null;
  const savingsRate = monthlyIncome && monthlyIncome > 0 && savings !== null ? savings / monthlyIncome : null;

  const cells = [
    { label: t('summary.income'), value: datasetLoaded && monthlyIncome !== null ? formatCurrency(monthlyIncome, locale, currency) : '—' },
    { label: t('summary.spend'), value: datasetLoaded ? formatCurrency(spend, locale, currency) : '—' },
    { label: t('summary.savings'), value: datasetLoaded && savings !== null ? formatCurrency(savings, locale, currency) : '—' },
    { label: t('summary.savingsRate'), value: datasetLoaded && savingsRate !== null ? formatPercent(savingsRate, locale) : '—' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-4">
      {cells.map((cell) => (
        <div key={cell.label}>
          <div className="text-[11px] font-medium text-[var(--color-ink-soft)]">{cell.label}</div>
          <div className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--color-ink)]">{cell.value}</div>
        </div>
      ))}
    </div>
  );
}
