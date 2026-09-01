import type { CategoryId } from '../data/types';
import { DEMO_REFERENCE_DATE } from '../lib/dates';
import { useAppStore, type MissionStepId } from '../store/useAppStore';
import { toolInvokers } from './registerTools';

function monthsRemainingThisYear(): number {
  return Math.max(1, 12 - DEMO_REFERENCE_DATE.getUTCMonth());
}

function mark(id: MissionStepId, status: 'running' | 'done') {
  useAppStore.getState().setMissionStep(id, status);
}

/**
 * Scripted "Financial Agent Mission": runs the same WebMCP tools a real
 * agent would (via `toolInvokers`, which already logs every call to the
 * Activity Timeline) in the analyze → compare → detect → recommend →
 * simulate order, then stops and waits for the human to review — it never
 * calls `set_budget_goal` itself.
 */
export async function runFinancialMission(): Promise<void> {
  const store = useAppStore.getState();
  if (!store.datasetLoaded) return;
  store.startMission();

  mark('load', 'running');
  await toolInvokers.query_transactions({});
  mark('load', 'done');

  mark('summarize', 'running');
  await toolInvokers.get_category_summary({});
  mark('summarize', 'done');

  mark('compare', 'running');
  await toolInvokers.compare_spending_periods({});
  mark('compare', 'done');

  mark('flag', 'running');
  const flagResult = await toolInvokers.flag_unusual_spending({});
  mark('flag', 'done');

  const topFlag = flagResult.flagged[0];
  if (!topFlag) {
    useAppStore.getState().setMissionEmpty();
    return;
  }
  const category = topFlag.category as CategoryId;

  mark('recommend', 'running');
  const recommendation = await toolInvokers.recommend_budget_goal({ category });
  mark('recommend', 'done');

  mark('simulate', 'running');
  const currentMonthlyAvg = recommendation.averageMonthlySpend;
  const recommendedLimit = recommendation.recommendedMonthlyLimit;
  const rawReductionPercent =
    currentMonthlyAvg > 0 ? ((currentMonthlyAvg - recommendedLimit) / currentMonthlyAvg) * 100 : 0;
  const reductionPercent = Math.min(100, Math.max(1, Math.round(rawReductionPercent)));
  const months = monthsRemainingThisYear();
  const simulation = await toolInvokers.simulate_budget_change({ category, reductionPercent, months });
  mark('simulate', 'done');

  useAppStore.getState().setMissionResult({
    category,
    flagRatio: topFlag.ratio,
    currentBudget: useAppStore.getState().budgets[category],
    currentMonthlyAvg,
    recommendedLimit,
    targetMonthlySpend: simulation.targetMonthlySpend,
    estimatedSavingsPerMonth: months > 0 ? simulation.estimatedSavings / months : 0,
    reductionPercent,
  });
}

/** CTA action: fires the real, approval-gated `set_budget_goal` call for the mission's recommendation. */
export function approveMissionRecommendation(): void {
  const store = useAppStore.getState();
  if (store.agentAuthority === 'observe') return;
  const result = store.mission.result;
  if (!result) return;
  void toolInvokers.set_budget_goal({ category: result.category, monthlyLimit: result.recommendedLimit });
}
