const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    try {
        let apiUrl = "";
        // تحديد المحرك بناءً على نوع الرابط بدقة
        if (url.includes('tiktok.com')) {
            apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
        } else if (url.includes('instagram.com')) {
            apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
        } else {
            return res.json({ status: 'error', message: 'رابط غير مدعوم' });
        }

        const response = await fetch(apiUrl);
        const d = await response.json();

        if (d.code === 0 && d.data) {
            res.json({
                status: 'success',
                platform: url.includes('tiktok') ? 'TikTok' : 'Instagram',
                url: d.data.hdplay || d.data.play,
                type: d.data.images ? 'image_album' : 'video',
                images: d.data.images || null
            });
        } else {
            res.json({ status: 'error', message: 'لم نتمكن من استخراج الفيديو' });
        }
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'السيرفر لا يستجيب' });
    }
};
