export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { url } = req.body;

    try {
        const response = await fetch('https://api.cobalt.tools/api/json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ url, videoQuality: '720' })
        });
        const data = await response.json();

        if (data.url) {
            return res.status(200).json({ status: 'success', url: data.url });
        } else {
            return res.status(400).json({ status: 'error', message: 'الرابط غير مدعوم أو الحساب خاص' });
        }
    } catch (e) {
        return res.status(500).json({ status: 'error', message: 'السيرفر مشغول' });
    }
}
