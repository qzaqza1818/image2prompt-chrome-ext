import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeWithOpenAI } from './openai';

describe('analyzeWithOpenAI', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

  it('throws when response has no content text', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [] }),
    } as Response);

    await expect(
      analyzeWithOpenAI('data', 'image/jpeg', 'key', 'gpt-4o-mini')
    ).rejects.toThrow('OpenAI response missing content');
  });

  it('throws when response content is not valid JSON', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'not json {{{' } }] }),
    } as Response);

    await expect(
      analyzeWithOpenAI('data', 'image/jpeg', 'key', 'gpt-4o-mini')
    ).rejects.toThrow('OpenAI response was not valid JSON');
  });
});
