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

export function isValidDateRange(start: string | null | undefined, end: string | null | undefined): boolean {
  if (!start || !end) return true;
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return false;
  return s.getTime() <= e.getTime();
}
