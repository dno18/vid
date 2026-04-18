module.exports = async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send('URL مطلوب');

  try {
    const response = await fetch(decodeURIComponent(url), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.tiktok.com/',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) return res.status(502).send('فشل جلب الفيديو');

    const contentType = response.headers.get('content-type') || 'video/mp4';
    const contentLength = response.headers.get('content-length');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
    if (contentLength) res.setHeader('Content-Length', contentLength);
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Stream the video
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();

  } catch (e) {
    console.error('Proxy error:', e.message);
    res.status(502).send('خطأ في البروكسي');
  }
};
