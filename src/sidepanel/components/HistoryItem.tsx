import { useState } from 'react';
import type { AnalysisResult } from '../../shared/types';

interface Props {
  result: AnalysisResult;
  onViewDetail: (id: string) => void;
}

export function HistoryItem({ result, onViewDetail }: Props) {
  const [expanded, setExpanded] = useState(false);

  function copy(text: string) {
    navigator.clipboard.writeText(text).catch((err) => {
      console.error('Clipboard write failed:', err);
    });
  }

  const preview = result.error
    ? `Error: ${result.error}`
    : result.fullPrompt.slice(0, 60) + (result.fullPrompt.length > 60 ? '…' : '');

  const timeLabel = new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ borderBottom: '1px solid #f0f0f0', fontFamily: 'system-ui, sans-serif' }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded(!expanded); }}
        style={{
          padding: '10px 14px',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          background: expanded ? '#e8f0fe' : 'white',
          cursor: 'pointer',
        }}
      >
        <img
          src={result.imageUrl}
          alt=""
          style={{ width: 52, height: 38, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: expanded ? '#1a73e8' : '#333', fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {preview}
          </div>
          <div style={{ color: '#9aa0a6', fontSize: 11 }}>{result.provider} · {timeLabel}</div>
        </div>
        <span style={{ color: expanded ? '#1a73e8' : '#9aa0a6', fontSize: 16 }}>{expanded ? '▾' : '▸'}</span>
      </div>

      {expanded && !result.error && (
        <div style={{ padding: '10px 14px', background: '#f8f9fa' }}>
          <div style={{ fontSize: 11, color: '#9aa0a6', textTransform: 'uppercase', marginBottom: 4 }}>Full Prompt</div>
          <div style={{ background: 'white', borderRadius: 4, padding: 8, color: '#333', lineHeight: 1.5, fontSize: 13, border: '1px solid #eee' }}>
            {result.fullPrompt}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => copy(result.fullPrompt)} style={btnPrimary}>Copy</button>
            <button onClick={() => onViewDetail(result.id)} style={btnSecondary}>Details ▸</button>
          </div>
        </div>
      )}
      {expanded && result.error && (
        <div style={{ padding: '10px 14px', background: '#fef7e0', color: '#c5221f', fontSize: 13 }}>
          {result.error === 'NO_API_KEY' && 'No API key. Open Settings to add one.'}
          {result.error === 'IMAGE_FETCH_FAILED' && 'Could not load the image.'}
          {result.error === 'API_CALL_FAILED' && 'API call failed. Check your key.'}
        </div>
      )}
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  background: '#1a73e8', color: 'white', border: 'none', borderRadius: 4,
  padding: '4px 12px', fontSize: 13, cursor: 'pointer', fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
  background: '#f1f3f4', color: '#555', border: 'none', borderRadius: 4,
  padding: '4px 12px', fontSize: 13, cursor: 'pointer',
};
