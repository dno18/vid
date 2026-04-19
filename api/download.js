module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

  try {
    // خطوة فك الرابط المختصر (عشان يشتغل الرابط اللي أرسلته)
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const finalUrl = response.url;

    // طلب البيانات من API التنزيل
    const r = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ url: finalUrl, hd: '1' }),
    });

    const d = await r.json();

    if (d.code === 0 && d.data) {
      const data = d.data;

      // إذا كان الرابط "صور" Slideshow
      if (data.images && data.images.length > 0) {
        return res.status(200).json({
          status: 'picker',
          picker: data.images.map(img => ({ url: img }))
        });
      }

      // إذا كان فيديو
      const videoUrl = data.hdplay || data.play;
      if (videoUrl) {
        return res.status(200).json({ status: 'success', url: videoUrl });
      }
    }
    return res.status(404).json({ error: 'لم يتم العثور على محتوى' });
  } catch (e) {
    return res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
};
