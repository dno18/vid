module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, videoQuality } = req.body || {};
  if (!url) return res.status(400).json({ error: 'URL مطلوب' });

  if (!process.env.RAPIDAPI_KEY) {
    return res.status(500).json({ error: 'RAPIDAPI_KEY غير مضبوط في البيئة' });
  }

  // ---- الـ API الأولى: all-in-one downloader ----
  try {
    const r1 = await fetch(
      `https://instagram-tiktok-youtube-downloader.p.rapidapi.com/index?url=${encodeURIComponent(url)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'instagram-tiktok-youtube-downloader.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        },
        signal: AbortSignal.timeout(20000),
      }
    );

    if (r1.ok) {
      const d1 = await r1.json();
      const videoUrl =
        d1.url ||
        d1.video ||
        d1.medias?.[0]?.url ||
        d1.links?.[0]?.url;

      if (videoUrl) {
        return res.status(200).json({
          status: 'redirect',
          url: videoUrl,
          title: d1.title || '',
          thumbnail: d1.thumbnail || d1.cover || '',
        });
      }
    }
  } catch (e) {
    console.warn('API #1 failed:', e.message);
  }

  // ---- الـ API الثانية: social media video downloader (backup) ----
  try {
    const r2 = await fetch(
      'https://social-media-video-downloader.p.rapidapi.com/smvd/get/all?' +
        new URLSearchParams({ url }),
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'social-media-video-downloader.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        },
        signal: AbortSignal.timeout(20000),
      }
    );

    if (r2.ok) {
      const d2 = await r2.json();
      // يرجع مصفوفة روابط بجودات مختلفة
      const links = d2.links || [];

      // اختار أعلى جودة mp4 مطلوبة
      const preferred = videoQuality
        ? links.find(
            (l) =>
              l.quality?.includes(videoQuality) &&
              (l.link?.includes('.mp4') || l.type === 'video/mp4')
          )
        : null;

      const best =
        preferred ||
        links.find(
          (l) => l.link?.includes('.mp4') || l.type === 'video/mp4'
        ) ||
        links[0];

      if (best?.link) {
        return res.status(200).json({
          status: 'redirect',
          url: best.link,
          title: d2.title || '',
          thumbnail: d2.picture || '',
        });
      }
    }
  } catch (e) {
    console.warn('API #2 failed:', e.message);
  }

  // ---- فشل الكل ----
  return res.status(502).json({
    error: 'تعذّر تنزيل الفيديو. تأكد من صحة الرابط أو حاول مرة أخرى.',
  });
};
