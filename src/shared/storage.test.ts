import { describe, it, expect } from 'vitest';
import {
  getSettings,
  saveSettings,
  getHistory,
  addToHistory,
  clearHistory,
} from './storage';
import type { AnalysisResult } from './types';
import { DEFAULT_SETTINGS } from './types';

const makeResult = (id: string): AnalysisResult => ({
  id,
  imageUrl: 'https://example.com/img.jpg',
  fullPrompt: 'A test prompt',
  breakdown: { subject: 'test', style: 'test', mood: 'test', technical: 'test' },
  provider: 'anthropic',
  model: 'claude-haiku-4-5-20251001',
  timestamp: Date.now(),
});

describe('getSettings', () => {
  it('returns default settings when nothing stored', async () => {
    const settings = await getSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('merges stored settings with defaults', async () => {
    await saveSettings({ ...DEFAULT_SETTINGS, provider: 'openai', model: 'gpt-4o-mini' });
    const settings = await getSettings();
    expect(settings.provider).toBe('openai');
    expect(settings.model).toBe('gpt-4o-mini');
  });
});

describe('history', () => {
  it('starts empty', async () => {
    expect(await getHistory()).toEqual([]);
  });

  it('addToHistory prepends newest item', async () => {
    await addToHistory(makeResult('a'));
    await addToHistory(makeResult('b'));
    const history = await getHistory();
    expect(history[0].id).toBe('b');
    expect(history[1].id).toBe('a');
  });

  it('caps history at HISTORY_MAX (50)', async () => {
    for (let i = 0; i < 52; i++) await addToHistory(makeResult(String(i)));
    expect(await getHistory()).toHaveLength(50);
  });

  it('clearHistory empties the list', async () => {
    await addToHistory(makeResult('x'));
    await clearHistory();
    expect(await getHistory()).toEqual([]);
  });
});
