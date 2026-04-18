module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'URL مطلوب' });

  if (!process.env.RAPIDAPI_KEY) {
    return res.status(500).json({ error: 'RAPIDAPI_KEY غير مضبوط في البيئة' });
  }

  const KEY = process.env.RAPIDAPI_KEY;

  // ---- social-media-video-downloader ----
  try {
    const r = await fetch(
      `https://social-media-video-downloader.p.rapidapi.com/smvd/get/all?url=${encodeURIComponent(url)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'social-media-video-downloader.p.rapidapi.com',
          'x-rapidapi-key': KEY,
        },
        signal: AbortSignal.timeout(25000),
      }
    );

    const d = await r.json();
    console.log('SMVD response:', JSON.stringify(d).slice(0, 400));

    if (r.ok && d.links && d.links.length > 0) {
      // اختار أفضل رابط mp4
      const best =
        d.links.find((l) => l.quality === 'hd' || l.quality === '720p') ||
        d.links.find((l) => l.link?.includes('.mp4')) ||
        d.links[0];

      if (best?.link) {
        return res.status(200).json({
          status: 'redirect',
          url: best.link,
          title: d.title || '',
          thumbnail: d.picture || '',
        });
      }
    }

    // لو ما في links جرب حقول أخرى
    const directUrl = d.url || d.video || d.hd_video || d.sd_video;
    if (directUrl) {
      return res.status(200).json({
        status: 'redirect',
        url: directUrl,
        title: d.title || '',
        thumbnail: d.thumbnail || d.cover || '',
      });
    }

    console.warn('No video URL found in response:', JSON.stringify(d).slice(0, 300));
  } catch (e) {
    console.warn('SMVD API failed:', e.message);
  }

  // ---- Backup: instagram-tiktok-youtube-downloader ----
  try {
    const r2 = await fetch(
      `https://instagram-tiktok-youtube-downloader.p.rapidapi.com/index?url=${encodeURIComponent(url)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'instagram-tiktok-youtube-downloader.p.rapidapi.com',
          'x-rapidapi-key': KEY,
        },
        signal: AbortSignal.timeout(20000),
      }
    );

    if (r2.ok) {
      const d2 = await r2.json();
      console.log('Backup API response:', JSON.stringify(d2).slice(0, 300));

      const videoUrl =
        d2.url ||
        d2.video ||
        d2.medias?.[0]?.url ||
        d2.links?.[0]?.url;

      if (videoUrl) {
        return res.status(200).json({
          status: 'redirect',
          url: videoUrl,
          title: d2.title || '',
          thumbnail: d2.thumbnail || d2.cover || '',
        });
      }
    }
  } catch (e) {
    console.warn('Backup API failed:', e.message);
  }

  return res.status(502).json({
    error: 'تعذّر تنزيل الفيديو. تأكد من صحة الرابط أو حاول مرة أخرى.',
  });
};
