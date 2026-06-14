const AGNES_BASE_URL = process.env.AGNES_BASE_URL?.trim() || 'https://apihub.agnes-ai.com';
const AGNES_MODEL = process.env.AGNES_MODEL?.trim() || 'agnes-image-2.1-flash';

export function buildImagePrompt(transcript, history = []) {
  const text = String(transcript || '').trim();
  if (/画|绘|图|图片|场景|风景|插画/.test(text)) return text;
  const contextHint = history.length > 0 ? ` (之前画了: ${String(history.at(-1)).slice(0, 50)})` : '';
  return `${text}${contextHint}`;
}

export async function generateImage({ prompt, n = 1, size = '1024x1024' }) {
  const apiKey = process.env.AGNES_API_KEY?.trim();
  if (!apiKey) throw new Error('AGNES_API_KEY is not configured');

  const res = await fetch(`${AGNES_BASE_URL}/v1/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AGNES_MODEL,
      prompt,
      n,
      size,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AgnesAI error ${res.status}: ${text}`);
  }

  return res.json();
}
