const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    // تنظيف الرابط من أي رموز زائدة ناتجة عن النسخ الخاطئ
    url = url.trim().replace(/^[\/\s]+/, '');

    try {
        // المحرك الأساسي (يدعم الروابط القصيرة تلقائياً)
        const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        const d = await response.json();

        if (d.code === 0 && d.data) {
            res.json({
                status: 'success',
                platform: url.includes('tiktok') ? 'TikTok' : 'Instagram',
                url: d.data.hdplay || d.data.play, // رابط الفيديو
                type: d.data.images ? 'image_album' : 'video',
                images: d.data.images || null
            });
        } else {
            res.json({ status: 'error', message: 'لم يتم العثور على محتوى. تأكد أن الحساب ليس خاصاً.' });
        }
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'عذراً، المحرك لا يستجيب حالياً.' });
    }
};
