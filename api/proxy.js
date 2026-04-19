const fetch = require('node-fetch');

module.exports = async (req, res) => {
    const { url, type } = req.query;
    if (!url) return res.status(400).send('URL missing');

    try {
        const response = await fetch(decodeURIComponent(url), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
            }
        });

        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // تعيين نوع المحتوى بناءً على المعامل type
        if (type === 'video') {
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
        } else if (type === 'image') {
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Content-Disposition', 'attachment; filename="image.jpg"');
        } else {
             res.setHeader('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
        }
        
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));

    } catch (e) {
        res.status(500).send('Proxy Error');
    }
};
