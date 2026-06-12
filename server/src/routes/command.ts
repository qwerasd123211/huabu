import { Router, Request, Response } from 'express';
import { buildMessages } from '../services/promptBuilder.js';
import { parseCommand } from '../services/llmService.js';
import type { ParseCommandRequest } from '../types/index.js';

const router = Router();

router.post('/parse-command', async (req: Request, res: Response) => {
  try {
    const body = req.body as ParseCommandRequest;

    if (!body.transcript || typeof body.transcript !== 'string') {
      res.status(400).json({ error: '缺少 transcript 字段' });
      return;
    }

    const { systemPrompt, userMessage } = buildMessages(body);
    const result = await parseCommand(systemPrompt, userMessage);

    console.log(
      `[Command] "${body.transcript.slice(0, 50)}" → ${result.operations.length} ops, confidence=${result.confidence}`
    );

    res.json(result);
  } catch (err) {
    console.error('[Command] Error:', err);
    res.status(500).json({
      error: '命令解析失败，请重试',
      operations: [],
      explanation: '服务暂时不可用',
      confidence: 0,
    });
  }
});

export default router;
