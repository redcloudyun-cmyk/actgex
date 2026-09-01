import { ArrowRight, BookOpen } from 'lucide-react';
import { useI18n } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { runFinancialMission } from '../webmcp/mission';
import { HeroDiagram } from './HeroDiagram';

export function Hero({ docsUrl }: { docsUrl: string }) {
  const { t } = useI18n();
  const datasetLoaded = useAppStore((s) => s.datasetLoaded);

  function handleAnalyze() {
    document.getElementById('mission')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    void runFinancialMission();
  }

  return (
    <section
      id="overview"
      className="grid scroll-mt-20 grid-cols-1 items-center gap-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 lg:grid-cols-2"
    >
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
          👋 {t('hero.badge')}
        </span>
        <h1 className="mt-4 text-3xl font-bold leading-tight text-[var(--color-ink)] sm:text-4xl">
          {t('hero.titleLine1')}{' '}
          <span className="text-[var(--color-primary)]">{t('hero.titleAccent')}</span>{' '}
          {t('hero.titleLine2')}
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--color-ink-soft)]">
          {t('hero.subtitle')}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!datasetLoaded}
            onClick={handleAnalyze}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50"
          >
            {t('hero.startBuilding')}
            <ArrowRight size={16} />
          </button>
          <a
            href={docsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-bg)]"
          >
            <BookOpen size={16} />
            {t('hero.viewDocs')}
          </a>
        </div>
      </div>

      <HeroDiagram />
    </section>
  );
}
