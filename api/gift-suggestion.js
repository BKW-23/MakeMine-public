import { checkRateLimit, getClientIp, json, supabase } from "./_supabase.js";

const gemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${prompt}\nReturn only valid JSON.` }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Gemini request failed");
  return JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
};

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  const clientIp = getClientIp(req);
  if (!checkRateLimit(`gift-suggestion:${clientIp}`, 12, 60_000)) {
    return json(res, 429, { error: "Too many requests. Please slow down and try again." });
  }

  try {
    const occasion = String(req.body?.occasion || "").slice(0, 300);
    const recipient = String(req.body?.recipient || "").slice(0, 300);
    const budget = Number.isFinite(Number(req.body?.budget)) ? Number(req.body.budget) : null;
    const products = await supabase("products?select=id,name,category,base_price,short_description&order=created_at.desc&limit=60");
    if (!products.length) return json(res, 200, { suggestions: [] });
    const result = await gemini(`Bạn là trợ lý quà tặng MakeMine. Chọn 3-5 sản phẩm phù hợp từ danh sách này cho dịp "${occasion}", người nhận "${recipient}", ngân sách ${budget ? `${budget}k VND` : "tự do"}.
Danh sách: ${JSON.stringify(products)}
Trả JSON dạng {"suggestions":[{"product_id":"...","ly_do":"..."}]}. Chỉ dùng id trong danh sách.`);
    const valid = new Set(products.map((product) => product.id));
    const suggestions = (Array.isArray(result.suggestions) ? result.suggestions : [])
      .filter((item) => valid.has(item?.product_id) && item.ly_do)
      .slice(0, 5);
    await supabase("chat_suggestions", {
      method: "POST",
      body: JSON.stringify({
        user_query: [occasion, recipient, budget && `${budget}k`].filter(Boolean).join(" | "),
        occasion, recipient, budget, suggested_product_ids: suggestions.map((item) => item.product_id), suggestions,
      }),
    }).catch(() => {});
    json(res, 200, { suggestions });
  } catch (error) {
    json(res, 500, { error: error.message });
  }
}
