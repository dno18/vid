const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

  try {
    // المحرك الأول: Tikwm (الأكثر استقراراً للروابط القصيرة)
    const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
    const result = await response.json();

    if (result.code === 0 && result.data) {
      return res.json({
        status: result.data.images ? 'picker' : 'success',
        url: result.data.hdplay || result.data.play,
        picker: result.data.images || null
      });
    }

    // المحرك الثاني (احتياطي): في حال فشل الأول
    const backup = await fetch(`https://api.tikmate.app/api/lookup?url=${encodeURIComponent(url)}`, { method: 'POST' });
    const backupData = await backup.json();
    if (backupData.success) {
      return res.json({ status: 'success', url: backupData.url });
    }

    throw new Error('جميع المحركات فشلت');
  } catch (e) {
    res.status(500).json({ error: 'تيك توك قام بحظر الطلب، جرب بعد دقيقة' });
  }
};
