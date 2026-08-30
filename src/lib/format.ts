import { LOCALE_TO_INTL, type Locale } from '../i18n';

export function formatCurrency(amount: number, locale: Locale, currency: string): string {
  return new Intl.NumberFormat(LOCALE_TO_INTL[locale], {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'KRW' ? 0 : 2,
  }).format(amount);
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_TO_INTL[locale]).format(value);
}

export function formatPercent(ratio: number, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_TO_INTL[locale], {
    style: 'percent',
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(ratio);
}

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TO_INTL[locale], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}

export function formatMonth(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TO_INTL[locale], {
    year: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

export function formatDay(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TO_INTL[locale], {
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso));
}
