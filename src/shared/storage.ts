import type { Settings, AnalysisResult } from './types';
import { DEFAULT_SETTINGS, HISTORY_MAX } from './types';

export async function getSettings(): Promise<Settings> {
  const data = await chrome.storage.sync.get('settings');
  const stored = data.settings as Partial<Settings> | undefined;
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    apiKeys: { ...DEFAULT_SETTINGS.apiKeys, ...stored?.apiKeys },
  };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set({ settings });
}

export async function getHistory(): Promise<AnalysisResult[]> {
  const data = await chrome.storage.local.get('history');
  return (data.history as AnalysisResult[]) ?? [];
}

export async function addToHistory(result: AnalysisResult): Promise<void> {
  const history = await getHistory();
  const updated = [result, ...history].slice(0, HISTORY_MAX);
  await chrome.storage.local.set({ history: updated });
}

export async function clearHistory(): Promise<void> {
  await chrome.storage.local.set({ history: [] });
}
