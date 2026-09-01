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
import { useEffect, useRef, useState } from 'react';
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

// #agents and #executions live inside the sticky right column, which
// scrolls independently of <main> — their on-screen position barely moves
// as the page scrolls, so they can't be tracked by scroll position at all.
// Everything else follows the normal top-to-bottom reading flow.
const STICKY_COLUMN_IDS = new Set(['agents', 'executions']);
const MAIN_FLOW_IDS = [...ITEMS.map((item) => item.href.slice(1)), SETTINGS_ITEM.href.slice(1)].filter(
  (id) => !STICKY_COLUMN_IDS.has(id),
);

const PIN_COOLDOWN_MS = 700; // long enough for a clicked anchor's smooth-scroll jump to finish

/**
 * Highlights whichever section is currently in view, instead of always
 * pinning "Overview". A section becomes active once it's scrolled up into
 * the top ~25% of the scroll container — not the moment its very top edge
 * touches the header — so the highlight changes as soon as a section is
 * clearly the one on screen, rather than lagging a full section behind.
 * Positions are computed relative to the scroll container's own content
 * (via a getBoundingClientRect diff, not raw `offsetTop`, since `<main>`
 * isn't a CSS-positioned ancestor and `offsetTop` would resolve against
 * whatever positioned ancestor is instead), so they stay correct regardless
 * of current scroll position.
 *
 * `pin(id)` lets a click on a sticky-column link (#agents/#executions, which
 * can't be tracked by scroll position) force that item active immediately;
 * normal scroll-tracking resumes on the next real scroll after the jump.
 */
function useScrollSpy(mainFlowIds: string[]): [string, (id: string) => void] {
  const [activeId, setActiveId] = useState(mainFlowIds[0]);
  const ignoreUntilRef = useRef(0);

  useEffect(() => {
    const scrollRoot = document.querySelector('main');
    if (!scrollRoot) return;

    let ticking = false;
    function computeActive() {
      ticking = false;
      if (Date.now() < ignoreUntilRef.current) return;

      // Scrolled (essentially) to the bottom: always activate the last
      // section, even if it never reaches the activation line — e.g.
      // because a taller sticky sibling column keeps the scrollable area
      // longer than the last section's own position would suggest.
      if (scrollRoot!.scrollTop + scrollRoot!.clientHeight >= scrollRoot!.scrollHeight - 4) {
        setActiveId(mainFlowIds[mainFlowIds.length - 1]);
        return;
      }

      const containerTop = scrollRoot!.getBoundingClientRect().top;
      const activationLine = scrollRoot!.scrollTop + Math.min(220, scrollRoot!.clientHeight * 0.25);

      let best = mainFlowIds[0];
      let bestOffset = -Infinity;
      for (const id of mainFlowIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const sectionTop = el.getBoundingClientRect().top - containerTop + scrollRoot!.scrollTop;
        if (sectionTop <= activationLine && sectionTop > bestOffset) {
          bestOffset = sectionTop;
          best = id;
        }
      }
      setActiveId(best);
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
  }, [mainFlowIds]);

  function pin(id: string) {
    setActiveId(id);
    ignoreUntilRef.current = Date.now() + PIN_COOLDOWN_MS;
  }

  return [activeId, pin];
}

export function Sidebar({ docsUrl }: { docsUrl: string }) {
  const { t } = useI18n();
  const [activeId, pin] = useScrollSpy(MAIN_FLOW_IDS);

  return (
    <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:flex">
      <nav className="flex-1 space-y-0.5 p-3 pt-4">
        {ITEMS.map(({ key, href, icon: Icon }) => {
          const id = href.slice(1);
          return (
            <a
              key={key}
              href={href}
              onClick={STICKY_COLUMN_IDS.has(id) ? () => pin(id) : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeId === id
                  ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                  : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)] hover:text-[var(--color-ink)]'
              }`}
            >
              <Icon size={17} strokeWidth={2} />
              {t(key)}
            </a>
          );
        })}
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
