export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
    const { url } = req.body;
    try {
        // استخدام محرك Cobalt المستقر والقوي
        const response = await fetch('https://api.cobalt.tools/api/json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ url: url, videoQuality: '720' })
        });
        const data = await response.json();
        if (data.url) {
            return res.status(200).json({ status: 'success', url: data.url });
        } else {
            throw new Error('لم نتمكن من العثور على الفيديو');
        }
    } catch (error) {
        return res.status(500).json({ status: 'error', message: 'السيرفر مشغول، حاول لاحقاً' });
    }
}
