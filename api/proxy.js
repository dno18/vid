const fetch = require('node-fetch');

module.exports = async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send('URL required');

  try {
    const decoded = decodeURIComponent(url);
    const response = await fetch(decoded, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15',
        'Referer': 'https://www.tiktok.com/'
      }
    });

    if (!response.ok) return res.status(502).send('Proxy fetch failed');

    const contentType = response.headers.get('content-type') || 'video/mp4';
    const isVideo = contentType.includes('video') || decoded.includes('.mp4');
    const isImage = contentType.includes('image') || decoded.includes('.jpg') || decoded.includes('.jpeg') || decoded.includes('.webp');

    const ext = isVideo ? 'mp4' : isImage ? 'jpg' : 'file';
    const filename = `download_${Date.now()}.${ext}`;

    // هذا هو السطر المهم — يجبر المتصفح على التنزيل حتى في Safari
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (e) {
    console.error('Proxy error:', e.message);
    res.status(502).send('Proxy error: ' + e.message);
  }
};
