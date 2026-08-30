# ActGeX

**Agent-native action layer for the web.** ActGeX connects AI agents to a
real personal-finance workspace — a human web UI and a set of real
[WebMCP](https://github.com/webmachinelearning/webmcp) tools that both read
and write the *same* application state.

## What is ActGeX?

A browser-only spending dashboard (transactions, category breakdown, budget
goals) backed by [DuckDB-Wasm](https://duckdb.org/docs/api/wasm/overview).
The human UI, the agent tools, and the underlying data all share one piece
of app state. Click a category filter, and the agent sees it. Have an agent
call a tool, and the chart, table, and budget panel update live.

## Why WebMCP?

Most "AI web apps" make the agent guess at a UI: inspect the DOM, find a
button, click it, hope the page didn't change shape. ActGeX instead
registers its real capabilities — query, compare, flag, recommend, simulate,
mutate, export — as typed tools on `document.modelContext`, so a
WebMCP-aware agent can call them directly, with the same guarantees a human
click would give.

## Demo

1. Click **+ Load Demo Data → US Demo** (or **Korea Demo**) in the header.
2. Click a category bar, or type into the transaction search/date filters —
   normal human UI, reflected instantly in shared state.
3. Open the **Agent Console** (bottom-right, or via the **Agents** sidebar
   item) and try a suggestion, e.g. *"Compare my dining spending this month
   with last month."* The same real tools your agent would call run right
   there, and every call appears in **Agent Activity**.
4. Ask it to recommend and apply a new budget — a **human approval dialog**
   appears before anything actually changes, because `set_budget_goal`
   mutates real state.
5. Switch the language switcher (EN / 한국어) — the UI, the activity log,
   and all formatting relocalize instantly. The underlying data and WebMCP
   tool calls never change.

A real WebMCP-capable browser/extension can also discover and call these
tools directly — the **Agent Console** is only a fallback simulator for
hosts that don't yet expose `document.modelContext`, so the same tool calls
are demonstrable without one.

## Tools

All tools are registered via `document.modelContext.registerTool` in
[`src/webmcp/registerTools.ts`](src/webmcp/registerTools.ts) and implemented
in [`src/webmcp/tools.ts`](src/webmcp/tools.ts) against a real DuckDB-Wasm
`transactions` table — not a mock API. The same list renders live in the
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

## Architecture

```
Human UI  ──┐
            ├── shared Zustand app state ── DuckDB-Wasm (transactions table)
Agent Tools ┘
```

- **UI language ≠ data.** Category ids, tool names, and stored values are
  locale-neutral canonical strings (`DINING`, `WAITING_APPROVAL`, …);
  `src/i18n` maps them to English or Korean at render time only.
- **Currency vs. UI locale are independent.** A dataset's currency (USD/KRW)
  comes from which demo you loaded; number/date formatting follows whichever
  UI language is currently selected — you can view KRW data with English UI
  formatting rules, or vice versa.
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
npm run build    # type-check + production build
npm run lint      # oxlint
```

Open the printed local URL, then click **Load Demo Data**.

## License

[MIT](LICENSE)
