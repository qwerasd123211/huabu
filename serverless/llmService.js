import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  baseURL: process.env.ANTHROPIC_BASE_URL || 'https://open.bigmodel.cn/api/anthropic',
  apiKey: process.env.ANTHROPIC_AUTH_TOKEN || '',
});

const MODEL = process.env.ANTHROPIC_MODEL || 'glm-5';

function extractJson(text) {
  const noFence = text.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  const first = noFence.indexOf('{');
  const last = noFence.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) return noFence.slice(first, last + 1);
  return noFence;
}

function validateOperations(ops) {
  if (!Array.isArray(ops)) return [];
  return ops.filter((op) => {
    if (!op || typeof op !== 'object') return false;
    if (op.op === 'draw') return op.shape && typeof op.shape === 'object' && op.shape.kind && op.shape.id;
    return ['clear', 'modify', 'delete', 'undo', 'redo'].includes(op.op);
  });
}

export async function parseCommand(systemPrompt, userMessage) {
  if (!process.env.ANTHROPIC_AUTH_TOKEN) {
    return {
      operations: [],
      explanation: '云端命令解析未配置，已交由本地规则或图片生成处理',
      confidence: 0,
    };
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    temperature: 0.1,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text =
    typeof response.content?.[0] === 'object' && 'text' in response.content[0]
      ? response.content[0].text
      : '';

  try {
    const parsed = JSON.parse(extractJson(text));
    return {
      operations: validateOperations(parsed.operations),
      explanation: parsed.explanation || '完成绘图操作',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
    };
  } catch {
    return {
      operations: [],
      explanation: 'AI 未能理解指令，请换个说法试试',
      confidence: 0,
    };
  }
}
