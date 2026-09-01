export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Fixed "as of" date the whole demo — data generation, every WebMCP tool's
 * date windows, and every "current month" UI display — is pinned to. A live
 * `new Date()` meant the app's calendar-month-based stories (MoM comparison,
 * "current month" totals) silently degraded depending on what day it
 * happened to be opened, worst right at a month boundary, and could drift
 * out of sync with data generated for a different day entirely. Every
 * call site that would otherwise default to `new Date()` for a date-window
 * calculation should pass this instead.
 */
export const DEMO_REFERENCE_DATE = new Date('2026-08-30T12:00:00Z');

export function todayISO(): string {
  return isoDate(DEMO_REFERENCE_DATE);
}

export function daysAgoISO(n: number, from: Date = DEMO_REFERENCE_DATE): string {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return isoDate(d);
}

export function addDaysISO(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

/**
 * [monthStart, monthEnd] ISO strings for the calendar month containing
 * `date`, offset by `monthsAgo`. Computed entirely in UTC (rather than
 * mixing local-timezone components with a UTC-based ISO conversion) so the
 * result is identical regardless of the runtime's local timezone — this
 * previously shifted the whole range back by up to a day in timezones ahead
 * of UTC (e.g. `calendarMonthRange(0, DEMO_REFERENCE_DATE)` produced
 * `2026-07-31` as the start, not `2026-08-01`, when run under KST).
 */
export function calendarMonthRange(monthsAgo: number, from: Date = DEMO_REFERENCE_DATE): [string, string] {
  const start = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - monthsAgo, 1));
  const end = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - monthsAgo + 1, 0));
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
