# Image to Prompt — Chrome Extension

A Chrome extension that right-clicks any image on the web and instantly generates an AI image generation prompt for it. Results are shown in a side panel with full history that persists across browser sessions.

## Features

- **Right-click any image** → "Generate prompt for this image"
- **AI-powered analysis** — generates a rich, copy-ready prompt plus a structured breakdown (subject, style, mood, technical)
- **Multiple providers** — supports Anthropic (Claude), OpenAI (GPT-4o), and Google (Gemini)
- **Persistent history** — up to 50 results saved locally, survive browser restarts
- **Side panel UI** — browse past results, copy prompts, clear history

## Screenshots

> _Coming soon_

## Installation

### From source

1. Clone the repo:
   ```bash
   git clone https://github.com/qzaqza1818/image-2-prompt-chrome-ext.git
   cd image-2-prompt-chrome-ext
   ```

2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

3. Load into Chrome:
   - Go to `chrome://extensions`
   - Enable **Developer mode** (top-right toggle)
   - Click **Load unpacked** and select the `dist/` folder

## Setup

1. Click the extension icon in the toolbar (or open any page)
2. Click **Options** / the gear icon to open settings
3. Select your preferred AI provider and paste your API key:
   - **Anthropic** — get a key at [console.anthropic.com](https://console.anthropic.com)
   - **OpenAI** — get a key at [platform.openai.com](https://platform.openai.com)
   - **Google** — get a key at [aistudio.google.com](https://aistudio.google.com)
4. Save settings — you're ready to go

## Usage

1. Right-click any image on any webpage
2. Select **"Generate prompt for this image"**
3. The side panel opens and shows the generated prompt with a breakdown
4. Click the copy button to copy the prompt to your clipboard
5. Browse previous results in the side panel history

## Supported Models

| Provider | Models |
|----------|--------|
| Anthropic | claude-haiku-4-5 (fast), claude-sonnet-4-6 (quality) |
| OpenAI | gpt-4o-mini (fast), gpt-4o (quality) |
| Google | gemini-1.5-flash (fast), gemini-1.5-pro (quality) |

## Development

```bash
# Watch mode (rebuilds on file changes)
npm run dev

# Run tests
npm test

# One-off build
npm run build
```

Built with React, TypeScript, and Vite. Tests use Vitest + Testing Library.

## Privacy

- Your API key is stored locally in `chrome.storage.sync` (synced across your own Chrome profile, never sent anywhere except the provider's API).
- Image URLs and generated prompts are stored locally in `chrome.storage.local` and never leave your browser.

## License

MIT
