import { useShallow } from 'zustand/react/shallow';
import { useI18n } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { summarizeEvent } from '../webmcp/summarize';

const STATUS_TONE: Record<string, string> = {
  REJECTED: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  COMPLETED: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
};

/** A short history of approved/rejected budget changes — distinct from the pending-approval modal, which handles the in-the-moment decision. */
export function RecentDecisions() {
  const { t, locale } = useI18n();
  const { activity, currency } = useAppStore(
    useShallow((s) => ({ activity: s.activity, currency: s.currency })),
  );

  const decisions = activity
    .filter((e) => e.tool === 'set_budget_goal' && (e.status === 'COMPLETED' || e.status === 'REJECTED'))
    .slice()
    .reverse()
    .slice(0, 5);

  return (
    <div>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
        {t('approvals.recentDecisions')}
      </h4>
      {decisions.length === 0 ? (
        <p className="text-xs text-[var(--color-ink-soft)]">{t('approvals.noDecisions')}</p>
      ) : (
        <div className="space-y-1.5">
          {decisions.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs"
            >
              <span className="text-[var(--color-ink)]">{summarizeEvent(event, t, locale, currency)}</span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_TONE[event.status]}`}>
                {t(`agent.status.${event.status}`)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
