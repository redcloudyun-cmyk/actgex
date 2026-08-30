import { CATEGORY_IDS, type ActivitySource } from '../data/types';
import { useAppStore } from '../store/useAppStore';
import { serializeToolError } from './errors';
import {
  compareSpendingPeriods,
  exportReport,
  flagUnusualSpending,
  getCategorySummary,
  queryTransactions,
  recommendBudgetGoal,
  setBudgetGoal,
  simulateBudgetChange,
  type ComparePeriodsArgs,
  type CategorySummaryArgs,
  type ExportReportArgs,
  type FlagUnusualArgs,
  type QueryTransactionsArgs,
  type RecommendBudgetArgs,
  type SetBudgetGoalArgs,
  type SimulateBudgetChangeArgs,
} from './tools';

export interface InvokeOptions {
  actor?: 'agent' | 'user';
  /** Whether this call came from a real WebMCP host or the in-app fallback simulator. */
  source?: ActivitySource;
}

function resolveOpts(opts?: InvokeOptions): { actor: 'agent' | 'user'; source: ActivitySource } {
  return { actor: opts?.actor ?? 'agent', source: opts?.source ?? 'console' };
}

async function runReadOnlyTool<A, R>(
  toolName: string,
  opts: InvokeOptions | undefined,
  args: A,
  fn: (args: A) => Promise<R>,
): Promise<R> {
  const { actor, source } = resolveOpts(opts);
  const store = useAppStore.getState();
  const id = store.logActivity({
    actor,
    source,
    tool: toolName,
    params: args as Record<string, unknown>,
    status: 'RUNNING',
  });
  try {
    const result = await fn(args);
    store.updateActivity(id, { status: 'COMPLETED', detail: { after: result } });
    return result;
  } catch (err) {
    store.updateActivity(id, { status: 'FAILED', detail: { after: { error: serializeToolError(err) } } });
    throw err;
  }
}

async function runSetBudgetGoal(opts: InvokeOptions | undefined, args: SetBudgetGoalArgs) {
  const { actor, source } = resolveOpts(opts);
  const store = useAppStore.getState();
  const id = store.logActivity({
    actor,
    source,
    tool: 'set_budget_goal',
    params: args as unknown as Record<string, unknown>,
    status: 'PENDING',
  });
  try {
    const result = await setBudgetGoal(args, id);
    store.updateActivity(id, {
      status: result.applied ? 'COMPLETED' : 'REJECTED',
      detail: { before: result.previousLimit, after: result },
    });
    return result;
  } catch (err) {
    store.updateActivity(id, { status: 'FAILED', detail: { after: { error: serializeToolError(err) } } });
    throw err;
  }
}

export const toolInvokers = {
  query_transactions: (args: QueryTransactionsArgs, opts?: InvokeOptions) =>
    runReadOnlyTool('query_transactions', opts, args, queryTransactions),
  get_category_summary: (args: CategorySummaryArgs, opts?: InvokeOptions) =>
    runReadOnlyTool('get_category_summary', opts, args, getCategorySummary),
  compare_spending_periods: (args: ComparePeriodsArgs, opts?: InvokeOptions) =>
    runReadOnlyTool('compare_spending_periods', opts, args, compareSpendingPeriods),
  flag_unusual_spending: (args: FlagUnusualArgs, opts?: InvokeOptions) =>
    runReadOnlyTool('flag_unusual_spending', opts, args, flagUnusualSpending),
  recommend_budget_goal: (args: RecommendBudgetArgs, opts?: InvokeOptions) =>
    runReadOnlyTool('recommend_budget_goal', opts, args, recommendBudgetGoal),
  simulate_budget_change: (args: SimulateBudgetChangeArgs, opts?: InvokeOptions) =>
    runReadOnlyTool('simulate_budget_change', opts, args, simulateBudgetChange),
  set_budget_goal: (args: SetBudgetGoalArgs, opts?: InvokeOptions) => runSetBudgetGoal(opts, args),
  export_report: (args: ExportReportArgs, opts?: InvokeOptions) =>
    runReadOnlyTool('export_report', opts, args, exportReport),
};

