# ActGeX

**ActGeX lets AI agents understand, analyze, and act on your live financial
workspace through WebMCP — while you keep final authority over every
important financial decision.**

## Live Demo

**https://redcloudyun-cmyk.github.io/actgex/**

No login. Click **+ Load Demo Data** on first load.

## What it does

ActGeX is a human-controlled financial workspace, not an AI finance
dashboard. Click **Analyze My Spending** and an agent runs a full mission —
read transactions, summarize categories, compare this month against last,
detect unusual spending, recommend a budget, and simulate its impact — over
[WebMCP](https://github.com/webmachinelearning/webmcp) tools that read the
same live data the human UI shows. The agent can propose a real change; only
a human can approve one.

```
Read financial context → Compare spending → Detect unusual spending
  → Recommend a budget goal → Simulate the impact → Propose a budget change
  → Human reviews → Human approves or rejects → Activity log records it
```

## Why WebMCP?

Most "AI web apps" make the agent guess at a UI: inspect the DOM, find a
button, click it, hope the page didn't change shape. ActGeX instead
registers its real capabilities as typed tools on `document.modelContext`
(the current WebMCP Community Group draft API), so a WebMCP-aware agent
calls them directly — the agent works on the same live financial workspace
as the human, not on a copied report or a separate AI dashboard.

The human UI, the agent tools, and the underlying data all share one piece
of app state ([DuckDB-Wasm](https://duckdb.org/docs/api/wasm/overview)).
Click a category filter, and any agent tool call that omits a category
inherits it. Have an agent call a tool, and the chart, table, and budget
panel update live.

## 8 WebMCP Tools

All tools are registered via `document.modelContext.registerTool` in
[`src/webmcp/registerTools.ts`](src/webmcp/registerTools.ts) — every call is
awaited, so the header only shows **"8 WebMCP Tools Connected"** once every
tool is actually confirmed registered — and implemented in
[`src/webmcp/tools.ts`](src/webmcp/tools.ts) against a real DuckDB-Wasm
`transactions` table, not a mock API.

| Tool | Read-only | Purpose |
|---|---|---|
| `query_transactions` | ✅ | Filter transactions by category, date range, amount, merchant text |
| `get_category_summary` | ✅ | Totals, counts, averages, share-of-total per category |
| `compare_spending_periods` | ✅ | Diff two periods (defaults to this month vs. last) |
| `flag_unusual_spending` | ✅ | Rule-based anomaly flag: recent 30d > 3-month avg × 1.3 |
| `recommend_budget_goal` | ✅ | Suggest a monthly limit from 3-month average spend |
| `simulate_budget_change` | ✅ | What-if: reduce a category by X% for Y months |
| `set_budget_goal` | ❌ | The only tool that changes a real budget — never runs without approval |
| `export_report` | ✅ | Export the current category summary as Markdown or CSV |

Every tool validates its own input (finite/positive budgets, 0–100%
reductions, 1–60 month windows, non-negative amount ranges, strict
`YYYY-MM-DD` dates) and reports typed, localized errors — see
[`src/webmcp/errors.ts`](src/webmcp/errors.ts).

## Human Approval

`set_budget_goal` is the only mutating tool in the app, and it can't skip
the human. Calling it opens **Human Approval Required** — a modal showing
the Before/After impact of the change (budget, monthly spend, savings,
savings rate) and an explicit explanation that nothing applies without your
click. See [`src/store/useAppStore.ts`](src/store/useAppStore.ts)
(`waitForApproval` / `respondToApproval`) and
[`src/components/ApprovalDialog.tsx`](src/components/ApprovalDialog.tsx).

- **Approve** → the real budget updates and the Activity Timeline logs it.
- **Reject** → nothing changes, the rejection is logged, and the agent does
  not retry on its own.

An **Agent Authority** toggle in the header (Observe / Assist) controls
whether the agent's mission is even allowed to reach this point: in
Observe, analysis runs but no change can be proposed.

## Simulation before Mutation

`simulate_budget_change` and `set_budget_goal` are deliberately two
different tools with two different guarantees:

```
simulate_budget_change   → read-only, no approval needed, run it freely
set_budget_goal          → mutating, always approval-gated
```

The Agent Mission always simulates before it ever asks to mutate — the
Recommendation card's "Impact" numbers come from a real
`simulate_budget_change` call, computed *before* `set_budget_goal` is ever
invoked. See [`src/webmcp/mission.ts`](src/webmcp/mission.ts).

## Demo

1. Open the [Live Demo](https://redcloudyun-cmyk.github.io/actgex/).
2. Click **+ Load Demo Data → US Demo**.
3. Click **Analyze My Spending**. Watch the mission steps run — transactions
   loaded, categories summarized, this month vs. last compared, unusual
   spending flagged, a recommendation generated, and its impact simulated.
4. Review the **Agent Recommendation** card (What / Why / Impact) and click
   **Review Recommendation**.
5. **Human Approval Required** appears with a Before/After table. Approve
   it — the budget changes for real, and the **Agent Activity** timeline
   records the whole chain, filterable by All / Human / Agent / Approved /
   Rejected.
6. Switch the language pill (EN / 한국어) — the UI, the activity log, and
   all formatting relocalize instantly; the underlying data and tool calls
   never change. **Reset Demo** restores the initial state at any time.

You can also drive the same tools manually from the **Agent Console**, or
click a category bar in "Spending by Category" and ask the agent to compare
it — the tool call inherits your selection as its default context.

## Testing with a real WebMCP agent

The **Agent Console** in the app is a deterministic **fallback simulator**
for hosts that don't yet expose `document.modelContext` — it calls the exact
same tool functions a real agent would (and the Agent Mission is built on
that same call path), so the demo works everywhere, but it is not itself a
WebMCP agent. To exercise real WebMCP discovery:

1. Use a Chrome build / extension that implements the WebMCP Community Group
   draft and exposes `document.modelContext` (check your challenge
   environment's setup instructions — this typically requires an experimental
   flag or an agent-enabled build, since WebMCP is not yet in stable Chrome).
2. Open the Live Demo above in that environment.
3. Confirm the header status pill reads **"8 WebMCP Tools Connected"** (not
   "Registering…" or "Registration failed" — registration is awaited and
   only reports Connected once all 8 tools are confirmed registered).
4. Ask your agent, in English or Korean:
   - *"Compare my dining spending this month with last month."* → `compare_spending_periods`
   - *"Did I spend unusually more on anything this month?"* → `flag_unusual_spending`
   - *"If I cut dining spending by 20%, how much would I save over 4 months?"* → `simulate_budget_change`
   - *"Set my dining budget to $400."* → `set_budget_goal`, which must pause at **Waiting for your approval** until you click Approve in the UI.
5. Verify each call, its arguments, and its result show up in **Agent Activity** tagged "via WebMCP" (vs. "via Demo Console" for fallback-simulator calls).

## Architecture

```
Human UI  ──┐
            ├── shared Zustand app state ── DuckDB-Wasm (transactions table)
Agent Tools ┘
```

- **Shared state is bidirectional.** A human's UI filter selection becomes
  the *default* context for any read-only tool call that omits that
  argument (e.g. asking "compare with last month" after clicking Dining in
  the UI compares Dining). An explicit agent argument always overrides it.
  Read-only tools never mutate view state themselves — only `set_budget_goal`
  changes real application data, and only after human approval.
- **"What the Agent Sees"** panel shows the same account, month,
  transaction count, and budget context the agent's tool calls implicitly
  read, so the shared-state behavior above is visible, not just documented.
- **UI language ≠ data.** Category ids, tool names, and stored values are
  locale-neutral canonical strings (`DINING`, `WAITING_APPROVAL`, …);
  `src/i18n` maps them to English or Korean at render time only.
- **Currency vs. UI locale are independent.** A dataset's currency (USD/KRW)
  comes from which demo you loaded; number/date formatting follows whichever
  UI language is currently selected.
- No backend. CSV/JSON never leaves the browser; DuckDB-Wasm runs entirely
  client-side.

## Privacy

ActGeX has no server component. All data (demo-generated or, in a future
CSV-upload release, user-provided) is processed and stored only in the
browser's WebAssembly runtime and never transmitted anywhere.

## How to run

```bash
npm install
npm run dev      # start the dev server
npm run test      # vitest unit tests
npm run lint      # oxlint
npm run build     # type-check + production build
```

Open the printed local URL, then click **Load Demo Data**.

## License

[MIT](LICENSE)
