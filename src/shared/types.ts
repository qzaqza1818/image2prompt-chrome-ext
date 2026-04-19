export type Provider = 'anthropic' | 'openai' | 'google';

export interface PromptBreakdown {
  subject: string;
  style: string;
  mood: string;
  technical: string;
}

export interface JsonPromptOverview {
  image_type: string;
  theme: string;
  scene_type: string;
  style: string;
  mood: string;
  lighting: string;
  color_palette: string;
  narrative: string;
}

export interface JsonPromptCompositionCamera {
  aspect_ratio: string;
  framing: string;
  camera_angle: string;
  lens_type: string;
  depth_of_field: string;
  camera_distance: string;
}

export interface JsonPrompt {
  overview: JsonPromptOverview;
  composition_camera: JsonPromptCompositionCamera;
}

export interface AnalysisResult {
  id: string;
  imageUrl: string;
  fullPrompt: string;
  jsonPrompt?: JsonPrompt;
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

export interface AnalyzeInlineMessage {
  type: 'ANALYZE_IMAGE_INLINE';
  imageUrl: string;
  aspectRatio?: string;
}

export interface AnalysisCompleteMessage {
  type: 'ANALYSIS_COMPLETE';
  result: AnalysisResult;
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
    { id: 'gemini-2.0-flash', label: 'gemini-2.0-flash (fast)' },
    { id: 'gemini-2.5-pro', label: 'gemini-2.5-pro (quality)' },
  ],
};

export const SYSTEM_PROMPT = `Analyze this image and generate an AI image generation prompt.

STEP 1 — Classify the image type. It MUST be exactly one of:
- "photorealistic photography"
- "2D illustration / digital art"
- "3D render"
- "anime / cartoon"
- "oil painting / watercolor"

STEP 2 — Return ONLY valid JSON in this exact format, no markdown, no code fences, no explanation:
{
  "fullPrompt": "MUST open with the image type (e.g. 'Photorealistic photography of...', '2D illustration of...', 'Anime / cartoon of...'). Then one rich paragraph covering: subject description, art style, lighting, mood, color palette, framing, camera angle, lens type, and depth of field. Include enough detail to recreate the image accurately.",
  "jsonPrompt": {
    "overview": {
      "image_type": "MUST be exactly one of: photorealistic photography | 2D illustration / digital art | 3D render | anime / cartoon | oil painting / watercolor",
      "theme": "main theme or concept",
      "scene_type": "type of scene or setting",
      "style": "art style and rendering quality",
      "mood": "emotional tone and atmosphere",
      "lighting": "lighting conditions and quality",
      "color_palette": "dominant colors and tones",
      "narrative": "brief story or context of the image"
    },
    "composition_camera": {
      "aspect_ratio": "estimated aspect ratio e.g. 16:9, 4:3, 1:1, 9:16",
      "framing": "how the subject is framed e.g. rule of thirds, centered, symmetrical",
      "camera_angle": "e.g. eye-level, low angle, bird's eye, dutch tilt",
      "lens_type": "e.g. wide-angle 24mm, portrait 85mm, telephoto 200mm, macro",
      "depth_of_field": "e.g. shallow bokeh, deep focus, everything sharp",
      "camera_distance": "e.g. extreme close-up, medium shot, wide establishing shot"
    }
  },
  "breakdown": {
    "subject": "main subjects and scene description",
    "style": "art style and rendering quality keywords",
    "mood": "lighting, atmosphere, color palette",
    "technical": "camera angle, lens type, composition"
  }
}`;
