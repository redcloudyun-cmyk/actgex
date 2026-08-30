import { Calendar } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { digitsOnly, digitsToIso, formatDraft, isoToDisplay } from '../lib/localizedDate';

interface LocalizedDateInputProps {
  /** Canonical value — ISO `YYYY-MM-DD`, or null when empty. Internal app/filter state never changes format. */
  value: string | null;
  onChange: (iso: string | null) => void;
  'aria-label'?: string;
}

/**
 * Replaces native `<input type="date">` so the displayed format follows
 * ActGeX's own language setting (EN → MM/DD/YYYY, KO → YYYY.MM.DD) instead
 * of leaking the browser/OS locale (e.g. Korean "연도. 월. 일." showing up
 * in an English UI). The value this component reports upward is always a
 * plain ISO `YYYY-MM-DD` string — filters, WebMCP tool context, and every
 * other consumer of shared state are unaffected.
 */
export function LocalizedDateInput({ value, onChange, ...aria }: LocalizedDateInputProps) {
  const { locale } = useI18n();
  const isKorean = locale === 'ko';
  const [draft, setDraft] = useState('');
  const [invalid, setInvalid] = useState(false);
  const focused = useRef(false);

  // Reflect external changes (Clear filters, language switch) as long as the
  // human isn't actively typing — never fight the user's own keystrokes.
  useEffect(() => {
    if (focused.current) return;
    setDraft(value ? isoToDisplay(value, isKorean) : '');
    setInvalid(false);
  }, [value, isKorean]);

  function handleChange(raw: string) {
    const digits = digitsOnly(raw);
    setDraft(formatDraft(digits, isKorean));

    if (digits.length === 0) {
      setInvalid(false);
      onChange(null);
      return;
    }
    if (digits.length < 8) {
      setInvalid(false);
      return;
    }
    const iso = digitsToIso(digits, isKorean);
    setInvalid(!iso);
    if (iso) onChange(iso);
  }

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={draft}
        placeholder={isKorean ? 'YYYY.MM.DD' : 'MM/DD/YYYY'}
        aria-label={aria['aria-label']}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
          setDraft(value ? isoToDisplay(value, isKorean) : '');
          setInvalid(false);
        }}
        onChange={(e) => handleChange(e.target.value)}
        className={`w-[112px] rounded-md border py-1.5 pl-2.5 pr-6 text-xs outline-none focus:border-[var(--color-primary)] ${
          invalid ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
        }`}
      />
      <Calendar
        size={13}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-ink-soft)]"
      />
    </div>
  );
}
