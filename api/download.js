const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

  try {
    // 1. محاكاة متصفح أندرويد حقيقي لفك الرابط القصير
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/ *;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    const longUrl = response.url;

    // 2. استخدام المحرك الأقوى حالياً (الذي تستخدمه معظم المواقع)
    const apiRes = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: new URLSearchParams({
        'url': longUrl,
        'hd': '1'
      })
    });

    const result = await apiRes.json();

    if (result.code === 0 && result.data) {
        return res.json({
            status: result.data.images ? 'picker' : 'success',
            url: result.data.hdplay || result.data.play,
            picker: result.data.images ? result.data.images.map(img => ({ url: img })) : null
        });
    }

    throw new Error('API Error');

  } catch (e) {
    // محاولة ثانية بمحرك احتياطي إذا فشل الأول
    try {
        const backupRes = await fetch(`https://api.tikmate.app/api/lookup?url=${encodeURIComponent(url)}`, {
            method: 'POST'
        });
        const backupData = await backupRes.json();
        if(backupData.success) {
            return res.json({ status: 'success', url: backupData.url });
        }
    } catch(err2) {}
    
    res.status(500).json({ error: 'فشل جلب الفيديو، قد يكون السيرفر مضغوطاً حالياً' });
  }
};
