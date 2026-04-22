export default async function handler(req, res) {
    const { url } = req.query;
    if (!url) return res.status(400).send('No URL');
    try {
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
        res.send(Buffer.from(buffer));
    } catch (e) {
        res.status(500).send('Error');
    }
}
