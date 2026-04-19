const fetch = require('node-fetch');

module.exports = async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('URL required');

    try {
        const response = await fetch(decodeURIComponent(url), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
                'Referer': 'https://www.tiktok.com/'
            }
        });

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'video/mp4');
        // هذا السطر يخبر الآيفون أن الملف اسمه video.mp4 ويجب تحميله
        res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');

        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
    } catch (e) {
        res.status(502).send('Proxy error');
    }
};
