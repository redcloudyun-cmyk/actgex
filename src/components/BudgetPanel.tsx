import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { CATEGORY_COLORS, categoryLabelKey } from '../data/categories';
import { useI18n } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { totalsByCategory } from '../lib/aggregate';
import { calendarMonthRange } from '../lib/dates';
import { formatCurrency } from '../lib/format';
import type { CategoryId } from '../data/types';

export function BudgetPanel() {
  const { t, locale } = useI18n();
  const { transactions, budgets, currency, setBudget } = useAppStore(
    useShallow((s) => ({
      transactions: s.transactions,
      budgets: s.budgets,
      currency: s.currency,
      setBudget: s.setBudget,
    })),
  );
  const [editing, setEditing] = useState<CategoryId | null>(null);
  const [draft, setDraft] = useState('');

  const rows = useMemo(() => {
    const [start, end] = calendarMonthRange(0);
    const spend = totalsByCategory(transactions.filter((tx) => tx.date >= start && tx.date <= end));
    const spendMap = new Map(spend.map((s) => [s.category, s.total]));
    const categories = new Set<CategoryId>([...spendMap.keys(), ...(Object.keys(budgets) as CategoryId[])]);
    return [...categories]
      .map((category) => ({
        category,
        spend: spendMap.get(category) ?? 0,
        limit: budgets[category],
      }))
      .sort((a, b) => b.spend - a.spend);
  }, [transactions, budgets]);

  function startEdit(category: CategoryId, current?: number) {
    setEditing(category);
    setDraft(current ? String(current) : '');
  }

  function save(category: CategoryId) {
    const value = Number(draft);
    if (value > 0) setBudget(category, value);
    setEditing(null);
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--color-ink)]">{t('budget.panelTitle')}</h3>
      {rows.length === 0 && <p className="text-xs text-[var(--color-ink-soft)]">{t('kpi.noBudgetSet')}</p>}
      <div className="space-y-3">
        {rows.map((row) => {
          const ratio = row.limit ? Math.min(1, row.spend / row.limit) : 0;
          const over = row.limit !== undefined && row.spend > row.limit;
          return (
            <div key={row.category}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-[var(--color-ink)]">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: CATEGORY_COLORS[row.category] }}
                  />
                  {t(categoryLabelKey(row.category))}
                </span>
                <span className="text-[var(--color-ink-soft)]">
                  {formatCurrency(row.spend, locale, currency)}
                  {row.limit !== undefined && ` / ${formatCurrency(row.limit, locale, currency)}`}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${ratio * 100}%`,
                    background: over ? 'var(--color-danger)' : CATEGORY_COLORS[row.category],
                  }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className={over ? 'font-medium text-[var(--color-danger)]' : 'text-[var(--color-ink-soft)]'}>
                  {row.limit !== undefined
                    ? over
                      ? t('budget.over')
                      : `${t('budget.remaining')}: ${formatCurrency(row.limit - row.spend, locale, currency)}`
                    : t('budget.notSet')}
                </span>
                {editing === row.category ? (
                  <span className="flex items-center gap-1">
                    <input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && save(row.category)}
                      className="w-20 rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[11px] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => save(row.category)}
                      className="text-[var(--color-primary)]"
                    >
                      {t('budget.save')}
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(row.category, row.limit)}
                    className="text-[var(--color-primary)]"
                  >
                    {row.limit !== undefined ? t('budget.edit') : t('budget.setLimit')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
