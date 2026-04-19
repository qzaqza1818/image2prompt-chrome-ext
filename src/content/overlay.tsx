import { useState } from 'react';
import type { AnalyzeInlineMessage } from '../shared/types';

interface Props {
  imageUrl: string;
  aspectRatio?: string;
  onAnalyzing: () => void;
}

export function OverlayButton({ imageUrl, aspectRatio, onAnalyzing }: Props) {
  const [loading, setLoading] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    onAnalyzing();
    const message: AnalyzeInlineMessage = { type: 'ANALYZE_IMAGE_INLINE', imageUrl, aspectRatio };
    chrome.runtime.sendMessage(message);
  }

  return (
    <>
      <style>{`
        .overlay-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(15, 15, 15, 0.72);
          color: white;
          border: none;
          border-radius: 20px;
          padding: 6px 12px 6px 9px;
          font-size: 13px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          font-weight: 500;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 2px 10px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          transition: background 0.15s, transform 0.15s;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }
        .overlay-btn:hover { background: rgba(0,0,0,0.88); transform: scale(1.04); }
        .overlay-btn.loading {
          background: rgba(26,115,232,0.85);
          cursor: default;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner {
          width: 13px;
          height: 13px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
      `}</style>
      <button
        className={`overlay-btn${loading ? ' loading' : ''}`}
        onClick={handleClick}
        title={loading ? 'Analyzing…' : 'Retrieve Prompt'}
      >
        {loading
          ? <><span className="spinner" /> Retrieving…</>
          : <>🪄 Retrieve Prompt</>
        }
      </button>
    </>
  );
}
