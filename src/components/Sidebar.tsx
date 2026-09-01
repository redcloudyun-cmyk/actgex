import {
  BookOpen,
  Bot,
  Database,
  Home,
  PlayCircle,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useI18n } from '../i18n';

const ITEMS = [
  { key: 'nav.overview', href: '#overview', icon: Home },
  { key: 'nav.mission', href: '#mission', icon: Sparkles },
  { key: 'nav.tools', href: '#tools', icon: Wrench },
  { key: 'nav.agents', href: '#agents', icon: Bot },
  { key: 'nav.executions', href: '#executions', icon: PlayCircle },
  { key: 'nav.sharedState', href: '#shared-state', icon: Database },
  { key: 'nav.approvals', href: '#approvals', icon: ShieldCheck },
] as const;

export function Sidebar({ docsUrl }: { docsUrl: string }) {
  const { t } = useI18n();

  return (
    <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:flex">
      <nav className="flex-1 space-y-0.5 p-3 pt-4">
        {ITEMS.map(({ key, href, icon: Icon }, i) => (
          <a
            key={key}
            href={href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              i === 0
                ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)] hover:text-[var(--color-ink)]'
            }`}
          >
            <Icon size={17} strokeWidth={2} />
            {t(key)}
          </a>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-[var(--color-border)] p-3">
        <a
          href={docsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)] hover:text-[var(--color-ink)]"
        >
          <BookOpen size={17} strokeWidth={2} />
          {t('nav.docs')}
        </a>
        <a
          href="#overview"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)] hover:text-[var(--color-ink)]"
        >
          <SettingsIcon size={17} strokeWidth={2} />
          {t('nav.settings')}
        </a>
      </div>
    </aside>
  );
}
