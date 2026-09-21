import { checkRateLimit, getClientIp, json } from "./_supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  const clientIp = getClientIp(req);
  if (!checkRateLimit(`greeting:${clientIp}`, 20, 60_000)) {
    return json(res, 429, { error: "Too many requests. Please wait a moment and try again." });
  }

  const body = req.body || {};
  const values = ["recipient", "relationship", "occasion", "hobbies", "keywords", "productName"]
    .reduce((result, key) => ({ ...result, [key]: String(body[key] || "").trim().slice(0, 160) }), {});
  if (!values.recipient && !values.relationship && !values.occasion) {
    return json(res, 400, { error: "Thiếu thông tin để tạo lời chúc." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json(res, 500, { error: "Missing GEMINI_API_KEY" });
  }

  try {
    const prompt = `Viết 3 lời chúc tiếng Việt tự nhiên, 20-60 ký tự, không emoji, không dấu ngoặc kép, phù hợp để khắc lên quà tặng.
Thông tin: ${JSON.stringify(values)}
Trả JSON dạng {"greetings":["...","...","..."]}.`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Gemini request failed");
    const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
    const greetings = (Array.isArray(parsed.greetings) ? parsed.greetings : [])
      .map((item) => String(item).trim().replace(/^["'\s]+|["'\s]+$/g, ""))
      .filter(Boolean).slice(0, 3);
    if (!greetings.length) return json(res, 502, { error: "AI không tạo được lời chúc." });
    json(res, 200, { greetings });
  } catch (error) {
    json(res, 500, { error: error.message });
  }
}
