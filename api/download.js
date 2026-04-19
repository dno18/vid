module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

  try {
    // 1. فك الرابط المختصر (vt.tiktok / vm.tiktok)
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
      }
    });
    const finalUrl = response.url;

    // 2. طلب البيانات من tikwm
    const r = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0'
      },
      body: new URLSearchParams({ url: finalUrl, hd: '1' }),
    });

    const d = await r.json();

    if (d.code === 0 && d.data) {
      const data = d.data;

      // حالة الصور (Slideshow)
      if (data.images && data.images.length > 0) {
        return res.status(200).json({
          status: 'picker',
          picker: data.images.map(img => ({ url: img }))
        });
      }

      // حالة الفيديو
      const videoUrl = data.hdplay || data.play;
      if (videoUrl) {
        return res.status(200).json({
          status: 'success',
          url: videoUrl
        });
      }
    }
    
    return res.status(404).json({ error: 'لم نجد محتوى، الرابط قد يكون خاصاً' });

  } catch (e) {
    return res.status(500).json({ error: 'خطأ في السيرفر: ' + e.message });
  }
};
