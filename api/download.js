const https = require('https');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    
    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });
    url = url.trim().replace(/^[\/]+/, '');

    try {
        // محرك خارجي قوي ومستقر جداً
        const apiUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`;
        
        https.get(apiUrl, (apiRes) => {
            let data = '';
            apiRes.on('data', (chunk) => { data += chunk; });
            apiRes.on('end', () => {
                try {
                    const d = JSON.parse(data);
                    const videoUrl = d.result?.video?.url || d.result?.url || d.data?.play || d.data?.video?.url;
                    
                    if (videoUrl) {
                        res.json({ status: 'success', url: videoUrl });
                    } else {
                        res.status(400).json({ status: 'error', message: 'لم نتمكن من جلب الفيديو' });
                    }
                } catch (e) {
                    res.status(500).json({ status: 'error', message: 'خطأ في تحليل البيانات' });
                }
            });
        }).on('error', (err) => {
            res.status(500).json({ status: 'error', message: 'خطأ في الاتصال بالمحرك' });
        });

    } catch (e) {
        res.status(500).json({ status: 'error', message: 'عطل فني في السيرفر' });
    }
};
