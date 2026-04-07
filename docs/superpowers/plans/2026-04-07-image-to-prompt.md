# Image to Prompt — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Chrome MV3 extension that converts any webpage image to an AI image-generation prompt via right-click menu or hover button, with results shown in a persistent side panel history.

**Architecture:** TypeScript + React + Vite multi-entry build. Content script injects a hover overlay; service worker handles context menu clicks and API calls; side panel displays a session-scoped history of all analyzed images; popup shows the latest result.

**Tech Stack:** TypeScript 5, React 18, Vite 5, Vitest 2, @testing-library/react, @types/chrome, Manifest V3

---

## File Map

```
popup.html                          # Entry: toolbar popup
sidepanel.html                      # Entry: side panel
options.html                        # Entry: options page
public/
  manifest.json                     # Copied to dist/ by Vite
src/
  shared/
    types.ts                        # All shared types, constants, SYSTEM_PROMPT
    storage.ts                      # chrome.storage helpers
    storage.test.ts
  background/
    service-worker.ts               # Context menu, message router, analyze orchestrator
    providers/
      anthropic.ts                  # Anthropic vision API call
      anthropic.test.ts
      openai.ts                     # OpenAI vision API call
      openai.test.ts
      google.ts                     # Google Gemini vision API call
      google.test.ts
  content/
    index.ts                        # Hover overlay injection (mouseover delegation)
    overlay.tsx                     # React button rendered inside shadow DOM
  sidepanel/
    main.tsx                        # Side panel React root
    components/
      HistoryList.tsx               # Scrollable list of AnalysisResult items
      HistoryItem.tsx               # Single collapsed/expanded list item
      DetailView.tsx                # Full prompt + breakdown for one result
  popup/
    main.tsx                        # Popup React root
  options/
    main.tsx                        # Options page React root
  test/
    chrome-mock.ts                  # Global chrome API mock for Vitest
vite.config.ts
tsconfig.json
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `popup.html`
- Create: `sidepanel.html`
- Create: `options.html`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "image-to-prompt-ext",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/chrome": "^0.0.268",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@vitest/coverage-v8": "^2.0.0",
    "jsdom": "^24.0.0",
    "typescript": "^5.5.0",
    "vite": "^5.3.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": ["chrome", "vitest/globals"]
  },
  "include": ["src", "*.ts", "*.tsx"]
}
```

- [ ] **Step 3: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        options: resolve(__dirname, 'options.html'),
        'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'service-worker' || chunk.name === 'content') {
            return '[name].js';
          }
          return 'assets/[name].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test/chrome-mock.ts'],
  },
});
```

- [ ] **Step 4: Create the three HTML entry files**

`popup.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Image to Prompt</title>
  <style>body { margin: 0; min-width: 300px; }</style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/popup/main.tsx"></script>
</body>
</html>
```

`sidepanel.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Image to Prompt</title>
  <style>body { margin: 0; }</style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/sidepanel/main.tsx"></script>
