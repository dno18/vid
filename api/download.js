const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // إعدادات السماح بالوصول (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    // تنظيف الرابط من السلاش الزائد الذي يسبب التعليق
    url = url.trim().replace(/^[\/]+/, ''); 

    try {
        // استخدام محرك يحاكي متصفح آيفون لتجاوز حماية تيك توك
        const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
            }
        });
        
        const d = await response.json();

        if (d.code === 0 && d.data) {
            res.json({
                status: 'success',
                url: d.data.hdplay || d.data.play,
                type: d.data.images ? 'image_album' : 'video'
            });
        } else {
            res.status(400).json({ status: 'error', message: 'تيك توك رفض الطلب، جرب مرة أخرى' });
        }
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'خطأ في الاتصال بالمحرك' });
    }
};
