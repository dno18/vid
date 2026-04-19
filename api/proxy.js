const https = require('https');
const http = require('http');

module.exports = function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send('URL required');

  const decoded = decodeURIComponent(url);
  const isVideo = decoded.includes('.mp4') || decoded.includes('video');
  const isImage = decoded.includes('.jpg') || decoded.includes('.jpeg') || decoded.includes('.webp') || decoded.includes('.png');
  const ext = isVideo ? 'mp4' : isImage ? 'jpg' : 'mp4';
  const filename = `tiktok_${Date.now()}.${ext}`;

  const lib = decoded.startsWith('https') ? https : http;

  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.tiktok.com/',
      'Accept': '*/*',
    }
  };

  const proxyReq = lib.get(decoded, options, (proxyRes) => {
    // تتبع redirect إذا وُجد
    if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
      proxyRes.destroy();
      const redirectUrl = proxyRes.headers.location;
      return module.exports({ query: { url: encodeURIComponent(redirectUrl) } }, res);
    }

    if (proxyRes.statusCode !== 200) {
      return res.status(proxyRes.statusCode).send('Upstream error: ' + proxyRes.statusCode);
    }

    const contentType = proxyRes.headers['content-type'] || (isVideo ? 'video/mp4' : 'image/jpeg');
    const contentLength = proxyRes.headers['content-length'];

    // Headers مهمة لإجبار iOS على التنزيل
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    // STREAMING — بدل تحميل الملف كاملاً في الذاكرة
    proxyRes.pipe(res);

    proxyRes.on('error', (e) => {
      console.error('proxyRes error:', e.message);
      if (!res.headersSent) res.status(502).send('Stream error');
    });
  });

  proxyReq.on('error', (e) => {
    console.error('proxyReq error:', e.message);
    if (!res.headersSent) res.status(502).send('Proxy error: ' + e.message);
  });

  proxyReq.setTimeout(30000, () => {
    proxyReq.destroy();
    if (!res.headersSent) res.status(504).send('Proxy timeout');
  });
};
