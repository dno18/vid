import { useState, useRef } from "react";

const GRAD = "linear-gradient(135deg, #0070f3, #f81ae5)";

export default function App() {
  const [mode, setModeState] = useState("");
  const [imgBase64, setImgBase64] = useState("");
  const [imgMediaType, setImgMediaType] = useState("image/jpeg");
  const [imgPreview, setImgPreview] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [vUrl, setVUrl] = useState("");
  const fileRef = useRef();

  function setMode(m) {
    setModeState(m);
    setResult("");
    setVideoUrl("");
  }

  function handleImg(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgMediaType(file.type || "image/jpeg");
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setImgPreview(dataUrl);
      setImgBase64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }

  async function process() {
    setLoading(true);
    setResult("");
    setVideoUrl("");

    try {
      if (mode === "ai") {
        if (!imgBase64) { alert("الرجاء اختيار صورة أولاً"); return; }

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image",
                    source: { type: "base64", media_type: imgMediaType, data: imgBase64 },
                  },
                  {
                    type: "text",
                    text: `أنت خبير في تحليل الصور. قم بتحليل هذه الصورة بشكل شامل ودقيق باللغة العربية وأجب على هذه النقاط:

1. 🖼️ وصف عام: ما الذي تراه في الصورة؟
2. 🎨 الألوان والأسلوب: ما هي الألوان السائدة والأسلوب البصري؟
3. 📍 التفاصيل المهمة: ما هي أبرز العناصر والتفاصيل في الصورة؟
4. 💡 جودة الصورة: كيف تقيّم وضوح وجودة الصورة؟
5. 📱 ملاءمة لوسائل التواصل: هل هذه الصورة مناسبة للنشر؟ وما هي اقتراحاتك لتحسينها؟

اجعل ردك مفصلاً ومفيداً.`,
                  },
                ],
              },
            ],
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error?.message || "خطأ في الاتصال");
        }

        const data = await response.json();
        setResult(data.content[0]?.text || "لم يتم الحصول على نتيجة.");

      } else {
        // TikTok / Instagram - يحتاج backend
        if (!vUrl) { alert("الرجاء إدخال رابط الفيديو"); return; }
        const res = await fetch("/api/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: vUrl, type: mode }),
        });
        const d = await res.json();
        setVideoUrl(`/api/proxy?url=${encodeURIComponent(d.url)}&type=video`);
      }
    } catch (e) {
      alert("❌ خطأ: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  const canGo = mode === "ai" ? !!imgBase64 : !!vUrl;

  return (
    <div style={{ background: "#050505", minHeight: "100vh", display: "flex", justifyContent: "center", padding: "24px 16px", fontFamily: "'Tajawal', sans-serif", direction: "rtl" }}>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap" rel="stylesheet" />

      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: 30, fontWeight: 900, background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>
            Social Media Pro
          </h1>
          <p style={{ color: "#444", fontSize: 13, marginTop: 4 }}>v8.7 · مدعوم بالذكاء الاصطناعي</p>
        </div>

        {/* Card */}
        <div style={{ background: "#121212", borderRadius: 28, border: "1px solid #222", padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }}>

          {/* Mode Selector */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[
              { id: "tiktok", label: "🎵 TikTok" },
              { id: "instagram", label: "📸 Instagram" },
              { id: "ai", label: "توضيح الصور ✨" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setMode(btn.id)}
                style={{
                  flex: 1, padding: "11px 4px", borderRadius: 14, border: "1px solid",
                  borderColor: mode === btn.id ? "#0070f3" : "#222",
                  background: mode === btn.id ? "#0070f3" : "#1a1a1a",
                  color: mode === btn.id ? "#fff" : "#666",
                  fontWeight: 700, fontSize: 11, cursor: "pointer",
                  fontFamily: "'Tajawal', sans-serif", transition: "all 0.2s",
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Input Area */}
          {mode === "ai" && (
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${imgBase64 ? "#0070f3" : "#333"}`,
                borderRadius: 18, padding: "28px 20px", textAlign: "center",
                cursor: "pointer", transition: "border-color 0.2s", marginBottom: 4,
              }}
            >
              {imgPreview ? (
                <>
                  <img src={imgPreview} alt="preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 12, marginBottom: 10 }} />
                  <p style={{ color: "#0070f3", fontWeight: 700, fontSize: 13 }}>✅ {fileName}</p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 38, marginBottom: 8 }}>📸</div>
                  <p style={{ color: "#777", fontWeight: 700, fontSize: 14 }}>اضغط لرفع صورة</p>
                  <p style={{ color: "#444", fontSize: 12, marginTop: 4 }}>JPG · PNG · WEBP</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImg} />
            </div>
          )}

          {(mode === "tiktok" || mode === "instagram") && (
            <input
              type="text"
              value={vUrl}
              onChange={e => setVUrl(e.target.value)}
              placeholder="الصق الرابط هنا"
              style={{
                width: "100%", padding: 16, borderRadius: 14, background: "#000",
                border: "1px solid #222", color: "#fff", textAlign: "center",
                fontFamily: "'Tajawal', sans-serif", fontSize: 14, boxSizing: "border-box",
              }}
            />
          )}

          {!mode && (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#444" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>👆</div>
              <p style={{ fontSize: 14 }}>اختر الخدمة من الأعلى</p>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={process}
            disabled={!canGo || loading}
            style={{
              width: "100%", padding: 17, borderRadius: 14, border: "none",
              background: canGo && !loading ? GRAD : "#1a1a1a",
              color: canGo && !loading ? "#fff" : "#444",
              fontWeight: 900, fontSize: 16, cursor: canGo && !loading ? "pointer" : "not-allowed",
              marginTop: 14, fontFamily: "'Tajawal', sans-serif", transition: "all 0.3s",
            }}
          >
            {loading ? "⏳ جاري التحليل..." : "ابدأ المعالجة"}
          </button>

          {/* AI Result */}
          {result && (
            <div style={{ marginTop: 20, background: "#0a0a18", border: "1px solid #1a1a44", borderRadius: 20, overflow: "hidden" }}>
              <div style={{ background: GRAD, padding: "12px 18px", fontWeight: 900, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <span>✨</span> تحليل الصورة بالذكاء الاصطناعي
              </div>
              <div style={{ padding: 18 }}>
                <span style={{ display: "inline-block", background: "rgba(0,112,243,0.15)", color: "#0070f3", border: "1px solid rgba(0,112,243,0.25)", borderRadius: 8, padding: "3px 10px", fontSize: 12, marginBottom: 12 }}>
                  🤖 Claude AI · تحليل دقيق
                </span>
                <p style={{ color: "#ccc", lineHeight: 1.9, fontSize: 14, whiteSpace: "pre-wrap", margin: 0 }}>
                  {result}
                </p>
              </div>
            </div>
          )}

          {/* Video Result */}
          {videoUrl && (
            <div style={{ marginTop: 20 }}>
              <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #333", background: "#000", marginBottom: 14 }}>
                <video src={videoUrl} controls style={{ width: "100%", display: "block" }} />
              </div>
              <a href={videoUrl} download="video.mp4" style={{ display: "block", padding: 17, background: "#fff", color: "#000", borderRadius: 14, fontWeight: 900, textDecoration: "none", textAlign: "center", fontFamily: "'Tajawal', sans-serif", fontSize: 15 }}>
                حفظ الفيديو 📥
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
