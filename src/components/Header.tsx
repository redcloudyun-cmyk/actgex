import { Bell, Loader2, Plus, Search, User } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import wordmark from '../assets/actgex-wordmark.png';
import { LOCALE_TO_CURRENCY, REGION_TO_LOCALE, useI18n, type Locale } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { generateDemoData } from '../data/demoData';
import { loadTransactions } from '../db/duckdb';
import { formatNumber } from '../lib/format';
import { useOnClickOutside } from '../lib/useOnClickOutside';
import type { Region } from '../data/types';
import type { WebMcpStatus } from '../webmcp/status';

export function Header({ webmcpStatus }: { webmcpStatus: WebMcpStatus }) {
  const { t, locale, setLocale } = useI18n();
  const { datasetLoaded, transactions, loadDataset, dbReady, filters, setFilters, pendingApproval } = useAppStore(
    useShallow((s) => ({
      datasetLoaded: s.datasetLoaded,
      transactions: s.transactions,
      loadDataset: s.loadDataset,
      dbReady: s.dbReady,
      filters: s.filters,
      setFilters: s.setFilters,
      pendingApproval: s.pendingApproval,
    })),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [busyRegion, setBusyRegion] = useState<Region | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(menuRef, () => setMenuOpen(false));

  async function handleLoadDemo(demoRegion: Region) {
    setBusyRegion(demoRegion);
    setMenuOpen(false);
    try {
      const data = generateDemoData(demoRegion);
      await loadTransactions(data);
      loadDataset(demoRegion, LOCALE_TO_CURRENCY[REGION_TO_LOCALE[demoRegion]], data);
      setLocale(REGION_TO_LOCALE[demoRegion] as Locale);
    } finally {
      setBusyRegion(null);
    }
  }

  return (
    <header className="z-20 flex h-16 shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:px-5">
      <img src={wordmark} alt="ActGeX" className="h-6 w-auto shrink-0 object-contain" />

      <div className="hidden items-center gap-2 pl-2 text-[11px] sm:flex">
        <StatusPill
          tone={dbReady ? 'neutral' : 'warning'}
          icon={dbReady ? undefined : <Loader2 size={11} className="animate-spin" />}
          label={
            !dbReady
              ? t('status.dbInitializing')
              : datasetLoaded
                ? t('status.datasetLoaded', { count: formatNumber(transactions.length, locale) })
                : t('status.noDataset')
          }
        />
        <StatusPill
          tone={
            webmcpStatus === 'CONNECTED'
              ? 'success'
              : webmcpStatus === 'FAILED'
                ? 'danger'
                : webmcpStatus === 'REGISTERING'
                  ? 'warning'
                  : 'neutral'
          }
          label={
            webmcpStatus === 'CONNECTED'
              ? t('status.webmcpConnected')
              : webmcpStatus === 'REGISTERING'
                ? t('status.webmcpRegistering')
                : webmcpStatus === 'FAILED'
                  ? t('status.webmcpFailed')
                  : t('status.webmcpUnavailable')
          }
          dot
        />
      </div>

      <div className="relative ml-2 hidden max-w-sm flex-1 md:block">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-soft)]" />
        <input
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          placeholder={t('nav.search')}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] py-2 pl-9 pr-3 text-xs outline-none focus:border-[var(--color-primary)]"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            disabled={!dbReady}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-50"
          >
            <Plus size={14} strokeWidth={2.5} />
            {busyRegion ? t('common.loading') : t('nav.demoData')}
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-xs hover:bg-[var(--color-bg)]"
                onClick={() => handleLoadDemo('US')}
              >
                🇺🇸 {t('nav.demoDataUS')}
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-xs hover:bg-[var(--color-bg)]"
                onClick={() => handleLoadDemo('KR')}
              >
                🇰🇷 {t('nav.demoDataKR')}
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          title={t('nav.uploadSoon')}
          disabled
          className="hidden rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-ink-soft)] opacity-60 sm:block"
        >
          {t('nav.uploadCsv')}
        </button>

        <div className="hidden overflow-hidden rounded-md border border-[var(--color-border)] text-xs font-medium sm:flex">
          <button
            type="button"
            onClick={() => setLocale('en')}
            className={`px-2.5 py-2 ${locale === 'en' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-ink-soft)]'}`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLocale('ko')}
            className={`px-2.5 py-2 ${locale === 'ko' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-ink-soft)]'}`}
          >
            한국어
          </button>
        </div>

        <button
          type="button"
          className="relative hidden h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-ink-soft)] sm:flex"
          title={pendingApproval ? t('approval.waiting') : t('agent.activityTitle')}
        >
          <Bell size={16} />
          {pendingApproval && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--color-danger)]" />
          )}
        </button>

        <div
          className="hidden h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-ink-soft)] sm:flex"
          title={`${t('header.guestSession')} · ${t('header.noAuth')}`}
        >
          <User size={16} />
        </div>
      </div>
    </header>
  );
}

function StatusPill({
  label,
  tone,
  dot,
  icon,
}: {
  label: string;
  tone: 'neutral' | 'success' | 'warning' | 'danger';
  dot?: boolean;
  icon?: ReactNode;
}) {
  const toneClasses =
    tone === 'success'
      ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]'
      : tone === 'warning'
        ? 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]'
        : tone === 'danger'
          ? 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
          : 'bg-[var(--color-bg)] text-[var(--color-ink-soft)]';
  const dotClasses =
    tone === 'success'
      ? 'bg-[var(--color-success)]'
      : tone === 'danger'
        ? 'bg-[var(--color-danger)]'
        : tone === 'warning'
          ? 'bg-[var(--color-warning)]'
          : 'bg-[var(--color-ink-soft)]';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${toneClasses}`}>
      {icon}
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotClasses}`} />}
      {label}
    </span>
  );
}
