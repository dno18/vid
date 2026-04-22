export default async function handler(req, res) {
    // التأكد من أن الطلب من نوع POST فقط
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { url } = req.body;

    //التأكد من وجود الرابط
    if (!url) {
        return res.status(400).json({ status: 'error', message: 'الرابط مطلوب' });
    }

    try {
        // استخدام محرك Cobalt القوي (بدون مكتبات خارجية لضمان عدم ظهور علامة X)
        const response = await fetch('https://api.cobalt.tools/api/json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                url: url, 
                videoQuality: '720',
                filenamePattern: 'basic'
            })
        });

        const data = await response.json();

        if (data && data.url) {
            return res.status(200).json({ 
                status: 'success', 
                url: data.url 
            });
        } else {
            return res.status(400).json({ 
                status: 'error', 
                message: 'تعذر العثور على الفيديو، تأكد من أن الحساب عام وليس خاصاً' 
            });
        }

    } catch (error) {
        console.error('Download Error:', error);
        return res.status(500).json({ 
            status: 'error', 
            message: 'حدث خطأ في الاتصال بالسيرفر' 
        });
    }
}
