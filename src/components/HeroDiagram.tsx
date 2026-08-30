import mark from '../assets/actgex-mark.png';
import { useI18n } from '../i18n';

const NODES = [
  { key: 'hero.diagram.webCapabilities', x: 14, y: 16 },
  { key: 'hero.diagram.agentActions', x: 86, y: 16 },
  { key: 'hero.diagram.sharedState', x: 14, y: 86 },
  { key: 'hero.diagram.humanApproval', x: 86, y: 86 },
] as const;

export function HeroDiagram() {
  const { t } = useI18n();

  return (
    <div className="relative mx-auto h-[300px] w-full max-w-[440px]">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {NODES.map((n) => (
          <line
            key={n.key}
            x1={50}
            y1={50}
            x2={n.x}
            y2={n.y}
            stroke="var(--color-primary)"
            strokeOpacity={0.35}
            strokeWidth={0.5}
            strokeDasharray="2 2"
          />
        ))}
      </svg>

      <div
        className="absolute flex h-24 w-24 rotate-45 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg"
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%) rotate(45deg)' }}
      >
        <img src={mark} alt="" className="h-14 w-14 -rotate-45 object-contain" />
      </div>
      <div
        className="absolute whitespace-nowrap rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-ink-soft)] shadow-sm"
        style={{ left: '50%', top: '68%', transform: 'translate(-50%, 0)' }}
      >
        {t('hero.diagram.runtime')}
      </div>

      {NODES.map((n) => (
        <div
          key={n.key}
          className="absolute w-32 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-center text-xs font-semibold text-[var(--color-ink)] shadow-sm"
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
        >
          {t(n.key)}
        </div>
      ))}
    </div>
  );
}
