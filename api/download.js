const fetch = require('node-fetch');
const https = require('https');
const http = require('http');

// ============================================================
// فك الرابط القصير — باستخدام Node المدمج (أكثر موثوقية)
// ============================================================
function resolveUrl(url) {
  return new Promise((resolve) => {
    const globalTimeout = setTimeout(() => {
      console.log('resolveUrl: global timeout, returning original');
      resolve(url);
    }, 10000);

    function follow(current, depth) {
      if (depth > 10) {
        clearTimeout(globalTimeout);
        return resolve(current);
      }

      const lib = current.startsWith('https') ? https : http;

      try {
        const req = lib.request(current, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml',
          }
        }, (res) => {
          const loc = res.headers['location'];
          res.destroy();

          if (loc && [301, 302, 303, 307, 308].includes(res.statusCode)) {
            const next = loc.startsWith('http') ? loc : new URL(loc, current).href;
            console.log(`Redirect ${depth}: ${current.substring(0, 60)} -> ${next.substring(0, 80)}`);

            if (next.includes('tiktok.com/@') && next.includes('/video/')) {
              clearTimeout(globalTimeout);
              return resolve(next);
            }

            follow(next, depth + 1);
          } else {
            clearTimeout(globalTimeout);
            resolve(current);
          }
        });

        req.on('error', (e) => {
          console.log('resolveUrl request error:', e.message);
          clearTimeout(globalTimeout);
          resolve(current);
        });

        req.setTimeout(7000, () => {
          req.destroy();
          clearTimeout(globalTimeout);
          resolve(current);
        });

        req.end();
      } catch (e) {
        console.log('resolveUrl exception:', e.message);
        clearTimeout(globalTimeout);
        resolve(current);
      }
    }

    follow(url, 0);
  });
}

// ============================================================
// API 1: tikwm POST (أفضل من GET للروابط القصيرة)
// ============================================================
async function tikwmPost(url) {
  try {
    const body = new URLSearchParams({ url, hd: '1' });
    const res = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.tikwm.com/',
        'Origin': 'https://www.tikwm.com'
      },
      body: body.toString(),
      timeout: 20000
    });
    const data = await res.json();
    console.log(`tikwm POST [${url.substring(0,50)}] code:`, data.code);
    if (data.code === 0 && data.data) return data.data;
  } catch (e) {
    console.log('tikwm POST error:', e.message);
  }
  return null;
}

// ============================================================
// API 2: tikwm GET
// ============================================================
async function tikwmGet(url) {
  try {
    const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://www.tikwm.com/'
      },
      timeout: 20000
    });
    const data = await res.json();
    console.log(`tikwm GET [${url.substring(0,50)}] code:`, data.code);
    if (data.code === 0 && data.data) return data.data;
  } catch (e) {
    console.log('tikwm GET error:', e.message);
  }
  return null;
}

// ============================================================
// API 3: douyin.wtf
// ============================================================
async function douyinWtf(url) {
  try {
    const res = await fetch(`https://api.douyin.wtf/api?url=${encodeURIComponent(url)}&minimal=true`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 20000
    });
    const data = await res.json();
    console.log('douyin.wtf status:', data.status);
    const videoUrl = data.video_data?.nwm_video_url_HQ || data.video_data?.nwm_video_url;
    if (videoUrl) return { play: videoUrl };
  } catch (e) {
    console.log('douyin.wtf error:', e.message);
  }
  return null;
}

// ============================================================
// تحويل النتيجة
// ============================================================
function parseResult(d) {
  if (!d) return null;

  if (d.images && d.images.length > 0) {
    return {
      type: 'picker',
      picker: d.images.map(img => ({ url: typeof img === 'string' ? img : (img.url || img) }))
    };
  }

  const videoUrl = d.hdplay || d.play;
  if (videoUrl && videoUrl.startsWith('http')) {
    return { type: 'video', url: videoUrl };
  }

  return null;
}

function sendResult(res, result) {
  if (result.type === 'picker') {
    return res.json({ status: 'picker', picker: result.picker });
  }
  return res.json({ status: 'success', url: result.url });
}

// ============================================================
// Handler الرئيسي
// ============================================================
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  console.log('\n========== New Request ==========');
  console.log('Input:', url);

  try {
    const isShort = /vt\.tiktok\.com|vm\.tiktok\.com|tiktok\.com\/t\//.test(url);
    let longUrl = url;

    // الخطوة 1: فك الرابط القصير
    if (isShort) {
      console.log('Short URL detected, resolving...');
      longUrl = await resolveUrl(url);
      console.log('Resolved URL:', longUrl);
    }

    let raw = null;
    let result = null;

    // الخطوة 2: tikwm POST بالرابط الطويل
    raw = await tikwmPost(longUrl);
    result = parseResult(raw);
    if (result) {
      console.log('Success via tikwm POST (long URL)');
      return sendResult(res, result);
    }

    // الخطوة 3: tikwm POST بالرابط الأصلي
    if (isShort && longUrl !== url) {
      raw = await tikwmPost(url);
      result = parseResult(raw);
      if (result) {
        console.log('Success via tikwm POST (short URL)');
        return sendResult(res, result);
      }
    }

    // الخطوة 4: tikwm GET
    raw = await tikwmGet(longUrl);
    result = parseResult(raw);
    if (result) {
      console.log('Success via tikwm GET');
      return sendResult(res, result);
    }

    // الخطوة 5: douyin.wtf
    raw = await douyinWtf(longUrl !== url ? longUrl : url);
    result = parseResult(raw);
    if (result) {
      console.log('Success via douyin.wtf');
      return sendResult(res, result);
    }

    console.log('All APIs failed');
    return res.status(404).json({ error: 'لم يتم العثور على الفيديو. تأكد من الرابط وحاول مجدداً.' });

  } catch (e) {
    console.error('Unexpected error:', e);
    return res.status(500).json({ error: 'خطأ في السيرفر: ' + e.message });
  }
};
