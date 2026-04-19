import type { PromptBreakdown, JsonPrompt } from '../../shared/types';
import { SYSTEM_PROMPT } from '../../shared/types';

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

export async function analyzeWithGoogle(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
  model: string,
  aspectRatio?: string
): Promise<{ fullPrompt: string; jsonPrompt?: JsonPrompt; breakdown: PromptBreakdown }> {
  const prompt = aspectRatio
    ? `${SYSTEM_PROMPT}\n\nIMPORTANT: The actual measured pixel dimensions give an aspect ratio of exactly ${aspectRatio}. You MUST use "${aspectRatio}" as the aspect_ratio value in your JSON.`
    : SYSTEM_PROMPT;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
            { text: prompt },
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
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Google response missing content text');
  }
  let parsed: { fullPrompt: string; jsonPrompt?: JsonPrompt; breakdown: PromptBreakdown };
  try {
    parsed = JSON.parse(stripFences(text));
  } catch {
    throw new Error(`Google response was not valid JSON: ${text.slice(0, 200)}`);
  }
  return parsed;
}
