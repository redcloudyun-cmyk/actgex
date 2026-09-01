import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { LOCALE_TO_INTL, useI18n } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { summarizeEvent } from '../webmcp/summarize';
import type { ActivityEvent, ToolStatus } from '../data/types';

type ActivityFilter = 'all' | 'human' | 'agent' | 'approved' | 'rejected';

const FILTERS: ActivityFilter[] = ['all', 'human', 'agent', 'approved', 'rejected'];

function matchesFilter(event: ActivityEvent, filter: ActivityFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'human':
      return event.actor === 'user';
    case 'agent':
      return event.actor === 'agent';
    case 'approved':
      return event.status === 'COMPLETED' && event.tool === 'set_budget_goal';
    case 'rejected':
      return event.status === 'REJECTED';
    default:
      return true;
  }
}

const STATUS_TONE: Record<ToolStatus, string> = {
  PENDING: 'bg-[var(--color-bg)] text-[var(--color-ink-soft)]',
  WAITING_APPROVAL: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
  APPROVED: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  REJECTED: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
  RUNNING: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
  COMPLETED: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  FAILED: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
};

function formatTime(ts: number, intlLocale: string) {
  return new Intl.DateTimeFormat(intlLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(
    new Date(ts),
  );
}

const SOURCE_KEY: Record<ActivityEvent['source'], string> = {
  webmcp: 'agent.source.webmcp',
  console: 'agent.source.console',
  seed: 'agent.source.seed',
};

function EventRow({ event }: { event: ActivityEvent }) {
  const { t, locale } = useI18n();
  const currency = useAppStore((s) => s.currency);
  const summary = summarizeEvent(event, t, locale, currency);

  if (event.tool === 'user_request') {
    return (
      <div className="flex gap-2 text-xs">
        <span className="mt-0.5 text-[var(--color-ink-soft)]">{formatTime(event.timestamp, LOCALE_TO_INTL[locale])}</span>
        <div className="flex-1 rounded-lg bg-[var(--color-bg)] px-3 py-2 text-[var(--color-ink)]">
          <span className="mr-1 font-medium text-[var(--color-ink-soft)]">{t('agent.userRequest')}:</span>
          “{summary}”
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 text-xs">
      <span className="mt-0.5 shrink-0 text-[var(--color-ink-soft)]">
        {formatTime(event.timestamp, LOCALE_TO_INTL[locale])}
      </span>
      <div className="flex-1 rounded-lg border border-[var(--color-border)] px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-[var(--color-ink)]">
            {event.actor === 'agent' ? '🤖' : '🧑'}{' '}
            {t(event.actor === 'agent' ? 'agent.toolCall' : 'human.toolCall', { tool: t(`tool.${event.tool}`) })}
          </span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_TONE[event.status]}`}>
            {t(`agent.status.${event.status}`)}
          </span>
        </div>
        {summary && <div className="mt-1 text-[var(--color-ink-soft)]">{summary}</div>}
        <div className="mt-1 text-[10px] text-[var(--color-ink-soft)]/70">{t(SOURCE_KEY[event.source])}</div>
      </div>
    </div>
  );
}

export function ActivityTimeline() {
  const { t } = useI18n();
  const activity = useAppStore(useShallow((s) => s.activity));
  const [filter, setFilter] = useState<ActivityFilter>('all');

  const filtered = activity.filter((e) => matchesFilter(e, filter));

  return (
    <div className="flex h-full flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="mb-2 text-sm font-semibold text-[var(--color-ink)]">{t('agent.activityTitle')}</h3>
      <div className="mb-3 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition ${
              filter === f
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-bg)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
            }`}
          >
            {t(`activity.filter.${f}`)}
          </button>
        ))}
      </div>
      <div className="flex-1 space-y-2 overflow-auto">
        {filtered.length === 0 && (
          <p className="text-xs text-[var(--color-ink-soft)]">
            {activity.length === 0 ? t('agent.activityEmpty') : t('activity.filterEmpty')}
          </p>
        )}
        {[...filtered].reverse().map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
