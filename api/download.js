const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    try {
        // محرك مخصص لإنستقرام وتيك توك معاً
        const response = await axios.get(`https://api.vkrdown.com/server/index.php?url=${encodeURIComponent(url.trim())}`);
        
        let videoUrl = response.data?.data?.url || response.data?.url;

        // إذا فشل المحرك الأول، نجرب المحرك البديل فوراً
        if (!videoUrl) {
            const secondTry = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`);
            videoUrl = secondTry.data?.result?.video?.url || secondTry.data?.result?.url || secondTry.data?.data?.play;
        }

        if (videoUrl) {
            return res.json({ status: 'success', url: videoUrl });
        } else {
            return res.status(400).json({ status: 'error', message: 'لم نتمكن من استخراج الفيديو، تأكد أن الحساب عام' });
        }

    } catch (e) {
        return res.status(500).json({ status: 'error', message: 'المحرك يحتاج تحديث، جرب رابطاً آخر حالياً' });
    }
};
