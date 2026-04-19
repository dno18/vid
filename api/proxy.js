const https = require('https');
const http = require('http');

function streamProxy(targetUrl, res, depth) {
  if (depth > 5) return res.status(502).send('Too many redirects');

  const lib = targetUrl.startsWith('https') ? https : http;

  const req = lib.get(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.tiktok.com/',
      'Accept': 'video/mp4,video/*,*/*',
    }
  }, (upstream) => {
    // تتبع الـ redirects
    if ([301,302,303,307,308].includes(upstream.statusCode) && upstream.headers.location) {
      upstream.destroy();
      const next = upstream.headers.location.startsWith('http')
        ? upstream.headers.location
        : new URL(upstream.headers.location, targetUrl).href;
      console.log(`Redirect ${depth} -> ${next.substring(0,80)}`);
      return streamProxy(next, res, depth + 1);
    }

    if (upstream.statusCode !== 200) {
      upstream.destroy();
      return res.status(upstream.statusCode).send('Upstream error: ' + upstream.statusCode);
    }

    const ct = upstream.headers['content-type'] || '';
    const cl = upstream.headers['content-length'];

    // تحقق إن الرابط فيديو وليس صوت
    const isAudio = ct.includes('audio') || targetUrl.includes('.mp3') || targetUrl.includes('.m4a');
    if (isAudio) {
      upstream.destroy();
      console.log('Blocked audio-only URL:', targetUrl.substring(0,80));
      return res.status(415).send('Audio-only URL blocked');
    }

    const finalType = ct.includes('video') ? ct : 'video/mp4';
    const filename = `tiktok_${Date.now()}.mp4`;

    res.setHeader('Content-Type', finalType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache');
    if (cl) res.setHeader('Content-Length', cl);

    // ─── STREAMING مباشر ───
    upstream.pipe(res);

    upstream.on('error', (e) => {
      console.error('upstream error:', e.message);
    });
  });

  req.on('error', (e) => {
    console.error('req error:', e.message);
    if (!res.headersSent) res.status(502).send('Proxy error: ' + e.message);
  });

  req.setTimeout(30000, () => {
    req.destroy();
    if (!res.headersSent) res.status(504).send('Proxy timeout');
  });
}

module.exports = function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).send('URL required');

  const decoded = decodeURIComponent(url);
  console.log('Proxying:', decoded.substring(0, 100));

  res.setHeader('Access-Control-Allow-Origin', '*');
  streamProxy(decoded, res, 0);
};
