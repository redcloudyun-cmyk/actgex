import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { CATEGORY_IDS, type CategoryId } from '../data/types';
import { categoryLabelKey, CATEGORY_COLORS } from '../data/categories';
import { useI18n } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { filterTransactions } from '../lib/aggregate';
import { formatCurrency, formatDate } from '../lib/format';

type SortKey = 'date' | 'amount';

export function TransactionTable() {
  const { t, locale } = useI18n();
  const { transactions, filters, currency, setFilters, clearFilters } = useAppStore(
    useShallow((s) => ({
      transactions: s.transactions,
      filters: s.filters,
      currency: s.currency,
      setFilters: s.setFilters,
      clearFilters: s.clearFilters,
    })),
  );
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const rows = useMemo(() => {
    const filtered = filterTransactions(transactions, filters);
    return [...filtered].sort((a, b) => {
      const cmp = sortKey === 'date' ? a.date.localeCompare(b.date) : a.amount - b.amount;
      return cmp * sortDir;
    });
  }, [transactions, filters, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(-1);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="mr-auto text-sm font-semibold text-[var(--color-ink)]">{t('table.title')}</h3>
        <input
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          placeholder={t('table.search')}
          className="rounded-md border border-[var(--color-border)] px-2 py-1.5 text-xs outline-none focus:border-[var(--color-primary)]"
        />
        <select
          value={filters.category}
          onChange={(e) => setFilters({ category: e.target.value as CategoryId | 'ALL' })}
          className="rounded-md border border-[var(--color-border)] px-2 py-1.5 text-xs outline-none focus:border-[var(--color-primary)]"
        >
          <option value="ALL">{t('table.allCategories')}</option>
          {CATEGORY_IDS.map((c) => (
            <option key={c} value={c}>
              {t(categoryLabelKey(c))}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.startDate ?? ''}
          onChange={(e) => setFilters({ startDate: e.target.value || null })}
          className="rounded-md border border-[var(--color-border)] px-2 py-1.5 text-xs outline-none focus:border-[var(--color-primary)]"
        />
        <span className="text-xs text-[var(--color-ink-soft)]">–</span>
        <input
          type="date"
          value={filters.endDate ?? ''}
          onChange={(e) => setFilters({ endDate: e.target.value || null })}
          className="rounded-md border border-[var(--color-border)] px-2 py-1.5 text-xs outline-none focus:border-[var(--color-primary)]"
        />
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)]"
        >
          {t('table.clear')}
        </button>
      </div>

      <div className="max-h-80 overflow-auto rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-[var(--color-bg)] text-[var(--color-ink-soft)]">
            <tr>
              <th className="cursor-pointer select-none px-3 py-2 font-medium" onClick={() => toggleSort('date')}>
                {t('table.date')} {sortKey === 'date' ? (sortDir === 1 ? '↑' : '↓') : ''}
              </th>
              <th className="px-3 py-2 font-medium">{t('table.merchant')}</th>
              <th className="px-3 py-2 font-medium">{t('table.category')}</th>
              <th
                className="cursor-pointer select-none px-3 py-2 text-right font-medium"
                onClick={() => toggleSort('amount')}
              >
                {t('table.amount')} {sortKey === 'amount' ? (sortDir === 1 ? '↑' : '↓') : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-[var(--color-ink-soft)]">
                  {t('table.noResults')}
                </td>
              </tr>
            )}
            {rows.slice(0, 150).map((tx) => (
              <tr key={tx.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-bg)]">
                <td className="px-3 py-2 tabular-nums text-[var(--color-ink-soft)]">{formatDate(tx.date, locale)}</td>
                <td className="px-3 py-2 text-[var(--color-ink)]">{tx.merchant}</td>
                <td className="px-3 py-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: `${CATEGORY_COLORS[tx.category]}1a`, color: CATEGORY_COLORS[tx.category] }}
                  >
                    {t(categoryLabelKey(tx.category))}
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums font-medium text-[var(--color-ink)]">
                  {formatCurrency(tx.amount, locale, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-[11px] text-[var(--color-ink-soft)]">
        {t('table.rowsShown', { shown: Math.min(rows.length, 150), total: rows.length })}
      </div>
    </div>
  );
}
