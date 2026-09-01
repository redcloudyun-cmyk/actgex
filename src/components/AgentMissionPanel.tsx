import { Check, Loader2, Sparkles } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { categoryLabelKey } from '../data/categories';
import { useI18n } from '../i18n';
import { useAppStore, type MissionResult, type MissionStepId } from '../store/useAppStore';
import { formatCurrency, formatPercent } from '../lib/format';
import { approveMissionRecommendation, runFinancialMission } from '../webmcp/mission';

const STEP_LABEL_KEYS: Record<MissionStepId, string> = {
  load: 'mission.step.load',
  summarize: 'mission.step.summarize',
  compare: 'mission.step.compare',
  flag: 'mission.step.flag',
  recommend: 'mission.step.recommend',
  simulate: 'mission.step.simulate',
};

export function AgentMissionPanel() {
  const { t, locale } = useI18n();
  const { datasetLoaded, mission, currency, agentAuthority } = useAppStore(
    useShallow((s) => ({
      datasetLoaded: s.datasetLoaded,
      mission: s.mission,
      currency: s.currency,
      agentAuthority: s.agentAuthority,
    })),
  );

  const busy = mission.status === 'running';

  return (
    <section
      id="mission"
      className="scroll-mt-20 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">{t('mission.title')}</h2>
          <p className="mt-0.5 max-w-lg text-[11px] text-[var(--color-ink-soft)]">{t('mission.subtitle')}</p>
        </div>
        <button
          type="button"
          disabled={!datasetLoaded || busy}
          onClick={() => runFinancialMission()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {busy ? t('mission.analyzing') : t('mission.analyzeCta')}
        </button>
      </div>

      {mission.status === 'idle' && <p className="mt-4 text-xs text-[var(--color-ink-soft)]">{t('mission.idleHint')}</p>}

      {(mission.status === 'running' || mission.status === 'ready') && (
        <ol className="mt-4 space-y-1.5">
          {mission.steps.map((step) => (
            <li key={step.id} className="flex items-center gap-2 text-xs">
              {step.status === 'done' ? (
                <Check size={14} className="shrink-0 text-[var(--color-success)]" />
              ) : step.status === 'running' ? (
                <Loader2 size={14} className="shrink-0 animate-spin text-[var(--color-primary)]" />
              ) : (
                <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-[var(--color-border)]" />
              )}
              <span className={step.status === 'pending' ? 'text-[var(--color-ink-soft)]' : 'text-[var(--color-ink)]'}>
                {t(STEP_LABEL_KEYS[step.id])}
              </span>
            </li>
          ))}
        </ol>
      )}

      {mission.status === 'empty' && <p className="mt-4 text-xs text-[var(--color-ink-soft)]">{t('mission.empty')}</p>}

      {mission.status === 'ready' && mission.result && (
        <RecommendationCard result={mission.result} currency={currency} locale={locale} authority={agentAuthority} />
      )}
    </section>
  );
}

function RecommendationCard({
  result,
  currency,
  locale,
  authority,
}: {
  result: MissionResult;
  currency: string;
  locale: 'en' | 'ko';
  authority: 'observe' | 'assist';
}) {
  const { t } = useI18n();
  const categoryLabel = t(categoryLabelKey(result.category));
  const percentAbove = formatPercent(result.flagRatio - 1, locale);
  const monthlySpendDelta = result.currentMonthlyAvg - result.targetMonthlySpend;

  return (
    <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
      <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-primary)]">
        {t('mission.recommendationBadge')}
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">
        {t('mission.recommendationTitle', {
          category: categoryLabel,
          current: formatCurrency(result.currentBudget ?? result.currentMonthlyAvg, locale, currency),
          proposed: formatCurrency(result.recommendedLimit, locale, currency),
        })}
      </h3>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            {t('mission.why')}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-soft)]">
            {t('mission.whyText', { category: categoryLabel, percent: percentAbove })}
          </p>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">
            {t('mission.impact')}
          </div>
          <ul className="mt-1 space-y-0.5 text-xs text-[var(--color-ink-soft)]">
            <li>{t('mission.impactSpend', { amount: formatCurrency(monthlySpendDelta, locale, currency) })}</li>
            <li>{t('mission.impactSavings', { amount: formatCurrency(result.estimatedSavingsPerMonth, locale, currency) })}</li>
          </ul>
        </div>
      </div>

      {authority === 'observe' ? (
        <p className="mt-4 text-[11px] text-[var(--color-warning)]">{t('mission.observeBlocked')}</p>
      ) : (
        <button
          type="button"
          onClick={() => approveMissionRecommendation()}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110"
        >
          {t('mission.reviewCta')}
        </button>
      )}
    </div>
  );
}
