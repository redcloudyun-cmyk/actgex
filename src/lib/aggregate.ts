import type { CategoryId, Transaction, TransactionFilter } from '../data/types';
import { calendarMonthRange } from './dates';

export function filterTransactions(transactions: Transaction[], filters: TransactionFilter): Transaction[] {
  return transactions.filter((t) => {
    if (filters.category !== 'ALL' && t.category !== filters.category) return false;
    if (filters.startDate && t.date < filters.startDate) return false;
    if (filters.endDate && t.date > filters.endDate) return false;
    if (filters.search && !t.merchant.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });
}

export function sumAmount(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

export interface CategoryTotal {
  category: CategoryId;
  total: number;
  count: number;
}

export function totalsByCategory(transactions: Transaction[]): CategoryTotal[] {
  const map = new Map<CategoryId, CategoryTotal>();
  for (const t of transactions) {
    const entry = map.get(t.category) ?? { category: t.category, total: 0, count: 0 };
    entry.total += t.amount;
    entry.count += 1;
    map.set(t.category, entry);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export interface DayTotal {
  date: string;
  total: number;
}

export function totalsByDay(transactions: Transaction[]): DayTotal[] {
  const map = new Map<string, number>();
  for (const t of transactions) {
    map.set(t.date, (map.get(t.date) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Last `days` daily totals (zero-filled), optionally restricted to one category — for sparklines. */
export function recentDailySeries(transactions: Transaction[], days: number, category?: CategoryId): number[] {
  const scoped = category ? transactions.filter((t) => t.category === category) : transactions;
  const byDay = new Map<string, number>();
  for (const t of scoped) byDay.set(t.date, (byDay.get(t.date) ?? 0) + t.amount);

  const series: number[] = [];
  const cursor = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    series.push(byDay.get(iso) ?? 0);
  }
  return series;
}

export function monthlyChange(transactions: Transaction[]): { change: number; percent: number } {
  const [curStart, curEnd] = calendarMonthRange(0);
  const [prevStart, prevEnd] = calendarMonthRange(1);
  const current = sumAmount(transactions.filter((t) => t.date >= curStart && t.date <= curEnd));
  const previous = sumAmount(transactions.filter((t) => t.date >= prevStart && t.date <= prevEnd));
  const change = current - previous;
  const percent = previous > 0 ? change / previous : current > 0 ? 1 : 0;
  return { change, percent };
}
