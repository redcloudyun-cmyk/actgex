export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return isoDate(new Date());
}

export function daysAgoISO(n: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return isoDate(d);
}

export function addDaysISO(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

/** [monthStart, monthEnd] ISO strings for the calendar month containing `date`, offset by `monthsAgo`. */
export function calendarMonthRange(monthsAgo: number, from: Date = new Date()): [string, string] {
  const start = new Date(from.getFullYear(), from.getMonth() - monthsAgo, 1);
  const end = new Date(from.getFullYear(), from.getMonth() - monthsAgo + 1, 0);
  return [isoDate(start), isoDate(end)];
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Strict `YYYY-MM-DD` validation: rejects malformed strings, non-ISO formats
 * (e.g. `08/30/2026`), and non-existent calendar dates (e.g. `2026-02-30`)
 * — and, as a side effect, anything that isn't a clean date literal (SQL
 * injection attempts included), since it never matches the regex.
 */
export function isStrictISODate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function isValidDateRange(start: string | null | undefined, end: string | null | undefined): boolean {
  if (start && !isStrictISODate(start)) return false;
  if (end && !isStrictISODate(end)) return false;
  if (!start || !end) return true;
  return start <= end;
}
