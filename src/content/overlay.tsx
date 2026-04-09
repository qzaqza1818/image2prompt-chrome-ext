import { useState } from 'react';
import type { AnalyzeMessage } from '../shared/types';

interface Props {
  imageUrl: string;
}

export function OverlayButton({ imageUrl }: Props) {
  const [sent, setSent] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (sent) return;
    setSent(true);
    const message: AnalyzeMessage = { type: 'ANALYZE_IMAGE', imageUrl };
    chrome.runtime.sendMessage(message);
    setTimeout(() => setSent(false), 2000);
  }

  return (
    <>
      <style>{`
        .overlay-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #1a73e8;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 13px;
          font-family: system-ui, sans-serif;
          font-weight: 600;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transition: background 0.15s;
        }
        .overlay-btn:hover { background: #1557b0; }
        .overlay-btn.sent { background: #137333; }
      `}</style>
      <button className={`overlay-btn${sent ? ' sent' : ''}`} onClick={handleClick}>
        {sent ? '✓ Sent' : '🪄 Prompt'}
      </button>
    </>
  );
}
