import { Router, Request, Response } from 'express';

const router = Router();

router.get('/proxy-image', async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      res.status(400).json({ error: '缺少 url 参数' });
      return;
    }

    // Validate URL is from trusted domains
    const allowedDomains = ['platform-outputs.agnes-ai.space', 'apihub.agnes-ai.com'];
    const urlObj = new URL(url);
    if (!allowedDomains.some((d) => urlObj.hostname.includes(d))) {
      res.status(403).json({ error: '不允许的图片域名' });
      return;
    }

    const imageRes = await fetch(url);
    if (!imageRes.ok) {
      res.status(502).json({ error: '图片获取失败' });
      return;
    }

    const buffer = await imageRes.arrayBuffer();
    const contentType = imageRes.headers.get('content-type') || 'image/png';

    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    });
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('[ProxyImage] Error:', err);
    res.status(500).json({ error: '图片代理失败' });
  }
});

export default router;
