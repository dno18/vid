const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    // تنظيف الرابط في السيرفر أيضاً لزيادة الأمان
    url = url.replace(/^\/+/, '');

    try {
        const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
        const d = await response.json();

        if (d.code === 0 && d.data) {
            res.json({
                status: 'success',
                platform: url.includes('tiktok') ? 'tiktok' : 'instagram',
                url: d.data.hdplay || d.data.play,
                type: d.data.images ? 'image_album' : 'video',
                images: d.data.images || null
            });
        } else {
            res.json({ status: 'error', message: 'الرابط غير صحيح أو الفيديو خاص' });
        }
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'السيرفر مضغوط حالياً' });
    }
};
