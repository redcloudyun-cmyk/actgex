import { useAppStore } from '../store/useAppStore';
import { toolInvokers } from './registerTools';

export type SuggestionId = 'compare' | 'flag' | 'recommend' | 'simulate';

function logUserRequest(text: string) {
  useAppStore.getState().logActivity({
    actor: 'user',
    tool: 'user_request',
    params: { text },
    status: 'COMPLETED',
  });
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

const HANDLERS: Record<SuggestionId, () => Promise<void>> = {
  compare: runCompare,
  flag: runFlag,
  recommend: runRecommendAndApply,
  simulate: runSimulate,
};

export const SUGGESTIONS: { id: SuggestionId; key: `demo.suggestion.${SuggestionId}` }[] = [
  { id: 'compare', key: 'demo.suggestion.compare' },
  { id: 'flag', key: 'demo.suggestion.flag' },
  { id: 'recommend', key: 'demo.suggestion.recommend' },
  { id: 'simulate', key: 'demo.suggestion.simulate' },
];

export async function runSuggestion(id: SuggestionId, text: string) {
  logUserRequest(text);
  await HANDLERS[id]();
}

const KEYWORDS: Record<SuggestionId, string[]> = {
  compare: ['compare', 'vs', 'last month', '비교', '지난달'],
  flag: ['unusual', 'anomaly', 'strange', '이상', '평소보다'],
  recommend: ['recommend', 'suggest', 'apply', '추천', '적용', '설정'],
  simulate: ['simulate', 'cut', 'reduce', 'if i', '줄이면', '시뮬', '절약'],
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
