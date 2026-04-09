import { StrictMode, useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { getSettings, saveSettings } from '../shared/storage';
import type { Provider, Settings } from '../shared/types';
import { PROVIDER_MODELS, DEFAULT_SETTINGS } from '../shared/types';

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'google', label: 'Google' },
];

function Options() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getSettings().then(setSettings).catch((err) => console.error('Failed to load settings:', err));
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function setProvider(provider: Provider) {
    const defaultModel = PROVIDER_MODELS[provider][0].id;
    setSettings((s) => ({ ...s, provider, model: defaultModel }));
  }

  function setModel(model: string) {
    setSettings((s) => ({ ...s, model }));
  }

  function setApiKey(provider: Provider, key: string) {
    setSettings((s) => ({ ...s, apiKeys: { ...s.apiKeys, [provider]: key } }));
  }

  async function handleSave() {
    try {
      await saveSettings(settings);
      setSaved(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 15, maxWidth: 500, margin: '0 auto', padding: '24px 20px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a73e8', marginBottom: 24 }}>🪄 Image to Prompt — Settings</h1>

      {/* Provider selector */}
      <section style={section}>
        <label style={labelStyle}>AI Provider</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {PROVIDERS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setProvider(id)}
              style={{
                ...segBtn,
                background: settings.provider === id ? '#1a73e8' : '#f1f3f4',
                color: settings.provider === id ? 'white' : '#333',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Model selector */}
      <section style={section}>
        <label style={labelStyle}>Model</label>
        <select
          value={settings.model}
          onChange={(e) => setModel(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 15 }}
        >
          {PROVIDER_MODELS[settings.provider].map(({ id, label }) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
        <div style={{ color: '#9aa0a6', fontSize: 13, marginTop: 4 }}>
          First option is faster and cheaper; second is higher quality.
        </div>
      </section>

      {/* API keys — one per provider */}
      {PROVIDERS.map(({ id, label }) => (
        <section key={id} style={section}>
          <label style={labelStyle}>{label} API Key</label>
          <input
            type="password"
            value={settings.apiKeys[id]}
            onChange={(e) => setApiKey(id, e.target.value)}
            placeholder={`Enter your ${label} API key`}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 15, boxSizing: 'border-box' }}
          />
        </section>
      ))}

      <button onClick={handleSave} style={{ background: '#1a73e8', color: 'white', border: 'none', borderRadius: 6, padding: '10px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
        {saved ? '✓ Saved' : 'Save Settings'}
      </button>
    </div>
  );
}

const section: React.CSSProperties = { marginBottom: 20 };
const labelStyle: React.CSSProperties = { display: 'block', fontWeight: 600, color: '#333', marginBottom: 8, fontSize: 15 };
const segBtn: React.CSSProperties = { border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 14, cursor: 'pointer', fontWeight: 600 };

createRoot(document.getElementById('root')!).render(
  <StrictMode><Options /></StrictMode>
);
