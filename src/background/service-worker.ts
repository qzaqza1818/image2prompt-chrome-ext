import { getSettings, addToHistory } from '../shared/storage';
import { analyzeWithAnthropic } from './providers/anthropic';
import { analyzeWithOpenAI } from './providers/openai';
import { analyzeWithGoogle } from './providers/google';
import type { AnalysisResult, AnalyzeMessage, PromptBreakdown } from '../shared/types';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'image-to-prompt',
      title: '🪄 Convert to AI Prompt',
      contexts: ['image'],
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'image-to-prompt' && info.srcUrl && tab?.id) {
    void handleAnalyze(info.srcUrl, tab.id);
  }
});

chrome.runtime.onMessage.addListener((message: AnalyzeMessage, sender) => {
  if (message.type === 'ANALYZE_IMAGE' && sender.tab?.id) {
    void handleAnalyze(message.imageUrl, sender.tab.id);
  }
});

async function handleAnalyze(imageUrl: string, tabId: number): Promise<void> {
  await chrome.sidePanel.open({ tabId });

  const settings = await getSettings();
  const apiKey = settings.apiKeys[settings.provider];

  const base: Omit<AnalysisResult, 'fullPrompt' | 'breakdown' | 'error'> = {
    id: crypto.randomUUID(),
    imageUrl,
    provider: settings.provider,
    model: settings.model,
    timestamp: Date.now(),
  };

  if (!apiKey) {
    await addToHistory({ ...base, fullPrompt: '', breakdown: emptyBreakdown(), error: 'NO_API_KEY' });
    console.warn('[image-to-prompt] No API key configured for provider:', settings.provider);
    return;
  }

  let imageBase64: string;
  let mimeType: string;

  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    mimeType = blob.type;
    if (!mimeType) {
      console.warn('[image-to-prompt] Could not detect MIME type, falling back to image/jpeg');
      mimeType = 'image/jpeg';
    }
    const buffer = await blob.arrayBuffer();
    imageBase64 = btoa(
      Array.from(new Uint8Array(buffer), (b) => String.fromCharCode(b)).join('')
    );
  } catch (err) {
    await addToHistory({ ...base, fullPrompt: '', breakdown: emptyBreakdown(), error: 'IMAGE_FETCH_FAILED' });
    console.error('[image-to-prompt] Failed to fetch image:', imageUrl, err);
    return;
  }

  try {
    let result: { fullPrompt: string; breakdown: PromptBreakdown };

    if (settings.provider === 'anthropic') {
      result = await analyzeWithAnthropic(imageBase64, mimeType, apiKey, settings.model);
    } else if (settings.provider === 'openai') {
      result = await analyzeWithOpenAI(imageBase64, mimeType, apiKey, settings.model);
    } else {
      result = await analyzeWithGoogle(imageBase64, mimeType, apiKey, settings.model);
    }

    await addToHistory({ ...base, ...result });
  } catch (err) {
    await addToHistory({ ...base, fullPrompt: '', breakdown: emptyBreakdown(), error: 'API_CALL_FAILED' });
    console.error('[image-to-prompt] Provider API call failed:', err);
  }
}

function emptyBreakdown(): PromptBreakdown {
  return { subject: '', style: '', mood: '', technical: '' };
}
