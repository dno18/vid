const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    url = url.trim().replace(/^[\/]+/, ''); 

    try {
        // استخدام محرك يدعم المنصتين معاً
        const apiResponse = await fetch(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
            }
        });
        
        const d = await apiResponse.json();

        // فحص النتيجة بناءً على استجابة المحرك الشامل
        if (d.result || d.data) {
            const data = d.result || d.data;
            res.json({
                status: 'success',
                // يجلب رابط الفيديو سواء كان من انستقرام أو تيك توك
                url: data.video?.url || data.url || data.play, 
                type: 'video'
            });
        } else {
            res.status(400).json({ status: 'error', message: 'لم نتمكن من جلب الفيديو، تأكد أن الحساب عام (Public)' });
        }
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'خطأ في الاتصال بمحرك الانستقرام' });
    }
};
