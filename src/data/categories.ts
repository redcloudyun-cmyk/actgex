import type { CategoryId } from './types';

export const CATEGORY_COLORS: Record<CategoryId, string> = {
  DINING: '#f59e0b',
  GROCERY: '#16a34a',
  SHOPPING: '#db2777',
  TRANSPORT: '#2f6fed',
  SUBSCRIPTION: '#7c3aed',
  ENTERTAINMENT: '#0891b2',
  HEALTH: '#dc2626',
  TRAVEL: '#0d9488',
  UTILITIES: '#64748b',
  OTHER: '#94a3b8',
};

export function categoryLabelKey(category: CategoryId): string {
  return `category.${category}`;
}
