const https = require('https');

const INSTANCES = [
  'cobalt.api.timelessnesses.me',
  'cobalt.drgns.space',
  'capi.7tv.app',
  'cobalt.ggtyler.dev',
  'cobalt.rocks',
  'cobalt-api.kwiatekmiki.com',
];

function postJSON(host, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: host,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
      timeout: 12000,
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => raw += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error('Invalid JSON')); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(data);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, videoQuality } = req.body || {};
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const body = { url };
  if (videoQuality) body.videoQuality = videoQuality;

  const ERROR_MAP = {
    'error.api.link.invalid': 'الرابط غير صحيح',
    'error.api.fetch.fail': 'تعذّر جلب الفيديو من المنصة',
    'error.api.link.unsupported': 'هذه المنصة غير مدعومة',
    'error.api.content.too_long': 'الفيديو طويل جداً',
  };

  for (const host of INSTANCES) {
    try {
      const data = await postJSON(host, body);
      if (data.status === 'error') {
        const code = data.error?.code;
        const msg = ERROR_MAP[code] || code || 'خطأ غير معروف';
        if (code === 'error.api.link.invalid' || code === 'error.api.link.unsupported') {
          return res.status(400).json({ error: msg });
        }
        continue;
      }
      if (data.url || data.status === 'picker') {
        return res.status(200).json(data);
      }
    } catch (e) {
      continue;
    }
  }

  return res.status(502).json({ error: 'فشل الاتصال بجميع الخوادم' });
};
