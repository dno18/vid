const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // إعدادات الوصول
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    // تنظيف الرابط من المسافات والسلاش المتكرر
    url = url.trim().replace(/^[\/]+/, ''); 

    try {
        // المحرك الأساسي (TiklyDown) - ممتاز للتيك توك
        const response = await fetch(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`);
        const d = await response.json();

        // محاولة استخراج الفيديو من النتائج
        let videoUrl = d.result?.video?.url || d.result?.url || d.data?.play || d.data?.video?.url;

        // إذا فشل المحرك الأول (خاصة مع إنستقرام)، ننتقل للمحرك الثاني (AIO)
        if (!videoUrl) {
            const backup = await fetch(`https://api.vkrdown.com/server/index.php?url=${encodeURIComponent(url)}`);
            const bData = await backup.json();
            videoUrl = bData.data?.url || bData.url;
        }

        if (videoUrl) {
            return res.json({
                status: 'success',
                url: videoUrl,
                type: 'video'
            });
        }

        res.status(400).json({ status: 'error', message: 'لم نتمكن من جلب الفيديو. تأكد أن الحساب عام (Public).' });

    } catch (e) {
        // إذا حدث خطأ في الكود نفسه أو في الاتصال
        console.error(e);
        res.status(500).json({ status: 'error', message: 'خطأ في الاتصال بالمحرك الخفي' });
    }
};
