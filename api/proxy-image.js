const ALLOWED_DOMAINS = ['platform-outputs.agnes-ai.space', 'apihub.agnes-ai.com'];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const url = req.query?.url;
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: '缺少 url 参数' });
      return;
    }

    const parsed = new URL(url);
    if (!ALLOWED_DOMAINS.some((domain) => parsed.hostname.includes(domain))) {
      res.status(403).json({ error: '不允许的图片域名' });
      return;
    }

    const imageRes = await fetch(url);
    if (!imageRes.ok) {
      res.status(502).json({ error: '图片获取失败' });
      return;
    }

    const buffer = Buffer.from(await imageRes.arrayBuffer());
    res.setHeader('Content-Type', imageRes.headers.get('content-type') || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(buffer);
  } catch (err) {
    console.error('[ProxyImage] Error:', err);
    res.status(500).json({ error: '图片代理失败' });
  }
}
