const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    try {
        // محرك واحد قوي وشامل (يدعم تيك توك وانستقرام)
        const api = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url.trim())}`;
        const response = await fetch(api);
        const d = await response.json();

        // استخراج الرابط بمرونة عالية
        const videoUrl = d.result?.video?.url || d.result?.url || d.data?.play || d.data?.video?.url;

        if (videoUrl) {
            return res.json({ status: 'success', url: videoUrl });
        } else {
            return res.status(400).json({ status: 'error', message: 'لم نتمكن من جلب الفيديو' });
        }
    } catch (e) {
        return res.status(500).json({ status: 'error', message: 'خطأ في السيرفر' });
    }
};
