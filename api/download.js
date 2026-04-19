module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    const { url } = req.body;

    try {
        const r = await fetch('https://www.tikwm.com/api/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ url, hd: '1' })
        });
        const d = await r.json();

        if (d.code === 0 && d.data) {
            // إذا كان تيك توك صور (Slideshow)
            if (d.data.images && d.data.images.length > 0) {
                return res.status(200).json({
                    status: 'picker',
                    picker: d.data.images.map(i => ({ url: i }))
                });
            }
            // إذا كان فيديو
            return res.status(200).json({
                status: 'success',
                url: d.data.hdplay || d.data.play
            });
        }
        res.status(404).json({ error: "لم يتم العثور على الفيديو" });
    } catch (e) { res.status(500).json({ error: "خطأ في الخادم" }); }
};
