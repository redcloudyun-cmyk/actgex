import { useEffect, useState } from 'react';
import { ActivityTimeline } from './components/ActivityTimeline';
import { AgentConsole } from './components/AgentConsole';
import { AgentContextPanel } from './components/AgentContextPanel';
import { AgentMissionPanel } from './components/AgentMissionPanel';
import { ApprovalDialog } from './components/ApprovalDialog';
import { BudgetPanel } from './components/BudgetPanel';
import { CategoryChart } from './components/CategoryChart';
import { FinancialSummaryStrip } from './components/FinancialSummaryStrip';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { KpiCards } from './components/KpiCards';
import { Sidebar } from './components/Sidebar';
import { SpendingChart } from './components/SpendingChart';
import { ToolsReference } from './components/ToolsReference';
import { TopToolsPanel } from './components/TopToolsPanel';
import { TransactionTable } from './components/TransactionTable';
import { REPO_URL } from './config';
import { getDb } from './db/duckdb';
import { useAppStore } from './store/useAppStore';
import { isWebMcpAvailable, registerWebMcpTools } from './webmcp/registerTools';
import type { WebMcpStatus } from './webmcp/status';

function App() {
  const setDbReady = useAppStore((s) => s.setDbReady);
  const [webmcpStatus, setWebmcpStatus] = useState<WebMcpStatus>('UNAVAILABLE');

  useEffect(() => {
    getDb()
      .then(() => setDbReady(true))
      .catch((err) => console.error('Failed to initialize DuckDB-Wasm', err));
  }, [setDbReady]);

  useEffect(() => {
    let cancelled = false;
    let interval: number | undefined;

    async function attempt() {
      if (!isWebMcpAvailable()) return false;
      if (interval !== undefined) window.clearInterval(interval);
      setWebmcpStatus('REGISTERING');
      const success = await registerWebMcpTools();
      if (!cancelled) setWebmcpStatus(success ? 'CONNECTED' : 'FAILED');
      return true;
    }

    attempt().then((found) => {
      if (found || cancelled) return;
      interval = window.setInterval(() => {
        attempt();
      }, 1000);
    });

    return () => {
      cancelled = true;
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex h-screen flex-col bg-[var(--color-bg)]">
      <Header webmcpStatus={webmcpStatus} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar docsUrl={REPO_URL} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] space-y-4 p-4 sm:p-5">
            <Hero docsUrl={REPO_URL} />

            <AgentMissionPanel />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
              <div className="space-y-4">
                <FinancialSummaryStrip />
                <KpiCards />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <SpendingChart />
                  <CategoryChart />
                </div>
                <ToolsReference />
                <div id="shared-state" className="scroll-mt-20">
                  <TransactionTable />
                </div>
                <div id="approvals" className="scroll-mt-20">
                  <BudgetPanel />
                </div>
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto xl:sticky xl:top-4 xl:h-[calc(100vh-96px)]">
                <AgentContextPanel />
                <TopToolsPanel />
                <div id="executions" className="min-h-[260px] flex-1 scroll-mt-20">
                  <ActivityTimeline />
                </div>
                <div id="agents" className="scroll-mt-20">
                  <AgentConsole />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ApprovalDialog />
    </div>
  );
}

export default App;
