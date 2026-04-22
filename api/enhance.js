const https = require('https');

const RAPIDAPI_KEY = '29914fedc3msh998a5bf5c930e94p16829ejsn4803a5267471';

function readBody(req) {
    return new Promise((resolve) => {
        if (req.body && typeof req.body === 'object') return resolve(req.body);
        let raw = '';
        req.on('data', c => raw += c);
        req.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({}); } });
        req.on('error', () => resolve({}));
    });
}

function postForm(hostname, path, boundary, bodyBuffer, headers) {
    return new Promise((resolve, reject) => {
        const opts = {
            hostname,
            path,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': bodyBuffer.length,
                ...headers
            }
        };
        const req = https.request(opts, (r) => {
            const chunks = [];
            r.on('data', c => chunks.push(c));
            r.on('end', () => {
                const buf = Buffer.concat(chunks);
                try { resolve({ status: r.statusCode, json: JSON.parse(buf.toString()), buf }); }
                catch { resolve({ status: r.statusCode, json: null, buf }); }
            });
        });
        req.setTimeout(25000, () => { req.destroy(); reject(new Error('timeout')); });
        req.on('error', reject);
        req.write(bodyBuffer);
        req.end();
    });
}

function buildMultipart(boundary, fieldName, fileBuffer, filename, mimeType) {
    const header = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    return Buffer.concat([header, fileBuffer, footer]);
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const body = await readBody(req);
        const { imageBase64, mediaType } = body;

        if (!imageBase64) {
            return res.status(400).json({ status: 'error', message: 'الصورة مطلوبة' });
        }

        const imageBuffer = Buffer.from(imageBase64, 'base64');
        const mime = mediaType || 'image/jpeg';
        const ext  = mime.includes('png') ? 'png' : 'jpg';
        const boundary = '----FormBoundary' + Date.now();
        const formData = buildMultipart(boundary, 'image', imageBuffer, `photo.${ext}`, mime);

        // المحرك: AI Image Upscaler (RapidAPI) - يكبر الصورة ضعفين ويوضحها
        const r = await postForm(
            'ai-image-upscaler.p.rapidapi.com',
            '/upscale?scale=2',
            boundary,
            formData,
            {
                'x-rapidapi-key':  RAPIDAPI_KEY,
                'x-rapidapi-host': 'ai-image-upscaler.p.rapidapi.com'
            }
        );

        if (r.status === 200 && r.buf.length > 1000) {
            // الـ API يرجع بيانات الصورة مباشرة (binary)
            const resultBase64 = r.buf.toString('base64');
            return res.json({
                status: 'success',
                imageBase64: resultBase64,
                mediaType: 'image/png'
            });
        }

        // إذا رجع JSON بدل binary (بعض الـ APIs ترجع URL)
        if (r.json?.output_url || r.json?.url) {
            return res.json({
                status: 'success',
                outputUrl: r.json.output_url || r.json.url
            });
        }

        console.log('Enhance API response:', r.status, r.json || r.buf.toString().slice(0, 200));
        return res.status(500).json({ status: 'error', message: 'فشل التوضيح، حاول مرة ثانية' });

    } catch (e) {
        console.error('Enhance error:', e.message);
        return res.status(500).json({ status: 'error', message: 'خطأ في السيرفر: ' + e.message });
    }
};
