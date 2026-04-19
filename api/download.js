module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

  try {
    // إجبار السيرفر على جلب الرابط الحقيقي من الرابط المختصر
    const headResponse = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const longUrl = headResponse.url; // الرابط الطويل بعد الفك

    // إرسال الرابط الطويل للـ API
    const tikRes = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ url: longUrl, hd: '1' }),
    });

    const result = await tikRes.json();

    if (result.code === 0 && result.data) {
      const d = result.data;

      // إذا كان صور (Slideshow)
      if (d.images && d.images.length > 0) {
        return res.status(200).json({
          status: 'picker',
          picker: d.images.map(img => ({ url: img }))
        });
      }

      // إذا كان فيديو (سواء قصير أو طويل)
      const video = d.hdplay || d.play;
      if (video) {
        return res.status(200).json({
          status: 'success',
          url: video
        });
      }
    }
    
    return res.status(404).json({ error: 'لم نتمكن من استخراج الفيديو، تأكد من أن الحساب ليس خاصاً' });

  } catch (e) {
    return res.status(500).json({ error: 'خطأ في معالجة الرابط القصير' });
  }
};
