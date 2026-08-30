import { useAppStore } from '../store/useAppStore';
import { toolInvokers } from './registerTools';

export type SuggestionId = 'query' | 'summary' | 'compare' | 'flag' | 'recommend' | 'simulate' | 'export';

function logUserRequest(text: string) {
  useAppStore.getState().logActivity({
    actor: 'user',
    source: 'console',
    tool: 'user_request',
    params: { text },
    status: 'COMPLETED',
  });
}

async function runQuery() {
  // No args on purpose: demonstrates Human UI → Shared State → Agent Tool
  // Context — the tool inherits whatever category/date the human currently
  // has selected in the dashboard filters instead of defaulting to "all".
  await toolInvokers.query_transactions({});
}

async function runSummary() {
  await toolInvokers.get_category_summary({});
}

async function runCompare() {
  await toolInvokers.compare_spending_periods({ category: 'DINING' });
}

async function runFlag() {
  await toolInvokers.flag_unusual_spending({});
}

async function runRecommendAndApply() {
  const recommendation = await toolInvokers.recommend_budget_goal({ category: 'DINING' });
  // Fire-and-forget: this opens the on-screen approval dialog, matching the
  // human-in-the-loop requirement for any state-mutating tool call.
  void toolInvokers.set_budget_goal({
    category: 'DINING',
    monthlyLimit: recommendation.recommendedMonthlyLimit,
  });
}

async function runSimulate() {
  const monthsRemaining = Math.max(1, 12 - new Date().getMonth());
  await toolInvokers.simulate_budget_change({
    category: 'DINING',
    reductionPercent: 20,
    months: monthsRemaining,
  });
}

async function runExport() {
  await toolInvokers.export_report({ format: 'csv' });
}

const HANDLERS: Record<SuggestionId, () => Promise<void>> = {
  query: runQuery,
  summary: runSummary,
  compare: runCompare,
  flag: runFlag,
  recommend: runRecommendAndApply,
  simulate: runSimulate,
  export: runExport,
};

export const SUGGESTIONS: { id: SuggestionId; key: `demo.suggestion.${SuggestionId}` }[] = [
  { id: 'compare', key: 'demo.suggestion.compare' },
  { id: 'flag', key: 'demo.suggestion.flag' },
  { id: 'recommend', key: 'demo.suggestion.recommend' },
  { id: 'simulate', key: 'demo.suggestion.simulate' },
  { id: 'query', key: 'demo.suggestion.query' },
  { id: 'summary', key: 'demo.suggestion.summary' },
  { id: 'export', key: 'demo.suggestion.export' },
];

export async function runSuggestion(id: SuggestionId, text: string) {
  logUserRequest(text);
  await HANDLERS[id]();
}

const KEYWORDS: Record<SuggestionId, string[]> = {
  query: ['show', 'transactions', 'merchant', '거래', '내역', '보여줘'],
  summary: ['summary', 'breakdown', 'category', '요약', '카테고리별'],
  compare: ['compare', 'vs', 'last month', '비교', '지난달'],
  flag: ['unusual', 'anomaly', 'strange', '이상', '평소보다'],
  recommend: ['recommend', 'suggest', 'apply', '추천', '적용', '설정'],
  simulate: ['simulate', 'cut', 'reduce', 'if i', '줄이면', '시뮬', '절약'],
  export: ['export', 'download', 'report', '내보내', '리포트', '다운로드'],
};

export function matchFreeText(text: string): SuggestionId | null {
  const lower = text.toLowerCase();
  for (const [id, words] of Object.entries(KEYWORDS) as [SuggestionId, string[]][]) {
    if (words.some((w) => lower.includes(w.toLowerCase()))) return id;
  }
  return null;
}

export async function runFreeText(text: string): Promise<boolean> {
  const match = matchFreeText(text);
  if (!match) return false;
  await runSuggestion(match, text);
  return true;
}