</body>
</html>
```

`options.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Image to Prompt — Settings</title>
  <style>body { margin: 0; font-family: system-ui, sans-serif; }</style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/options/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 5: Update .gitignore to include dist/**

Append to the existing `.gitignore`:
```
dist/
node_modules/
```

- [ ] **Step 6: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors (no source files yet, that's fine).

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json vite.config.ts popup.html sidepanel.html options.html .gitignore
git commit -m "feat: scaffold project with Vite + React + TypeScript"
```

---

## Task 2: Shared Types + Storage Helpers

**Files:**
- Create: `src/shared/types.ts`
- Create: `src/shared/storage.ts`
- Create: `src/test/chrome-mock.ts`
- Create: `src/shared/storage.test.ts`

- [ ] **Step 1: Create src/shared/types.ts**

```typescript
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
```

- [ ] **Step 2: Create src/shared/storage.ts**

```typescript
import type { Settings, AnalysisResult } from './types';
import { DEFAULT_SETTINGS, HISTORY_MAX } from './types';

export async function getSettings(): Promise<Settings> {
  const data = await chrome.storage.sync.get('settings');
  return { ...DEFAULT_SETTINGS, ...(data.settings as Partial<Settings>) };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set({ settings });
}

export async function getHistory(): Promise<AnalysisResult[]> {
  const data = await chrome.storage.session.get('history');
  return (data.history as AnalysisResult[]) ?? [];
}

export async function addToHistory(result: AnalysisResult): Promise<void> {
  const history = await getHistory();
  const updated = [result, ...history].slice(0, HISTORY_MAX);
  await chrome.storage.session.set({ history: updated });
}

export async function clearHistory(): Promise<void> {
  await chrome.storage.session.set({ history: [] });
}
```

- [ ] **Step 3: Create src/test/chrome-mock.ts**

```typescript
import { vi } from 'vitest';

const storageSyncData: Record<string, unknown> = {};
const storageSessionData: Record<string, unknown> = {};

global.chrome = {
  storage: {
    sync: {
      get: vi.fn(async (keys: string | string[]) => {
        const k = Array.isArray(keys) ? keys : [keys];
        return Object.fromEntries(k.map((key) => [key, storageSyncData[key]]));
      }),
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(storageSyncData, items);
      }),
    },
    session: {
      get: vi.fn(async (keys: string | string[]) => {
        const k = Array.isArray(keys) ? keys : [keys];
        return Object.fromEntries(k.map((key) => [key, storageSessionData[key]]));
      }),
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(storageSessionData, items);
      }),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  contextMenus: {
    create: vi.fn(),
    onClicked: { addListener: vi.fn() },
  },
  runtime: {
    onMessage: { addListener: vi.fn() },
    onInstalled: { addListener: vi.fn() },
    sendMessage: vi.fn(),
  },
  sidePanel: {
    open: vi.fn(),
  },
} as unknown as typeof chrome;

// Reset storage between tests
beforeEach(() => {
  for (const key of Object.keys(storageSyncData)) delete storageSyncData[key];
  for (const key of Object.keys(storageSessionData)) delete storageSessionData[key];
  vi.clearAllMocks();
});
```

- [ ] **Step 4: Write the failing tests**

Create `src/shared/storage.test.ts`:
```typescript
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
```

- [ ] **Step 5: Run tests — expect FAIL (no implementation yet passes)**

```bash
npm test
```

Expected: tests import fine (storage.ts exists), all pass immediately since we're testing real implementations. If something fails, check the mock setup.

- [ ] **Step 6: Run tests — expect PASS**

```bash
npm test
```

Expected: `4 tests passed`.

- [ ] **Step 7: Commit**

```bash
git add src/shared/types.ts src/shared/storage.ts src/shared/storage.test.ts src/test/chrome-mock.ts
git commit -m "feat: shared types, storage helpers, and chrome mock"
```

---

## Task 3: Anthropic Provider

**Files:**
- Create: `src/background/providers/anthropic.ts`
- Create: `src/background/providers/anthropic.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/background/providers/anthropic.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeWithAnthropic } from './anthropic';

describe('analyzeWithAnthropic', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('returns parsed fullPrompt and breakdown on success', async () => {
    const mockResponse = {
      content: [
        {
          text: JSON.stringify({
            fullPrompt: 'A mountain at sunset',
            breakdown: {
              subject: 'mountain',
              style: 'photorealistic',
              mood: 'golden hour',
              technical: 'wide angle',
            },
          }),
        },
      ],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await analyzeWithAnthropic(
      'base64data',
      'image/jpeg',
      'sk-ant-test',
      'claude-haiku-4-5-20251001'
    );

    expect(result.fullPrompt).toBe('A mountain at sunset');
    expect(result.breakdown.subject).toBe('mountain');
  });

  it('throws when API returns non-ok status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    } as Response);

    await expect(
      analyzeWithAnthropic('data', 'image/jpeg', 'bad-key', 'claude-haiku-4-5-20251001')
    ).rejects.toThrow('Anthropic API error 401');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test src/background/providers/anthropic.test.ts
```

Expected: FAIL — `Cannot find module './anthropic'`

- [ ] **Step 3: Implement src/background/providers/anthropic.ts**

```typescript
import type { PromptBreakdown } from '../../shared/types';
import { SYSTEM_PROMPT } from '../../shared/types';

export async function analyzeWithAnthropic(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
  model: string
): Promise<{ fullPrompt: string; breakdown: PromptBreakdown }> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: imageBase64 },
            },
            { type: 'text', text: SYSTEM_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const text: string = data.content[0].text;
  return JSON.parse(text) as { fullPrompt: string; breakdown: PromptBreakdown };
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test src/background/providers/anthropic.test.ts
```

Expected: `2 tests passed`.

- [ ] **Step 5: Commit**

```bash
git add src/background/providers/anthropic.ts src/background/providers/anthropic.test.ts
git commit -m "feat: Anthropic vision provider"
```

---

## Task 4: OpenAI Provider

**Files:**
- Create: `src/background/providers/openai.ts`
- Create: `src/background/providers/openai.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/background/providers/openai.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeWithOpenAI } from './openai';

describe('analyzeWithOpenAI', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('returns parsed fullPrompt and breakdown on success', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              fullPrompt: 'Forest at dawn',
              breakdown: {
                subject: 'forest',
                style: 'painterly',
                mood: 'misty morning',
                technical: 'telephoto',
              },
            }),
          },
        },
      ],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await analyzeWithOpenAI('base64', 'image/png', 'sk-test', 'gpt-4o-mini');

    expect(result.fullPrompt).toBe('Forest at dawn');
    expect(result.breakdown.mood).toBe('misty morning');
  });

  it('throws on API error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => 'Rate limited',
    } as Response);

    await expect(
      analyzeWithOpenAI('data', 'image/jpeg', 'key', 'gpt-4o-mini')
    ).rejects.toThrow('OpenAI API error 429');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test src/background/providers/openai.test.ts
```

Expected: FAIL — `Cannot find module './openai'`

- [ ] **Step 3: Implement src/background/providers/openai.ts**

```typescript
import type { PromptBreakdown } from '../../shared/types';
import { SYSTEM_PROMPT } from '../../shared/types';

export async function analyzeWithOpenAI(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
  model: string
): Promise<{ fullPrompt: string; breakdown: PromptBreakdown }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            { type: 'text', text: SYSTEM_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const text: string = data.choices[0].message.content;
  return JSON.parse(text) as { fullPrompt: string; breakdown: PromptBreakdown };
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test src/background/providers/openai.test.ts
```

Expected: `2 tests passed`.

- [ ] **Step 5: Commit**

```bash
git add src/background/providers/openai.ts src/background/providers/openai.test.ts
git commit -m "feat: OpenAI vision provider"
```

---

## Task 5: Google Gemini Provider

**Files:**
- Create: `src/background/providers/google.ts`
- Create: `src/background/providers/google.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/background/providers/google.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeWithGoogle } from './google';

describe('analyzeWithGoogle', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('returns parsed fullPrompt and breakdown on success', async () => {
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  fullPrompt: 'Abstract city at night',
                  breakdown: {
                    subject: 'city skyline',
                    style: 'neon noir',
                    mood: 'dark, vibrant',
                    technical: 'drone shot',
                  },
                }),
              },
            ],
          },
        },
      ],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await analyzeWithGoogle('base64', 'image/jpeg', 'AIza-test', 'gemini-1.5-flash');

    expect(result.fullPrompt).toBe('Abstract city at night');
    expect(result.breakdown.style).toBe('neon noir');
  });

  it('throws on API error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => 'Forbidden',
    } as Response);

    await expect(
      analyzeWithGoogle('data', 'image/jpeg', 'key', 'gemini-1.5-flash')
    ).rejects.toThrow('Google API error 403');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test src/background/providers/google.test.ts
```

Expected: FAIL — `Cannot find module './google'`

- [ ] **Step 3: Implement src/background/providers/google.ts**

```typescript
import type { PromptBreakdown } from '../../shared/types';
import { SYSTEM_PROMPT } from '../../shared/types';

export async function analyzeWithGoogle(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
  model: string
): Promise<{ fullPrompt: string; breakdown: PromptBreakdown }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
            { text: SYSTEM_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  const text: string = data.candidates[0].content.parts[0].text;
  return JSON.parse(text) as { fullPrompt: string; breakdown: PromptBreakdown };
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npm test src/background/providers/google.test.ts
```

Expected: `2 tests passed`.

- [ ] **Step 5: Run all tests to confirm nothing broken**

```bash
npm test
```

Expected: `8 tests passed` (2 storage + 2 anthropic + 2 openai + 2 google).

- [ ] **Step 6: Commit**

```bash
git add src/background/providers/google.ts src/background/providers/google.test.ts
git commit -m "feat: Google Gemini vision provider"
```

---

## Task 6: Service Worker

**Files:**
- Create: `src/background/service-worker.ts`
- Create: `public/manifest.json`

- [ ] **Step 1: Create public/manifest.json**

```json
{
  "manifest_version": 3,
  "name": "Image to Prompt",
  "version": "1.0.0",
  "description": "Convert any image to an AI image generation prompt",
  "minimum_chrome_version": "114",
  "permissions": ["contextMenus", "storage", "sidePanel", "activeTab"],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "service-worker.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ],
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "action": {
    "default_popup": "popup.html",
    "default_title": "Image to Prompt"
  },
  "options_page": "options.html"
}
```

- [ ] **Step 2: Create src/background/service-worker.ts**

```typescript
import { getSettings, addToHistory } from '../shared/storage';
import { analyzeWithAnthropic } from './providers/anthropic';
import { analyzeWithOpenAI } from './providers/openai';
import { analyzeWithGoogle } from './providers/google';
import type { AnalysisResult, AnalyzeMessage, PromptBreakdown } from '../shared/types';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'image-to-prompt',
    title: '🪄 Convert to AI Prompt',
    contexts: ['image'],
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
    return;
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
  } catch {
    await addToHistory({ ...base, fullPrompt: '', breakdown: emptyBreakdown(), error: 'IMAGE_FETCH_FAILED' });
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
  } catch {
    await addToHistory({ ...base, fullPrompt: '', breakdown: emptyBreakdown(), error: 'API_CALL_FAILED' });
  }
}

function emptyBreakdown() {
  return { subject: '', style: '', mood: '', technical: '' };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/background/service-worker.ts public/manifest.json
git commit -m "feat: service worker with context menu, message router, and analysis orchestrator"
```

---

## Task 7: Content Script + Hover Overlay

**Files:**
- Create: `src/content/overlay.tsx`
- Create: `src/content/index.ts`

- [ ] **Step 1: Create src/content/overlay.tsx**

This is the React component rendered inside a shadow DOM attached to a host element positioned over the hovered image.

```tsx
import { useState } from 'react';
import type { AnalyzeMessage } from '../shared/types';

interface Props {
  imageUrl: string;
}

export function OverlayButton({ imageUrl }: Props) {
  const [sent, setSent] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (sent) return;
    setSent(true);
    const message: AnalyzeMessage = { type: 'ANALYZE_IMAGE', imageUrl };
    chrome.runtime.sendMessage(message);
    setTimeout(() => setSent(false), 2000);
  }

  return (
    <>
      <style>{`
        button {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #1a73e8;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 13px;
          font-family: system-ui, sans-serif;
          font-weight: 600;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transition: background 0.15s;
        }
        button:hover { background: #1557b0; }
        button.sent { background: #137333; }
      `}</style>
      <button className={sent ? 'sent' : ''} onClick={handleClick}>
        {sent ? '✓ Sent' : '🪄 Prompt'}
      </button>
    </>
  );
}
```

- [ ] **Step 2: Create src/content/index.ts**

```typescript
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { OverlayButton } from './overlay';

let hostEl: HTMLElement | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

function removeOverlay() {
  hostEl?.remove();
  hostEl = null;
}

function showOverlay(img: HTMLImageElement) {
  if (!img.src || img.src.startsWith('data:')) return;

  removeOverlay();

  const rect = img.getBoundingClientRect();
  if (rect.width < 40 || rect.height < 40) return; // skip tiny images

  const host = document.createElement('div');
  host.style.cssText = [
    'position:fixed',
    `top:${rect.top}px`,
    `left:${rect.left}px`,
    `width:${rect.width}px`,
    `height:${rect.height}px`,
    'z-index:2147483647',
    'pointer-events:none',
  ].join(';');

  const shadow = host.attachShadow({ mode: 'open' });
  const container = document.createElement('div');
  container.style.cssText = 'width:100%;height:100%;position:relative;pointer-events:none';
  shadow.appendChild(container);

  document.body.appendChild(host);
  hostEl = host;

  const root = createRoot(container);
  root.render(createElement(OverlayButton, { imageUrl: img.src }));
}

document.addEventListener('mouseover', (e) => {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  const target = e.target as HTMLElement;
  if (target.tagName === 'IMG') {
    showOverlay(target as HTMLImageElement);
  }
});

document.addEventListener('mouseout', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'IMG') {
    hideTimer = setTimeout(removeOverlay, 300);
  }
});
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/overlay.tsx src/content/index.ts
git commit -m "feat: content script hover overlay with shadow DOM isolation"
```

---

## Task 8: Side Panel UI

**Files:**
- Create: `src/sidepanel/components/DetailView.tsx`
- Create: `src/sidepanel/components/HistoryItem.tsx`
- Create: `src/sidepanel/components/HistoryList.tsx`
- Create: `src/sidepanel/main.tsx`
- Create: `src/sidepanel/components/HistoryList.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/sidepanel/components/HistoryList.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryList } from './HistoryList';
import type { AnalysisResult } from '../../shared/types';

const makeResult = (id: string, prompt: string): AnalysisResult => ({
  id,
  imageUrl: 'https://example.com/img.jpg',
  fullPrompt: prompt,
  breakdown: { subject: 'test subject', style: 'test style', mood: 'test mood', technical: 'test tech' },
  provider: 'anthropic',
  model: 'claude-haiku-4-5-20251001',
  timestamp: Date.now(),
});

describe('HistoryList', () => {
  it('shows empty state when no history', () => {
    render(<HistoryList history={[]} onClear={vi.fn()} />);
    expect(screen.getByText(/right-click/i)).toBeInTheDocument();
  });

  it('renders all history items', () => {
    const history = [makeResult('1', 'Mountain at sunset'), makeResult('2', 'Forest in mist')];
    render(<HistoryList history={history} onClear={vi.fn()} />);
    expect(screen.getByText('Mountain at sunset')).toBeInTheDocument();
  });

  it('calls onClear when clear button clicked', () => {
    const onClear = vi.fn();
    const history = [makeResult('1', 'Test prompt')];
    render(<HistoryList history={history} onClear={onClear} />);
    fireEvent.click(screen.getByText(/clear history/i));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npm test src/sidepanel/components/HistoryList.test.tsx
```

Expected: FAIL — `Cannot find module './HistoryList'`

- [ ] **Step 3: Create src/sidepanel/components/DetailView.tsx**

```tsx
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
    navigator.clipboard.writeText(text);
  }

  const breakdownText = Object.entries(result.breakdown)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 15 }}>
      {/* Header */}
      <div style={{ background: '#1a73e8', color: 'white', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'white', fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
        <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {result.fullPrompt.slice(0, 40) || 'Error'}
        </span>
      </div>

      {/* Thumbnail */}
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
          {/* Full prompt */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={LABEL}>Full Prompt</div>
            <div style={{ background: '#f8f9fa', borderRadius: 4, padding: 8, color: '#333', lineHeight: 1.5, fontSize: 14 }}>
              {result.fullPrompt}
            </div>
            <button onClick={() => copy(result.fullPrompt)} style={copyBtnStyle}>Copy</button>
          </div>

          {/* Breakdown */}
          <div style={{ padding: '12px 14px' }}>
            <div style={LABEL}>Breakdown</div>
            {(['subject', 'style', 'mood', 'technical'] as const).map((key) => (
              <div key={key} style={{ marginBottom: 5, fontSize: 14 }}>
                <span style={{ color: '#1a73e8', fontWeight: 600, textTransform: 'capitalize' }}>{key}: </span>
                <span style={{ color: '#333' }}>{result.breakdown[key]}</span>
              </div>
            ))}
            <button onClick={() => copy(breakdownText)} style={{ ...copyBtnStyle, background: '#f1f3f4', color: '#555', marginTop: 6 }}>
              Copy Breakdown
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
```

- [ ] **Step 4: Create src/sidepanel/components/HistoryItem.tsx**

```tsx
import { useState } from 'react';
import type { AnalysisResult } from '../../shared/types';

interface Props {
  result: AnalysisResult;
  onViewDetail: (id: string) => void;
}

export function HistoryItem({ result, onViewDetail }: Props) {
  const [expanded, setExpanded] = useState(false);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  const preview = result.error
    ? `Error: ${result.error}`
    : result.fullPrompt.slice(0, 60) + (result.fullPrompt.length > 60 ? '…' : '');

  const timeLabel = new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ borderBottom: '1px solid #f0f0f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Collapsed row */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '10px 14px',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          background: expanded ? '#e8f0fe' : 'white',
          cursor: 'pointer',
        }}
      >
        <img
          src={result.imageUrl}
          alt=""
          style={{ width: 52, height: 38, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: expanded ? '#1a73e8' : '#333', fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {preview}
          </div>
          <div style={{ color: '#9aa0a6', fontSize: 11 }}>{result.provider} · {timeLabel}</div>
        </div>
        <span style={{ color: expanded ? '#1a73e8' : '#9aa0a6', fontSize: 16 }}>{expanded ? '▾' : '▸'}</span>
      </div>

      {/* Expanded inline content */}
      {expanded && !result.error && (
        <div style={{ padding: '10px 14px', background: '#f8f9fa' }}>
          <div style={{ fontSize: 11, color: '#9aa0a6', textTransform: 'uppercase', marginBottom: 4 }}>Full Prompt</div>
          <div style={{ background: 'white', borderRadius: 4, padding: 8, color: '#333', lineHeight: 1.5, fontSize: 13, border: '1px solid #eee' }}>
            {result.fullPrompt}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={() => copy(result.fullPrompt)} style={btnPrimary}>Copy</button>
            <button onClick={() => onViewDetail(result.id)} style={btnSecondary}>Details ▸</button>
          </div>
        </div>
      )}
      {expanded && result.error && (
        <div style={{ padding: '10px 14px', background: '#fef7e0', color: '#c5221f', fontSize: 13 }}>
          {result.error === 'NO_API_KEY' && 'No API key. Open Settings to add one.'}
          {result.error === 'IMAGE_FETCH_FAILED' && 'Could not load the image.'}
          {result.error === 'API_CALL_FAILED' && 'API call failed. Check your key.'}
        </div>
      )}
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  background: '#1a73e8', color: 'white', border: 'none', borderRadius: 4,
  padding: '4px 12px', fontSize: 13, cursor: 'pointer', fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
  background: '#f1f3f4', color: '#555', border: 'none', borderRadius: 4,
  padding: '4px 12px', fontSize: 13, cursor: 'pointer',
};
```

- [ ] **Step 5: Create src/sidepanel/components/HistoryList.tsx**

```tsx
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
```

Note: the test imports `HistoryList` without the `onViewDetail` prop — update the test to pass it:

Edit `src/sidepanel/components/HistoryList.test.tsx` — add `onViewDetail={vi.fn()}` to all `<HistoryList ... />` renders:
```tsx
render(<HistoryList history={[]} onClear={vi.fn()} onViewDetail={vi.fn()} />);
// and
render(<HistoryList history={history} onClear={vi.fn()} onViewDetail={vi.fn()} />);
// and
render(<HistoryList history={history} onClear={onClear} onViewDetail={vi.fn()} />);
```

- [ ] **Step 6: Create src/sidepanel/main.tsx**

```tsx
import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { getHistory, clearHistory } from '../shared/storage';
import type { AnalysisResult } from '../shared/types';
import { HistoryList } from './components/HistoryList';
import { DetailView } from './components/DetailView';

function SidePanel() {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);

  async function loadHistory() {
    setHistory(await getHistory());
  }

  useEffect(() => {
    void loadHistory();

    chrome.storage.onChanged.addListener((_changes, area) => {
      if (area === 'session') void loadHistory();
    });
  }, []);

  async function handleClear() {
    await clearHistory();
    setHistory([]);
    setDetailId(null);
  }

  const detailResult = detailId ? history.find((r) => r.id === detailId) : null;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#1a73e8', color: 'white', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🪄</span>
          <span style={{ fontWeight: 700, fontSize: 16, fontFamily: 'system-ui, sans-serif' }}>Image to Prompt</span>
        </div>
        {history.length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: 12, fontSize: 13, fontFamily: 'system-ui' }}>
            {history.length}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {detailResult ? (
          <DetailView result={detailResult} onBack={() => setDetailId(null)} />
        ) : (
          <HistoryList history={history} onClear={handleClear} onViewDetail={setDetailId} />
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><SidePanel /></StrictMode>
);
```

- [ ] **Step 7: Run tests — expect PASS**

```bash
npm test src/sidepanel/components/HistoryList.test.tsx
```

Expected: `3 tests passed`.

- [ ] **Step 8: Commit**

```bash
git add src/sidepanel/
git commit -m "feat: side panel with history list and detail view"
```

---

## Task 9: Toolbar Popup

**Files:**
- Create: `src/popup/main.tsx`

- [ ] **Step 1: Create src/popup/main.tsx**

```tsx
import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { getHistory } from '../shared/storage';
import type { AnalysisResult } from '../shared/types';

function Popup() {
  const [latest, setLatest] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getHistory().then((h) => setLatest(h[0] ?? null));
  }, []);

  function copy() {
    if (!latest?.fullPrompt) return;
    navigator.clipboard.writeText(latest.fullPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openPanel() {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) chrome.sidePanel.open({ tabId: tab.id });
    });
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 15, width: 300 }}>
      {/* Header */}
      <div style={{ background: '#1a73e8', color: 'white', padding: '10px 14px', fontWeight: 700, fontSize: 15 }}>
        🪄 Image to Prompt
      </div>

      <div style={{ padding: '12px 14px' }}>
        {!latest ? (
          <div style={{ color: '#9aa0a6', textAlign: 'center', padding: '12px 0', fontSize: 14 }}>
            Right-click an image or hover to convert it to a prompt.
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: '#9aa0a6', textTransform: 'uppercase', marginBottom: 4 }}>Last Result</div>
            <div style={{ background: '#f8f9fa', borderRadius: 4, padding: 8, color: '#333', lineHeight: 1.5, fontSize: 13, marginBottom: 10 }}>
              {latest.fullPrompt
                ? latest.fullPrompt.slice(0, 120) + (latest.fullPrompt.length > 120 ? '…' : '')
                : `Error: ${latest.error}`}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={copy} disabled={!latest.fullPrompt} style={{ ...btn('#1a73e8', 'white'), flex: 1 }}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              <button onClick={openPanel} style={{ ...btn('#f1f3f4', '#333'), flex: 1 }}>
                Open Panel
              </button>
            </div>
          </>
        )}
      </div>

      <div style={{ borderTop: '1px solid #f0f0f0', padding: '8px 14px', textAlign: 'right' }}>
        <button onClick={openOptions} style={{ background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', fontSize: 13 }}>
          ⚙ Settings
        </button>
      </div>
    </div>
  );
}

