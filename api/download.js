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
    // 1. أرسل الرابط مباشرة لـ tikwm (يدعم الروابط القصيرة)
    let resolvedUrl = url;

    // 2. إذا كان رابط قصير، نفكّه يدوياً خطوة خطوة
    if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
      try {
        // نتبع الـ redirect يدوياً بدون node-fetch لأنه أحياناً ما يعيد response.url صح
        const r1 = await fetch(url, {
          method: 'HEAD',
          redirect: 'manual',
          headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15' }
        });
        const location = r1.headers.get('location');
        if (location) {
          resolvedUrl = location;
          // قد يكون في redirect ثاني
          if (!resolvedUrl.includes('tiktok.com/@')) {
            const r2 = await fetch(resolvedUrl, {
              method: 'HEAD',
              redirect: 'manual',
              headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15' }
            });
            const loc2 = r2.headers.get('location');
            if (loc2) resolvedUrl = loc2;
          }
        }
      } catch (e) {
        // إذا فشل فك الرابط، نستخدم الرابط الأصلي
        resolvedUrl = url;
      }
    }

    console.log('Resolved URL:', resolvedUrl);

    // 3. نجرّب tikwm بالرابط المُفكّك أو الأصلي
    const apiRes = await fetch(
      `https://www.tikwm.com/api/?url=${encodeURIComponent(resolvedUrl)}&hd=1`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    const data = await apiRes.json();

    if (data.code === 0 && data.data) {
      const d = data.data;
      if (d.images && d.images.length > 0) {
        return res.json({ status: 'picker', picker: d.images.map(img => ({ url: img })) });
      }
      const videoUrl = d.hdplay || d.play;
      if (videoUrl) return res.json({ status: 'success', url: videoUrl });
    }

    // 4. إذا فشل مع الرابط المُفكّك، نجرّب الرابط الأصلي مباشرة
    if (resolvedUrl !== url) {
      const retry = await fetch(
        `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      const retryData = await retry.json();
      if (retryData.code === 0 && retryData.data) {
        const d = retryData.data;
        if (d.images && d.images.length > 0) {
          return res.json({ status: 'picker', picker: d.images.map(img => ({ url: img })) });
        }
        const videoUrl = d.hdplay || d.play;
        if (videoUrl) return res.json({ status: 'success', url: videoUrl });
      }
    }

    res.status(404).json({ error: 'Content not found' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
};
