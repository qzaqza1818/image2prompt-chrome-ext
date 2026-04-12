import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { getHistory, clearHistory } from '../shared/storage';
import type { AnalysisResult } from '../shared/types';
import { HistoryList } from './components/HistoryList';
import { DetailView } from './components/DetailView';

function SidePanel() {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);

  async function loadHistory() {
    setHistory(await getHistory());
  }

  useEffect(() => {
    void loadHistory();
    const listener = (_changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local') void loadHistory();
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  async function handleClear() {
    await clearHistory();
    setHistory([]);
    setDetailId(null);
  }

  const detailResult = detailId ? history.find((r) => r.id === detailId) : null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#111', color: 'white', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🪄</span>
          <span style={{ fontWeight: 700, fontSize: 16, fontFamily: 'system-ui, sans-serif' }}>Image to Prompt</span>
        </div>
        {history.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: 12, fontSize: 13, fontFamily: 'system-ui' }}>
            {history.length}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {detailResult ? (
          <DetailView result={detailResult} onBack={() => setDetailId(null)} />
        ) : (
          <HistoryList history={history} onClear={handleClear} onViewDetail={setDetailId} />
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><SidePanel /></StrictMode>
);
