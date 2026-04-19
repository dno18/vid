module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing URL' });

  try {
    // خطوة قوية لفك الروابط القصيرة vt.tiktok
    const fetchRealUrl = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
      }
    });
    const finalLongUrl = fetchRealUrl.url;

    // إرسال الرابط الحقيقي المكتشف للـ API
    const apiRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(finalLongUrl)}&hd=1`);
    const responseData = await apiRes.json();

    if (responseData.code === 0 && responseData.data) {
      const d = responseData.data;
      
      // إذا كان صور
      if (d.images && d.images.length > 0) {
        return res.json({ status: 'picker', picker: d.images.map(img => ({ url: img })) });
      }
      
      // إذا كان فيديو
      const videoLink = d.hdplay || d.play;
      return res.json({ status: 'success', url: videoLink });
    }

    res.status(404).json({ error: "تعذر العثور على محتوى" });
  } catch (error) {
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
};
