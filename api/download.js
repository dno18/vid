const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    try {
        // محرك TikTok و Instagram
        const response = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url.trim())}`);
        const d = response.data;

        const videoUrl = d.result?.video?.url || d.result?.url || d.data?.play || d.data?.video?.url;

        if (videoUrl) {
            return res.json({ status: 'success', url: videoUrl });
        } else {
            return res.status(400).json({ status: 'error', message: 'لم نتمكن من جلب الفيديو' });
        }
    } catch (e) {
        // إذا فشل المحرك الأول، نجرب المحرك الاحتياطي مباشرة
        try {
            const backup = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            if (backup.data.code === 0) {
                return res.json({ status: 'success', url: backup.data.data.play });
            }
        } catch (err) {}
        
        return res.status(500).json({ status: 'error', message: 'السيرفر يواجه ضغطاً، حاول مرة أخرى' });
    }
};
