const https = require('https');

const HOSTS = [
  'cobalt.lunar.icu',
  'co.wuk.sh',
  'cobalt.svaha.eu.org',
  'cobalt.api.timelessnesses.me',
  'capi.7tv.app',
];

function postCobalt(host, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: host,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'vid-downloader/1.0',
      },
      timeout: 15000,
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error('bad json')); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
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
  if (!url) return res.status(400).json({ error: 'URL مطلوب' });

  const body = { url };
  if (videoQuality) body.videoQuality = videoQuality;

  const errors = [];
  for (const host of HOSTS) {
    try {
      const d = await postCobalt(host, body);
      if (d.status === 'error') {
        const code = d.error?.code || '';
        const map = {
          'error.api.link.invalid': 'الرابط غير صحيح',
          'error.api.link.unsupported': 'المنصة غير مدعومة',
          'error.api.fetch.fail': 'تعذّر جلب الفيديو',
          'error.api.content.too_long': 'الفيديو طويل جداً',
        };
        if (code === 'error.api.link.invalid' || code === 'error.api.link.unsupported') {
          return res.status(400).json({ error: map[code] || code });
        }
        errors.push(map[code] || code);
        continue;
      }
      if (d.url || d.status === 'picker') {
        return res.status(200).json(d);
      }
    } catch (e) {
      errors.push(host + ': ' + e.message);
      continue;
    }
  }

  // Log errors for debugging
  console.error('All hosts failed:', errors);
  return res.status(502).json({ 
    error: 'فشل الاتصال بجميع الخوادم',
    debug: errors
  });
};
