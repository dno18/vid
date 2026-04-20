const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    // تنظيف الرابط
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
//  محرك إنستقرام المخصص (3 محركات احتياطية)
// ─────────────────────────────────────────────
async function handleInstagram(cleanUrl, originalUrl, res) {

    // المحرك 1: saveig.app (الأقوى لإنستقرام)
    try {
        const formData = `q=${encodeURIComponent(cleanUrl)}&t=media&lang=ar`;
        const r = await axios.post('https://v3.saveig.app/api/ajaxSearch', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': UA,
                'Origin': 'https://saveig.app',
                'Referer': 'https://saveig.app/'
            },
            timeout: 12000
        });

        const html = r.data?.data || '';
        // استخراج رابط الفيديو من HTML المُرجَع
        const videoMatch = html.match(/href="(https:\/\/[^"]*\.mp4[^"]*)"/i);
        if (videoMatch && videoMatch[1]) {
            return res.json({ status: 'success', url: decodeURIComponent(videoMatch[1]) });
        }
    } catch (e) { console.log('[IG] Method 1 failed:', e.message); }

    // المحرك 2: igdownloader.app
    try {
        const formData = `recaptchaToken=&q=${encodeURIComponent(cleanUrl)}&t=media&lang=ar`;
        const r = await axios.post('https://igdownloader.app/api/ajaxSearch', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': UA,
                'Origin': 'https://igdownloader.app',
                'Referer': 'https://igdownloader.app/'
            },
            timeout: 12000
        });

        const html = r.data?.data || '';
        const videoMatch = html.match(/href="(https:\/\/[^"]*\.mp4[^"]*)"/i);
        if (videoMatch && videoMatch[1]) {
            return res.json({ status: 'success', url: decodeURIComponent(videoMatch[1]) });
        }
    } catch (e) { console.log('[IG] Method 2 failed:', e.message); }

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
                timeout: 12000
            }
        );
        // snapinsta يرجع JSON أو URL مباشر
        const videoUrl = r.data?.url || r.data?.media?.[0]?.url;
        if (videoUrl) return res.json({ status: 'success', url: videoUrl });

        // أو يرجع HTML
        const html = typeof r.data === 'string' ? r.data : '';
        const videoMatch = html.match(/href="(https:\/\/[^"]*\.mp4[^"]*)"/i);
        if (videoMatch && videoMatch[1]) {
            return res.json({ status: 'success', url: decodeURIComponent(videoMatch[1]) });
        }
    } catch (e) { console.log('[IG] Method 3 failed:', e.message); }

    return res.status(400).json({
        status: 'error',
        message: 'لم نتمكن من استخراج الفيديو. تأكد أن الحساب عام والرابط مضبوط.'
    });
}

// ─────────────────────────────────────────────
//  محرك تيك توك (يعمل بشكل صحيح)
// ─────────────────────────────────────────────
async function handleTikTok(cleanUrl, originalUrl, res) {

    // المحرك 1: tiklydown
    try {
        const r = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(cleanUrl)}`, {
            timeout: 10000
        });
        const videoUrl = r.data?.result?.video?.url || r.data?.result?.url || r.data?.data?.play;
        if (videoUrl) return res.json({ status: 'success', url: videoUrl });
    } catch (e) { console.log('[TK] Method 1 failed:', e.message); }

    // المحرك 2: tikwm (الأقوى لتيك توك)
    try {
        const r = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(originalUrl)}`, {
            timeout: 10000
        });
        if (r.data?.data?.play) {
            return res.json({ status: 'success', url: r.data.data.play });
        }
    } catch (e) { console.log('[TK] Method 2 failed:', e.message); }

    // المحرك 3: musicaldown
    try {
        const r = await axios.post('https://musicaldown.com/api/download',
            `id=${encodeURIComponent(originalUrl)}`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': UA,
                    'Referer': 'https://musicaldown.com/'
                },
                timeout: 10000
            }
        );
        const videoUrl = r.data?.links?.[0]?.a || r.data?.url;
        if (videoUrl) return res.json({ status: 'success', url: videoUrl });
    } catch (e) { console.log('[TK] Method 3 failed:', e.message); }

    return res.status(400).json({
        status: 'error',
        message: 'لم نتمكن من استخراج الفيديو. تأكد أن الحساب عام.'
    });
}
