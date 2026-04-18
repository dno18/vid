module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'URL مطلوب' });

  if (!process.env.RAPIDAPI_KEY) {
    return res.status(500).json({ error: 'RAPIDAPI_KEY غير مضبوط في البيئة' });
  }

  const KEY = process.env.RAPIDAPI_KEY;

  // استخراج videoId من روابط يوتيوب
  function extractYoutubeId(url) {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  }

  // ---- social-media-video-downloader - YouTube endpoint ----
  const ytId = extractYoutubeId(url);
  if (ytId) {
    try {
      const r = await fetch(
        `https://social-media-video-downloader.p.rapidapi.com/youtube/v3/video/details?videoId=${ytId}&urlAccess=normal&renderableFormats=720p,360p&getTranscript=false`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-host': 'social-media-video-downloader.p.rapidapi.com',
            'x-rapidapi-key': KEY,
          },
          signal: AbortSignal.timeout(25000),
        }
      );

      const d = await r.json();
      console.log('YouTube API response:', JSON.stringify(d).slice(0, 400));

      // ابحث عن رابط الفيديو في الـ response
      const formats = d.formats || d.streamingData?.formats || d.streamingData?.adaptiveFormats || [];
      const videoUrl =
        formats.find((f) => f.qualityLabel === '720p')?.url ||
        formats.find((f) => f.qualityLabel === '360p')?.url ||
        formats[0]?.url ||
        d.url ||
        d.videoUrl;

      if (videoUrl) {
        return res.status(200).json({
          status: 'redirect',
          url: videoUrl,
          title: d.title || d.videoDetails?.title || '',
          thumbnail: d.thumbnail || d.videoDetails?.thumbnail?.thumbnails?.[0]?.url || '',
        });
      }
    } catch (e) {
      console.warn('YouTube API failed:', e.message);
    }
  }

  // ---- Backup: TikTok & Instagram & others via coder2077 API ----
  try {
    const r2 = await fetch(
      `https://instagram-tiktok-youtube-downloader.p.rapidapi.com/index?url=${encodeURIComponent(url)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'instagram-tiktok-youtube-downloader.p.rapidapi.com',
          'x-rapidapi-key': KEY,
        },
        signal: AbortSignal.timeout(20000),
      }
    );

    const d2 = await r2.json();
    console.log('Backup API response:', JSON.stringify(d2).slice(0, 400));

    const videoUrl =
      d2.url ||
      d2.video ||
      d2.medias?.[0]?.url ||
      d2.links?.[0]?.url ||
      d2.data?.play ||
      d2.data?.hdplay;

    if (videoUrl) {
      return res.status(200).json({
        status: 'redirect',
        url: videoUrl,
        title: d2.title || '',
        thumbnail: d2.thumbnail || d2.cover || '',
      });
    }
  } catch (e) {
    console.warn('Backup API failed:', e.message);
  }

  return res.status(502).json({
    error: 'تعذّر تنزيل الفيديو. تأكد من صحة الرابط أو حاول مرة أخرى.',
  });
};
