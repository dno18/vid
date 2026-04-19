const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    // 1. فك الرابط القصير vt.tiktok للحصول على الرابط الطويل
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15' }
    });
    const longUrl = response.url;

    // 2. طلب الفيديو من API التنزيل باستخدام الرابط الطويل
    const apiRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(longUrl)}&hd=1`);
    const data = await apiRes.json();

    if (data.code === 0 && data.data) {
      const d = data.data;
      if (d.images && d.images.length > 0) {
        return res.json({ status: 'picker', picker: d.images.map(img => ({ url: img })) });
      }
      return res.json({ status: 'success', url: d.hdplay || d.play });
    }
    res.status(404).json({ error: 'Content not found' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
};
