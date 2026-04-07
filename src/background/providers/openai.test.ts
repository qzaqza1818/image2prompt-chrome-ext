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
