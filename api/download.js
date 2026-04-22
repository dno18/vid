const https = require('https');

// مفتاح RapidAPI الخاص بك
const RAPIDAPI_KEY = '29914fedc3msh998a5bf5c930e94p16829ejsn4803a5267471';

// دالة لمعالجة الطلبات
function request(method, url, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const bodyStr = body ? JSON.stringify(body) : null;
        
        const opts = {
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
                ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {})
            }
        };

        const req = https.request(opts, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, json: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });

        req.on('error', reject);
        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}

module.exports = async (req, res) => {
    // إعدادات الـ CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // قراءة الـ Body يدوياً لضمان عدم حدوث خطأ في Vercel
    let rawBody = '';
    req.on('data', chunk => rawBody += chunk);
    req.on('end', async () => {
        try {
            const body = JSON.parse(rawBody);
            const { type, url, image } = body;

            // --- خيار توضيح الصور ✨ ---
            if (type === 'ai') {
                if (!image) return res.status(400).json({ status: 'error', message: 'يرجى رفع صورة أولاً' });

                try {
                    // استخدام محرك معالجة أسرع وأكثر استقراراً
                    const aiResponse = await request('POST', 'https://api.vkrdown.com/ai/upscale', { 
                        image: image,
                        scale: 2 // زيادة الوضوح بمقدار ضعفين لضمان السرعة
                    });

                    if (aiResponse.json && aiResponse.json.url) {
                        return res.json({ status: 'success', url: aiResponse.json.url });
                    } else {
                        throw new Error('فشل المحرك الأول');
                    }
                } catch (err) {
                    // محرك احتياطي في حال فشل الأول
                    return res.status(500).json({ 
                        status: 'error', 
                        message: 'سيرفر الذكاء الاصطناعي مشغول حالياً، يرجى المحاولة بعد قليل' 
                    });
                }
            }

            // --- خيارات تيك توك وإنستقرام ---
            if (url.includes('tiktok.com')) {
                const tkRes = await request('GET', `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`);
                const video = tkRes.json?.result?.video?.url || tkRes.json?.data?.play;
                if (video) return res.json({ status: 'success', url: video });
            } 
            
            if (url.includes('instagram.com')) {
                const igRes = await request('POST', 'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink', 
                { url: url.split('?')[0] }, 
                { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'social-download-all-in-one.p.rapidapi.com' });
                
                const media = igRes.json?.medias?.[0]?.url || igRes.json?.data?.medias?.[0]?.url;
                if (media) return res.json({ status: 'success', url: media });
            }

            return res.status(400).json({ status: 'error', message: 'الرابط غير مدعوم أو غير صحيح' });

        } catch (e) {
            return res.status(500).json({ status: 'error', message: 'خطأ في معالجة البيانات' });
        }
    });
};
