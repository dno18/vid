export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
    const { imageBase64 } = req.body;
    try {
        const response = await fetch('https://api.vkrdown.com/ai/upscale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: `data:image/jpeg;base64,${imageBase64}` })
        });
        const data = await response.json();
        if (data.url) {
            // تحويل الرابط إلى Base64 مجدداً لضمان العرض
            const imgRes = await fetch(data.url);
            const buffer = await imgRes.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            return res.status(200).json({ status: 'success', imageBase64: base64 });
        } else {
            throw new Error('فشل توضيح الصورة');
        }
    } catch (error) {
        return res.status(500).json({ status: 'error', message: 'خطأ في معالج الصور' });
    }
}
