import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LOCALE_TO_INTL, useI18n } from '../i18n';
import { todayISO } from '../lib/dates';
import {
  buildMonthGrid,
  digitsOnly,
  digitsToIso,
  formatDraft,
  isoParts,
  isoToDisplay,
  normalizeYearMonth,
} from '../lib/localizedDate';
import { useOnClickOutside } from '../lib/useOnClickOutside';

interface LocalizedDateInputProps {
  /** Canonical value — ISO `YYYY-MM-DD`, or null when empty. Internal app/filter state never changes format. */
  value: string | null;
  onChange: (iso: string | null) => void;
  'aria-label'?: string;
}

const WEEKDAYS: Record<'en' | 'ko', string[]> = {
  en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  ko: ['일', '월', '화', '수', '목', '금', '토'],
};

/**
 * Replaces native `<input type="date">` so the displayed format follows
 * ActGeX's own language setting (EN → MM/DD/YYYY, KO → YYYY.MM.DD) instead
 * of leaking the browser/OS locale (e.g. Korean "연도. 월. 일." showing up
 * in an English UI), while still offering a real clickable calendar picker.
 * The value this component reports upward is always a plain ISO
 * `YYYY-MM-DD` string — filters, WebMCP tool context, and every other
 * consumer of shared state are unaffected.
 */
export function LocalizedDateInput({ value, onChange, ...aria }: LocalizedDateInputProps) {
  const { locale } = useI18n();
  const isKorean = locale === 'ko';
  const [draft, setDraft] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<{ year: number; month: number }>(() => {
    const { year, month } = isoParts(value ?? todayISO());
    return { year, month };
  });
  const focused = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(containerRef, () => setOpen(false));

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

  function toggleOpen() {
    setOpen((wasOpen) => {
      if (!wasOpen) {
        const { year, month } = isoParts(value ?? todayISO());
        setView({ year, month });
      }
      return !wasOpen;
    });
  }

  function selectDay(iso: string) {
    onChange(iso);
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    setView((v) => normalizeYearMonth(v.year, v.month + delta));
  }

  const monthLabel = new Intl.DateTimeFormat(LOCALE_TO_INTL[locale], { month: 'long', year: 'numeric' }).format(
    new Date(view.year, view.month - 1, 1),
  );
  const today = todayISO();
  const cells = buildMonthGrid(view.year, view.month);

  return (
    <div className="relative" ref={containerRef}>
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
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        className={`w-[112px] rounded-md border py-1.5 pl-2.5 pr-6 text-xs outline-none focus:border-[var(--color-primary)] ${
          invalid ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]'
        }`}
      />
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={aria['aria-label'] ? `${aria['aria-label']} calendar` : 'Open calendar'}
        className="absolute right-1 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)]"
      >
        <Calendar size={13} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-lg">
          <div className="mb-1 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-[var(--color-bg)]"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-[var(--color-ink)]">{monthLabel}</span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="flex h-6 w-6 items-center justify-center rounded hover:bg-[var(--color-bg)]"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS[isKorean ? 'ko' : 'en'].map((wd) => (
              <span key={wd} className="py-0.5 text-[10px] font-medium text-[var(--color-ink-soft)]">
                {wd}
              </span>
            ))}
            {cells.map((cell, i) =>
              cell ? (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => selectDay(cell.iso)}
                  className={`rounded py-1 text-[11px] tabular-nums hover:bg-[var(--color-primary-soft)] ${
                    cell.iso === value
                      ? 'bg-[var(--color-primary)] font-semibold text-white hover:bg-[var(--color-primary)]'
                      : cell.iso === today
                        ? 'font-semibold text-[var(--color-primary)]'
                        : 'text-[var(--color-ink)]'
                  }`}
                >
                  {cell.day}
                </button>
              ) : (
                <span key={`pad-${i}`} />
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}
