import { Router, Request, Response } from 'express';
import { generateImage, buildImagePrompt } from '../services/agnesService.js';

const router = Router();

router.post('/generate-image', async (req: Request, res: Response) => {
  try {
    const { prompt, history = [] } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: '缺少 prompt 字段' });
      return;
    }

    const imagePrompt = `Masterpiece, best quality, ultra-detailed, vibrant colors, ${buildImagePrompt(prompt, history)}`;
    const result = await generateImage({
      prompt: imagePrompt,
      n: 1,
      size: '1024x1024',
    });

    res.json({
      success: true,
      imageUrl: result.data[0]?.url || '',
      revisedPrompt: result.data[0]?.revised_prompt || '',
      explanation: `已根据"${prompt}"生成图像`,
    });
  } catch (err) {
    console.error('[GenerateImage] Error:', err);
    res.status(500).json({
      success: false,
      error: '图像生成失败，请重试',
    });
  }
});

export default router;
