import type { AnalysisResult } from '../../shared/types';
import { HistoryItem } from './HistoryItem';

interface Props {
  history: AnalysisResult[];
  onClear: () => void;
  onViewDetail: (id: string) => void;
}

export function HistoryList({ history, onClear, onViewDetail }: Props) {
  if (history.length === 0) {
    return (
      <div style={{ padding: '32px 14px', textAlign: 'center', color: '#9aa0a6', fontFamily: 'system-ui, sans-serif', fontSize: 15 }}>
        Right-click an image or hover over it to convert it to a prompt.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {history.map((r) => (
          <HistoryItem key={r.id} result={r} onViewDetail={onViewDetail} />
        ))}
      </div>
      <div style={{ borderTop: '1px solid #f0f0f0', padding: '10px 14px', textAlign: 'right' }}>
        <button onClick={onClear} style={{ background: 'none', border: 'none', color: '#c5221f', cursor: 'pointer', fontSize: 13 }}>
          Clear history
        </button>
      </div>
    </div>
  );
}
