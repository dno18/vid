const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // إعدادات CORS للسماح للموقع بالاتصال بالسيرفر
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    // تنظيف الرابط من أي مسافات أو سلاش زائد
    url = url.trim().replace(/^[\/]+/, ''); 

    try {
        // استخدام محرك TiklyDown الشامل (يدعم تيك توك وانستقرام)
        const response = await fetch(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
            }
        });
        
        const d = await response.json();

        // التحقق من نجاح العملية (تيك توك أو انستقرام)
        if (d && (d.result || d.data)) {
            const videoUrl = d.result?.video?.url || d.result?.url || d.data?.play || d.data?.video?.url;
            
            if (videoUrl) {
                return res.json({
                    status: 'success',
                    url: videoUrl,
                    type: 'video'
                });
            }
        }
        
        // إذا فشل المحرك الأول، نحاول بالمحرك الثاني (TikWM) كاحتياط
        const backupRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
        const backupData = await backupRes.json();

        if (backupData.code === 0 && backupData.data) {
            return res.json({
                status: 'success',
                url: backupData.data.hdplay || backupData.data.play,
                type: 'video'
            });
        }

        res.status(400).json({ status: 'error', message: 'لم نتمكن من استخراج الفيديو. تأكد أن الحساب عام.' });

    } catch (e) {
        res.status(500).json({ status: 'error', message: 'خطأ في الاتصال بالمحرك الخلفي' });
    }
};
