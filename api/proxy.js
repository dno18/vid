const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // 1. استلام الرابط من الطلب
    const { url } = req.query;

    if (!url) {
        return res.status(400).send('URL required');
    }

    try {
        // 2. فك ترميز الرابط
        const targetUrl = decodeURIComponent(url);

        // 3. جلب الفيديو مع إضافة Headers تخدع سيرفر المصدر ليعتقد أن الطلب من متصفح عادي
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                'Referer': 'https://www.tiktok.com/'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        // 4. إرسال الـ Headers المناسبة للمتصفح ليتم التعامل معه كفيديو
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp4');
        
        // لجعل المتصفح يحاول تنزيل الملف بدلاً من مجرد عرضه (اختياري)
        // res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');

        // 5. تحويل البيانات المرسلة إلى Buffer وإرسالها
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));

    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(502).send('خطأ في جلب ملف الفيديو من المصدر');
    }
};
