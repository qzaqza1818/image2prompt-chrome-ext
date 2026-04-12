import { useState, useEffect } from 'react';
import type { AnalysisResult } from '../shared/types';

const APPS = [
  { name: 'Midjourney', url: 'https://www.midjourney.com' },
  { name: 'Lovart', url: 'https://lovart.ai' },
  { name: 'CapCut', url: 'https://www.capcut.com' },
  { name: 'Lumina', url: 'https://ai.byteplus.com/lumina' },
];

interface Props {
  result: AnalysisResult;
  onClose: () => void;
}

export function PromptModal({ result, onClose }: Props) {
  const [tab, setTab] = useState<'json' | 'full'>('json');
  const [selectedApp, setSelectedApp] = useState(APPS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load persisted app selection on mount
  useEffect(() => {
    chrome.storage.local.get('selectedApp').then((data) => {
      const saved = APPS.find((a) => a.name === data.selectedApp);
      if (saved) setSelectedApp(saved);
    });
  }, []);

  const jsonContent = JSON.stringify(
    result.jsonPrompt ?? result.breakdown,
    null,
    2
  );
  const currentContent = tab === 'json' ? jsonContent : result.fullPrompt;

  function copyText(text: string) {
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyAndOpen() {
    copyText(currentContent);
    window.open(selectedApp.url, '_blank', 'noopener');
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="itp-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="itp-header">
          <div className="itp-title">
            <span className="itp-icon">🪄</span>
            <span>Retrieve Prompt</span>
          </div>
          <button className="itp-close" onClick={onClose} title="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="itp-tabs">
          <button
            className={`itp-tab${tab === 'json' ? ' active' : ''}`}
            onClick={() => setTab('json')}
          >JSON</button>
          <button
            className={`itp-tab${tab === 'full' ? ' active' : ''}`}
            onClick={() => setTab('full')}
          >Full Prompt</button>
        </div>

        {/* Content */}
        <div className="itp-body">
          {result.error ? (
            <p className="itp-error">
              {result.error === 'NO_API_KEY' && 'No API key configured. Open Settings to add one.'}
              {result.error === 'IMAGE_FETCH_FAILED' && 'Could not fetch this image.'}
              {result.error === 'API_CALL_FAILED' && 'AI analysis failed. Please try again.'}
            </p>
          ) : (
            <pre className="itp-pre">{currentContent}</pre>
          )}
        </div>

        {/* Footer */}
        {!result.error && (
          <div className="itp-footer">
            <div className="itp-app-row">
              <button className="itp-open-btn" onClick={copyAndOpen}>
                <svg className="itp-open-icon" width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 11L11 2M11 2H6M11 2v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Copy &amp; Open in {selectedApp.name}
              </button>
              <div className="itp-dd-wrap">
                <button
                  className="itp-dd-toggle"
                  onClick={() => setDropdownOpen((o) => !o)}
                  title="Choose app"
                >
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {dropdownOpen && (
                  <div className="itp-dropdown">
                    {APPS.map((app) => (
                      <button
                        key={app.name}
                        className={`itp-dd-item${app.name === selectedApp.name ? ' active' : ''}`}
                        onClick={() => { setSelectedApp(app); setDropdownOpen(false); chrome.storage.local.set({ selectedApp: app.name }); }}
                      >
                        {app.name}
                        {app.name === selectedApp.name && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="#1a73e8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              className={`itp-copy-btn${copied ? ' copied' : ''}`}
              onClick={() => copyText(currentContent)}
            >
              {copied
                ? <><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1.5 7L5 10.5 11.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> Copied!</>
                : <><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M1 9V2a1 1 0 011-1h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> Copy to Clipboard</>
              }
            </button>
          </div>
        )}
      </div>
    </>
  );
}

const STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .itp-modal {
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.1);
    width: 425px;
    max-height: 480px;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    overflow: hidden;
    border: 1px solid rgba(0,0,0,0.08);
    pointer-events: auto;
  }

  .itp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 14px 11px;
    background: #111;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    flex-shrink: 0;
  }

  .itp-title {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    letter-spacing: -0.1px;
  }

  .itp-icon { font-size: 15px; }

  .itp-close {
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(255,255,255,0.55);
    padding: 4px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    pointer-events: auto;
    transition: color 0.15s, background 0.15s;
  }
  .itp-close:hover { color: #fff; background: rgba(255,255,255,0.12); }

  .itp-tabs {
    display: flex;
    padding: 0 14px;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
    gap: 2px;
  }

  .itp-tab {
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 9px 12px;
    font-size: 12.5px;
    font-weight: 500;
    color: #999;
    cursor: pointer;
    pointer-events: auto;
    margin-bottom: -1px;
    transition: color 0.15s, border-color 0.15s;
    letter-spacing: 0.1px;
  }
  .itp-tab.active { color: #111; border-bottom-color: #111; }
  .itp-tab:hover:not(.active) { color: #444; }

  .itp-body {
    flex: 1;
    overflow-y: auto;
    padding: 13px 14px;
    background: #f8f9fa;
    scrollbar-width: thin;
    scrollbar-color: #ddd transparent;
  }
  .itp-body::-webkit-scrollbar { width: 4px; }
  .itp-body::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }

  .itp-pre {
    font-size: 11.5px;
    line-height: 1.65;
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace;
    color: #2d2d2d;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .itp-error {
    font-size: 13px;
    color: #c0392b;
    line-height: 1.5;
  }

  .itp-footer {
    padding: 11px 14px 13px;
    border-top: 1px solid #f0f0f0;
    display: flex;
    flex-direction: column;
    gap: 7px;
    flex-shrink: 0;
  }

  .itp-app-row {
    display: flex;
    gap: 0;
    border-radius: 9px;
    overflow: visible;
    position: relative;
  }

  .itp-open-btn {
    flex: 1;
    background: #111;
    color: #fff;
    border: none;
    border-radius: 9px 0 0 9px;
    padding: 9px 12px;
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .itp-open-btn:hover { background: #222; }

  .itp-open-icon { flex-shrink: 0; }

  .itp-dd-wrap {
    position: relative;
  }

  .itp-dd-toggle {
    background: #222;
    color: #fff;
    border: none;
    border-left: 1px solid #444;
    border-radius: 0 9px 9px 0;
    padding: 9px 11px;
    cursor: pointer;
    pointer-events: auto;
    display: flex;
    align-items: center;
    transition: background 0.15s;
    height: 100%;
  }
  .itp-dd-toggle:hover { background: #333; }

  .itp-dropdown {
    position: absolute;
    bottom: calc(100% + 6px);
    right: 0;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 10px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.13);
    overflow: hidden;
    min-width: 148px;
    z-index: 10;
    pointer-events: auto;
  }

  .itp-dd-item {
    width: 100%;
    background: none;
    border: none;
    padding: 9px 13px;
    font-size: 13px;
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    pointer-events: auto;
    color: #222;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background 0.1s;
  }
  .itp-dd-item:hover { background: #f7f7f7; }
  .itp-dd-item.active { font-weight: 600; }

  .itp-copy-btn {
    width: 100%;
    background: #f6f6f6;
    color: #333;
    border: 1px solid #e4e4e4;
    border-radius: 9px;
    padding: 8px;
    font-size: 12.5px;
    font-family: inherit;
    font-weight: 500;
    cursor: pointer;
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.15s;
  }
  .itp-copy-btn:hover { background: #ececec; }
  .itp-copy-btn.copied { background: #eaf6ee; color: #1a7a3c; border-color: #a8d8b8; }
`;
