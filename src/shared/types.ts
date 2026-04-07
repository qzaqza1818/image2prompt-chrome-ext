export type Provider = 'anthropic' | 'openai' | 'google';

export interface PromptBreakdown {
  subject: string;
  style: string;
  mood: string;
  technical: string;
}

export interface AnalysisResult {
  id: string;
  imageUrl: string;
  fullPrompt: string;
  breakdown: PromptBreakdown;
  provider: Provider;
  model: string;
  timestamp: number;
  error?: 'NO_API_KEY' | 'IMAGE_FETCH_FAILED' | 'API_CALL_FAILED';
}

export interface Settings {
  provider: Provider;
  model: string;
  apiKeys: Record<Provider, string>;
}

export interface AnalyzeMessage {
  type: 'ANALYZE_IMAGE';
  imageUrl: string;
}

export const HISTORY_MAX = 50;

export const DEFAULT_SETTINGS: Settings = {
  provider: 'anthropic',
  model: 'claude-haiku-4-5-20251001',
  apiKeys: { anthropic: '', openai: '', google: '' },
};

export const PROVIDER_MODELS: Record<Provider, { id: string; label: string }[]> = {
  anthropic: [
    { id: 'claude-haiku-4-5-20251001', label: 'claude-haiku-4-5 (fast)' },
    { id: 'claude-sonnet-4-6', label: 'claude-sonnet-4-6 (quality)' },
  ],
  openai: [
    { id: 'gpt-4o-mini', label: 'gpt-4o-mini (fast)' },
    { id: 'gpt-4o', label: 'gpt-4o (quality)' },
  ],
  google: [
    { id: 'gemini-1.5-flash', label: 'gemini-1.5-flash (fast)' },
    { id: 'gemini-1.5-pro', label: 'gemini-1.5-pro (quality)' },
  ],
};

export const SYSTEM_PROMPT = `Analyze this image and generate an AI image generation prompt.

Return ONLY valid JSON in this exact format, no markdown, no code fences, no explanation:
{
  "fullPrompt": "A single rich descriptive paragraph ready to paste into any AI image generator, covering subject, style, lighting, mood, colors, and technical details",
  "breakdown": {
    "subject": "main subjects and scene description",
    "style": "art style and rendering quality keywords",
    "mood": "lighting, atmosphere, color palette",
    "technical": "camera angle, lens type, composition"
  }
}`;
