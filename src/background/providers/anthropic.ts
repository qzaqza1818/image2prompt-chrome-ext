import type { PromptBreakdown, JsonPrompt } from '../../shared/types';
import { SYSTEM_PROMPT } from '../../shared/types';

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

export async function analyzeWithAnthropic(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
  model: string,
  aspectRatio?: string
): Promise<{ fullPrompt: string; jsonPrompt?: JsonPrompt; breakdown: PromptBreakdown }> {
  const prompt = aspectRatio
    ? `${SYSTEM_PROMPT}\n\nIMPORTANT: The actual measured pixel dimensions give an aspect ratio of exactly ${aspectRatio}. You MUST use "${aspectRatio}" as the aspect_ratio value in your JSON.`
    : SYSTEM_PROMPT;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
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
            { type: 'text', text: prompt },
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
  const text: string = data.content?.[0]?.text;
  if (!text) {
    throw new Error(`Anthropic response missing content text`);
  }
  let parsed: { fullPrompt: string; jsonPrompt?: JsonPrompt; breakdown: PromptBreakdown };
  try {
    parsed = JSON.parse(stripFences(text));
  } catch {
    throw new Error(`Anthropic response was not valid JSON: ${text.slice(0, 200)}`);
  }
  return parsed;
}
