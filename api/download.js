const https = require('https');

// ─── طلب HTTP/HTTPS مدمج بدون مكتبات خارجية ───
function request(method, url, body, headers) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const options = {
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                ...headers,
                ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {})
            }
        };

        const req = https.request(options, (res) => {
            // تتبع التحويلات
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return resolve(request(method, res.headers.location, body, headers));
            }
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve({ ok: true, json: JSON.parse(data), raw: data }); }
                catch { resolve({ ok: true, json: null, raw: data }); }
            });
        });

        req.setTimeout(7000, () => { req.destroy(); reject(new Error('timeout')); });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

const post = (url, body, headers) => request('POST', url, body, headers);
const get  = (url, headers)       => request('GET',  url, null, headers || {});

// ─── Handler الرئيسي ───
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    let { url } = req.body || {};
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    url = url.trim();
    const cleanUrl = url.split('?')[0];
    const isInstagram = url.includes('instagram.com');

    if (isInstagram) {
        return await handleInstagram(cleanUrl, url, res);
    } else {
        return await handleTikTok(cleanUrl, url, res);
    }
};

// ─────────────────────────────────────────────
//  محرك إنستقرام
// ─────────────────────────────────────────────
async function handleInstagram(cleanUrl, originalUrl, res) {

    // المحرك 1: saveig.app
    try {
        const body = `q=${encodeURIComponent(cleanUrl)}&t=media&lang=ar`;
        const r = await post('https://v3.saveig.app/api/ajaxSearch', body, {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Origin':  'https://saveig.app',
            'Referer': 'https://saveig.app/'
        });
        const html = r.json?.data || r.raw || '';
        const m = html.match(/href="(https:\/\/[^"]*\.mp4[^"]*)"/i);
        if (m) return res.json({ status: 'success', url: decodeURIComponent(m[1]) });
    } catch (e) { console.log('[IG1]', e.message); }

    // المحرك 2: igdownloader.app
    try {
        const body = `recaptchaToken=&q=${encodeURIComponent(cleanUrl)}&t=media&lang=ar`;
        const r = await post('https://igdownloader.app/api/ajaxSearch', body, {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest',
            'Origin':  'https://igdownloader.app',
            'Referer': 'https://igdownloader.app/'
        });
        const html = r.json?.data || r.raw || '';
        const m = html.match(/href="(https:\/\/[^"]*\.mp4[^"]*)"/i);
        if (m) return res.json({ status: 'success', url: decodeURIComponent(m[1]) });
    } catch (e) { console.log('[IG2]', e.message); }

    // المحرك 3: snapinsta.app
    try {
        const body = `url=${encodeURIComponent(cleanUrl)}`;
        const r = await post('https://snapinsta.app/action.php', body, {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': 'https://snapinsta.app/'
        });
        const videoUrl = r.json?.url || r.json?.media?.[0]?.url;
        if (videoUrl) return res.json({ status: 'success', url: videoUrl });
        const m = r.raw.match(/href="(https:\/\/[^"]*\.mp4[^"]*)"/i);
        if (m) return res.json({ status: 'success', url: decodeURIComponent(m[1]) });
    } catch (e) { console.log('[IG3]', e.message); }

    return res.status(400).json({
        status: 'error',
        message: 'لم نتمكن من استخراج الفيديو. تأكد أن الحساب عام والرابط صحيح.'
    });
}

// ─────────────────────────────────────────────
//  محرك تيك توك
// ─────────────────────────────────────────────
async function handleTikTok(cleanUrl, originalUrl, res) {

    // المحرك 1: tiklydown
    try {
        const r = await get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(cleanUrl)}`);
        const videoUrl = r.json?.result?.video?.url || r.json?.result?.url || r.json?.data?.play;
        if (videoUrl) return res.json({ status: 'success', url: videoUrl });
    } catch (e) { console.log('[TK1]', e.message); }

    // المحرك 2: tikwm
    try {
        const r = await get(`https://www.tikwm.com/api/?url=${encodeURIComponent(originalUrl)}`);
        if (r.json?.data?.play) {
            return res.json({ status: 'success', url: r.json.data.play });
        }
    } catch (e) { console.log('[TK2]', e.message); }

    return res.status(400).json({
        status: 'error',
        message: 'لم نتمكن من استخراج الفيديو. تأكد أن الحساب عام.'
    });
}
