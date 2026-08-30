import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import en from './dictionaries/en';
import ko from './dictionaries/ko';
import type { Dictionary } from './dictionaries/en';

export type Locale = 'en' | 'ko';

const DICTIONARIES: Record<Locale, Dictionary> = { en, ko };
const STORAGE_KEY = 'spendlens.locale';

export const REGION_TO_LOCALE = { US: 'en', KR: 'ko' } as const;
export const LOCALE_TO_CURRENCY: Record<Locale, string> = {
  en: 'USD',
  ko: 'KRW',
};
export const LOCALE_TO_INTL: Record<Locale, string> = {
  en: 'en-US',
  ko: 'ko-KR',
};

function detectInitialLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'ko') return stored;
  } catch {
    // ignore storage access errors
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return nav?.toLowerCase().startsWith('ko') ? 'ko' : 'en';
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof Dictionary | (string & {}), vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectInitialLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore storage access errors
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => setLocaleState(next), []);

  const t = useCallback(
    (key: keyof Dictionary | (string & {}), vars?: Record<string, string | number>) => {
      const dict = DICTIONARIES[locale] as Record<string, string>;
      let str: string = dict[key] ?? (DICTIONARIES.en as Record<string, string>)[key] ?? String(key);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replaceAll(`{{${k}}}`, String(v));
        }
      }
      return str;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
