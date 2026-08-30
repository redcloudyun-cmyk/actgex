import { Lock, Unlock } from 'lucide-react';
import { useI18n } from '../i18n';
import { TOOL_DEFS } from '../webmcp/toolDefs';

export function ToolsReference() {
  const { t } = useI18n();

  return (
    <section
      id="tools"
      className="scroll-mt-20 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">{t('tools.sectionTitle')}</h3>
      <p className="mb-3 max-w-2xl text-[11px] text-[var(--color-ink-soft)]">{t('tools.sectionSubtitle')}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {TOOL_DEFS.map((tool) => (
          <div key={tool.name} className="rounded-lg border border-[var(--color-border)] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[var(--color-ink)]">{t(`tool.${tool.name}`)}</span>
              {tool.readOnly ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-success-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-success)]">
                  <Lock size={10} /> {t('tools.readOnly')}
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-warning-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-warning)]">
                  <Unlock size={10} /> {t('tools.mutating')}
                </span>
              )}
            </div>
            <p className="mt-1 font-mono text-[10px] text-[var(--color-ink-soft)]">{tool.name}</p>
            <p className="mt-1 text-[11px] leading-snug text-[var(--color-ink-soft)]">
              {t(`tool.${tool.name}.desc`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
