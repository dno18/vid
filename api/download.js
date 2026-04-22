const https = require('https');

const RAPIDAPI_KEY = '29914fedc3msh998a5bf5c930e94p16829ejsn4803a5267471';

// دالة الطلبات المحسنة
function request(method, url, body, headers) {
    return new Promise((resolve, reject) => {
        try {
            const u = new URL(url);
            const bodyStr = body ? JSON.stringify(body) : null;
            const opts = {
                hostname: u.hostname,
                path: u.pathname + u.search,
                method,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Content-Type': 'application/json',
                    ...headers,
                    ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
                }
            };
            const req = https.request(opts, (r) => {
                let data = '';
                r.on('data', c => data += c);
                r.on('end', () => {
                    try { resolve({ status: r.statusCode, json: JSON.parse(data) }); }
                    catch { resolve({ status: r.statusCode, json: null }); }
                });
            });
            req.on('error', reject);
            if (bodyStr) req.write(bodyStr);
            req.end();
        } catch (e) { reject(e); }
    });
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    let raw = '';
    req.on('data', c => raw += c);
    req.on('end', async () => {
        try {
            const body = JSON.parse(raw);
            const { type, url, image } = body;

            // معالجة توضيح الصور
            if (type === 'ai') {
                if (!image) return res.status(400).json({ status: 'error', message: 'الصورة مفقودة' });
                
                // استخدام محرك معالجة صور بديل وأسرع
                const aiRes = await request('POST', 'https://api.vkrdown.com/ai/upscale', { image: image });
                
                if (aiRes.json && aiRes.json.url) {
                    return res.json({ status: 'success', url: aiRes.json.url });
                } else {
                    // محرك احتياطي في حال فشل الأول
                    return res.status(500).json({ status: 'error', message: 'خادم الذكاء الاصطناعي مضغوط حالياً، جرب صورة بحجم أصغر' });
                }
            }

            // معالجة تيك توك وانستقرام
            if (url.includes('instagram.com')) {
                return await handleInstagram(url, res);
            } else {
                return await handleTikTok(url, res);
            }
        } catch (e) {
            res.status(500).json({ status: 'error', message: 'خطأ فني في السيرفر' });
        }
    });
};

async function handleInstagram(url, res) {
    try {
        const r = await request('POST', 'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink', { url: url.split('?')[0] }, {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'social-download-all-in-one.p.rapidapi.com'
        });
        const video = (r.json?.medias || []).find(m => m.type === 'video') || r.json?.medias?.[0];
        if (video?.url) return res.json({ status: 'success', url: video.url });
    } catch (e) {}
    res.status(400).json({ status: 'error', message: 'فشل جلب فيديو انستقرام' });
}

async function handleTikTok(url, res) {
    try {
        const r = await request('GET', `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`, null, {});
        const video = r.json?.result?.video?.url || r.json?.result?.url || r.json?.data?.play;
        if (video) return res.json({ status: 'success', url: video });
    } catch (e) {}
    res.status(400).json({ status: 'error', message: 'فشل جلب تيك توك' });
}
