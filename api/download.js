const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    // تنظيف الرابط
    url = url.trim().replace(/^[\/]+/, '');

    try {
        // الخطوة 1: محاكاة متصفح حقيقي لجلب بيانات الفيديو
        const apiResponse = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
                'Accept': 'application/json'
            }
        });
        
        const result = await apiResponse.json();

        if (result.code === 0 && result.data) {
            res.json({
                status: 'success',
                platform: 'TikTok',
                url: result.data.hdplay || result.data.play,
                title: result.data.title,
                author: result.data.author.nickname,
                type: result.data.images ? 'image_album' : 'video'
            });
        } else {
            res.status(400).json({ 
                status: 'error', 
                message: 'فشل المحرك في استخراج الفيديو. جرب نسخ الرابط الطويل من المتصفح.' 
            });
        }
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'خطأ في الاتصال بالمحرك الخلفي' });
    }
};
