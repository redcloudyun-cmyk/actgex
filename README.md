# ActGeX

**Agent-native action layer for the web.** ActGeX connects AI agents to a
real personal-finance workspace — a human web UI and a set of real
[WebMCP](https://github.com/webmachinelearning/webmcp) tools that both read
and write the *same* application state.

## Live Demo

**https://redcloudyun-cmyk.github.io/actgex/**

No login. Click **+ Load Demo Data** on first load.

## What is ActGeX?

A browser-only spending dashboard (transactions, category breakdown, budget
goals) backed by [DuckDB-Wasm](https://duckdb.org/docs/api/wasm/overview).
The human UI, the agent tools, and the underlying data all share one piece
of app state. Click a category filter, and any agent tool call that omits
a category inherits it. Have an agent call a tool, and the chart, table,
and budget panel update live.

## Why WebMCP?

Most "AI web apps" make the agent guess at a UI: inspect the DOM, find a
button, click it, hope the page didn't change shape. ActGeX instead
registers its real capabilities — query, compare, flag, recommend, simulate,
mutate, export — as typed tools on `document.modelContext` (the current
WebMCP Community Group draft API), so a WebMCP-aware agent can call them
directly, with the same guarantees a human click would give.

## Judge Quick Test

1. Open the [Live Demo](https://redcloudyun-cmyk.github.io/actgex/).
2. Click **+ Load Demo Data → US Demo**.
3. Click the **Dining** bar in "Spending by Category" (human UI).
4. Open the **Agent Console** (bottom-right) and click *"Compare my dining
   spending this month with last month."* — a real `compare_spending_periods`
   WebMCP tool call runs and appears in **Agent Activity**.
5. Click *"Dining spending is too high — recommend and apply a new budget."*
   — a human **approval dialog** appears before the budget actually changes,
   because `set_budget_goal` mutates real state. Approve or reject it.
6. Switch the language pill (EN / 한국어) in the header — the UI, the
   activity log, and all formatting relocalize instantly; the underlying
   data and tool calls never change.

## Testing with a real WebMCP agent

The **Agent Console** in the app is a deterministic **fallback simulator**
for hosts that don't yet expose `document.modelContext` — it calls the exact
same tool functions a real agent would, so the demo works everywhere, but it
is not itself a WebMCP agent. To exercise real WebMCP discovery:

1. Use a Chrome build / extension that implements the WebMCP Community Group
   draft and exposes `document.modelContext` (check your challenge
   environment's setup instructions — this typically requires an experimental
   flag or an agent-enabled build, since WebMCP is not yet in stable Chrome).
2. Open the Live Demo above in that environment.
3. Confirm the header status pill reads **"WebMCP Connected"** (not
   "Registering…" or "Registration failed" — registration is awaited and
   only reports Connected once all 8 tools are confirmed registered).
4. Ask your agent, in English or Korean:
   - *"Compare my dining spending this month with last month."* → `compare_spending_periods`
   - *"Did I spend unusually more on anything this month?"* → `flag_unusual_spending`
   - *"If I cut dining spending by 20%, how much would I save over 4 months?"* → `simulate_budget_change`
   - *"Set my dining budget to $400."* → `set_budget_goal`, which must pause at **Waiting for your approval** until you click Approve in the UI.
5. Verify each call, its arguments, and its result show up in **Agent Activity** tagged "via WebMCP" (vs. "via Demo Console" for fallback-simulator calls).

## Tools

All tools are registered via `document.modelContext.registerTool` in
[`src/webmcp/registerTools.ts`](src/webmcp/registerTools.ts) — every call is
awaited, so "WebMCP Connected" only appears after every tool is actually
confirmed registered — and implemented in
[`src/webmcp/tools.ts`](src/webmcp/tools.ts) against a real DuckDB-Wasm
`transactions` table, not a mock API. The same list renders live in the
app's **Tools** section, and actual call counts show up in **Top Tools**.

| Tool | Read-only | Purpose |
|---|---|---|
| `query_transactions` | ✅ | Filter transactions by category, date range, amount, merchant text |
| `get_category_summary` | ✅ | Totals, counts, averages, share-of-total per category |
| `compare_spending_periods` | ✅ | Diff two periods (defaults to this month vs. last) |
| `flag_unusual_spending` | ✅ | Rule-based anomaly flag: recent 30d > 3-month avg × 1.3 |
| `recommend_budget_goal` | ✅ | Suggest a monthly limit from 3-month average spend |
| `simulate_budget_change` | ✅ | What-if: reduce a category by X% for Y months |
| `set_budget_goal` | ❌ | Change a real budget limit — always requires on-screen human approval |
| `export_report` | ✅ | Export the current category summary as Markdown or CSV |

Every tool validates its own input (finite/positive budgets, 0–100%
reductions, 1–60 month windows, non-negative amount ranges, strict
`YYYY-MM-DD` dates) and reports typed, localized errors — see
`src/webmcp/errors.ts`.

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
