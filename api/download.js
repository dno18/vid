const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

  try {
    // 1. فك الرابط المختصر vt.tiktok يدوياً
    const decodeLink = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    });
    
    const longUrl = decodeLink.url.split('?')[0]; 

    // 2. استخدام محرك جلب (Tikwm) بطريقة الـ GET (أحياناً تكون أضمن من POST)
    const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(longUrl)}&hd=1`;
    
    const apiRes = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });

    const result = await apiRes.json();

    if (result.code === 0 && result.data) {
      const data = result.data;

      // إذا كان صور
      if (data.images && data.images.length > 0) {
        return res.json({
          status: 'picker',
          picker: data.images.map(img => ({ url: img }))
        });
      }

      // إذا كان فيديو - نرسل الرابط المباشر
      const video = data.hdplay || data.play;
      if (video) {
        return res.json({
          status: 'success',
          url: video
        });
      }
    }
    
    // إذا فشل المحرك الأول، نرسل خطأ واضحاً لنعرف السبب
    return res.status(404).json({ error: 'الـ API لم يجد بيانات، قد يكون الفيديو خاص أو محذوف' });

  } catch (e) {
    return res.status(500).json({ error: 'خطأ في السيرفر: ' + e.message });
  }
};
