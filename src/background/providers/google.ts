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
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Google response missing content text');
  }
  let parsed: { fullPrompt: string; breakdown: PromptBreakdown };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Google response was not valid JSON: ${text.slice(0, 200)}`);
  }
  return parsed;
}
