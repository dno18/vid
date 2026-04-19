module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' });

    try {
        // --- خطوة ذكية: فك الرابط المختصر إذا كان من نوع vt أو vm ---
        if (url.includes('tiktok.com')) {
            const expand = await fetch(url, { method: 'HEAD', redirect: 'follow' });
            url = expand.url; // الحصول على الرابط الكامل بعد التوجيه
        }

        const r = await fetch('https://www.tikwm.com/api/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ url, hd: '1' })
        });
        
        const d = await r.json();

        if (d.code === 0 && d.data) {
            const data = d.data;

            // إذا كان المنشور صور
            if (data.images && data.images.length > 0) {
                return res.status(200).json({
                    status: 'picker',
                    picker: data.images.map(img => ({ url: img }))
                });
            }

            // إذا كان فيديو
            const videoUrl = data.hdplay || data.play;
            if (videoUrl) {
                return res.status(200).json({
                    status: 'success',
                    url: videoUrl
                });
            }
        }
        
        res.status(404).json({ error: "تعذر العثور على محتوى. الرابط قد يكون خاصاً أو غير صالح." });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "حدث خطأ أثناء معالجة الرابط" });
    }
};
