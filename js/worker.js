// Cloudflare Worker — بيخبّي مفتاح Gemini ومحدّش يشوفه
// المتغيرات (Settings > Variables): GEMINI_KEY (Secret) و ALLOWED_ORIGIN
// مثال ALLOWED_ORIGIN:  https://ea0487206-create.github.io
const MODELS_OK = /^[a-z0-9.\-]+$/;
export default {
  async fetch(req, env) {
    const allowed = (env.ALLOWED_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
    const origin = req.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : (allowed[0] || ""),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };
    if (req.method === "OPTIONS") { return new Response(null, { headers: cors }); }
    if (req.method !== "POST" || !allowed.includes(origin)) { return new Response("forbidden", { status: 403, headers: cors }); }
    const raw = await req.text();
    if (raw.length > 30000) { return new Response("too large", { status: 413, headers: cors }); }
    let data;
    try { data = JSON.parse(raw); } catch (e) { return new Response("bad json", { status: 400, headers: cors }); }
    if (!data.model || !MODELS_OK.test(data.model) || !data.body) { return new Response("bad request", { status: 400, headers: cors }); }
    const g = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + data.model + ":streamGenerateContent?alt=sse", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_KEY },
      body: JSON.stringify(data.body)
    });
    return new Response(g.body, { status: g.status, headers: { ...cors, "Content-Type": g.headers.get("Content-Type") || "text/event-stream" } });
  }
};
