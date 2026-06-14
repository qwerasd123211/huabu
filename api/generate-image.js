import { buildImagePrompt, generateImage } from '../serverless/agnesService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { prompt, history = [] } = req.body || {};
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

    res.status(200).json({
      success: true,
      imageUrl: result.data?.[0]?.url || '',
      revisedPrompt: result.data?.[0]?.revised_prompt || '',
      explanation: `已根据"${prompt}"生成图像`,
    });
  } catch (err) {
    console.error('[GenerateImage] Error:', err);
    res.status(500).json({
      success: false,
      error: '图像生成失败，请重试',
    });
  }
}
