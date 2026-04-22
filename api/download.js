const https = require('https');

const RAPIDAPI_KEY = '29914fedc3msh998a5bf5c930e94p16829ejsn4803a5267471';

// ─── دالة HTTP مدمجة ───
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
                if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location)
                    return resolve(request(method, r.headers.location, body, headers));
                let data = '';
                r.on('data', c => data += c);
                r.on('end', () => {
                    try { resolve({ status: r.statusCode, json: JSON.parse(data), raw: data }); }
                    catch { resolve({ status: r.statusCode, json: null, raw: data }); }
                });
            });
            req.setTimeout(12000, () => { req.destroy(); reject(new Error('timeout')); });
            req.on('error', reject);
            if (bodyStr) req.write(bodyStr);
            req.end();
        } catch (e) { reject(e); }
    });
}

function readBody(req) {
    return new Promise((resolve) => {
        if (req.body && typeof req.body === 'object') return resolve(req.body);
        let raw = '';
        req.on('data', c => raw += c);
        req.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({}); } });
        req.on('error', () => resolve({}));
    });
}

// ─── Handler الرئيسي ───
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const body = await readBody(req);
        let { url } = body;
        if (!url || typeof url !== 'string')
            return res.status(400).json({ status: 'error', message: 'الرابط مطلوب' });

        url = url.trim();
        const isInstagram = url.includes('instagram.com');

        if (isInstagram) return await handleInstagram(url, res);
        else             return await handleTikTok(url, res);

    } catch (e) {
        console.error('Error:', e.message);
        return res.status(500).json({ status: 'error', message: 'خطأ داخلي في السيرفر' });
    }
};

// ─────────────────────────────────────────────
//  إنستقرام
// ─────────────────────────────────────────────
async function handleInstagram(url, res) {
    // نحذف الـ query string لأنه أحياناً يسبب مشكلة في الـ API
    const cleanUrl = url.split('?')[0];

    // ── المحرك 1: Social Download All In One ──
    try {
        const r = await request('POST',
            'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink',
            { url: cleanUrl },
            {
                'x-rapidapi-key':  RAPIDAPI_KEY,
                'x-rapidapi-host': 'social-download-all-in-one.p.rapidapi.com'
            }
        );
        console.log('[IG1] status:', r.status, '| raw:', r.raw?.slice(0, 400));
        const medias = r.json?.medias || r.json?.data?.medias || [];
        const videoItem =
            medias.find(m => m.quality === 'hd') ||
            medias.find(m => m.type === 'video' || m.url?.includes('.mp4')) ||
            medias[0];
        if (videoItem?.url) return res.json({ status: 'success', url: videoItem.url });
    } catch (e) { console.log('[IG1]', e.message); }

    // ── المحرك 2: Instagram Reels & Posts Downloader (RapidAPI) ──
    try {
        const r = await request('GET',
            `https://instagram-reels-posts-downloader.p.rapidapi.com/ig/post?url=${encodeURIComponent(cleanUrl)}`,
            null,
            {
                'x-rapidapi-key':  RAPIDAPI_KEY,
                'x-rapidapi-host': 'instagram-reels-posts-downloader.p.rapidapi.com'
            }
        );
        console.log('[IG2] status:', r.status, '| raw:', r.raw?.slice(0, 400));
        // هذا الـ API يرجع مصفوفة مباشرة أو كائن فيه video_url
        const data = r.json;
        if (Array.isArray(data)) {
            const vid = data.find(i => i.media_type === 2 || i.video_url);
            if (vid?.video_url) return res.json({ status: 'success', url: vid.video_url });
        }
        if (data?.video_url) return res.json({ status: 'success', url: data.video_url });
        if (data?.url)       return res.json({ status: 'success', url: data.url });
    } catch (e) { console.log('[IG2]', e.message); }

    // ── المحرك 3: Downloader for Instagram (RapidAPI) ──
    try {
        const r = await request('GET',
            `https://downloader-for-instagram.p.rapidapi.com/v2/post?url=${encodeURIComponent(cleanUrl)}`,
            null,
            {
                'x-rapidapi-key':  RAPIDAPI_KEY,
                'x-rapidapi-host': 'downloader-for-instagram.p.rapidapi.com'
            }
        );
        console.log('[IG3] status:', r.status, '| raw:', r.raw?.slice(0, 400));
        const videoUrl =
            r.json?.download_url ||
            r.json?.video_url    ||
            r.json?.data?.download_url ||
            r.json?.result?.video_url;
        if (videoUrl) return res.json({ status: 'success', url: videoUrl });
    } catch (e) { console.log('[IG3]', e.message); }

    // ── المحرك 4: tiklydown ──
    try {
        const r = await request('GET',
            `https://api.tiklydown.eu.org/api/download/v2?url=${encodeURIComponent(cleanUrl)}`,
            null, {}
        );
        console.log('[IG4] status:', r.status, '| raw:', r.raw?.slice(0, 400));
        const videoUrl = r.json?.result?.video?.url || r.json?.video?.url || r.json?.url;
        if (videoUrl) return res.json({ status: 'success', url: videoUrl });
    } catch (e) { console.log('[IG4]', e.message); }

    return res.status(400).json({
        status: 'error',
        message: 'تأكد أن الحساب عام وأن الرابط صحيح.'
    });
}

// ─────────────────────────────────────────────
//  تيك توك
// ─────────────────────────────────────────────
async function handleTikTok(url, res) {
    const cleanUrl = url.split('?')[0];

    // المحرك 1: Social Download All In One — POST
    try {
        const r = await request('POST',
            'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink',
            { url },
            {
                'x-rapidapi-key':  RAPIDAPI_KEY,
                'x-rapidapi-host': 'social-download-all-in-one.p.rapidapi.com'
            }
        );
        console.log('[TK1] status:', r.status, '| raw:', r.raw?.slice(0, 400));
        const medias = r.json?.medias || r.json?.data?.medias || [];
        const videoItem =
            medias.find(m => m.quality === 'hd') ||
            medias.find(m => m.type === 'video' || m.url?.includes('.mp4')) ||
            medias[0];
        if (videoItem?.url) return res.json({ status: 'success', url: videoItem.url });
    } catch (e) { console.log('[TK1]', e.message); }

    // المحرك 2: tiklydown
    try {
        const r = await request('GET',
            `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(cleanUrl)}`,
            null, {}
        );
        const videoUrl = r.json?.result?.video?.url || r.json?.result?.url || r.json?.data?.play;
        if (videoUrl) return res.json({ status: 'success', url: videoUrl });
    } catch (e) { console.log('[TK2]', e.message); }

    // المحرك 3: tikwm
    try {
        const r = await request('GET',
            `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`,
            null, {}
        );
        if (r.json?.data?.play) return res.json({ status: 'success', url: r.json.data.play });
    } catch (e) { console.log('[TK3]', e.message); }

    return res.status(400).json({ status: 'error', message: 'لم نتمكن من استخراج الفيديو.' });
}
