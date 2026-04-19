const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    try {
        if (url.includes('tiktok.com')) {
            const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
            const tikData = await tikRes.json();
            if (tikData.data) {
                return res.json({
                    status: 'success',
                    platform: 'tiktok',
                    type: tikData.data.images ? 'image_album' : 'video',
                    url: tikData.data.hdplay || tikData.data.play,
                    images: tikData.data.images || null
                });
            }
        } 
        
        else if (url.includes('instagram.com')) {
            // استخدام محرك "SnapInsta" API المباشر (وسيط خفي)
            const instaRes = await fetch(`https://api.snapinsta.app/api/video?url=${encodeURIComponent(url)}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            
            // في حال فشل SnapInsta، نستخدم المحرك الاحترافي البديل
            const backupRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            const data = await backupRes.json();

            if (data.code === 0 && data.data) {
                return res.json({
                    status: 'success',
                    platform: 'instagram',
                    type: data.data.images ? 'image_album' : 'video',
                    url: data.data.play || data.data.hdplay,
                    images: data.data.images || null
                });
            }
        }
        
        throw new Error('فشل الجلب');
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'السيرفر مضغوط، حاول مجدداً' });
    }
};
