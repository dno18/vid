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

  // ---- API: Auto Download All-in-One ----
  try {
    const r = await fetch(
      'https://auto-download-all-in-one.p.rapidapi.com/v1/social/autolink',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'auto-download-all-in-one.p.rapidapi.com',
          'x-rapidapi-key': KEY,
        },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(20000),
      }
    );

    if (r.ok) {
      const d = await r.json();
      console.log('API response:', JSON.stringify(d).slice(0, 300));

      const medias = d.medias || d.media || [];
      const best =
        medias.find((m) => m.quality === 'hd' && m.videoAvailable) ||
        medias.find((m) => m.videoAvailable) ||
        medias.find((m) => m.url) ||
        medias[0];

      const videoUrl = best?.url || d.url || d.video;

      if (videoUrl) {
        return res.status(200).json({
          status: 'redirect',
          url: videoUrl,
          title: d.title || d.desc || '',
          thumbnail: d.thumbnail || d.cover || best?.thumbnail || '',
        });
      }
    } else {
      const errText = await r.text();
      console.warn('API error:', r.status, errText.slice(0, 200));
    }
  } catch (e) {
    console.warn('API failed:', e.message);
  }

  // ---- API Backup: Instagram-TikTok-YouTube Downloader ----
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
