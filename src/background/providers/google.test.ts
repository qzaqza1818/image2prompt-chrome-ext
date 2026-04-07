import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeWithGoogle } from './google';

describe('analyzeWithGoogle', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
