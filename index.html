// api/download.js — Vercel Serverless Function
// هذا السيرفر يستقبل الطلب من المتصفح ويحوله لـ Cobalt API
// يحل مشكلة CORS لأن السيرفر يتكلم مع Cobalt مباشرة

const COBALT_INSTANCES = [
  'https://cobalt.api.timelessnesses.me',
  'https://cobalt.drgns.space',
  'https://capi.7tv.app',
  'https://cobalt.ggtyler.dev',
  'https://cobalt.rocks',
  'https://cobalt-api.kwiatekmiki.com',
];

export default async function handler(req, res) {
  // السماح بالطلبات من أي مكان (CORS headers)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, videoQuality } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const body = { url };
  if (videoQuality) body.videoQuality = videoQuality;

  let lastError = 'All instances failed';

  for (const instance of COBALT_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${instance}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await response.json();

      if (data.status === 'error') {
        const errorMap = {
          'error.api.link.invalid': 'الرابط غير صحيح',
          'error.api.fetch.fail': 'تعذّر جلب الفيديو من المنصة',
          'error.api.link.unsupported': 'هذه المنصة غير مدعومة',
          'error.api.content.too_long': 'الفيديو طويل جداً',
        };
        const code = data.error?.code;
        const msg = errorMap[code] || code || 'خطأ غير معروف';

        // إذا الرابط غلط، ما في فائدة نجرب خوادم ثانية
        if (code === 'error.api.link.invalid' || code === 'error.api.link.unsupported') {
          return res.status(400).json({ error: msg });
        }
        lastError = msg;
        continue;
      }

      if (data.url || data.status === 'picker') {
        return res.status(200).json(data);
      }

    } catch (err) {
      lastError = `Connection failed: ${err.message}`;
      continue;
    }
  }

  return res.status(502).json({ error: lastError });
}
