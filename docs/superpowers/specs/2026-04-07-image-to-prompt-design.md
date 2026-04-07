# Image to Prompt — Chrome Extension Design

**Date:** 2026-04-07  
**Status:** Approved

---

## Overview

A Chrome extension that lets users convert any image on a webpage into an AI image-generation prompt. The user triggers analysis via right-click context menu or a hover overlay button; results appear in a persistent side panel with a full history of all analyzed images.

---

## Architecture

Five components connected via Chrome extension APIs:

| Component | Role |
|---|---|
| **Content Script** | Injects hover overlay button on images; sends `ANALYZE_IMAGE` message to service worker |
| **Background Service Worker** | Registers context menu; routes messages; fetches image; calls AI provider API; stores result |
| **Side Panel** | Primary results view — history list + detail view |
| **Toolbar Popup** | Quick-access last result + "Open Panel" shortcut |
| **Options Page** | Provider selection, model selection, API key entry |

**Storage:**
- `chrome.storage.sync` — API keys + selected provider/model (synced across user's devices)
- `chrome.storage.session` — Analysis history for the current browser session (cleared on browser close). Capped at the last 50 items to stay within the ~10MB session storage limit.

**Tech stack:** TypeScript + React + Vite, Manifest V3, no backend.

---

## Trigger Mechanisms

Two ways to trigger analysis:

1. **Right-click context menu** — "Convert to AI Prompt" item appears when right-clicking any image. Registered by the service worker via `chrome.contextMenus`.
2. **Hover overlay button** — A small "🪄 Prompt" button appears when the user hovers over an image. Injected by the content script. Can be dismissed by moving the mouse away.

---

## Data Flow

Two trigger paths converge at the service worker:

- **Context menu path:** Chrome provides `info.srcUrl` directly to the service worker's `contextMenus.onClicked` handler — no content script involvement.
- **Hover button path:** Content script captures `image.src` (or base64 for `<canvas>`) and sends `{ type: "ANALYZE_IMAGE", imageUrl, tabId }` to the service worker.

1. Service worker receives the image URL (from either path)
2. Service worker opens side panel (`chrome.sidePanel.open`), reads API key + provider from `chrome.storage.sync`
4. Service worker fetches image → converts to base64 → calls selected provider's vision API with a fixed system prompt requesting the structured output format
5. Response parsed into `{ fullPrompt, breakdown: { subject, style, mood, technical } }`, saved to `chrome.storage.session` history array
6. Side panel listens via `chrome.storage.onChanged` → re-renders history list with newest entry expanded

**Error handling:**
- No API key configured → side panel shows a setup prompt linking to Options page
- API call fails → side panel shows error message with a retry button
- Image URL inaccessible (CORS) → service worker attempts `fetch()` with appropriate headers; if blocked, shows "Image not accessible" message

---

## AI Providers

Users bring their own API key (BYOK). No backend relay. The service worker calls provider APIs directly from the extension.

| Provider | Models offered |
|---|---|
| Anthropic | claude-haiku-4-5 (default), claude-sonnet-4-6 |
| OpenAI | gpt-4o-mini (default), gpt-4o |
| Google | gemini-1.5-flash (default), gemini-1.5-pro |

Provider and model are selected in the Options page and stored in `chrome.storage.sync`.

---

## Prompt Output Format

Every analysis returns two things:

**Full Prompt** — a single rich paragraph ready to paste into any AI image generator (Midjourney, DALL-E, Stable Diffusion, etc.). Universal, not optimized for a specific tool.

**Breakdown** — the prompt split into labeled fields:
- **Subject** — main subjects and scene
- **Style** — art style, rendering quality
- **Mood** — lighting, atmosphere, color palette
- **Technical** — camera angle, lens, composition

Both are copyable independently.

---

## UI Surfaces

### Side Panel (primary)

- **List view (default):** All analyzed images for the session, newest first. Each item shows a thumbnail, truncated prompt preview, provider, and timestamp. Clicking an item expands it inline to show the full prompt + copy button + "Details ▸" link.
- **Detail view:** Full-page view of one result — image thumbnail, full prompt with copy button, and complete breakdown with copy button. Back arrow returns to list.
- **Clear history** button at the bottom of the list.
- Base font size: ~15px (1.5× browser default) for readability.

### Toolbar Popup

- Shows last analysis result (truncated) with a Copy button and an "Open Panel" button.
- If no result yet, shows a brief instruction ("Right-click an image or hover to convert it").
- Settings link at the bottom.

### Options Page

- Provider selector (Anthropic / OpenAI / Google) — segmented button
- Model dropdown (options change based on selected provider)
- API key input (masked)
- Save button

---

## File Structure

```
src/
  background/
    service-worker.ts       # Message router, context menu, API calls
    providers/
      anthropic.ts
      openai.ts
      google.ts
  content/
    index.ts                # Hover overlay injection
    overlay.tsx             # Hover button React component
  sidepanel/
    index.html
    main.tsx
    components/
      HistoryList.tsx
      HistoryItem.tsx
      DetailView.tsx
  popup/
    index.html
    main.tsx
  options/
    index.html
    main.tsx
  shared/
    types.ts                # AnalysisResult, Provider, StorageSchema
    storage.ts              # chrome.storage helpers
manifest.json
vite.config.ts
```

---

## Out of Scope (v1)

- Prompt history persisting beyond the browser session
- Uploading a local image file (file picker)
- Exporting history
- Per-image prompt style targeting (e.g., "optimize for Midjourney")
- Backend relay or usage analytics
