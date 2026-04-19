const fetch = require('node-fetch');
const https = require('https');
const http = require('http');

function resolveUrl(url) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(url), 10000);
    function follow(current, depth) {
      if (depth > 8) { clearTimeout(timeout); return resolve(current); }
      const lib = current.startsWith('https') ? https : http;
      try {
        const req = lib.request(current, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15' } }, (res) => {
          const loc = res.headers['location'];
          res.destroy();
          if (loc && [301,302,303,307,308].includes(res.statusCode)) {
            const next = loc.startsWith('http') ? loc : new URL(loc, current).href;
            console.log(`Redirect ${depth}: ${next.substring(0,80)}`);
            if (next.includes('tiktok.com/@') && next.includes('/video/')) { clearTimeout(timeout); return resolve(next); }
            follow(next, depth + 1);
          } else { clearTimeout(timeout); resolve(current); }
        });
        req.on('error', () => { clearTimeout(timeout); resolve(current); });
        req.setTimeout(6000, () => { req.destroy(); clearTimeout(timeout); resolve(current); });
        req.end();
      } catch(e) { clearTimeout(timeout); resolve(current); }
    }
    follow(url, 0);
  });
}

async function tikwmPost(url) {
  try {
    const res = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.tikwm.com/', 'Origin': 'https://www.tikwm.com' },
      body: new URLSearchParams({ url, hd: '1' }).toString(),
      timeout: 20000
    });
    const data = await res.json();
    console.log(`tikwm POST code=${data.code} for ${url.substring(0,50)}`);
    if (data.code === 0 && data.data) return data.data;
  } catch(e) { console.log('tikwm POST err:', e.message); }
  return null;
}

async function tikwmGet(url) {
  try {
    const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.tikwm.com/' },
      timeout: 20000
    });
    const data = await res.json();
    console.log(`tikwm GET code=${data.code} for ${url.substring(0,50)}`);
    if (data.code === 0 && data.data) return data.data;
  } catch(e) { console.log('tikwm GET err:', e.message); }
  return null;
}

async function douyinWtf(url) {
  try {
    const res = await fetch(`https://api.douyin.wtf/api?url=${encodeURIComponent(url)}&minimal=true`, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
    const data = await res.json();
    const v = data.video_data?.nwm_video_url_HQ || data.video_data?.nwm_video_url;
    if (v) return { play: v };
  } catch(e) { console.log('douyin err:', e.message); }
  return null;
}

function extractResult(d) {
  if (!d) return null;
  if (d.images && d.images.length > 0) {
    return { type: 'picker', picker: d.images.map(img => ({ url: typeof img === 'string' ? img : (img.url || img) })) };
  }
  // تجنب روابط الصوت — hdplay أولاً ثم play
  const url = [d.hdplay, d.play, d.wmplay].find(u => u && u.startsWith('http') && !u.includes('.mp3') && !u.includes('audio'));
  if (url) { console.log('Final video URL:', url.substring(0,80)); return { type: 'video', url }; }
  return null;
}

function sendResult(res, r) {
  return r.type === 'picker'
    ? res.json({ status: 'picker', picker: r.picker })
    : res.json({ status: 'success', url: r.url });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  console.log('\n=== Request:', url);

  try {
    const isShort = /vt\.tiktok\.com|vm\.tiktok\.com|tiktok\.com\/t\//.test(url);
    const longUrl = isShort ? await resolveUrl(url) : url;
    if (isShort) console.log('Resolved:', longUrl.substring(0,80));

    let r;
    r = extractResult(await tikwmPost(longUrl)); if (r) return sendResult(res, r);
    if (isShort && longUrl !== url) { r = extractResult(await tikwmPost(url)); if (r) return sendResult(res, r); }
    r = extractResult(await tikwmGet(longUrl));  if (r) return sendResult(res, r);
    r = extractResult(await douyinWtf(longUrl !== url ? longUrl : url)); if (r) return sendResult(res, r);

    res.status(404).json({ error: 'لم يتم العثور على الفيديو.' });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ: ' + e.message });
  }
};
