const https = require('https');

// ─── دالة طلب HTTP مدمجة (بدون مكتبات خارجية) ───
function request(method, url, body, headers) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const opts = {
            hostname: u.hostname,
            path: u.pathname + u.search,
            method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                ...headers,
                ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {})
            }
        };
        const req = https.request(opts, (r) => {
            if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
                return resolve(request(method, r.headers.location, body, headers));
            }
            let data = '';
            r.on('data', c => data += c);
            r.on('end', () => {
                try { resolve({ status: r.statusCode, json: JSON.parse(data), raw: data }); }
                catch { resolve({ status: r.statusCode, json: null, raw: data }); }
            });
        });
        req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')); });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

const postJSON = (url, data, hdrs) =>
    request('POST', url, JSON.stringify(data), { 'Content-Type': 'application/json', ...hdrs });

const postForm = (url, body, hdrs) =>
    request('POST', url, body, { 'Content-Type': 'application/x-www-form-urlencoded', ...hdrs });

const getReq = (url, hdrs) =>
    request('GET', url, null, hdrs || {});

// ─────────────────────────────────────────────
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    let { url } = req.body || {};
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    url = url.trim();
    const isInstagram = url.includes('instagram.com');

    if (isInstagram) return await handleInstagram(url, res);
    else              return await handleTikTok(url, res);
};

// ─────────────────────────────────────────────
//  إنستقرام — محركات مخصصة للسيرفرات
// ─────────────────────────────────────────────
async function handleInstagram(url, res) {
    const cleanUrl = url.split('?')[0];

    // ══ المحرك 1: cobalt.tools ══
    // مشروع مفتوح المصدر مصمم للاستخدام من السيرفرات
    try {
        const r = await postJSON('https://api.cobalt.tools/', { url: cleanUrl }, {
            'Accept': 'application/json'
        });

        if (r.json?.status === 'tunnel' || r.json?.status === 'redirect') {
            return res.json({ status: 'success', url: r.json.url });
        }

        // نوع picker (مثلاً منشور فيه أكثر من فيديو)
        if (r.json?.status === 'picker' && r.json?.picker?.[0]?.url) {
            return res.json({ status: 'success', url: r.json.picker[0].url });
        }
    } catch (e) { console.log('[IG cobalt]', e.message); }

    // ══ المحرك 2: tiklydown (يدعم إنستقرام ريلز) ══
    try {
        const r = await getReq(`https://api.tiklydown.eu.org/api/download/v2?url=${encodeURIComponent(cleanUrl)}`);
        const videoUrl = r.json?.result?.video?.url || r.json?.video?.url || r.json?.url;
        if (videoUrl) return res.json({ status: 'success', url: videoUrl });
    } catch (e) { console.log('[IG tiklydown]', e.message); }

    // ══ المحرك 3: saveig.app ══
    try {
        const body = `q=${encodeURIComponent(cleanUrl)}&t=media&lang=ar`;
        const r = await postForm('https://v3.saveig.app/api/ajaxSearch', body, {
            'X-Requested-With': 'XMLHttpRequest',
            'Origin':  'https://saveig.app',
            'Referer': 'https://saveig.app/'
        });
        const html = r.json?.data || r.raw || '';
        const m = html.match(/href="(https:\/\/[^"]*\.mp4[^"]*)"/i);
        if (m) return res.json({ status: 'success', url: decodeURIComponent(m[1]) });
    } catch (e) { console.log('[IG saveig]', e.message); }

    return res.status(400).json({
        status: 'error',
        message: 'تأكد أن الحساب غير مخفي وأن الرابط من Reel أو منشور عام.'
    });
}

// ─────────────────────────────────────────────
//  تيك توك — يعمل بشكل ممتاز
// ─────────────────────────────────────────────
async function handleTikTok(url, res) {
    const cleanUrl = url.split('?')[0];

    // المحرك 1: cobalt.tools (يدعم تيك توك أيضاً)
    try {
        const r = await postJSON('https://api.cobalt.tools/', { url }, {
            'Accept': 'application/json'
        });
        if (r.json?.status === 'tunnel' || r.json?.status === 'redirect') {
            return res.json({ status: 'success', url: r.json.url });
        }
    } catch (e) { console.log('[TK cobalt]', e.message); }

    // المحرك 2: tiklydown
    try {
        const r = await getReq(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(cleanUrl)}`);
        const videoUrl = r.json?.result?.video?.url || r.json?.result?.url || r.json?.data?.play;
        if (videoUrl) return res.json({ status: 'success', url: videoUrl });
    } catch (e) { console.log('[TK tiklydown]', e.message); }

    // المحرك 3: tikwm
    try {
        const r = await getReq(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        if (r.json?.data?.play) return res.json({ status: 'success', url: r.json.data.play });
    } catch (e) { console.log('[TK tikwm]', e.message); }

    return res.status(400).json({
        status: 'error',
        message: 'لم نتمكن من استخراج الفيديو. تأكد أن الحساب عام.'
    });
}
