const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'الرابط مفقود' });

  try {
    // 1. فك الرابط القصير يدوياً للتأكد من صحته
    const getLongUrl = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
      }
    });
    
    const finalLongUrl = getLongUrl.url.split('?')[0]; // تنظيف الرابط من التتبع

    // 2. استخدام API بديل وأسرع (Loovit أو Tikwm)
    const apiRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(finalLongUrl)}&hd=1`);
    const result = await apiRes.json();

    if (result.code === 0 && result.data) {
      // إرسال النتيجة فوراً
      return res.json({ 
        status: 'success', 
        url: result.data.hdplay || result.data.play,
        title: result.data.title 
      });
    } else {
      // إذا فشل الـ API الأول، نحاول بطلب مباشر لفك الفيديو (خطة بديلة)
      return res.status(404).json({ error: 'فشل الـ API في جلب البيانات' });
    }
  } catch (e) {
    return res.status(500).json({ error: 'خطأ داخلي في السيرفر' });
  }
};
