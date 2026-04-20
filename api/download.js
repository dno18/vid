const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    try {
        // تنظيف الرابط من أكواد التتبع الطويلة في إنستقرام
        const cleanUrl = url.split('?')[0];

        // المحرك 1: محرك عالى الجودة للإنستقرام وتيك توك
        const response = await axios.get(`https://api.boxentriq.com/social/download?url=${encodeURIComponent(cleanUrl)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        // محاولة البحث عن رابط الفيديو في نتائج المحرك
        let videoUrl = response.data?.videoUrl || response.data?.url || response.data?.links?.[0]?.url;

        // إذا فشل الأول، نستخدم المحرك 2 (كخطة بديلة قوية)
        if (!videoUrl) {
            const backup = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(cleanUrl)}`);
            videoUrl = backup.data?.result?.video?.url || backup.data?.result?.url || backup.data?.data?.play;
        }

        if (videoUrl) {
            return res.json({
                status: 'success',
                url: videoUrl
            });
        }

        res.status(400).json({ status: 'error', message: 'لم نتمكن من استخراج الفيديو. تأكد أن الحساب عام.' });

    } catch (e) {
        // المحرك 3: محرك الطوارئ (النهائي)
        try {
            const lastRes = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            if (lastRes.data?.data?.play) {
                return res.json({ status: 'success', url: lastRes.data.data.play });
            }
        } catch (err) {}
        
        res.status(500).json({ status: 'error', message: 'جاري تحديث السيرفر لفك حماية إنستقرام، جرب بعد قليل' });
    }
};
