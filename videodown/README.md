# Video Downloader — دليل الرفع على Vercel

## لماذا Vercel؟
المتصفح يمنع التواصل المباشر مع APIs خارجية (CORS).
Vercel يوفر Backend مجاني يعمل كوسيط بينك وبين Cobalt.

---

## خطوات الرفع (5 دقائق)

### 1. سجّل في Vercel
- اذهب لـ https://vercel.com
- سجّل دخول بحساب GitHub

### 2. ارفع الملفات على GitHub
- اذهب لـ https://github.com/new
- اسم المشروع: video-downloader
- ارفع المجلد كله (api/, public/, vercel.json, package.json)

### 3. اربط GitHub بـ Vercel
- في Vercel: "Add New Project"
- اختر الـ repo اللي رفعته
- اضغط Deploy

### 4. موقعك جاهز!
- ستحصل على رابط مثل: https://video-downloader-xxx.vercel.app
- هذا هو موقعك الخاص يشتغل 100%

---

## هيكل المشروع
```
videodown/
├── api/
│   └── download.js    ← السيرفر (Backend)
├── public/
│   └── index.html     ← الواجهة (Frontend)
├── vercel.json        ← إعدادات Vercel
└── package.json
```

## كيف يشتغل؟
1. المستخدم يضع الرابط في الموقع
2. الموقع يرسل الطلب لـ /api/download (سيرفرك على Vercel)
3. سيرفرك يتكلم مع Cobalt API
4. Cobalt يرجع رابط التنزيل لسيرفرك
5. سيرفرك يرجعه للمستخدم
→ لا CORS، لا حجب، يشتغل من أي جهاز!
