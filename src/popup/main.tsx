import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { getHistory } from '../shared/storage';
import type { AnalysisResult } from '../shared/types';

function Popup() {
  const [latest, setLatest] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getHistory().then((h) => setLatest(h[0] ?? null));
  }, []);

  function copy() {
    if (!latest?.fullPrompt) return;
    navigator.clipboard.writeText(latest.fullPrompt).catch((err) => console.error('Clipboard write failed:', err));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openPanel() {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) chrome.sidePanel.open({ tabId: tab.id });
    });
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 15, width: 300 }}>
      {/* Header */}
      <div style={{ background: '#1a73e8', color: 'white', padding: '10px 14px', fontWeight: 700, fontSize: 15 }}>
        🪄 Image to Prompt
      </div>

      <div style={{ padding: '12px 14px' }}>
        {!latest ? (
          <div style={{ color: '#9aa0a6', textAlign: 'center', padding: '12px 0', fontSize: 14 }}>
            Right-click an image or hover to convert it to a prompt.
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: '#9aa0a6', textTransform: 'uppercase', marginBottom: 4 }}>Last Result</div>
            <div style={{ background: '#f8f9fa', borderRadius: 4, padding: 8, color: '#333', lineHeight: 1.5, fontSize: 13, marginBottom: 10 }}>
              {latest.fullPrompt
                ? latest.fullPrompt.slice(0, 120) + (latest.fullPrompt.length > 120 ? '…' : '')
                : `Error: ${latest.error}`}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={copy} disabled={!latest.fullPrompt} style={{ ...btn('#1a73e8', 'white'), flex: 1 }}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              <button onClick={openPanel} style={{ ...btn('#f1f3f4', '#333'), flex: 1 }}>
                Open Panel
              </button>
            </div>
          </>
        )}
      </div>

      <div style={{ borderTop: '1px solid #f0f0f0', padding: '8px 14px', textAlign: 'right' }}>
        <button onClick={openOptions} style={{ background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', fontSize: 13 }}>
          ⚙ Settings
        </button>
      </div>
    </div>
  );
}

function btn(bg: string, color: string): React.CSSProperties {
  return { background: bg, color, border: 'none', borderRadius: 4, padding: '6px 0', fontSize: 13, cursor: 'pointer', fontWeight: 600 };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><Popup /></StrictMode>
);
