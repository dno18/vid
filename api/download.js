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

  try {
    const r = await fetch(
      `https://auto-download-all-in-one.p.rapidapi.com/v1/social/autolink?url=${encodeURIComponent(url)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'auto-download-all-in-one.p.rapidapi.com',
          'x-rapidapi-key': KEY,
        },
        signal: AbortSignal.timeout(25000),
      }
    );

    const d = await r.json();
    console.log('API response:', JSON.stringify(d).slice(0, 500));

    if (!r.ok) {
      return res.status(502).json({ error: d.message || 'خطأ من الخادم' });
    }

    // الـ API ترجع medias array
    const medias = d.medias || [];
    const best =
      medias.find((m) => m.quality === 'hd') ||
      medias.find((m) => m.quality === 'sd') ||
      medias.find((m) => m.url) ||
      medias[0];

    const videoUrl = best?.url || d.url;

    if (videoUrl) {
      return res.status(200).json({
        status: 'redirect',
        url: videoUrl,
        title: d.title || '',
        thumbnail: d.thumbnail || best?.thumbnail || '',
      });
    }

    return res.status(502).json({ error: 'لم يُعثر على رابط الفيديو' });

  } catch (e) {
    console.error('API error:', e.message);
    return res.status(502).json({ error: 'تعذّر تنزيل الفيديو. تأكد من صحة الرابط أو حاول مرة أخرى.' });
  }
};
