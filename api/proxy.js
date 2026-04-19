const fetch = require('node-fetch');

module.exports = async (req, res) => {
    const { url } = req.query;
    try {
        const response = await fetch(decodeURIComponent(url));
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Access-Control-Allow-Origin', '*');
        // إجبار الآيفون على رؤية الملف كفيديو كامل وليس تدفق صوتي
        res.setHeader('Content-Disposition', 'attachment; filename="tiktok_video.mp4"');
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
    } catch (e) {
        res.status(500).send('Proxy Error');
    }
};
