export type CategoryId =
  | 'DINING'
  | 'GROCERY'
  | 'SHOPPING'
  | 'TRANSPORT'
  | 'SUBSCRIPTION'
  | 'ENTERTAINMENT'
  | 'HEALTH'
  | 'TRAVEL'
  | 'UTILITIES'
  | 'OTHER';

export const CATEGORY_IDS: CategoryId[] = [
  'DINING',
  'GROCERY',
  'SHOPPING',
  'TRANSPORT',
  'SUBSCRIPTION',
  'ENTERTAINMENT',
  'HEALTH',
  'TRAVEL',
  'UTILITIES',
  'OTHER',
];

export type Region = 'US' | 'KR';

export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  merchant: string;
  category: CategoryId;
  amount: number; // major currency unit, always positive spend
}

export interface BudgetGoal {
  category: CategoryId;
  monthlyLimit: number;
}

export type ToolStatus =
  | 'PENDING'
  | 'WAITING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED';

export type ActivitySource = 'webmcp' | 'console' | 'seed';

export interface ActivityEvent {
  id: string;
  timestamp: number;
  actor: 'agent' | 'user';
  /** Whether this call came through a real `document.modelContext` agent or the in-app fallback simulator. */
  source: ActivitySource;
  tool: string;
  params?: Record<string, unknown>;
  status: ToolStatus;
  summary?: string;
  detail?: {
    before?: unknown;
    after?: unknown;
  };
}

export interface TransactionFilter {
  category: CategoryId | 'ALL';
  startDate: string | null;
  endDate: string | null;
  search: string;
}
