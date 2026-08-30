import { useState } from 'react';
import { useI18n } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { runFreeText, runSuggestion, SUGGESTIONS } from '../webmcp/agentConsole';

export function AgentConsole() {
  const { t } = useI18n();
  const datasetLoaded = useAppStore((s) => s.datasetLoaded);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [noMatch, setNoMatch] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setNoMatch(false);
    try {
      const matched = await runFreeText(text);
      if (!matched) setNoMatch(true);
      setInput('');
    } finally {
      setBusy(false);
    }
  }

  async function clickSuggestion(id: (typeof SUGGESTIONS)[number]['id'], text: string) {
    if (busy) return;
    setBusy(true);
    setNoMatch(false);
    try {
      await runSuggestion(id, text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">{t('agent.consoleTitle')}</h3>
      <p className="mb-3 text-[11px] text-[var(--color-ink-soft)]">{t('agent.consoleHint')}</p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => {
          const text = t(s.key);
          return (
            <button
              key={s.id}
              type="button"
              disabled={!datasetLoaded || busy}
              onClick={() => clickSuggestion(s.id, text)}
              className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[11px] text-[var(--color-ink-soft)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-40"
            >
              {text}
            </button>
          );
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('agent.placeholder')}
          disabled={!datasetLoaded}
          className="flex-1 rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-xs outline-none focus:border-[var(--color-primary)] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!datasetLoaded || busy}
          className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          {busy ? t('agent.thinking') : t('agent.send')}
        </button>
      </form>
      {noMatch && <p className="mt-2 text-[11px] text-[var(--color-warning)]">{t('agent.noMatch')}</p>}
    </div>
  );
}
