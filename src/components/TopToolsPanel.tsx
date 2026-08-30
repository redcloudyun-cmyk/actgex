import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useI18n } from '../i18n';
import { useAppStore } from '../store/useAppStore';

export function TopToolsPanel() {
  const { t } = useI18n();
  const activity = useAppStore(useShallow((s) => s.activity));

  const ranked = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of activity) {
      if (e.tool === 'user_request') continue;
      counts.set(e.tool, (counts.get(e.tool) ?? 0) + 1);
    }
    const total = [...counts.values()].reduce((a, b) => a + b, 0);
    return [...counts.entries()]
      .map(([tool, count]) => ({ tool, count, ratio: total > 0 ? count / total : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [activity]);

  const max = ranked[0]?.count ?? 1;

  return (
    <div id="tools-usage" className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--color-ink)]">{t('panel.topTools')}</h3>
      {ranked.length === 0 && <p className="text-xs text-[var(--color-ink-soft)]">{t('panel.noToolCalls')}</p>}
      <div className="space-y-3">
        {ranked.map((r) => (
          <div key={r.tool}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--color-ink)]">{t(`tool.${r.tool}`)}</span>
              <span className="text-[var(--color-ink-soft)]">
                {r.count} ({(r.ratio * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
              <div
                className="h-full rounded-full bg-[var(--color-primary)]"
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
