import type { AnalysisResult } from '../../shared/types';

interface Props {
  result: AnalysisResult;
  onViewDetail: (id: string) => void;
}

export function HistoryItem({ result, onViewDetail }: Props) {
  const preview = result.error
    ? `Error: ${result.error}`
    : result.fullPrompt.slice(0, 60) + (result.fullPrompt.length > 60 ? '…' : '');

  const timeLabel = new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onViewDetail(result.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onViewDetail(result.id); }}
      style={{
        borderBottom: '1px solid #f0f0f0',
        padding: '10px 14px',
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        background: 'white',
        cursor: 'pointer',
        fontFamily: 'system-ui, sans-serif',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#f8f9fa'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'white'; }}
    >
      <img
        src={result.imageUrl}
        alt=""
        style={{ width: 52, height: 38, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#333', fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {preview}
        </div>
        <div style={{ color: '#9aa0a6', fontSize: 11 }}>{result.provider} · {timeLabel}</div>
      </div>
      <span style={{ color: '#9aa0a6', fontSize: 14 }}>▸</span>
    </div>
  );
}
