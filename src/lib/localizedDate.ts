import { isStrictISODate } from './dates';

export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 8);
}

/** Auto-inserts separators as the user types, without ever touching the ISO value. */
export function formatDraft(digits: string, isKorean: boolean): string {
  if (isKorean) {
    // YYYY.MM.DD
    let out = digits.slice(0, 4);
    if (digits.length > 4) out += `.${digits.slice(4, 6)}`;
    if (digits.length > 6) out += `.${digits.slice(6, 8)}`;
    return out;
  }
  // MM/DD/YYYY
  let out = digits.slice(0, 2);
  if (digits.length > 2) out += `/${digits.slice(2, 4)}`;
  if (digits.length > 4) out += `/${digits.slice(4, 8)}`;
  return out;
}

export function isoToDisplay(iso: string, isKorean: boolean): string {
  const [y, m, d] = iso.split('-');
  return isKorean ? `${y}.${m}.${d}` : `${m}/${d}/${y}`;
}

/** Returns a valid ISO date only once all 8 digits are in and the calendar date is real; null otherwise. */
export function digitsToIso(digits: string, isKorean: boolean): string | null {
  if (digits.length !== 8) return null;
  const iso = isKorean
    ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
    : `${digits.slice(4, 8)}-${digits.slice(0, 2)}-${digits.slice(2, 4)}`;
  return isStrictISODate(iso) ? iso : null;
}

export function isoParts(iso: string): { year: number; month: number; day: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, month: m, day: d };
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Normalizes a (possibly out-of-range) month/year pair, e.g. month=13 → next January. */
export function normalizeYearMonth(year: number, month: number): { year: number; month: number } {
  const y = year + Math.floor((month - 1) / 12);
  const m = ((((month - 1) % 12) + 12) % 12) + 1;
  return { year: y, month: m };
}

export interface CalendarCell {
  iso: string;
  day: number;
}

/** One month's day grid for a picker, left-padded with `null` so day 1 lands under its real weekday (Sun-start). */
export function buildMonthGrid(year: number, month: number): (CalendarCell | null)[] {
  const startWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (CalendarCell | null)[] = new Array(startWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ iso: `${year}-${pad2(month)}-${pad2(day)}`, day });
  }
  return cells;
}
