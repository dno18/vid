const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });
    url = url.trim().replace(/^[\/]+/, '');

    // قائمة بالمحركات الشغالة (تيك توك + انستقرام)
    const engines = [
        `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`,
        `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`,
        `https://api.vkrdown.com/server/index.php?url=${encodeURIComponent(url)}`
    ];

    for (let engineUrl of engines) {
        try {
            const response = await fetch(engineUrl, { timeout: 5000 });
            const d = await response.json();
            
            // محاولة استخراج الرابط من أي محرك ينجح
            let videoUrl = d.result?.video?.url || d.result?.url || d.data?.play || d.data?.hdplay || d.url;

            if (videoUrl) {
                return res.json({ status: 'success', url: videoUrl });
            }
        } catch (e) {
            console.log(`المحرك فشل، نجرب التالي...`);
            continue; // انتقل للمحرك التالي إذا فشل هذا
        }
    }

    // إذا انتهت كل المحركات ولم ينجح شيء
    res.status(400).json({ status: 'error', message: 'جميع المحركات مشغولة حالياً، جرب رابطاً آخر' });
};
