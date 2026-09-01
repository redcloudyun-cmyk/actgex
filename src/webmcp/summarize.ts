import { categoryLabelKey } from '../data/categories';
import type { ActivityEvent, CategoryId } from '../data/types';
import type { Locale } from '../i18n';
import { formatCurrency, formatPercent } from '../lib/format';

type T = (key: string, vars?: Record<string, string | number>) => string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function summarizeEvent(event: ActivityEvent, t: T, locale: Locale, currency: string): string {
  const after = event.detail?.after as Record<string, unknown> | undefined;

  if (event.status === 'FAILED' && after && 'error' in after) {
    const error = after.error as { message: string; messageKey?: string };
    return error.messageKey ? t(error.messageKey) : error.message;
  }

  if (event.status === 'REJECTED' && event.tool === 'set_budget_goal' && after) {
    const category = t(categoryLabelKey(after.category as CategoryId));
    return t('summary.rejected', { category });
  }

  switch (event.tool) {
    case 'user_request':
      return String((event.params as { text?: string } | undefined)?.text ?? '');

    case 'query_transactions': {
      if (!after) return '';
      return t('summary.querySummary', {
        count: after.count as number,
        total: formatCurrency(after.totalAmount as number, locale, currency),
      });
    }

    case 'get_category_summary': {
      if (!after) return '';
      const categories = after.categories as unknown[];
      return t('summary.categoriesCount', {
        count: categories.length,
        total: formatCurrency(after.grandTotal as number, locale, currency),
      });
    }

    case 'compare_spending_periods': {
      if (!after) return '';
      const amount = formatCurrency(after.changeAmount as number, locale, currency);
      const pct = formatPercent(after.changePercent as number, locale);
      return `${amount} (${pct})`;
    }

    case 'flag_unusual_spending': {
      if (!after) return '';
      const flagged = after.flagged as { category: CategoryId }[];
      if (flagged.length === 0) return t('summary.noneFlagged');
      return flagged.map((f) => t(categoryLabelKey(f.category))).join(', ');
    }

    case 'recommend_budget_goal': {
      if (!after) return '';
      return t('summary.recommended', {
        amount: formatCurrency(after.recommendedMonthlyLimit as number, locale, currency),
      });
    }

    case 'simulate_budget_change': {
      if (!after) return '';
      return t('summary.estimatedSavings', {
        amount: formatCurrency(after.estimatedSavings as number, locale, currency),
      });
    }

    case 'set_budget_goal': {
      if (!after) return '';
      const category = t(categoryLabelKey(after.category as CategoryId));
      const before = event.detail?.before;
      const beforeStr =
        typeof before === 'number' ? formatCurrency(before, locale, currency) : t('budget.notSet');
      const afterStr = formatCurrency(after.monthlyLimit as number, locale, currency);
      return t('summary.changed', { category, before: beforeStr, after: afterStr });
    }

    case 'export_report': {
      if (!after) return '';
      return t('summary.exported', { format: String(after.format) });
    }

    case 'demo_query':
      return t('summary.demoQueried');

    case 'demo_compare':
      return t('summary.demoCompared');

    case 'demo_flag':
      return t('summary.demoFlagged');

    case 'demo_review':
      return t('summary.demoReviewed');

    default:
      return '';
  }
}
