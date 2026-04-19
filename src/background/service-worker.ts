import { getSettings, addToHistory } from '../shared/storage';
import { analyzeWithAnthropic } from './providers/anthropic';
import { analyzeWithOpenAI } from './providers/openai';
import { analyzeWithGoogle } from './providers/google';
import type { AnalysisResult, AnalyzeMessage, AnalyzeInlineMessage, PromptBreakdown } from '../shared/types';

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

chrome.runtime.onMessage.addListener((message: AnalyzeMessage | AnalyzeInlineMessage, sender) => {
  if (!sender.tab?.id) return;
  const tabId = sender.tab.id;

  if (message.type === 'ANALYZE_IMAGE') {
    void handleAnalyze(message.imageUrl, tabId);
  } else if (message.type === 'ANALYZE_IMAGE_INLINE') {
    void handleAnalyzeInline(message.imageUrl, tabId, message.aspectRatio);
  }
});

async function analyzeImage(imageUrl: string, aspectRatio?: string): Promise<AnalysisResult> {
  const settings = await getSettings();
  const apiKey = settings.apiKeys[settings.provider];

  const base: Omit<AnalysisResult, 'fullPrompt' | 'jsonPrompt' | 'breakdown' | 'error'> = {
    id: crypto.randomUUID(),
    imageUrl,
    provider: settings.provider,
    model: settings.model,
    timestamp: Date.now(),
  };

  if (!apiKey) {
    console.warn('[image-to-prompt] No API key configured for provider:', settings.provider);
    return { ...base, fullPrompt: '', breakdown: emptyBreakdown(), error: 'NO_API_KEY' };
  }

  let imageBase64: string;
  let mimeType: string;

  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    mimeType = blob.type || 'image/jpeg';
    const buffer = await blob.arrayBuffer();
    imageBase64 = btoa(
      Array.from(new Uint8Array(buffer), (b) => String.fromCharCode(b)).join('')
    );
  } catch (err) {
    console.error('[image-to-prompt] Failed to fetch image:', imageUrl, err);
    return { ...base, fullPrompt: '', breakdown: emptyBreakdown(), error: 'IMAGE_FETCH_FAILED' };
  }

  try {
    let result: { fullPrompt: string; jsonPrompt?: Record<string, string>; breakdown: PromptBreakdown };

    if (settings.provider === 'anthropic') {
      result = await analyzeWithAnthropic(imageBase64, mimeType, apiKey, settings.model, aspectRatio);
    } else if (settings.provider === 'openai') {
      result = await analyzeWithOpenAI(imageBase64, mimeType, apiKey, settings.model, aspectRatio);
    } else {
      result = await analyzeWithGoogle(imageBase64, mimeType, apiKey, settings.model, aspectRatio);
    }

    return { ...base, ...result };
  } catch (err) {
    console.error('[image-to-prompt] Provider API call failed:', err);
    return { ...base, fullPrompt: '', breakdown: emptyBreakdown(), error: 'API_CALL_FAILED' };
  }
}

async function handleAnalyze(imageUrl: string, tabId: number): Promise<void> {
  await chrome.sidePanel.open({ tabId });
  const result = await analyzeImage(imageUrl);
  await addToHistory(result);
}

async function handleAnalyzeInline(imageUrl: string, tabId: number, aspectRatio?: string): Promise<void> {
  const result = await analyzeImage(imageUrl, aspectRatio);
  await addToHistory(result);
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'ANALYSIS_COMPLETE', result });
  } catch (err) {
    console.error('[image-to-prompt] Failed to send inline result to tab:', err);
  }
}

function emptyBreakdown(): PromptBreakdown {
  return { subject: '', style: '', mood: '', technical: '' };
}
