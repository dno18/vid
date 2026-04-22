const fetch = require('node-fetch');

module.exports = async (req, res) => {
    const { url, type } = req.query;
    if (!url) return res.status(400).send('Missing URL');

    try {
        const response = await fetch(decodeURIComponent(url), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', type === 'video' ? 'video/mp4' : 'image/jpeg');
        
        // إرسال البيانات مباشرة (Streaming) لتحسين السرعة في الآيفون
        response.body.pipe(res);
    } catch (e) {
        res.status(500).send('Proxy Error');
    }
};
