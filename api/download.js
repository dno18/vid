const https = require('https');

const RAPIDAPI_KEY = '29914fedc3msh998a5bf5c930e94p16829ejsn4803a5267471';

// دالة جلب البيانات من الروابط الخارجية
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
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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
            req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
            req.on('error', reject);
            if (bodyStr) req.write(bodyStr);
            req.end();
        } catch (e) { reject(e); }
    });
}

module.exports = async (req, res) => {
    // إعدادات الوصول (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    let raw = '';
    req.on('data', c => raw += c);
    req.on('end', async () => {
        try {
            if (!raw) return res.status(400).json({ status: 'error', message: 'طلب فارغ' });
            
            const body = JSON.parse(raw);
            const { url } = body;

            if (!url) return res.status(400).json({ status: 'error', message: 'الرابط مطلوب' });

            // توجيه الطلب حسب المنصة
            if (url.includes('instagram.com')) {
                return await handleInstagram(url, res);
            } else if (url.includes('tiktok.com')) {
                return await handleTikTok(url, res);
            } else {
                return res.status(400).json({ status: 'error', message: 'الرابط غير مدعوم حالياً' });
            }
        } catch (e) {
            res.status(500).json({ status: 'error', message: 'حدث خطأ في قراءة البيانات' });
        }
    });
};

// محرك إنستقرام
async function handleInstagram(url, res) {
    try {
        const cleanUrl = url.split('?')[0];
        const r = await request('POST', 'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink', { url: cleanUrl }, {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': 'social-download-all-in-one.p.rapidapi.com'
        });
        
        const video = (r.json?.medias || []).find(m => m.type === 'video' || m.extension === 'mp4') || r.json?.medias?.[0];
        
        if (video?.url) {
            return res.json({ status: 'success', url: video.url });
        }
    } catch (e) {}
    res.status(400).json({ status: 'error', message: 'فشل جلب فيديو إنستقرام، تأكد أن الحساب عام' });
}

// محرك تيك توك
async function handleTikTok(url) {
    try {
        // نستخدم محرك tiklydown السريع
        const r = await request('GET', `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`, null, {});
        const video = r.json?.result?.video?.url || r.json?.result?.url || r.json?.data?.play;
        
        if (video) {
            return res.json({ status: 'success', url: video });
        }
    } catch (e) {}
    res.status(400).json({ status: 'error', message: 'فشل جلب فيديو تيك توك' });
}
