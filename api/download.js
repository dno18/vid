const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    try {
        // نستخدم محرك "Tikwm" لأنه الأسرع حالياً في الاستجابة للطلبات الخارجية
        // وهو المحرك الذي تعتمد عليه الكثير من المواقع الأخرى في الخلفية
        const apiResponse = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            }
        });

        const data = await apiResponse.json();

        if (data.code === 0 && data.data) {
            // نأخذ رابط الفيديو المباشر ونرسله لواجهة موقعك
            return res.json({
                status: 'success',
                url: data.data.hdplay || data.data.play,
                title: data.data.title,
                cover: data.data.cover
            });
        } else {
            throw new Error('فشل الجلب من المحرك الوسيط');
        }

    } catch (e) {
        // محرك احتياطي آخر في حال فشل الأول
        try {
            const backup = await fetch(`https://api.tikmate.app/api/lookup?url=${encodeURIComponent(url)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            const bData = await backup.json();
            if (bData.success) {
                return res.json({ status: 'success', url: bData.url });
            }
        } catch (err2) {}

        res.status(500).json({ error: 'تعذر الاتصال بالمحرك الخفي حالياً' });
    }
};
