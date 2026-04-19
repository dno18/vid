const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

  let result = {};

  try {
    // 1. تحديد المنصة بناءً على الرابط
    if (url.includes('tiktok.com')) {
      // محرك TikTok (Tikwm)
      const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
      const tikData = await tikRes.json();
      if (tikData.code === 0 && tikData.data) {
        result = {
          status: 'success',
          platform: 'tiktok',
          type: tikData.data.images ? 'image_album' : 'video',
          url: tikData.data.hdplay || tikData.data.play,
          cover: tikData.data.cover,
          // إذا كان ألبوم صور
          images: tikData.data.images || null 
        };
      }
    } else if (url.includes('instagram.com')) {
      // محرك Instagram الاحترافي (نستخدم محرك Cobalt العام)
      // هذا المحرك قوي جداً ويتجاوز حماية إنستقرام
      const instaRes = await fetch('https://cobalt-api.kwi.li/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: url,
          videoQuality: '1080', // جودة عالية
          filenamePattern: 'basic'
        })
      });
      const instaData = await instaRes.json();

      if (instaData.status === 'stream' || instaData.status === 'redirect') {
        result = {
          status: 'success',
          platform: 'instagram',
          type: 'video', // فيديوهات، Reels
          url: instaData.url, // الرابط المباشر بدون علامة
          cover: null // Cobalt لا يعطي غلاف دائماً
        };
      } else if (instaData.status === 'picker') {
        result = {
          status: 'success',
          platform: 'instagram',
          type: 'image_album', // ألبوم صور
          images: instaData.picker.map(item => item.url)
        };
      } else if (instaData.status === 'error') {
          throw new Error('فشل الجلب من إنستقرام');
      }
    } else {
        return res.status(400).json({ status: 'error', message: 'المنصة غير مدعومة' });
    }

    if (result.status === 'success') {
      res.json(result);
    } else {
      throw new Error('فشل جلب البيانات');
    }

  } catch (e) {
    res.status(500).json({ status: 'error', message: 'حدث خطأ في السيرفر أو أن الرابط خاص' });
  }
};
