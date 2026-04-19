const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

  try {
    // خطوة فك الرابط القصير vt.tiktok للحصول على الرابط الطويل
    const follow = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15' }
    });
    const finalUrl = follow.url;

    // إرسال الرابط الحقيقي لـ API التنزيل
    const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(finalUrl)}&hd=1`);
    const result = await tikRes.json();

    if (result.code === 0 && result.data) {
      const d = result.data;
      if (d.images && d.images.length > 0) {
        return res.json({ status: 'picker', picker: d.images.map(img => ({ url: img })) });
      }
      return res.json({ status: 'success', url: d.hdplay || d.play });
    }
    res.status(404).json({ error: 'لم يتم العثور على محتوى' });
  } catch (e) {
    res.status(500).json({ error: 'خطأ في معالجة الرابط' });
  }
};
