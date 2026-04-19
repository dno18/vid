const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    const { url } = req.body;

    try {
        // استخدام محرك Tikwm المطور بجودة HD
        const apiRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`);
        const json = await apiRes.json();

        if (json.code === 0 && json.data) {
            return res.json({
                status: 'success',
                url: json.data.hdplay || json.data.play,
                cover: json.data.cover
            });
        }
        throw new Error('API Error');
    } catch (e) {
        res.status(500).json({ error: 'خطأ في جلب الفيديو' });
    }
};
