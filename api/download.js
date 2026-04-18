module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'URL مطلوب' });

  const isTikTok = url.includes('tiktok.com') || url.includes('vm.tiktok') || url.includes('vt.tiktok');
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const isInstagram = url.includes('instagram.com');

  // ---- TikTok: tikwm.com API (مجانية بدون مفتاح) ----
  if (isTikTok) {
    try {
      const r = await fetch('https://www.tikwm.com/api/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: new URLSearchParams({ url, hd: '1' }),
        signal: AbortSignal.timeout(20000),
      });

      const d = await r.json();
      console.log('tikwm response:', JSON.stringify(d).slice(0, 400));

      if (d.code === 0 && d.data) {
        const data = d.data;
const videoUrl = data.hdplay || data.play;
        if (videoUrl) {
          return res.status(200).json({
            status: 'redirect',
            url: videoUrl,
            title: data.title || '',
            thumbnail: data.cover || data.origin_cover || '',
          });
        }
      }
    } catch (e) {
      console.warn('tikwm failed:', e.message);
    }
  }

  // ---- YouTube: y2mate API ----
  if (isYouTube) {
    try {
      // استخراج video ID
      const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
      const videoId = match?.[1];

      if (videoId) {
        const r = await fetch('https://www.y2mate.com/mates/analyzeV2/ajax', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          body: new URLSearchParams({
            k_query: url,
            k_page: 'home',
            hl: 'en',
            q_auto: '0',
          }),
          signal: AbortSignal.timeout(20000),
        });

        const d = await r.json();
        console.log('y2mate response:', JSON.stringify(d).slice(0, 400));

        if (d.status === 'ok' && d.links?.mp4) {
          const formats = Object.values(d.links.mp4);
          const best = formats.find(f => f.q === '720p') || formats.find(f => f.q === '360p') || formats[0];
          if (best?.k) {
            // الخطوة الثانية: الحصول على الرابط الفعلي
            const r2 = await fetch('https://www.y2mate.com/mates/convertV2/index', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({ vid: videoId, k: best.k }),
              signal: AbortSignal.timeout(20000),
            });
            const d2 = await r2.json();
            if (d2.dlink) {
              return res.status(200).json({
                status: 'redirect',
                url: d2.dlink,
                title: d.title || '',
                thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('y2mate failed:', e.message);
    }
  }

  // ---- Instagram: saveig API ----
  if (isInstagram) {
    try {
      const r = await fetch(`https://v3.saveig.app/api/ajaxSearch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: new URLSearchParams({ q: url, t: 'media', lang: 'en' }),
        signal: AbortSignal.timeout(20000),
      });

      const d = await r.json();
      console.log('saveig response:', JSON.stringify(d).slice(0, 400));

      if (d.status === 'ok' && d.data) {
        // استخراج أول رابط فيديو من الـ HTML
        const match = d.data.match(/href="(https:\/\/[^"]+\.mp4[^"]*)"/);
        if (match?.[1]) {
          return res.status(200).json({
            status: 'redirect',
            url: match[1],
            title: '',
            thumbnail: '',
          });
        }
      }
    } catch (e) {
      console.warn('saveig failed:', e.message);
    }
  }

  // ---- Fallback: tikwm لجميع المنصات ----
  try {
    const r = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0',
      },
      body: new URLSearchParams({ url, hd: '1' }),
      signal: AbortSignal.timeout(20000),
    });
    const d = await r.json();
    if (d.code === 0 && d.data) {
      const videoUrl = d.data.hdplay || d.data.play;
      if (videoUrl) {
        return res.status(200).json({
          status: 'redirect',
          url: videoUrl,
          title: d.data.title || '',
          thumbnail: d.data.cover || '',
        });
      }
    }
  } catch (e) {
    console.warn('Fallback failed:', e.message);
  }

  return res.status(502).json({
    error: 'تعذّر تنزيل الفيديو. تأكد من صحة الرابط أو حاول مرة أخرى.',
  });
};
