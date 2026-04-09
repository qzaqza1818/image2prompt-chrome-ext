import type { PromptBreakdown } from '../../shared/types';
import { SYSTEM_PROMPT } from '../../shared/types';

export async function analyzeWithOpenAI(
  imageBase64: string,
  mimeType: string,
  apiKey: string,
  model: string
): Promise<{ fullPrompt: string; breakdown: PromptBreakdown }> {
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
            { type: 'text', text: SYSTEM_PROMPT },
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
  let parsed: { fullPrompt: string; breakdown: PromptBreakdown };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`OpenAI response was not valid JSON: ${text.slice(0, 200)}`);
  }
  return parsed;
}
