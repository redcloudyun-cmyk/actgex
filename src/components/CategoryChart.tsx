import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CATEGORY_COLORS, categoryLabelKey } from '../data/categories';
import { useI18n } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { filterTransactions, totalsByCategory } from '../lib/aggregate';
import { formatCurrency } from '../lib/format';
import type { CategoryId } from '../data/types';

export function CategoryChart() {
  const { t, locale } = useI18n();
  const { transactions, filters, currency, setFilters } = useAppStore(
    useShallow((s) => ({
      transactions: s.transactions,
      filters: s.filters,
      currency: s.currency,
      setFilters: s.setFilters,
    })),
  );

  const data = useMemo(() => {
    const filtered = filterTransactions(transactions, { ...filters, category: 'ALL' });
    return totalsByCategory(filtered).map((c) => ({
      ...c,
      label: t(categoryLabelKey(c.category)),
    }));
  }, [transactions, filters, t]);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--color-ink)]">{t('chart.byCategory')}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              width={92}
              tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value), locale, currency), t('chart.amount')]}
              contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: 'var(--color-border)' }}
            />
            <Bar
              dataKey="total"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              onClick={(entry) => {
                const cat = (entry as unknown as { category: CategoryId }).category;
                setFilters({ category: filters.category === cat ? 'ALL' : cat });
              }}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={CATEGORY_COLORS[entry.category]}
                  fillOpacity={filters.category === 'ALL' || filters.category === entry.category ? 1 : 0.25}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
