import { categoryLabelKey } from '../data/categories';
import { useI18n } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../lib/format';

export function ApprovalDialog() {
  const { t, locale } = useI18n();
  const pendingApproval = useAppStore((s) => s.pendingApproval);
  const currency = useAppStore((s) => s.currency);
  const respondToApproval = useAppStore((s) => s.respondToApproval);

  if (!pendingApproval) return null;

  const categoryLabel = t(categoryLabelKey(pendingApproval.category));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl">
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-warning-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-warning)]">
          {t('approval.requested')}
        </div>
        <h3 className="mb-3 text-base font-semibold text-[var(--color-ink)]">
          {t('approval.title', { category: categoryLabel })}
        </h3>

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
