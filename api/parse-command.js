import { buildMessages } from '../serverless/promptBuilder.js';
import { parseCommand } from '../serverless/llmService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = req.body || {};
    if (!body.transcript || typeof body.transcript !== 'string') {
      res.status(400).json({ error: '缺少 transcript 字段' });
      return;
    }

    const { systemPrompt, userMessage } = buildMessages(body);
    const result = await parseCommand(systemPrompt, userMessage);
    res.status(200).json(result);
  } catch (err) {
    console.error('[Command] Error:', err);
    res.status(500).json({
      error: '命令解析失败，请重试',
      operations: [],
      explanation: '服务暂时不可用',
      confidence: 0,
    });
  }
}
