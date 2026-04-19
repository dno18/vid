const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    try {
        // نستخدم محرك Cobalt القوي جداً في تجاوز حظر تيك توك
        const response = await fetch('https://cobalt-api.kwi.li/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                videoQuality: '720', // جودة عالية
                filenamePattern: 'basic'
            })
        });

        const result = await response.json();

        // إذا نجح Cobalt في جلب الفيديو
        if (result.status === 'stream' || result.status === 'redirect') {
            return res.json({
                status: 'success',
                url: result.url
            });
        } 
        
        // إذا كان المحتوى عبارة عن صور (Slideshow)
        if (result.status === 'picker') {
            return res.json({
                status: 'picker',
                picker: result.picker
            });
        }

        throw new Error('فشل المحرك الأول');

    } catch (e) {
        // محرك احتياطي في حال تعطل الأول (Tikwm)
        try {
            const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
            const tikData = await tikRes.json();
            if (tikData.code === 0) {
                return res.json({
                    status: tikData.data.images ? 'picker' : 'success',
                    url: tikData.data.hdplay || tikData.data.play,
                    picker: tikData.data.images ? tikData.data.images.map(i => ({ url: i })) : null
                });
            }
        } catch (err2) {}
        
        res.status(500).json({ error: 'جميع المحركات محظورة حالياً من تيك توك' });
    }
};
