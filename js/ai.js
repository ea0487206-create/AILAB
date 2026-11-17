// ===== AI Core: دالة واحدة تستخدمها كل الصفحات =====
window.AI = {
  // system: تعليمات الشخصية | history: [{role:"user"|"model", parts:[{text}]}]
  // onChunk(textSoFar): اختياري للعرض الفوري
  // بترجع النص الكامل أو ترمي Error برسالة عربي
  async ask({ system, history, onChunk, maxTokens = 800 }) {
    const { KEY, MODEL } = window.AI_CONFIG || {};
    if (!KEY || KEY.includes("حط_المفتاح")) {
      throw new Error("لازم تحط مفتاح Gemini في js/config.js");
    }
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      MODEL + ":streamGenerateContent?alt=sse&key=" + KEY;
    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: history,
      generationConfig: { maxOutputTokens: maxTokens }
    });

    let res;
    for (let i = 0; i < 3; i++) {
      try {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body
        });
      } catch (e) {
        throw new Error("في مشكلة في الاتصال بالإنترنت.");
      }
      if (res.ok || (res.status !== 503 && res.status !== 429)) break;
      await new Promise((r) => setTimeout(r, 900));
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Gemini error:", err);
      throw new Error(
        res.status === 503 || res.status === 429
          ? "الموديل مشغول دلوقتي، جرّب بعد شوية 🤖"
          : "حصل خطأ: " + (err.error?.message || res.status)
      );
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", full = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        try {
          const j = JSON.parse(line.slice(5));
          const t = j.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
          if (t) { full += t; if (onChunk) onChunk(full); }
        } catch (e) {}
      }
    }
    if (!full) throw new Error("ما قدرتش أرد دلوقتي.");
    return full;
  }
};
