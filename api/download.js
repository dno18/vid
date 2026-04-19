const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // إعدادات الوصول (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

  try {
    // 1. محاكاة متصفح آيفون حقيقي لفك الرابط المختصر vt.tiktok
    const redirectResponse = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    
    // الحصول على الرابط الطويل النهائي
    let finalLongUrl = redirectResponse.url;

    // 2. استخدام API تنزيل قوي جداً يدعم الفيديو والصور معاً
    const apiResponse = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      },
      body: new URLSearchParams({
        'url': finalLongUrl,
        'hd': '1' // طلب جودة HD
      })
    });

    const result = await apiResponse.json();

    if (result.code === 0 && result.data) {
      const data = result.data;

      // حالة الصور (Slideshow)
      if (data.images && data.images.length > 0) {
        return res.json({
          status: 'picker',
          picker: data.images.map(img => ({ url: img })),
          music: data.music // جلب الموسيقى أيضاً
        });
      }

      // حالة الفيديو (MP4)
      const videoUrl = data.hdplay || data.play || data.wmplay;
      if (videoUrl) {
        return res.json({
          status: 'success',
          url: videoUrl,
          title: data.title,
          cover: data.cover
        });
      }
    }
    
    return res.status(404).json({ error: 'تعذر العثور على محتوى في هذا الرابط' });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'خطأ في الاتصال بالسيرفر، جرب مرة أخرى' });
  }
};
