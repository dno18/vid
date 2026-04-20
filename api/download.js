const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // إعدادات السماح بالوصول
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });
    
    // تنظيف الرابط
    url = url.trim().replace(/^[\/]+/, '');

    try {
        // المحرك الشامل (يغطي تيك توك وإنستقرام)
        const api = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`;
        const response = await fetch(api, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        const d = await response.json();
        
        // استخراج الرابط سواء من تيك توك أو إنستقرام
        const videoUrl = d.result?.video?.url || d.result?.url || d.data?.play || d.data?.video?.url;

        if (videoUrl) {
            return res.json({ status: 'success', url: videoUrl });
        } else {
            return res.status(400).json({ status: 'error', message: 'لم نتمكن من العثور على الفيديو' });
        }
    } catch (e) {
        return res.status(500).json({ status: 'error', message: 'خطأ في المحرك الخلفي' });
    }
};
