import Anthropic from '@anthropic-ai/sdk';
import type { ParseCommandResponse, DrawingOperation } from '../types/index.js';

const client = new Anthropic({
  baseURL: process.env.ANTHROPIC_BASE_URL || 'https://open.bigmodel.cn/api/anthropic',
  apiKey: process.env.ANTHROPIC_AUTH_TOKEN || '',
});

const MODEL = process.env.ANTHROPIC_MODEL || 'glm-5';

function extractJson(text: string): string {
  // Try to find JSON block in the response
  const trimmed = text.trim();
  // Remove markdown code fences if present
  const noFence = trimmed.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  // Find the outermost { ... }
  const firstBrace = noFence.indexOf('{');
  const lastBrace = noFence.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return noFence.slice(firstBrace, lastBrace + 1);
  }
  return noFence;
}

function validateOperations(ops: unknown[]): DrawingOperation[] {
  const valid: DrawingOperation[] = [];
  for (const op of ops) {
    if (typeof op !== 'object' || op === null) continue;
    const o = op as Record<string, unknown>;
    if (o.op === 'draw' && o.shape && typeof o.shape === 'object') {
      const shape = o.shape as Record<string, unknown>;
      if (shape.kind && shape.id) {
        valid.push(op as DrawingOperation);
      }
    } else if (['clear', 'modify', 'delete', 'undo', 'redo'].includes(o.op as string)) {
      valid.push(op as DrawingOperation);
    }
  }
  return valid;
}

export async function parseCommand(
  systemPrompt: string,
  userMessage: string
): Promise<ParseCommandResponse> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    temperature: 0.1,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text =
    typeof response.content[0] === 'object' && 'text' in response.content[0]
      ? (response.content[0] as { text: string }).text
      : '';

  console.log('[LLM] Raw response length:', text.length);
  console.log('[LLM] First 200 chars:', text.slice(0, 200));

  try {
    const jsonStr = extractJson(text);
    const parsed = JSON.parse(jsonStr);

    const operations = Array.isArray(parsed.operations)
      ? validateOperations(parsed.operations)
      : [];

    return {
      operations,
      explanation: parsed.explanation || '完成绘图操作',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
    };
  } catch (err) {
    console.error('[LLM] JSON parse failed:', err);
    console.error('[LLM] Full text:', text);
    return {
      operations: [],
      explanation: 'AI 未能理解指令，请换个说法试试',
      confidence: 0,
    };
  }
}