function btn(bg: string, color: string): React.CSSProperties {
  return { background: bg, color, border: 'none', borderRadius: 4, padding: '6px 0', fontSize: 13, cursor: 'pointer', fontWeight: 600 };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><Popup /></StrictMode>
);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/popup/main.tsx
git commit -m "feat: toolbar popup with last result and open panel button"
```

---

## Task 10: Options Page

**Files:**
- Create: `src/options/main.tsx`

- [ ] **Step 1: Create src/options/main.tsx**

```tsx
import { StrictMode, useState, useEffect } from 'react';
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

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

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
    await saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/options/main.tsx
git commit -m "feat: options page with provider, model, and API key settings"
```

---

## Task 11: Build + Load in Chrome

**Files:** No new files — build and manual test.

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests pass (storage × 4, anthropic × 2, openai × 2, google × 2, HistoryList × 3 = 13 tests).

- [ ] **Step 2: Build the extension**

```bash
npm run build
```

Expected: `dist/` folder created with:
- `dist/service-worker.js`
- `dist/content.js`
- `dist/popup.html`
- `dist/sidepanel.html`
- `dist/options.html`
- `dist/manifest.json`
- `dist/assets/` (JS chunks)

If you see TypeScript errors, fix them before continuing.

- [ ] **Step 3: Load in Chrome**

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder

Expected: Extension appears in the list with no errors.

- [ ] **Step 4: Configure your API key**

1. Click the 🪄 icon in the toolbar → **⚙ Settings**
2. Select your provider (e.g., Anthropic)
3. Enter your API key
4. Click **Save Settings**

- [ ] **Step 5: Smoke test — context menu**

1. Open any webpage with images (e.g., `https://unsplash.com`)
2. Right-click an image
3. Click **🪄 Convert to AI Prompt**
4. Side panel should open and show the generated prompt within a few seconds

Expected: Side panel shows the image thumbnail, full prompt, and breakdown.

- [ ] **Step 6: Smoke test — hover button**

1. Hover over an image on a webpage
2. A blue **🪄 Prompt** button should appear in the top-right corner of the image
3. Click it
4. Side panel updates with the new result at the top of the history list

- [ ] **Step 7: Smoke test — history**

1. Analyze 3 different images
2. Side panel should list all 3, newest at top
3. Click any item to expand it inline → click **Details ▸** to see full breakdown
4. Click **←** to return to the list

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat: complete image-to-prompt Chrome extension v1"
```
