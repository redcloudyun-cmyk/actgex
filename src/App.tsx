import { useEffect, useState } from 'react';
import { ActivityTimeline } from './components/ActivityTimeline';
import { AgentConsole } from './components/AgentConsole';
import { ApprovalDialog } from './components/ApprovalDialog';
import { BudgetPanel } from './components/BudgetPanel';
import { CategoryChart } from './components/CategoryChart';
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

function App() {
  const setDbReady = useAppStore((s) => s.setDbReady);
  const [webmcpConnected, setWebmcpConnected] = useState(false);

  useEffect(() => {
    getDb()
      .then(() => setDbReady(true))
      .catch((err) => console.error('Failed to initialize DuckDB-Wasm', err));
  }, [setDbReady]);

  useEffect(() => {
    if (webmcpConnected) return;
    const tryRegister = () => {
      if (isWebMcpAvailable()) {
        registerWebMcpTools();
        setWebmcpConnected(true);
        return true;
      }
      return false;
    };
    if (tryRegister()) return;
    const interval = window.setInterval(() => {
      if (tryRegister()) window.clearInterval(interval);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [webmcpConnected]);

  return (
    <div className="flex h-screen flex-col bg-[var(--color-bg)]">
      <Header webmcpConnected={webmcpConnected} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar docsUrl={REPO_URL} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] space-y-4 p-4 sm:p-5">
            <Hero docsUrl={REPO_URL} />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
              <div className="space-y-4">
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

              <div className="flex flex-col gap-4 xl:sticky xl:top-4 xl:h-[calc(100vh-96px)]">
                <TopToolsPanel />
                <div id="executions" className="min-h-0 flex-1 scroll-mt-20">
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
