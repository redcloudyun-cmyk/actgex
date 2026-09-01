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
import { useEffect, useState } from 'react';
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

const SETTINGS_ITEM = { key: 'nav.settings', href: '#settings', icon: SettingsIcon } as const;

const OBSERVED_IDS = [...ITEMS.map((item) => item.href.slice(1)), SETTINGS_ITEM.href.slice(1)];

const ANCHOR_OFFSET = 96; // px from the top of the scroll container, below the sticky header

/**
 * Highlights whichever section is currently in view, instead of always
 * pinning "Overview". Picks whichever observed section's top is closest to
 * (but still above) the anchor line — not "walk in document order, stop at
 * the first that hasn't crossed yet", because a couple of these ids
 * (#agents, #executions) live inside the sticky right column, which scrolls
 * independently of <main>; their position barely changes as the page
 * scrolls, so a sequential/order-dependent check gets permanently stuck on
 * whichever left-column section came right before them. Order-independent
 * "closest qualifying top" sidesteps that entirely, and also naturally
 * activates the last section once it's scrolled into place (no bottom-side
 * margin to fail to cross, unlike an IntersectionObserver rootMargin).
 */
function useScrollSpy(ids: string[]): string {
  const [activeId, setActiveId] = useState(ids[0]);

  useEffect(() => {
    const scrollRoot = document.querySelector('main');
    if (!scrollRoot) return;

    let ticking = false;
    function computeActive() {
      // Scrolled (essentially) to the bottom: always activate the last
      // section, even if it never reaches the anchor line — e.g. because a
      // taller sticky sibling column keeps the scrollable area longer than
      // the last section's own position would otherwise suggest.
      if (scrollRoot!.scrollTop + scrollRoot!.clientHeight >= scrollRoot!.scrollHeight - 4) {
        setActiveId(ids[ids.length - 1]);
        ticking = false;
        return;
      }

      let best = ids[0];
      let bestTop = -Infinity;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= ANCHOR_OFFSET && top > bestTop) {
          bestTop = top;
          best = id;
        }
      }
      setActiveId(best);
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(computeActive);
    }

    computeActive();
    scrollRoot.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      scrollRoot.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ids]);

  return activeId;
}

export function Sidebar({ docsUrl }: { docsUrl: string }) {
  const { t } = useI18n();
  const activeId = useScrollSpy(OBSERVED_IDS);

  return (
    <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:flex">
      <nav className="flex-1 space-y-0.5 p-3 pt-4">
        {ITEMS.map(({ key, href, icon: Icon }) => (
          <a
            key={key}
            href={href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeId === href.slice(1)
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
          href={SETTINGS_ITEM.href}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
            activeId === SETTINGS_ITEM.href.slice(1)
              ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
              : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)] hover:text-[var(--color-ink)]'
          }`}
        >
          <SettingsIcon size={17} strokeWidth={2} />
          {t(SETTINGS_ITEM.key)}
        </a>
      </div>
    </aside>
  );
}
