const AGNES_API_KEY = process.env.AGNES_API_KEY?.trim() || '';
const AGNES_BASE_URL = process.env.AGNES_BASE_URL?.trim() || 'https://apihub.agnes-ai.com';
const AGNES_MODEL = process.env.AGNES_MODEL?.trim() || 'agnes-image-2.1-flash';

interface ImageGenerationParams {
  prompt: string;
  n?: number;
  size?: string;
}

interface ImageGenerationResponse {
  created: number;
  data: Array<{ url: string; revised_prompt?: string }>;
}

export async function generateImage(params: ImageGenerationParams): Promise<ImageGenerationResponse> {
  if (!AGNES_API_KEY) {
    throw new Error('AGNES_API_KEY is not configured');
  }

  const body: Record<string, unknown> = {
    model: AGNES_MODEL,
    prompt: params.prompt,
    n: params.n || 1,
    size: params.size || '1024x1024',
  };

  console.log('[AgnesAI] Generating image with prompt:', params.prompt.slice(0, 100));

  const res = await fetch(`${AGNES_BASE_URL}/v1/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AGNES_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[AgnesAI] API error:', res.status, errText);
    throw new Error(`图片生成失败: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as ImageGenerationResponse;
  console.log('[AgnesAI] Generated:', data.data[0]?.url?.slice(0, 80));
  return data;
}

export function buildImagePrompt(transcript: string, history: string[]): string {
  // If the user's transcript already looks like a visual description, use it directly
  // Otherwise, prefix with art direction for better results
  const text = transcript.trim();

  // If the text already contains drawing/painting keywords, use as-is
  if (/画|绘|图|图片|场景|风景|插画/.test(text)) {
    return text;
  }

  // Add context from history for multi-turn refinement
  const contextHint = history.length > 0
    ? ` (之前画了: ${history.slice(-1)[0].slice(0, 50)})`
    : '';

  return `${text}${contextHint}`;
}
