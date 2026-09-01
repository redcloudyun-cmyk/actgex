import { useI18n } from '../i18n';
import { useAppStore } from '../store/useAppStore';

export function SettingsPanel() {
  const { t, locale, setLocale } = useI18n();
  const agentAuthority = useAppStore((s) => s.agentAuthority);
  const setAgentAuthority = useAppStore((s) => s.setAgentAuthority);

  return (
    <section
      id="settings"
      className="scroll-mt-20 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">{t('settings.title')}</h3>
      <p className="mb-4 max-w-2xl text-[11px] text-[var(--color-ink-soft)]">{t('settings.subtitle')}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 text-xs font-medium text-[var(--color-ink)]">{t('settings.language')}</div>
          <div className="inline-flex overflow-hidden rounded-md border border-[var(--color-border)] text-xs font-medium">
            <button
              type="button"
              onClick={() => setLocale('en')}
              className={`px-3 py-1.5 ${locale === 'en' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-ink-soft)]'}`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLocale('ko')}
              className={`px-3 py-1.5 ${locale === 'ko' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-ink-soft)]'}`}
            >
              한국어
            </button>
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-medium text-[var(--color-ink)]">{t('settings.authority')}</div>
          <div className="inline-flex overflow-hidden rounded-md border border-[var(--color-border)] text-xs font-medium">
            <button
              type="button"
              onClick={() => setAgentAuthority('observe')}
              className={`px-3 py-1.5 ${agentAuthority === 'observe' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-ink-soft)]'}`}
            >
              {t('authority.observe')}
            </button>
            <button
              type="button"
              onClick={() => setAgentAuthority('assist')}
              className={`px-3 py-1.5 ${agentAuthority === 'assist' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-ink-soft)]'}`}
            >
              {t('authority.assist')}
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-[var(--color-ink-soft)]">
            {t(agentAuthority === 'observe' ? 'authority.observeHint' : 'authority.assistHint')}
          </p>
        </div>
      </div>
    </section>
  );
}
