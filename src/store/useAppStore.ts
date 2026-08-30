import { create } from 'zustand';
import type {
  ActivityEvent,
  BudgetGoal,
  CategoryId,
  Region,
  ToolStatus,
  Transaction,
  TransactionFilter,
} from '../data/types';

export interface PendingApproval {
  activityId: string;
  category: CategoryId;
  currentLimit: number | undefined;
  newLimit: number;
}

const approvalResolvers = new Map<string, (approved: boolean) => void>();

export function waitForApproval(activityId: string): Promise<boolean> {
  return new Promise((resolve) => {
    approvalResolvers.set(activityId, resolve);
  });
}

function settleApproval(activityId: string, approved: boolean) {
  const resolver = approvalResolvers.get(activityId);
  if (resolver) {
    resolver(approved);
    approvalResolvers.delete(activityId);
  }
}

const defaultFilter: TransactionFilter = {
  category: 'ALL',
  startDate: null,
  endDate: null,
  search: '',
};

interface AppState {
  region: Region | null;
  currency: string;
  transactions: Transaction[];
  dbReady: boolean;
  datasetLoaded: boolean;
  filters: TransactionFilter;
  budgets: Partial<Record<CategoryId, number>>;
  activity: ActivityEvent[];
  pendingApproval: PendingApproval | null;

  setDbReady: (ready: boolean) => void;
  loadDataset: (region: Region, currency: string, transactions: Transaction[]) => void;
  setFilters: (patch: Partial<TransactionFilter>) => void;
  clearFilters: () => void;
  setBudget: (category: CategoryId, limit: number) => void;

  logActivity: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => string;
  updateActivity: (id: string, patch: Partial<ActivityEvent>) => void;
  requestBudgetApproval: (activityId: string, category: CategoryId, newLimit: number) => void;
  respondToApproval: (approved: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  region: null,
  currency: 'USD',
  transactions: [],
  dbReady: false,
  datasetLoaded: false,
  filters: defaultFilter,
  budgets: {},
  activity: [],
  pendingApproval: null,

  setDbReady: (ready) => set({ dbReady: ready }),

  loadDataset: (region, currency, transactions) =>
    set({
      region,
      currency,
      transactions,
      datasetLoaded: true,
      filters: defaultFilter,
      budgets: {},
      activity: [],
      pendingApproval: null,
    }),

  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  clearFilters: () => set({ filters: defaultFilter }),

  setBudget: (category, limit) =>
    set((s) => ({ budgets: { ...s.budgets, [category]: limit } })),

  logActivity: (event) => {
    const id = `evt-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const full: ActivityEvent = { ...event, id, timestamp: Date.now() };
    set((s) => ({ activity: [...s.activity, full] }));
    return id;
  },

  updateActivity: (id, patch) =>
    set((s) => ({
      activity: s.activity.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),

  requestBudgetApproval: (activityId, category, newLimit) =>
    set((s) => ({
      pendingApproval: {
        activityId,
        category,
        currentLimit: s.budgets[category],
        newLimit,
      },
    })),

  respondToApproval: (approved) => {
    const pending = get().pendingApproval;
    if (!pending) return;
    settleApproval(pending.activityId, approved);
    set({ pendingApproval: null });
  },
}));

export function activityStatus(id: string, status: ToolStatus, extra?: Partial<ActivityEvent>) {
  useAppStore.getState().updateActivity(id, { status, ...extra });
}

export function currentBudgets(): BudgetGoal[] {
  const { budgets } = useAppStore.getState();
  return Object.entries(budgets).map(([category, monthlyLimit]) => ({
    category: category as CategoryId,
    monthlyLimit: monthlyLimit as number,
  }));
}
