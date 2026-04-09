import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeWithAnthropic } from './anthropic';

describe('analyzeWithAnthropic', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

  it('throws when response has no content text', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [] }),
    } as Response);

    await expect(
      analyzeWithAnthropic('data', 'image/jpeg', 'key', 'claude-haiku-4-5-20251001')
    ).rejects.toThrow('Anthropic response missing content text');
  });

  it('throws when response content is not valid JSON', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ text: 'not valid json {{{' }] }),
    } as Response);

    await expect(
      analyzeWithAnthropic('data', 'image/jpeg', 'key', 'claude-haiku-4-5-20251001')
    ).rejects.toThrow('Anthropic response was not valid JSON');
  });
});
