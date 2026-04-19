const fetch = require('node-fetch');
const https = require('https');
const http = require('http');

// ===== فك الرابط القصير باستخدام مكتبة https المدمجة في Node (أكثر موثوقية من node-fetch) =====
function resolveRedirects(url, maxRedirects = 10) {
  return new Promise((resolve) => {
    let redirectCount = 0;

    function doRequest(currentUrl) {
      if (redirectCount >= maxRedirects) return resolve(currentUrl);

      const lib = currentUrl.startsWith('https') ? https : http;
      const options = {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      };

      try {
        const req = lib.get(currentUrl, options, (res) => {
          const location = res.headers['location'];
          if ([301, 302, 303, 307, 308].includes(res.statusCode) && location) {
            redirectCount++;
            // بناء الرابط الكامل إذا كان location نسبياً
            const nextUrl = location.startsWith('http') ? location : new URL(location, currentUrl).href;
            console.log(`Redirect ${redirectCount}: ${currentUrl} -> ${nextUrl}`);
            res.destroy(); // إغلاق الاتصال الحالي
            doRequest(nextUrl);
          } else {
            res.destroy();
            resolve(currentUrl);
          }
        });
        req.on('error', () => resolve(currentUrl));
        req.setTimeout(8000, () => { req.destroy(); resolve(currentUrl); });
      } catch (e) {
        resolve(currentUrl);
      }
    }

    doRequest(url);
  });
}

// ===== API الأول: tikwm =====
async function tryTikwm(url) {
  try {
    const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://www.tikwm.com/'
      },
      timeout: 15000
    });
    const data = await res.json();
    console.log('tikwm response code:', data.code, '| url used:', url);
    if (data.code === 0 && data.data) return data.data;
  } catch (e) {
    console.log('tikwm error:', e.message);
  }
  return null;
}

// ===== API الثاني: douyin.wtf كـ fallback =====
async function tryDouyinWtf(url) {
  try {
    const res = await fetch(`https://api.douyin.wtf/api?url=${encodeURIComponent(url)}&minimal=true`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    });
    const data = await res.json();
    if (data.video_data?.nwm_video_url_HQ) {
      console.log('douyin.wtf success');
      return { play: data.video_data.nwm_video_url_HQ };
    }
  } catch (e) {
    console.log('douyin.wtf error:', e.message);
  }
  return null;
}

// ===== API الثالث: tiktok-scraper عبر rapidapi (اختياري) =====
async function tryAwemeDownloader(url) {
  try {
    const res = await fetch(`https://tiktok-download-without-watermark.p.rapidapi.com/analysis?url=${encodeURIComponent(url)}&hd=1`, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        // أضف مفتاح RapidAPI هنا إذا عندك
        // 'X-RapidAPI-Key': 'YOUR_KEY',
        // 'X-RapidAPI-Host': 'tiktok-download-without-watermark.p.rapidapi.com'
      },
      timeout: 10000
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.data?.play) return { play: data.data.play };
    }
  } catch (e) {}
  return null;
}

// ===== الدالة الرئيسية =====
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  console.log('=== New Request ===');
  console.log('Input URL:', url);

  try {
    const isShort = url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com') || url.includes('/t/');
    let longUrl = url;
    let result = null;

    // الخطوة 1: فك الرابط القصير إذا لزم (باستخدام Node https المدمج)
    if (isShort) {
      longUrl = await resolveRedirects(url);
      console.log('Final resolved URL:', longUrl);
    }

    // الخطوة 2: جرّب tikwm بالرابط المُفكَّك
    result = await tryTikwm(longUrl);

    // الخطوة 3: إذا فشل وكان رابط قصير، جرّب tikwm بالرابط الأصلي
    if (!result && isShort && longUrl !== url) {
      result = await tryTikwm(url);
    }

    // الخطوة 4: جرّب douyin.wtf كـ fallback
    if (!result) {
      result = await tryDouyinWtf(longUrl !== url ? longUrl : url);
    }

    // الخطوة 5: معالجة النتيجة
    if (result) {
      // محتوى صور (Slideshow)
      if (result.images && result.images.length > 0) {
        return res.json({
          status: 'picker',
          picker: result.images.map(img => ({ url: typeof img === 'string' ? img : img.url || img }))
        });
      }
      // محتوى فيديو
      const videoUrl = result.hdplay || result.play;
      if (videoUrl) {
        return res.json({ status: 'success', url: videoUrl });
      }
    }

    console.log('All methods failed for:', url);
    res.status(404).json({ error: 'Content not found. تأكد من الرابط أو حاول مرة ثانية.' });

  } catch (e) {
    console.error('Unexpected error:', e.message);
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
};
