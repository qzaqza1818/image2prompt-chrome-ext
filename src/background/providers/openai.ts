import type { PromptBreakdown, JsonPrompt } from '../../shared/types';
import { SYSTEM_PROMPT } from '../../shared/types';

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

export async function analyzeWithOpenAI(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
  model: string,
  aspectRatio?: string
): Promise<{ fullPrompt: string; jsonPrompt?: JsonPrompt; breakdown: PromptBreakdown }> {
  const prompt = aspectRatio
    ? `${SYSTEM_PROMPT}\n\nIMPORTANT: The actual measured pixel dimensions give an aspect ratio of exactly ${aspectRatio}. You MUST use "${aspectRatio}" as the aspect_ratio value in your JSON.`
    : SYSTEM_PROMPT;

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
            { type: 'text', text: prompt },
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
  const text: string = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('OpenAI response missing content');
  }
  let parsed: { fullPrompt: string; jsonPrompt?: JsonPrompt; breakdown: PromptBreakdown };
  try {
    parsed = JSON.parse(stripFences(text));
  } catch {
    throw new Error(`OpenAI response was not valid JSON: ${text.slice(0, 200)}`);
  }
  return parsed;
}
