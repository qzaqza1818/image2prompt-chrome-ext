import { StrictMode, useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { getHistory } from '../shared/storage';
import type { AnalysisResult } from '../shared/types';

function Popup() {
  const [latest, setLatest] = useState<AnalysisResult | null>(null);
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const timerFull = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerJson = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getHistory().then((h) => setLatest(h[0] ?? null));
  }, []);

  useEffect(() => () => {
    if (timerFull.current) clearTimeout(timerFull.current);
    if (timerJson.current) clearTimeout(timerJson.current);
  }, []);

  function copyFull() {
    if (!latest?.fullPrompt) return;
    navigator.clipboard.writeText(latest.fullPrompt).then(() => {
      setCopiedFull(true);
      if (timerFull.current) clearTimeout(timerFull.current);
      timerFull.current = setTimeout(() => setCopiedFull(false), 2000);
    });
  }

  function copyJson() {
    if (!latest) return;
    const text = JSON.stringify(latest.jsonPrompt ?? latest.breakdown, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedJson(true);
      if (timerJson.current) clearTimeout(timerJson.current);
      timerJson.current = setTimeout(() => setCopiedJson(false), 2000);
    });
  }

  function openPanel() {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
    });
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
  }

  const jsonText = latest ? JSON.stringify(latest.jsonPrompt ?? latest.breakdown, null, 2) : '';

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 14, width: 340, background: '#fff' }}>
      {/* Header */}
      <div style={{ background: '#111', color: 'white', padding: '11px 14px', fontWeight: 700, fontSize: 15 }}>
        🪄 Image to Prompt
      </div>

      {!latest ? (
        <div style={{ color: '#9aa0a6', textAlign: 'center', padding: '24px 14px', fontSize: 13 }}>
          Hover over an image and click<br />🪄 Retrieve Prompt to get started.
        </div>
      ) : latest.error ? (
        <div style={{ padding: '14px', color: '#c5221f', fontSize: 13 }}>
          {latest.error === 'NO_API_KEY' && 'No API key configured. Open Settings to add one.'}
          {latest.error === 'IMAGE_FETCH_FAILED' && 'Could not fetch the image.'}
          {latest.error === 'API_CALL_FAILED' && 'AI analysis failed. Try again.'}
        </div>
      ) : (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Full Prompt */}
          <div>
            <div style={labelStyle}>Full Prompt</div>
            <div style={{ background: '#f8f9fa', borderRadius: 6, padding: '8px 10px', color: '#222', lineHeight: 1.55, fontSize: 13, maxHeight: 110, overflowY: 'auto' }}>
              {latest.fullPrompt}
            </div>
            <button onClick={copyFull} style={{ ...actionBtn('#1a73e8', '#fff'), marginTop: 6, width: '100%' }}>
              {copiedFull ? '✓ Copied' : 'Copy Full Prompt'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid #f0f0f0' }} />

          {/* JSON */}
          <div>
            <div style={labelStyle}>JSON</div>
            <pre style={{ background: '#f8f9fa', borderRadius: 6, padding: '8px 10px', margin: 0, color: '#222', fontSize: 11, lineHeight: 1.55, maxHeight: 180, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: "'SF Mono', Consolas, monospace" }}>
              {jsonText}
            </pre>
            <button onClick={copyJson} style={{ ...actionBtn('#f1f3f4', '#333'), marginTop: 6, width: '100%' }}>
              {copiedJson ? '✓ Copied' : 'Copy JSON'}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #f0f0f0', padding: '8px 12px', display: 'flex', gap: 8 }}>
        <button onClick={openPanel} style={footerBtn}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="12" height="2.5" rx="1" fill="currentColor"/>
            <rect x="1" y="5.5" width="12" height="2.5" rx="1" fill="currentColor"/>
            <rect x="1" y="10" width="12" height="2.5" rx="1" fill="currentColor"/>
          </svg>
          History
        </button>
        <button onClick={openOptions} style={footerBtn}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 1v1.5M7 11.5V13M13 7h-1.5M2.5 7H1M11.24 2.76l-1.06 1.06M3.82 10.18l-1.06 1.06M11.24 11.24l-1.06-1.06M3.82 3.82L2.76 2.76" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Settings
        </button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: '#9aa0a6',
  marginBottom: 5,
};

function actionBtn(bg: string, color: string): React.CSSProperties {
  return {
    background: bg,
    color,
    border: 'none',
    borderRadius: 6,
    padding: '7px 0',
    fontSize: 12.5,
    cursor: 'pointer',
    fontWeight: 600,
  };
}

const footerBtn: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  background: '#f1f3f4',
  color: '#444',
  border: 'none',
  borderRadius: 7,
  padding: '7px 0',
  fontSize: 12.5,
  fontWeight: 600,
  cursor: 'pointer',
};

createRoot(document.getElementById('root')!).render(
  <StrictMode><Popup /></StrictMode>
);
