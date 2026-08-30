export interface ToolDef {
  name: string;
  readOnly: boolean;
}

export const TOOL_DEFS: ToolDef[] = [
  { name: 'query_transactions', readOnly: true },
  { name: 'get_category_summary', readOnly: true },
  { name: 'compare_spending_periods', readOnly: true },
  { name: 'flag_unusual_spending', readOnly: true },
  { name: 'recommend_budget_goal', readOnly: true },
  { name: 'simulate_budget_change', readOnly: true },
  { name: 'set_budget_goal', readOnly: false },
  { name: 'export_report', readOnly: true },
];
