const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    // مصفوفة المحركات (نظام التبادل التلقائي)
    const engines = [
        // المحرك 1: Tikwm (الأقوى لتيك توك وإنستقرام)
        async (u) => {
            const r = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(u)}&hd=1`);
            const d = await r.json();
            if (d.code === 0 && d.data) return {
                url: d.data.hdplay || d.data.play,
                images: d.data.images || null,
                type: d.data.images ? 'image_album' : 'video'
            };
            return null;
        },
        // المحرك 2: Tikmate (احتياطي سريع)
        async (u) => {
            const r = await fetch(`https://api.tikmate.app/api/lookup?url=${encodeURIComponent(u)}`, { method: 'POST' });
            const d = await r.json();
            if (d.success) return { url: d.url, type: 'video' };
            return null;
        },
        // المحرك 3: محرك طوارئ (بدون واجهة)
        async (u) => {
            const r = await fetch(`https://api.douyin.wtf/api?url=${encodeURIComponent(u)}`);
            const d = await r.json();
            if (d.status === 'success') return { url: d.url, type: 'video' };
            return null;
        }
    ];

    try {
        let finalData = null;
        for (let engine of engines) {
            try {
                finalData = await engine(url);
                if (finalData) break; // إذا نجح محرك، توقف واخرج بالنتيجة
            } catch (err) { continue; }
        }

        if (finalData) {
            res.json({ status: 'success', ...finalData });
        } else {
            res.status(500).json({ status: 'error', message: 'جميع المحركات فشلت في جلب هذا الرابط حالياً' });
        }
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'خطأ غير متوقع' });
    }
};
