import { categoryLabelKey } from '../data/categories';
import { useI18n, type Locale } from '../i18n';
import { useAppStore, type BudgetImpact } from '../store/useAppStore';
import { formatCurrency, formatPercent } from '../lib/format';

export function ApprovalDialog() {
  const { t, locale } = useI18n();
  const pendingApproval = useAppStore((s) => s.pendingApproval);
  const currency = useAppStore((s) => s.currency);
  const respondToApproval = useAppStore((s) => s.respondToApproval);

  if (!pendingApproval) return null;

  const categoryLabel = t(categoryLabelKey(pendingApproval.category));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl">
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-warning-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-warning)]">
          {t('approval.humanApprovalRequired')}
        </div>
        <h3 className="mb-1 text-base font-semibold text-[var(--color-ink)]">
          {t('approval.title', { category: categoryLabel })}
        </h3>
        <p className="mb-3 text-xs text-[var(--color-ink-soft)]">{t('approval.impactExplain')}</p>

        {pendingApproval.impact ? (
          <ImpactTable
            categoryLabel={categoryLabel}
            currentLimit={pendingApproval.currentLimit}
            newLimit={pendingApproval.newLimit}
            impact={pendingApproval.impact}
            locale={locale}
            currency={currency}
          />
        ) : (
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-[var(--color-bg)] p-3">
              <div className="text-[11px] text-[var(--color-ink-soft)]">{t('approval.currentBudget')}</div>
              <div className="text-lg font-semibold text-[var(--color-ink)]">
                {pendingApproval.currentLimit !== undefined
                  ? formatCurrency(pendingApproval.currentLimit, locale, currency)
                  : t('budget.notSet')}
              </div>
            </div>
            <div className="rounded-lg bg-[var(--color-primary-soft)] p-3">
              <div className="text-[11px] text-[var(--color-primary)]">{t('approval.newBudget')}</div>
              <div className="text-lg font-semibold text-[var(--color-primary)]">
                {formatCurrency(pendingApproval.newLimit, locale, currency)}
              </div>
            </div>
          </div>
        )}

        <p className="mb-4 text-xs text-[var(--color-ink-soft)]">{t('approval.warning')}</p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => respondToApproval(false)}
            className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)]"
          >
            {t('approval.cancel')}
          </button>
          <button
            type="button"
            onClick={() => respondToApproval(true)}
            className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white hover:brightness-110"
          >
            {t('approval.approve')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImpactTable({
  categoryLabel,
  currentLimit,
  newLimit,
  impact,
  locale,
  currency,
}: {
  categoryLabel: string;
  currentLimit: number | undefined;
  newLimit: number;
  impact: BudgetImpact;
  locale: Locale;
  currency: string;
}) {
  const { t } = useI18n();
  const money = (v: number | null) => (v === null ? '—' : formatCurrency(v, locale, currency));
  const pct = (v: number | null) => (v === null ? '—' : formatPercent(v, locale));

  const rows = [
    {
      label: t('approval.impact.budget', { category: categoryLabel }),
      before: currentLimit !== undefined ? formatCurrency(currentLimit, locale, currency) : t('budget.notSet'),
      after: formatCurrency(newLimit, locale, currency),
    },
    {
      label: t('approval.impact.monthlySpend'),
      before: money(impact.currentMonthlySpend),
      after: money(impact.projectedMonthlySpend),
    },
    {
      label: t('approval.impact.savings'),
      before: money(impact.currentSavings),
      after: money(impact.projectedSavings),
    },
    {
      label: t('approval.impact.savingsRate'),
      before: pct(impact.currentSavingsRate),
      after: pct(impact.projectedSavingsRate),
    },
  ];

  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-[var(--color-border)]">
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 bg-[var(--color-bg)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
        <span />
        <span className="text-right">{t('approval.impact.current')}</span>
        <span className="text-right">{t('approval.impact.proposed')}</span>
      </div>
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[1fr_auto_auto] gap-2 border-t border-[var(--color-border)] px-3 py-1.5 text-xs">
          <span className="text-[var(--color-ink-soft)]">{row.label}</span>
          <span className="text-right text-[var(--color-ink)]">{row.before}</span>
          <span className="text-right font-medium text-[var(--color-primary)]">{row.after}</span>
        </div>
      ))}
    </div>
  );
}
