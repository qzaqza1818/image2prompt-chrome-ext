import type { AnalysisResult } from '../../shared/types';

interface Props {
  result: AnalysisResult;
  onBack: () => void;
}

const LABEL: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: '#9aa0a6',
  marginBottom: 4,
};

export function DetailView({ result, onBack }: Props) {
  function copy(text: string) {
    navigator.clipboard.writeText(text).catch((err) => {
      console.error('Clipboard write failed:', err);
    });
  }

  const jsonText = JSON.stringify(result.jsonPrompt ?? result.breakdown, null, 2);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 15 }}>
      <div style={{ background: '#111', color: 'white', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} aria-label="Back to history" style={{ background: 'none', border: 'none', color: 'white', fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
        <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {result.fullPrompt.slice(0, 40) || 'Error'}
        </span>
      </div>

      <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f0f0' }}>
        <img src={result.imageUrl} alt="" style={{ width: '100%', maxHeight: 140, objectFit: 'contain', borderRadius: 4 }} />
        <div style={{ color: '#9aa0a6', fontSize: 11, marginTop: 6 }}>
          {result.provider} · {result.model} · {new Date(result.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {result.error ? (
        <div style={{ padding: '12px 14px', color: '#c5221f' }}>
          {result.error === 'NO_API_KEY' && 'No API key configured. Go to Settings.'}
          {result.error === 'IMAGE_FETCH_FAILED' && 'Could not fetch the image (CORS or network error).'}
          {result.error === 'API_CALL_FAILED' && 'AI API call failed. Check your API key and try again.'}
        </div>
      ) : (
        <>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={LABEL}>Full Prompt</div>
            <div style={{ background: '#f8f9fa', borderRadius: 4, padding: 8, color: '#333', lineHeight: 1.5, fontSize: 14 }}>
              {result.fullPrompt}
            </div>
            <button onClick={() => copy(result.fullPrompt)} style={copyBtnStyle}>Copy</button>
          </div>

          <div style={{ padding: '12px 14px' }}>
            <div style={LABEL}>JSON</div>
            <pre style={{
              background: '#f8f9fa',
              borderRadius: 4,
              padding: 8,
              margin: 0,
              color: '#333',
              fontSize: 12,
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: "'SF Mono', Consolas, monospace",
            }}>
              {jsonText}
            </pre>
            <button onClick={() => copy(jsonText)} style={{ ...copyBtnStyle, background: '#f1f3f4', color: '#555', marginTop: 6 }}>
              Copy JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const copyBtnStyle: React.CSSProperties = {
  marginTop: 8,
  background: '#1a73e8',
  color: 'white',
  border: 'none',
  borderRadius: 4,
  padding: '5px 14px',
  fontSize: 13,
  cursor: 'pointer',
  fontWeight: 600,
};