const WEBMCP_SOURCE: InvokeOptions = { source: 'webmcp' };

const dateProp = { type: 'string', format: 'date' } as const;
const categoryEnumProp = { type: 'string', enum: CATEGORY_IDS } as const;

function buildToolDefinitions(): ModelContextToolDefinition[] {
  return [
    {
      name: 'query_transactions',
      title: 'Query transactions',
      description: `Search transactions by category, date range, amount range, or merchant text.
If a filter is omitted, the tool falls back to whatever the human currently has
selected in the dashboard (shared state) — pass an explicit value to override it.
Use for requests such as:
- "Show my dining transactions from August."
- "How much did I spend on Uber last week?"
- "이번 달 외식 거래 내역 보여줘."
- "지난주 교통비 지출 얼마나 됐어?"`,
      inputSchema: {
        type: 'object',
        properties: {
          category: categoryEnumProp,
          startDate: dateProp,
          endDate: dateProp,
          minAmount: { type: 'number', minimum: 0 },
          maxAmount: { type: 'number', minimum: 0 },
          search: { type: 'string' },
        },
      },
      annotations: { readOnlyHint: true },
      execute: (args: QueryTransactionsArgs) => toolInvokers.query_transactions(args, WEBMCP_SOURCE),
    },
    {
      name: 'get_category_summary',
      title: 'Get category spending summary',
      description: `Summarize totals, transaction counts, averages, and share-of-total for every
spending category within an optional date range. If no range is given, falls back to
the human's currently selected date filter (shared state).
Use for requests such as:
- "Break down my spending by category this month."
- "이번 달 카테고리별 지출을 요약해줘."`,
      inputSchema: {
        type: 'object',
        properties: { startDate: dateProp, endDate: dateProp },
      },
      annotations: { readOnlyHint: true },
      execute: (args: CategorySummaryArgs) => toolInvokers.get_category_summary(args, WEBMCP_SOURCE),
    },
    {
      name: 'compare_spending_periods',
      title: 'Compare spending periods',
      description: `Compare total spending between two periods (defaults to this month vs. last
month) and return the amount difference, percentage change, and which categories
increased or decreased. If no category is given, falls back to the human's currently
selected category filter (shared state) — omit it entirely to compare everything.
Use for requests such as:
- "Compare my dining spending this month with last month."
- "How much did transportation spending increase?"
- "이번 달 외식비를 지난달과 비교해줘."
- "교통비가 얼마나 증가했어?"`,
      inputSchema: {
        type: 'object',
        properties: {
          currentStartDate: dateProp,
          currentEndDate: dateProp,
          previousStartDate: dateProp,
          previousEndDate: dateProp,
          category: categoryEnumProp,
        },
      },
      annotations: { readOnlyHint: true },
      execute: (args: ComparePeriodsArgs) => toolInvokers.compare_spending_periods(args, WEBMCP_SOURCE),
    },
    {
      name: 'flag_unusual_spending',
      title: 'Flag unusual spending',
      description: `Detect categories whose spending in the last 30 days is at least 30% above
their trailing 3-month monthly average (rule-based, no ML).
Use for requests such as:
- "Did I spend unusually more on anything this month?"
- "이번 달 평소보다 많이 쓴 항목 찾아줘."`,
      inputSchema: {
        type: 'object',
        properties: {
          threshold: { type: 'number', exclusiveMinimum: 1, description: 'Ratio threshold, default 1.3' },
        },
      },
      annotations: { readOnlyHint: true },
      execute: (args: FlagUnusualArgs) => toolInvokers.flag_unusual_spending(args, WEBMCP_SOURCE),
    },
    {
      name: 'recommend_budget_goal',
      title: 'Recommend a budget goal',
      description: `Recommend a monthly budget for a category based on the trailing 3-month
average spend. Read-only — does not change any budget.
Use for requests such as:
- "Suggest a reasonable dining budget."
- "적절한 외식 예산을 추천해줘."`,
      inputSchema: {
        type: 'object',
        properties: { category: categoryEnumProp },
        required: ['category'],
      },
      annotations: { readOnlyHint: true },
      execute: (args: RecommendBudgetArgs) => toolInvokers.recommend_budget_goal(args, WEBMCP_SOURCE),
    },
    {
      name: 'simulate_budget_change',
      title: 'Simulate a what-if budget change',
      description: `Simulate the effect of reducing spending in a category by a percentage over
a number of months, based on real historical averages. Does not change any budget.
Use for requests such as:
- "If I cut dining spending by 20%, how much would I save by December?"
- "외식비를 20% 줄이면 12월까지 얼마나 절약할 수 있어?"`,
      inputSchema: {
        type: 'object',
        properties: {
          category: categoryEnumProp,
          reductionPercent: { type: 'number', exclusiveMinimum: 0, maximum: 100 },
          months: { type: 'integer', minimum: 1, maximum: 60 },
        },
        required: ['category', 'reductionPercent', 'months'],
      },
      annotations: { readOnlyHint: true },
      execute: (args: SimulateBudgetChangeArgs) => toolInvokers.simulate_budget_change(args, WEBMCP_SOURCE),
    },
    {
      name: 'set_budget_goal',
      title: 'Set a monthly budget goal',
      description: `Change the actual monthly budget limit for a category. This mutates real app
state and always requires the human user's on-screen approval before it takes effect.
Use for requests such as:
- "Set my dining budget to $400."
- "외식 예산을 40만원으로 설정해줘."`,
      inputSchema: {
        type: 'object',
        properties: {
          category: categoryEnumProp,
          monthlyLimit: { type: 'number', exclusiveMinimum: 0 },
        },
        required: ['category', 'monthlyLimit'],
      },
      annotations: { readOnlyHint: false },
      execute: (args: SetBudgetGoalArgs) => toolInvokers.set_budget_goal(args, WEBMCP_SOURCE),
    },
    {
      name: 'export_report',
      title: 'Export a spending report',
      description: `Export the current category summary and budgets as a Markdown or CSV report.
Use for requests such as:
- "Export this month's report as CSV."
- "이번 리포트를 마크다운으로 내보내줘."`,
      inputSchema: {
        type: 'object',
        properties: { format: { type: 'string', enum: ['markdown', 'csv'] } },
        required: ['format'],
      },
      annotations: { readOnlyHint: true },
      execute: (args: ExportReportArgs) => toolInvokers.export_report(args, WEBMCP_SOURCE),
    },
  ];
}

let registrationPromise: Promise<boolean> | null = null;

async function doRegister(): Promise<boolean> {
  if (typeof document === 'undefined' || !document.modelContext) return false;
  const mc = document.modelContext;

  try {
    await Promise.all(
      buildToolDefinitions().map((tool) =>
        // registerTool's return type isn't finalized across implementations —
        // Promise.resolve() awaits it whether it's a Promise or a plain value.
        Promise.resolve(mc.registerTool(tool)),
      ),
    );
    return true;
  } catch (error) {
    console.error('[ActGeX] WebMCP tool registration failed', error);
    return false;
  }
}

/**
 * Registers ActGeX's real application capabilities as WebMCP tools on
 * `document.modelContext`, if the host browser/extension exposes it.
 * Awaits every `registerTool()` call and only resolves `true` once all 8
 * tools are confirmed registered. Idempotent — concurrent/repeated calls
 * (e.g. React StrictMode double-invoking an effect) share one in-flight
 * registration instead of registering tools twice.
 */
export function registerWebMcpTools(): Promise<boolean> {
  if (!registrationPromise) registrationPromise = doRegister();
  return registrationPromise;
}

export function isWebMcpAvailable(): boolean {
  return typeof document !== 'undefined' && !!document.modelContext;
}
