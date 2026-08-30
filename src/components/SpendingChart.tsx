import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useI18n } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { filterTransactions, totalsByDay } from '../lib/aggregate';
import { formatCurrency, formatDay } from '../lib/format';

export function SpendingChart() {
  const { t, locale } = useI18n();
  const { transactions, filters, currency } = useAppStore(
    useShallow((s) => ({ transactions: s.transactions, filters: s.filters, currency: s.currency })),
  );

  const data = useMemo(() => {
    const filtered = filterTransactions(transactions, filters);
    return totalsByDay(filtered).map((d) => ({ ...d, label: formatDay(d.date, locale) }));
  }, [transactions, filters, locale]);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--color-ink)]">{t('chart.spendingOverTime')}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickLine={false}
              minTickGap={32}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(v) => formatCurrency(v as number, locale, currency).replace(/\.00$/, '')}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value), locale, currency), t('chart.amount')]}
              contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: 'var(--color-border)' }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="var(--color-primary)"
              fill="url(#spendFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
