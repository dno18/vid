const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    let { url } = req.body;
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
//  محرك إنستقرام (timeout آمن أقل من 10 ثواني)
// ─────────────────────────────────────────────
async function handleInstagram(cleanUrl, originalUrl, res) {

    // المحرك 1: saveig.app
    try {
        const r = await axios.post('https://v3.saveig.app/api/ajaxSearch',
            `q=${encodeURIComponent(cleanUrl)}&t=media&lang=ar`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'User-Agent': UA,
                    'Origin': 'https://saveig.app',
                    'Referer': 'https://saveig.app/'
                },
                timeout: 7000
            }
        );
        const html = r.data?.data || '';
        const m = html.match(/href="(https:\/\/[^"]*\.mp4[^"]*)"/i);
        if (m?.[1]) return res.json({ status: 'success', url: decodeURIComponent(m[1]) });
    } catch (e) { console.log('[IG1]', e.message); }

    // المحرك 2: igdownloader.app
    try {
        const r = await axios.post('https://igdownloader.app/api/ajaxSearch',
            `recaptchaToken=&q=${encodeURIComponent(cleanUrl)}&t=media&lang=ar`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'User-Agent': UA,
                    'Origin': 'https://igdownloader.app',
                    'Referer': 'https://igdownloader.app/'
                },
                timeout: 7000
            }
        );
        const html = r.data?.data || '';
        const m = html.match(/href="(https:\/\/[^"]*\.mp4[^"]*)"/i);
        if (m?.[1]) return res.json({ status: 'success', url: decodeURIComponent(m[1]) });
    } catch (e) { console.log('[IG2]', e.message); }

    // المحرك 3: snapinsta.app
    try {
        const r = await axios.post('https://snapinsta.app/action.php',
            `url=${encodeURIComponent(cleanUrl)}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': UA,
                    'Referer': 'https://snapinsta.app/'
                },
                timeout: 7000
            }
        );
        const videoUrl = r.data?.url || r.data?.media?.[0]?.url;
        if (videoUrl) return res.json({ status: 'success', url: videoUrl });

        const html = typeof r.data === 'string' ? r.data : '';
        const m = html.match(/href="(https:\/\/[^"]*\.mp4[^"]*)"/i);
        if (m?.[1]) return res.json({ status: 'success', url: decodeURIComponent(m[1]) });
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
        const r = await axios.get(
            `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(cleanUrl)}`,
            { timeout: 7000 }
        );
        const videoUrl = r.data?.result?.video?.url || r.data?.result?.url || r.data?.data?.play;
        if (videoUrl) return res.json({ status: 'success', url: videoUrl });
    } catch (e) { console.log('[TK1]', e.message); }

    // المحرك 2: tikwm
    try {
        const r = await axios.get(
            `https://www.tikwm.com/api/?url=${encodeURIComponent(originalUrl)}`,
            { timeout: 7000 }
        );
        if (r.data?.data?.play) {
            return res.json({ status: 'success', url: r.data.data.play });
        }
    } catch (e) { console.log('[TK2]', e.message); }

    return res.status(400).json({
        status: 'error',
        message: 'لم نتمكن من استخراج الفيديو. تأكد أن الحساب عام.'
    });
}
